// src/utils/storage.ts

const STORAGE_KEY = 'user_dictionary';

export const loadUserDict = (): Record<string, string> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        console.error("Lỗi đọc LocalStorage:", error);
        return {};
    }
};

export const saveUserDict = (dict: Record<string, string>) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dict));
    } catch (error) {
        console.error("Lỗi ghi LocalStorage (khả năng đầy bộ nhớ):", error);
    }
};

export const addToUserDict = (key: string, value: string) => {
    const currentDict = loadUserDict();
    currentDict[key] = value;
    saveUserDict(currentDict);
};