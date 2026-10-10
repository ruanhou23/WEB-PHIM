import { initializeApp, getApps, cert, type ServiceAccount, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

/**
 * Firebase Admin SDK — chạy phía server.
 * Dùng để verify ID token, tạo session cookie, quản lý user, lưu settings.
 */

let app: App;

if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, "\n") : undefined;

  if (projectId && clientEmail && privateKey) {
    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };
    app = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
    });
  } else {
    // Dành cho quá trình build Next.js (collecting page data) khi chưa inject env
    app = initializeApp({
      projectId: projectId || "build-dummy-project",
    });
  }
} else {
  app = getApps()[0];
}

const adminAuth = getAuth(app);

// Chỉ khởi tạo DB khi có URL
const databaseUrl = process.env.FIREBASE_DATABASE_URL;
const adminDb = databaseUrl ? getDatabase(app) : null;

export { adminAuth, adminDb };
