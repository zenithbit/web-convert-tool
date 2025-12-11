import React from 'react';

// Định nghĩa kiểu dữ liệu cho cấu hình
export interface AppSettings {
    fontSize: number;
    lineHeight: number;
    fontFamily: string;
}

interface Props {
    settings: AppSettings;
    onUpdate: (newSettings: AppSettings) => void;
}

const ReadingSettings: React.FC<Props> = ({ settings, onUpdate }) => {

    const handleChange = (key: keyof AppSettings, value: any) => {
        onUpdate({ ...settings, [key]: value });
    };

    return (
        <div style={{
            padding: '15px', backgroundColor: '#1f2937',
            borderRadius: '8px', border: '1px solid #374151',
            marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap',
            alignItems: 'center', color: '#e5e7eb', fontSize: '14px'
        }}>
            {/* 1. Cỡ chữ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>Cỡ chữ:</span>
                <button
                    onClick={() => handleChange('fontSize', Math.max(12, settings.fontSize - 1))}
                    style={btnStyle}>-</button>
                <span style={{ width: '30px', textAlign: 'center' }}>{settings.fontSize}</span>
                <button
                    onClick={() => handleChange('fontSize', Math.min(30, settings.fontSize + 1))}
                    style={btnStyle}>+</button>
            </div>

            {/* 2. Giãn dòng */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>Giãn dòng:</span>
                <button
                    onClick={() => handleChange('lineHeight', Math.max(1.0, settings.lineHeight - 0.1))}
                    style={btnStyle}>-</button>
                <span style={{ width: '30px', textAlign: 'center' }}>{settings.lineHeight.toFixed(1)}</span>
                <button
                    onClick={() => handleChange('lineHeight', Math.min(3.0, settings.lineHeight + 0.1))}
                    style={btnStyle}>+</button>
            </div>

            {/* 3. Font chữ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>Font:</span>
                <select
                    value={settings.fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    style={{ padding: '5px', borderRadius: '4px', backgroundColor: '#374151', color: 'white', border: 'none' }}
                >
                    <option value="Arial, sans-serif">Arial (Không chân)</option>
                    <option value="'Times New Roman', serif">Times New Roman (Có chân)</option>
                    <option value="'Courier New', monospace">Courier (Code)</option>
                </select>
            </div>
        </div>
    );
};

const btnStyle: React.CSSProperties = {
    width: '30px', height: '30px',
    backgroundColor: '#374151', color: 'white',
    border: 'none', borderRadius: '4px', cursor: 'pointer',
    display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold'
};

export default ReadingSettings;