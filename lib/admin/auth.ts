import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "./constants";

// Re-export để các file server-side có thể import từ đây
export { SESSION_COOKIE_NAME, SESSION_MAX_AGE };

/**
 * Tạo session cookie từ Firebase ID token.
 * Gọi từ API login sau khi client gửi ID token lên.
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresIn = SESSION_MAX_AGE * 1000; // milliseconds
  return adminAuth.createSessionCookie(idToken, { expiresIn });
}

/**
 * Xác thực session cookie.
 * Trả về thông tin user nếu hợp lệ, null nếu không.
 */
export async function verifySessionCookie(sessionCookie: string) {
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra session cookie có hợp lệ hay không (dùng trong middleware).
 */
export async function isValidSession(sessionCookie: string | undefined): Promise<boolean> {
  if (!sessionCookie) return false;
  const decoded = await verifySessionCookie(sessionCookie);
  return decoded !== null;
}

/**
 * Tạo tài khoản admin mới trong Firebase Auth.
 * Chỉ được gọi bởi admin đã đăng nhập.
 */
export async function createAdminUser(email: string, password: string, displayName?: string) {
  const user = await adminAuth.createUser({
    email,
    password,
    displayName: displayName || email.split("@")[0],
  });

  // Gán custom claim "admin" để phân biệt với user thường
  await adminAuth.setCustomUserClaims(user.uid, { admin: true });

  return user;
}

/**
 * Lấy danh sách tất cả admin users.
 */
export async function listAdminUsers() {
  const listResult = await adminAuth.listUsers(100);
  // Chỉ trả về user có custom claim admin
  return listResult.users.filter(
    (user) => user.customClaims && user.customClaims.admin === true
  );
}

/**
 * Xóa tài khoản admin.
 */
export async function deleteAdminUser(uid: string) {
  await adminAuth.deleteUser(uid);
}
