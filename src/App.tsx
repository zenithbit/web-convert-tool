import { useEffect, useRef, useState } from "react";
// import DictionaryTrie from "./core/DictionaryTrie.js"; <--- XÓA DÒNG NÀY (UI không cần biết Trie là gì nữa)
import type { TokenData } from "./types.ts";
import { addToUserDict, loadUserDict } from "./utils/storage.js";
import { downloadTxtFile, generateCleanText } from "./utils/exporter.js";
import Token from "./components/Token.js";
import QuickEdit from "./components/QuickEdit.js";
import DictionaryManager from "./components/DictionaryManager.js";
import ReadingSettings, { type AppSettings } from "./components/ReadingSettings.js";

function App() {
  const workerRef = useRef<Worker | null>(null);

  const [inputText, setInputText] = useState("你好世界。我是开发者。");
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showDictManager, setShowDictManager] = useState(false);

  // State cấu hình mặc định
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : {
      fontSize: 18,
      lineHeight: 1.8,
      fontFamily: "'Times New Roman', serif" // Mặc định để font có chân đọc truyện cho sướng
    };
  });

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  // --- CHỈ GIỮ LẠI 1 USE EFFECT DUY NHẤT DÀNH CHO WORKER ---
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

  const handleDictChange = () => {
    if (!workerRef.current) return;

    // Chúng ta gửi lại lệnh INIT để Worker load lại từ đầu (cả Base + User Dict mới)
    // Cách này hơi "thô" nhưng an toàn nhất. 
    // Cách tối ưu hơn là gửi lệnh DELETE sang worker, nhưng worker hiện chưa hỗ trợ delete.
    const initData = async () => {
      const response = await fetch('/vietphrase.json');
      const baseData = await response.json();
      const userData = loadUserDict(); // Load lại data mới nhất từ storage
      const mergedData = { ...baseData, ...userData };

      workerRef.current?.postMessage({ type: 'INIT', payload: mergedData });
      // Sau khi init xong, ta có thể tự động convert lại luôn
      workerRef.current?.postMessage({ type: 'TRANSLATE', payload: inputText });
    };
    initData();
  };

  const handleConvert = () => {
    if (!workerRef.current) return;

    // UI không lo tính toán nữa, chỉ gửi lệnh
    console.time("TranslateWorker");
    workerRef.current.postMessage({ type: 'TRANSLATE', payload: inputText });
  };

  const handleSelectMeaning = (newMeaning: string, isMassUpdate = false) => {
    if (selectedIndex === null) return;
    const currentToken = tokens[selectedIndex];
    if (!currentToken) return;

    const newTokens = [...tokens];

    if (isMassUpdate) {
      newTokens.forEach((token, idx) => {
        if (token.origin === currentToken.origin) {
          newTokens[idx] = { ...token, display: newMeaning };
        }
      });

      // 🔥 Gửi lệnh UPDATE cho Worker để nó cập nhật Trie bên kia
      if (workerRef.current && currentToken.origin) {
        workerRef.current.postMessage({
          type: 'UPDATE_WORD',
          payload: { key: currentToken.origin, value: newMeaning }
        });
      }

      // Lưu LocalStorage (Vẫn giữ ở UI thread)
      if (currentToken.origin) {
        addToUserDict(currentToken.origin, newMeaning);
      }
    } else {
      newTokens[selectedIndex] = {
        type: currentToken.type,
        ...(currentToken.origin !== undefined && { origin: currentToken.origin }),
        display: newMeaning,
        meanings: currentToken.meanings,
      };
    }

    setTokens(newTokens);
    // setSelectedIndex(null); 
  };

  // ... (Phần handleCopy và handleDownload giữ nguyên như cũ)
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

  return (
    <div style={{ padding: 20, paddingBottom: 100, backgroundColor: '#121212', minHeight: '100vh', color: '#eee', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Web Convert Tool (Pro Worker)</h1>

        {/* Nút mở quản lý từ điển */}
        <button
          onClick={() => setShowDictManager(true)}
          style={{
            backgroundColor: '#4b5563', color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
            fontSize: '14px', fontWeight: 'bold'
          }}
        >
          📚 Quản lý Từ điển
        </button>
      </div>
      <ReadingSettings settings={settings} onUpdate={setSettings} />
      {loading ? (
        <p style={{ color: 'yellow' }}>⏳ Đang khởi động Worker...</p>
      ) : (
        <p style={{ color: "#4ade80" }}>⚡ Dữ liệu đã sẵn sàng!</p>
      )}

      <div style={{ display: "flex", gap: 20 }}>
        <textarea
          rows={15}
          style={{ width: '50%', backgroundColor: '#222', color: '#fff', padding: 10, border: '1px solid #444' }}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste truyện tiếng Trung vào đây (thử paste 10 chương xem)..."
        />

        {/* Output Area */}
        <div style={{ width: "50%", display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              border: "1px solid #444",
              padding: 10,
              flex: 1,
              minHeight: 300,
              borderRadius: 4,
              overflowY: 'auto',
              maxHeight: '600px', // Giới hạn chiều cao để scroll
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              fontFamily: settings.fontFamily,
              transition: 'all 0.2s ease' // Hiệu ứng mượt khi đổi số
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
            <button onClick={handleCopy} style={{ padding: 10, flex: 1, cursor: 'pointer', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: 4 }}>📋 Copy</button>
            <button onClick={handleDownload} style={{ padding: 10, flex: 1, cursor: 'pointer', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: 4 }}>⬇️ Tải file</button>
          </div>
        </div>
      </div>
      <br />

      <button
        onClick={handleConvert}
        disabled={loading}
        style={{ padding: "12px 24px", backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 'bold' }}
      >
        🚀 Convert (Đa luồng)
      </button>

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
    </div>
  );
}

export default App;