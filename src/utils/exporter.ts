// src/utils/exporter.ts

import type { TokenData } from "../types.js";

// Hàm ghép token thành văn bản thuần (Clean text)
export const generateCleanText = (tokens: TokenData[]): string => {
    const rawText = tokens.map(t => t.display).join(' '); // Ghép lại, tạm thời mỗi từ cách nhau 1 dấu cách

    // Xử lý chuẩn hóa văn bản (Regex):
    // 1. Xóa khoảng trắng trước dấu câu: "Xin chào . Bạn khỏe không ?" -> "Xin chào. Bạn khỏe không?"
    // 2. Xóa khoảng trắng thừa: "   " -> " "
    return rawText
        .replace(/\s+([.,!?:;])/g, '$1') // $1 là dấu câu tìm được
        .replace(/\s+/g, ' ')            // Gộp nhiều space thành 1
        .trim();
};

// Hàm tải file .txt về máy
export const downloadTxtFile = (content: string, filename: string = 'convert-result.txt') => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Dọn dẹp
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Hàm copy vào clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Lỗi copy:', err);
        return false;
    }
};