// src/core/convert.worker.ts
import type { TokenData } from '../types.js';
import DictionaryTrie from './DictionaryTrie.js';

// Khởi tạo Trie trong worker (UI không truy cập được cái này)
const trie = new DictionaryTrie();

// Định nghĩa các kiểu tin nhắn (Action)
type WorkerMessage =
    | { type: 'INIT', payload: Record<string, string> }
    | { type: 'TRANSLATE', payload: string }
    | { type: 'UPDATE_WORD', payload: { key: string, value: string } };

// Lắng nghe lệnh từ "Sếp" (App.tsx)
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            // Lệnh 1: Nạp dữ liệu (Chạy 1 lần đầu)
            console.log('👷 Worker: Đang nạp dữ liệu...');
            trie.load(payload);
            self.postMessage({ type: 'INIT_DONE', success: true });
            break;

        case 'TRANSLATE':
            // Lệnh 2: Dịch văn bản
            // console.log('👷 Worker: Đang dịch...');
            const tokens = trie.translate(payload);
            self.postMessage({ type: 'TRANSLATE_DONE', payload: tokens });
            break;

        case 'UPDATE_WORD':
            // Lệnh 3: Sửa từ (Khi user Quick Edit)
            trie.insert(payload.key, payload.value);
            // Không cần báo về, sửa âm thầm là được
            break;
    }
};

export { };