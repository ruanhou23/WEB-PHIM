const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      process.env[key] = val.replace(/\\n/g, '\n');
    }
  });
}

const admin = require('firebase-admin');

// Initialize Firebase Admin
let credential;
const serviceAccountFile = path.resolve(__dirname, 'web-d3809-firebase-adminsdk-fbsvc-5688c3c5de.json');

if (fs.existsSync(serviceAccountFile)) {
  credential = admin.credential.cert(require(serviceAccountFile));
} else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  });
} else {
  console.error('❌ Không tìm thấy thông tin xác thực Firebase Admin.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential });
}

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];
  const displayName = args[2] || (email ? email.split('@')[0] : 'Admin');

  if (!email || !password) {
    console.log('📌 Cách sử dụng:');
    console.log('   node create-admin.js <email> <mật_khẩu> [tên_hiển_thị]\n');
    console.log('Ví dụ:');
    console.log('   node create-admin.js admin@mephim.com 123456 "Quản trị viên"\n');

    // Hiển thị danh sách admin hiện có
    console.log('📋 Danh sách người dùng hiện có trong Firebase Auth:');
    const list = await admin.auth().listUsers();
    if (list.users.length === 0) {
      console.log('   (Chưa có người dùng nào)');
    } else {
      list.users.forEach(u => {
        const isAdmin = u.customClaims && u.customClaims.admin === true;
        console.log(`   - ${u.email || u.uid} [${isAdmin ? '👑 ADMIN' : 'Viewer/User'}] (UID: ${u.uid})`);
      });
    }
    return;
  }

  if (password.length < 6) {
    console.error('❌ Mật khẩu phải có ít nhất 6 ký tự.');
    process.exit(1);
  }

  try {
    let user;
    let isNew = false;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log(`ℹ️ Tài khoản ${email} đã tồn tại (UID: ${user.uid}). Đang cập nhật mật khẩu và cấp quyền Admin...`);
      await admin.auth().updateUser(user.uid, {
        password: password,
        displayName: displayName || user.displayName,
      });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        isNew = true;
        user = await admin.auth().createUser({
          email,
          password,
          displayName,
        });
        console.log(`✨ Đã tạo tài khoản mới cho ${email} (UID: ${user.uid}).`);
      } else {
        throw err;
      }
    }

    // Gán custom claim admin: true
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    console.log('\n========================================');
    console.log(`✅ ${isNew ? 'Đăng ký tài khoản Admin thành công!' : 'Cập nhật tài khoản Admin thành công!'}`);
    console.log(`📧 Email:        ${email}`);
    console.log(`🔑 Mật khẩu:     ${password}`);
    console.log(`👤 Tên hiển thị: ${displayName}`);
    console.log(`👑 Quyền:        Admin (custom claim admin=true)`);
    console.log('========================================\n');
    console.log('👉 Bây giờ bạn có thể đăng nhập vào trang Admin tại:');
    console.log('   http://localhost:3000/admin\n');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

main();
