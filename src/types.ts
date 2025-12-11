// Định nghĩa cấu trúc của 1 Token
export interface TokenData {
    type: 'text' | 'phrase'; // Chỉ được phép là 1 trong 2 loại này
    origin?: string;         // Có thể có hoặc không (với type text)
    display: string;
    meanings: string[];      // Bắt buộc là mảng chuỗi
}

// Định nghĩa props cho Component
export interface TokenProps {
    data: TokenData;
    onClick: (data: TokenData) => void;
    isSelected: boolean;
}