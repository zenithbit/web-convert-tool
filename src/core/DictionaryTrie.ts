import type { TokenData } from "../types.js";

class TrieNode {
  children: Map<string, TrieNode>; // Khai báo kiểu Map
  value: string | null;
  isEnd: boolean;

  constructor() {
    this.children = new Map();
    this.value = null;
    this.isEnd = false;
  }
}

class DictionaryTrie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  // load data từ JSON (key string, value string)
  load(dictionaryObject: Record<string, string>) {
    for (const [key, value] of Object.entries(dictionaryObject)) {
      this.insert(key, value);
    }
  }

  insert(key: string, value: string) {
    let node = this.root;
    for (const char of key) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      // Dùng dấu ! để khẳng định với TS là node con chắc chắn tồn tại
      node = node.children.get(char)!;
    }
    node.isEnd = true;
    node.value = value;
  }

  // Hàm trả về mảng TokenData
  translate(text: string): TokenData[] {
    const tokens: TokenData[] = [];
    let i = 0;
    const n = text.length;
    let isStartOfSentence = true;

    while (i < n) {
      let node = this.root;
      let matchLen = 0;
      let matchValue: string | null = null;

      for (let j = i; j < n; j++) {
        const char = text[j];
        if (!char || !node.children.has(char)) break;

        node = node.children.get(char)!;
        if (node.isEnd) {
          matchLen = j - i + 1;
          matchValue = node.value;
        }
      }

      if (matchLen > 0 && matchValue) {
        const allMeanings = matchValue.split('/');
        let primaryMeaning = allMeanings[0];
        if (!primaryMeaning) {
          primaryMeaning = matchValue;
        }

        if (isStartOfSentence) {
          primaryMeaning = primaryMeaning.charAt(0).toUpperCase() + primaryMeaning.slice(1);
        }

        tokens.push({
          type: 'phrase',
          origin: text.substring(i, i + matchLen),
          display: primaryMeaning,
          meanings: allMeanings
        });

        isStartOfSentence = false;
        i += matchLen;
      } else {
        const char = text[i];
        if (!char) {
          i++;
          continue;
        }

        tokens.push({
          type: 'text',
          display: char,
          meanings: []
        });

        if (['.', '?', '!', '。', '？', '！', '\n'].includes(char)) {
          isStartOfSentence = true;
        }
        i++;
      }
    }
    return tokens;
  }
}

export default DictionaryTrie;