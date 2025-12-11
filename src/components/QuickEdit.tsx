import React, { useState, useEffect } from 'react';
import type { TokenData } from '../types.js';

interface QuickEditProps {
  token: TokenData;
  onSelectMeaning: (newMeaning: string, isMassUpdate: boolean) => void;
  onClose: () => void;
}

const QuickEdit: React.FC<QuickEditProps> = ({ token, onSelectMeaning, onClose }) => {
  const [customVal, setCustomVal] = useState('');

  useEffect(() => {
    setCustomVal('');
  }, [token]);

  if (!token) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customVal.trim()) {
      onSelectMeaning(customVal.trim(), true); // True = Sửa tất cả
    }
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      backgroundColor: '#1e1e1e', borderTop: '1px solid #333',
      padding: '15px', boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
      zIndex: 100, display: 'flex', flexDirection: 'column', gap: 12,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#9ca3af', fontSize: '14px' }}>
          Gốc: <strong style={{ color: '#fff', fontSize: '18px', marginRight: 10 }}>{token.origin}</strong>
          <span>({token.meanings.length} lựa chọn)</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '20px', padding: '0 10px' }}>×</button>
      </div>

      {/* Danh sách nghĩa có sẵn (ĐÃ SỬA GIAO DIỆN) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxHeight: '150px', overflowY: 'auto' }}>
        {token.meanings.map((meaning, index) => {
          const isCurrent = meaning === token.display;
          return (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'stretch', // Để 2 nút cao bằng nhau
              border: isCurrent ? '1px solid #2563eb' : '1px solid #444',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              {/* Nút chọn đơn (Chính) */}
              <button
                onClick={() => onSelectMeaning(meaning, false)} // Sửa 1 từ
                style={{
                  padding: '8px 12px',
                  backgroundColor: isCurrent ? 'rgba(37, 99, 235, 0.2)' : '#333',
                  color: isCurrent ? '#60a5fa' : '#e5e7eb',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  borderRight: '1px solid #444'
                }}
                title="Chỉ sửa từ này"
              >
                {meaning}
              </button>

              {/* Nút chọn tất cả (Phụ) */}
              <button
                onClick={() => onSelectMeaning(meaning, true)} // 🔥 Sửa tất cả
                style={{
                  padding: '8px 10px',
                  backgroundColor: isCurrent ? 'rgba(37, 99, 235, 0.3)' : '#2a2a2a',
                  color: '#10b981', // Màu xanh lá cho nút All
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={`Sửa tất cả các từ "${token.origin}" thành "${meaning}"`}
              >
                ALL
              </button>
            </div>
          );
        })}
      </div>

      {/* Input sửa tay */}
      <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: 10, marginTop: 5 }}>
        <input
          type="text"
          value={customVal}
          onChange={(e) => setCustomVal(e.target.value)}
          placeholder="Hoặc nhập nghĩa khác..."
          style={{
            flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #4b5563',
            backgroundColor: '#374151', color: '#fff', outline: 'none'
          }}
          autoFocus
        />
        <button
          type="submit"
          disabled={!customVal.trim()} // Disable nếu chưa nhập gì
          style={{
            padding: '10px 20px',
            backgroundColor: customVal.trim() ? '#16a34a' : '#4b5563', // Đổi màu nếu disable
            color: '#fff',
            border: 'none', borderRadius: '6px', cursor: customVal.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}>
          Sửa tất cả
        </button>
      </form>
    </div>
  );
};

export default QuickEdit;