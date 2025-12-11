import { useEffect, useRef, useState } from "react";
// import DictionaryTrie from "./core/DictionaryTrie.js"; <--- XÓA DÒNG NÀY (UI không cần biết Trie là gì nữa)
import DictionaryManager from "./components/DictionaryManager.js";
import QuickEdit from "./components/QuickEdit.js";
import ReadingSettings, { type AppSettings } from "./components/ReadingSettings.js";
import Token from "./components/Token.js";
import useMobile from "./hooks/useMobile.js";
import type { TokenData } from "./types.ts";
import { downloadTxtFile, generateCleanText } from "./utils/exporter.js";
import { addToUserDict, loadUserDict } from "./utils/storage.js";

function App() {
  const isMobile = useMobile(); // Kiểm tra xem có đang dùng đt không
  const [activeTab, setActiveTab] = useState<'input' | 'reader'>('input');
  const workerRef = useRef<Worker | null>(null);

  const [inputText, setInputText] = useState("你好世界。我是开发者。");

  const [isSaved, setIsSaved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showDictManager, setShowDictManager] = useState(false);

  // State cấu hình mặc định (có lưu LocalStorage)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : {
      fontSize: 18,
      lineHeight: 1.8,
      fontFamily: "'Times New Roman', serif" // Mặc định để font có chân đọc truyện cho sướng
    };
  });

  // Lưu cấu hình mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  // --- USE EFFECT KHỞI TẠO WORKER ---
  useEffect(() => {
    // 1. Khởi tạo Worker
    const worker = new Worker(new URL('./core/convert.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    // 2. Lắng nghe Worker báo cáo
    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'INIT_DONE') {
        console.log('✅ Worker đã nạp xong dữ liệu!');
        setLoading(false);
      } else if (type === 'TRANSLATE_DONE') {
        setTokens(payload); // Nhận kết quả dịch
        console.timeEnd("TranslateWorker");
      }
    };

    // 3. Load Data & Gửi cho Worker
    const initData = async () => {
      try {
        const response = await fetch('/vietphrase.json');
        const baseData = await response.json();
        const userData = loadUserDict();

        // Trộn data ở đây rồi ném cục to đùng cho Worker xử lý
        const mergedData = { ...baseData, ...userData };

        // Gửi lệnh INIT
        worker.postMessage({ type: 'INIT', payload: mergedData });

      } catch (error) {
        console.error("Lỗi nạp data:", error);
      }
    };

    initData();

    // Cleanup khi tắt app
    return () => {
      worker.terminate();
    };
  }, []);

  // --- USE EFFECT LOAD BẢN NHÁP ---
  useEffect(() => {
    const savedDraft = localStorage.getItem('draft_input');
    if (savedDraft) {
      setInputText(savedDraft);
    }
  }, []);

  // --- USE EFFECT AUTO-SAVE ---
  useEffect(() => {
    setIsSaved(false); // Đánh dấu là chưa lưu (đang gõ)

    const timeoutId = setTimeout(() => {
      localStorage.setItem('draft_input', inputText);
      setIsSaved(true); // Đã lưu xong
    }, 1000); // Đợi user ngừng gõ 1s mới lưu

    return () => clearTimeout(timeoutId);
  }, [inputText]);

  // --- CÁC HÀM XỬ LÝ LOGIC ---

  const handleDictChange = () => {
    if (!workerRef.current) return;

    // Gửi lại lệnh INIT để Worker load lại từ đầu (cả Base + User Dict mới)
    const initData = async () => {
      const response = await fetch('/vietphrase.json');
      const baseData = await response.json();
      const userData = loadUserDict();
      const mergedData = { ...baseData, ...userData };

      workerRef.current?.postMessage({ type: 'INIT', payload: mergedData });
      // Sau khi init xong, tự động convert lại luôn
      workerRef.current?.postMessage({ type: 'TRANSLATE', payload: inputText });
    };
    initData();
  };

  const handleConvert = () => {
    if (!workerRef.current) return;
    console.time("TranslateWorker");
    workerRef.current.postMessage({ type: 'TRANSLATE', payload: inputText });

    if (isMobile) {
      setActiveTab('reader'); // Tự động nhảy sang tab đọc
    }
  };

  const handleSelectMeaning = (newMeaning: string, isMassUpdate = false) => {
    if (selectedIndex === null) return;
    const currentToken = tokens[selectedIndex];
    if (!currentToken) return;

    const newTokens = [...tokens];

    if (isMassUpdate) {
      // Logic sửa hàng loạt
      newTokens.forEach((token, idx) => {
        if (token.origin === currentToken.origin) {
          newTokens[idx] = { ...token, display: newMeaning };
        }
      });

      // 🔥 Gửi lệnh UPDATE cho Worker
      if (workerRef.current && currentToken.origin) {
        workerRef.current.postMessage({
          type: 'UPDATE_WORD',
          payload: { key: currentToken.origin, value: newMeaning }
        });
      }

      // Lưu LocalStorage
      if (currentToken.origin) {
        addToUserDict(currentToken.origin, newMeaning);
      }
    } else {
      // Logic sửa 1 từ
      newTokens[selectedIndex] = {
        ...currentToken,
        display: newMeaning,
      };
    }

    setTokens(newTokens);
    // setSelectedIndex(null); 
  };

  const handleCopy = () => {
    const textResult = tokens.map((t) => t.display).join(" ");
    const cleanText = textResult
      .replace(/\s+([.,!?:;])/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

    navigator.clipboard
      .writeText(cleanText)
      .then(() => alert("Đã copy vào bộ nhớ tạm!"))
      .catch((err) => console.error("Lỗi copy:", err));
  };

  const handleDownload = () => {
    if (tokens.length === 0) return;
    const text = generateCleanText(tokens);
    downloadTxtFile(text, `convert-${Date.now()}.txt`);
  };

  const handleClear = () => {
    if (window.confirm("Bác có chắc muốn xóa trắng toàn bộ không?")) {
      setInputText("");
      setTokens([]);
      localStorage.removeItem('draft_input');
    }
  };

  return (
    <div style={{
      padding: isMobile ? 10 : 20,
      paddingBottom: 100,
      backgroundColor: '#121212',
      minHeight: '100vh',
      color: '#eee',
      fontFamily: 'Arial',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h1 style={{ fontSize: isMobile ? '1.2rem' : '2rem', margin: 0 }}>
          {isMobile ? 'Convert Tool' : 'Web Convert Tool (Pro)'}
        </h1>
        <button
          onClick={() => setShowDictManager(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: 'bold'
          }}
        >
          {isMobile ? '📚 Từ điển' : '📚 Quản lý Từ điển'}
        </button>
      </div>

      <ReadingSettings settings={settings} onUpdate={setSettings} />

      {/* STATUS BAR */}
      <div style={{ marginBottom: 10, fontSize: '14px' }}>
        {loading ? (
          <span style={{ color: 'yellow' }}>⏳ Đang khởi động Worker...</span>
        ) : (
          <span style={{ color: "#4ade80" }}>⚡ Dữ liệu đã sẵn sàng!</span>
        )}
      </div>

      {/* THANH TAB CHO MOBILE */}
      {isMobile && (
        <div style={{ display: 'flex', marginBottom: 15, borderBottom: '1px solid #333' }}>
          <button
            onClick={() => setActiveTab('input')}
            style={{
              flex: 1, padding: 10, background: 'none', border: 'none',
              color: activeTab === 'input' ? '#2563eb' : '#888',
              borderBottom: activeTab === 'input' ? '2px solid #2563eb' : 'none',
              fontWeight: 'bold'
            }}>
            1. Nhập Truyện
          </button>
          <button
            onClick={() => setActiveTab('reader')}
            style={{
              flex: 1, padding: 10, background: 'none', border: 'none',
              color: activeTab === 'reader' ? '#10b981' : '#888',
              borderBottom: activeTab === 'reader' ? '2px solid #10b981' : 'none',
              fontWeight: 'bold'
            }}>
            2. Đọc & Sửa
          </button>
        </div>
      )}

      {/* CONTAINER CHÍNH */}
      <div style={{
        display: "flex",
        gap: 20,
        flexDirection: isMobile ? 'column' : 'row'
      }}>

        {/* --- CỘT TRÁI: INPUT --- */}
        {(!isMobile || activeTab === 'input') && (
          <div style={{ width: isMobile ? '100%' : '50%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Thanh trạng thái lưu & nút xóa */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: isSaved ? '#10b981' : '#f59e0b' }}>
                {isSaved ? '✅ Đã lưu nháp' : '✍️ Đang nhập...'}
              </span>

              {inputText && (
                <button
                  onClick={handleClear}
                  style={{
                    background: 'none', border: 'none', color: '#ef4444',
                    cursor: 'pointer', fontSize: '12px', textDecoration: 'underline'
                  }}
                >
                  Xóa trắng
                </button>
              )}
            </div>

            <textarea
              rows={isMobile ? 12 : 15}
              style={{
                width: '100%',
                backgroundColor: '#222', color: '#fff',
                padding: 10, border: '1px solid #444',
                boxSizing: 'border-box',
                fontSize: '16px'
              }}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste truyện tiếng Trung vào đây..."
            />

            {/* Nút Convert (Hiện ở đây cho cả Desktop và Mobile Input Tab) */}
            <button
              onClick={handleConvert}
              disabled={loading}
              style={{
                padding: "12px", backgroundColor: '#2563eb', color: 'white',
                border: 'none', borderRadius: 6, fontSize: 16, fontWeight: 'bold', width: '100%', cursor: 'pointer'
              }}
            >
              🚀 Convert Ngay
            </button>
          </div>
        )}

        {/* --- CỘT PHẢI: OUTPUT --- */}
        {(!isMobile || activeTab === 'reader') && (
          <div style={{ width: isMobile ? '100%' : '50%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                border: "1px solid #444",
                padding: isMobile ? 15 : 10,
                flex: 1,
                minHeight: isMobile ? '60vh' : 300,
                backgroundColor: "#1e1e1e",
                borderRadius: 4,
                overflowY: 'auto',
                maxHeight: isMobile ? '75vh' : '600px',

                // Style từ settings
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                fontFamily: settings.fontFamily,
              }}
            >
              {tokens.length > 0 ? tokens.map((token, index) => (
                <Token
                  key={index}
                  data={token}
                  isSelected={index === selectedIndex}
                  onClick={() => setSelectedIndex(index)}
                />
              )) : <span style={{ color: '#666' }}>Kết quả hiển thị tại đây...</span>}
            </div>

            {/* Toolbar Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCopy} style={{ padding: 12, flex: 1, cursor: 'pointer', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>📋 Copy</button>
              <button onClick={handleDownload} style={{ padding: 12, flex: 1, cursor: 'pointer', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>⬇️ Tải file</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showDictManager && (
        <DictionaryManager
          onClose={() => setShowDictManager(false)}
          onDataChanged={handleDictChange}
        />
      )}

      {selectedIndex !== null && tokens[selectedIndex] && (
        <QuickEdit
          token={tokens[selectedIndex]}
          onSelectMeaning={handleSelectMeaning}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div >
  );
}

export default App;