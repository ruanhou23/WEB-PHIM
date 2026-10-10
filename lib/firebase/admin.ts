import { initializeApp, getApps, cert, type ServiceAccount, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { decryptServerVault } from "./vault";

/**
 * Firebase Admin SDK — chạy phía server.
 * Dùng để verify ID token, tạo session cookie, quản lý user, lưu settings.
 * Tự động nạp cấu hình từ Vault mã hóa nếu không có biến môi trường trên Render/Vercel.
 */

let app: App;

if (getApps().length === 0) {
  const vault = decryptServerVault();
  const projectId = process.env.FIREBASE_PROJECT_ID || vault.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || vault.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || vault.FIREBASE_PRIVATE_KEY;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, "\n") : undefined;
  const databaseUrl = process.env.FIREBASE_DATABASE_URL || vault.FIREBASE_DATABASE_URL;

  if (projectId && clientEmail && privateKey) {
    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };
    app = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: databaseUrl || undefined,
    });
  } else {
    // Dành cho quá trình build Next.js (collecting page data)
    app = initializeApp({
      projectId: projectId || "build-dummy-project",
    });
  }
} else {
  app = getApps()[0];
}

const adminAuth = getAuth(app);

// Khởi tạo DB khi có URL (từ env hoặc vault)
const databaseUrl = process.env.FIREBASE_DATABASE_URL || decryptServerVault().FIREBASE_DATABASE_URL;
const adminDb = databaseUrl ? getDatabase(app) : null;

export { adminAuth, adminDb };
