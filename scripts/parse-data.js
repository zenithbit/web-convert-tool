import fs from "fs";
import path from "path";
import process from "process";

const currentDir = process.cwd();
const vpFile = path.join(currentDir, "scripts", "Vietphrase.txt");
const namesFile = path.join(currentDir, "scripts", "Names.txt"); // File mới
const outputFile = path.join(currentDir, "public", "vietphrase.json");

// Hàm Helper: Đọc file và nạp vào dictionary
const loadFileToDict = (filePath, dict, isName = false) => {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Không tìm thấy file: ${filePath} (Bỏ qua)`);
    return;
  }
  console.log(`⏳ Đang đọc ${isName ? "Names" : "Vietphrase"}...`);

  // Lưu ý: Names.txt thường cũng dùng UTF-16LE, nếu file bác dùng UTF-8 thì sửa lại tham số này
  const content = fs.readFileSync(filePath, "utf16le");

  content.split("\n").forEach((line) => {
    const parts = line.trim().split("=");
    if (parts.length >= 2) {
      const key = parts[0];
      let value = parts.slice(1).join("=");

      if (key && value) {
        // 🔥 FIX 1: Xóa chú thích trong dấu ngoặc {}
        // Ví dụ: "các loại{đợi}" -> "các loại"
        value = value.replace(/\{.*?\}/g, "");

        // 🔥 FIX 2: Xử lý dấu câu Tàu thành Ta ngay từ đầu (Optional)
        // Hoặc bác làm 1 file replacements riêng, nhưng nhét vào đây cho tiện cũng được
        if (key === "，") value = ", ";
        if (key === "。") value = ". ";
        if (key === "！") value = "! ";
        if (key === "？") value = "? ";
        if (key === "：") value = ": ";
        if (key === "…") value = "... ";
        if (key === "“") value = '"';
        if (key === "”") value = '"';

        // Nếu là Names thì viết hoa (Logic cũ giữ nguyên)
        if (isName) {
          // ...
        }

        dictionary[key] = value;
      }
    }
  });
};

const dictionary = {};

// 1. Load Vietphrase trước (Nền tảng)
loadFileToDict(vpFile, dictionary, false);

// 2. Load Names sau (Ưu tiên đè lên)
loadFileToDict(namesFile, dictionary, true);

dictionary["的"] = "đích";
dictionary["了"] = "rồi";
dictionary["是"] = "là";

fs.writeFileSync(outputFile, JSON.stringify(dictionary));
console.log(`✅ Xong! Tổng số từ: ${Object.keys(dictionary).length}`);
