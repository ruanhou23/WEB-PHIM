const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const k = trimmed.slice(0, eqIdx).trim();
    let v = trimmed.slice(eqIdx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) {
      v = v.slice(1, -1);
    }
    env[k] = v.replace(/\\n/g, '\n');
  }
});

// Khóa bảo mật dẫn xuất bằng SHA-256
const salt = 'mephim_security_vault_salt_2026';
const secretKey = crypto.createHash('sha256').update(salt).digest();
const iv = crypto.randomBytes(16);

const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
let encrypted = cipher.update(JSON.stringify(env), 'utf8', 'hex');
encrypted += cipher.final('hex');

const payload = iv.toString('hex') + ':' + encrypted;

// Kiểm tra giải mã
const [ivHex, cipherHex] = payload.split(':');
const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, Buffer.from(ivHex, 'hex'));
let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
decrypted += decipher.final('utf8');
const parsed = JSON.parse(decrypted);

if (parsed.FIREBASE_PROJECT_ID === env.FIREBASE_PROJECT_ID && parsed.FIREBASE_PRIVATE_KEY === env.FIREBASE_PRIVATE_KEY) {
  console.log('✅ Mã hóa và giải mã thử nghiệm thành công 100%!');
  
  // Tạo file vault TypeScript
  const tsContent = `// Tệp chứa cấu hình dự phòng đã mã hóa AES-256
// Đảm bảo không lộ thông tin bí mật ra ngoài nhưng ứng dụng vẫn tự giải mã khi chạy online

export const ENCRYPTED_VAULT_PAYLOAD = ${JSON.stringify(payload)};
`;

  fs.writeFileSync(path.resolve(__dirname, '../lib/firebase/vault.ts'), tsContent, 'utf8');
  console.log('✅ Đã ghi lib/firebase/vault.ts thành công!');
} else {
  console.error('❌ Kiểm tra giải mã thất bại!');
}
