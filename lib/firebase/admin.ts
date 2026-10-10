import { initializeApp, getApps, cert, type ServiceAccount, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

/**
 * Firebase Admin SDK — chạy phía server.
 * Dùng để verify ID token, tạo session cookie, quản lý user, lưu settings.
 */

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

let app: App;

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
  });
} else {
  app = getApps()[0];
}

const adminAuth = getAuth(app);

// Chỉ khởi tạo DB khi có URL
const databaseUrl = process.env.FIREBASE_DATABASE_URL;
const adminDb = databaseUrl ? getDatabase(app) : null;

export { adminAuth, adminDb };

