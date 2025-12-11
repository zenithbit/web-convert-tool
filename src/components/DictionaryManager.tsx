import React, { useState, useEffect } from 'react';
import { loadUserDict, removeFromUserDict } from '../utils/storage.js';

interface Props {
    onClose: () => void;
    onDataChanged: () => void; // Báo cho App biết để reload Trie
}

const DictionaryManager: React.FC<Props> = ({ onClose, onDataChanged }) => {
    const [dict, setDict] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const data = loadUserDict();
        setDict(data);
    };

    const handleDelete = (key: string) => {
        if (confirm(`Xóa từ "${key}"?`)) {
            removeFromUserDict(key);
            loadData(); // Reload lại list
            onDataChanged(); // Báo ra ngoài App reload Trie
        }
    };

    // Filter danh sách theo từ khóa tìm kiếm
    const filteredKeys = Object.keys(dict).filter(key =>
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dict[key]?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontFamily: 'Arial'
        }}>
            <div style={{
                backgroundColor: '#1f2937', color: '#fff',
                width: '600px', maxHeight: '80vh',
                borderRadius: '8px', padding: '20px',
                display: 'flex', flexDirection: 'column', gap: 15,
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Quản lý Từ điển ({Object.keys(dict).length})</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>

                {/* Ô tìm kiếm */}
                <input
                    type="text"
                    placeholder="Tìm kiếm từ gốc hoặc nghĩa..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                        padding: '10px', borderRadius: '6px', border: '1px solid #374151',
                        backgroundColor: '#111827', color: '#fff', width: '100%', boxSizing: 'border-box'
                    }}
                />

                {/* Danh sách cuộn */}
                <div style={{
                    flex: 1, overflowY: 'auto', border: '1px solid #374151',
                    borderRadius: '6px', backgroundColor: '#111827'
                }}>
                    {filteredKeys.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>Không tìm thấy dữ liệu</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#374151', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: 10, textAlign: 'left' }}>Gốc (Trung)</th>
                                    <th style={{ padding: 10, textAlign: 'left' }}>Nghĩa (Việt)</th>
                                    <th style={{ padding: 10, width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredKeys.map(key => (
                                    <tr key={key} style={{ borderBottom: '1px solid #1f2937' }}>
                                        <td style={{ padding: 10, color: '#9ca3af' }}>{key}</td>
                                        <td style={{ padding: 10, color: '#10b981', fontWeight: 'bold' }}>{dict[key]}</td>
                                        <td style={{ padding: 10, textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDelete(key)}
                                                style={{
                                                    backgroundColor: '#ef4444', color: '#fff', border: 'none',
                                                    padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'
                                                }}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                    * Xóa xong nhớ bấm Convert lại để thấy thay đổi.
                </div>
            </div>
        </div>
    );
};

export default DictionaryManager;