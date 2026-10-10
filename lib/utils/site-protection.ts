import { adminDb, adminAuth } from "@/lib/firebase/admin";

const SETTINGS_REF = "settings/siteProtection";
const SETTINGS_USER_LOGIN_REF = "settings/userLoginEnabled";

// ─── Cache in-memory để tránh gọi DB mỗi request ──────────────────────────
let cachedProtectionState: boolean | null = null;
let cacheTimestamp = 0;

let cachedUserLoginState: boolean | null = null;
let cacheUserLoginTimestamp = 0;

const CACHE_TTL = 10_000; // 10 giây

/**
 * Kiểm tra site protection có đang bật không.
 */
export async function isSiteProtected(): Promise<boolean> {
  const now = Date.now();
  if (cachedProtectionState !== null && now - cacheTimestamp < CACHE_TTL) {
    return cachedProtectionState;
  }

  if (!adminDb) {
    return cachedProtectionState ?? false;
  }

  try {
    const snapshot = await adminDb.ref(SETTINGS_REF).get();
    cachedProtectionState = snapshot.val() === true;
    cacheTimestamp = now;
    return cachedProtectionState;
  } catch (error) {
    console.error("[site-protection] Error reading state:", error);
    return cachedProtectionState ?? false;
  }
}

/**
 * Bật/tắt site protection.
 */
export async function setSiteProtection(enabled: boolean): Promise<void> {
  if (adminDb) {
    await adminDb.ref(SETTINGS_REF).set(enabled);
  }
  cachedProtectionState = enabled;
  cacheTimestamp = Date.now();
}

/**
 * Kiểm tra tính năng đăng nhập người dùng có đang bật không (mặc định bật).
 */
export async function isUserLoginEnabled(): Promise<boolean> {
  const now = Date.now();
  if (cachedUserLoginState !== null && now - cacheUserLoginTimestamp < CACHE_TTL) {
    return cachedUserLoginState;
  }

  if (!adminDb) {
    return cachedUserLoginState ?? true;
  }

  try {
    const snapshot = await adminDb.ref(SETTINGS_USER_LOGIN_REF).get();
    const val = snapshot.val();
    // Mặc định là true nếu chưa set
    cachedUserLoginState = val === null || val === undefined ? true : val === true;
    cacheUserLoginTimestamp = now;
    return cachedUserLoginState;
  } catch (error) {
    console.error("[site-protection] Error reading user login state:", error);
    return cachedUserLoginState ?? true;
  }
}

/**
 * Bật/tắt tính năng đăng nhập người dùng.
 */
export async function setUserLoginEnabled(enabled: boolean): Promise<void> {
  if (adminDb) {
    await adminDb.ref(SETTINGS_USER_LOGIN_REF).set(enabled);
  }
  cachedUserLoginState = enabled;
  cacheUserLoginTimestamp = Date.now();
}

// ─── Quản lý tài khoản viewer ─────────────────────────────────────────────

/**
 * Tạo tài khoản viewer (người xem) mới.
 * Custom claim: { role: "viewer" }
 */
export async function createViewerUser(
  email: string,
  password: string,
  displayName?: string
) {
  const user = await adminAuth.createUser({
    email,
    password,
    displayName: displayName || email.split("@")[0],
    emailVerified: true,
  });

  // Gán role viewer
  await adminAuth.setCustomUserClaims(user.uid, { role: "viewer" });
  return user;
}

/**
 * Lấy danh sách tài khoản viewer.
 */
export async function listViewerUsers() {
  const listResult = await adminAuth.listUsers(100);
  return listResult.users.filter((u) => {
    const claims = u.customClaims || {};
    return claims.role === "viewer";
  });
}

/**
 * Xóa tài khoản viewer.
 */
export async function deleteViewerUser(uid: string) {
  // Kiểm tra xem có phải viewer không
  const user = await adminAuth.getUser(uid);
  const claims = user.customClaims || {};
  if (claims.role !== "viewer") {
    throw new Error("Chỉ có thể xóa tài khoản viewer");
  }
  await adminAuth.deleteUser(uid);
}

/**
 * Tạo session cookie cho viewer.
 */
export async function createViewerSession(idToken: string) {
  // Verify token và kiểm tra role
  const decoded = await adminAuth.verifyIdToken(idToken);
  const user = await adminAuth.getUser(decoded.uid);
  const claims = user.customClaims || {};

  // Nếu tài khoản chưa có claim (ví dụ người dùng mới tạo), tự động gán role viewer
  if (!claims.role && !claims.admin) {
    await adminAuth.setCustomUserClaims(decoded.uid, { role: "viewer" });
    claims.role = "viewer";
  }

  const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 ngày
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  return {
    sessionCookie,
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "Thành viên",
      role: claims.admin ? "admin" : "viewer",
      isAdmin: !!claims.admin,
    },
  };
}

/**
 * Verify viewer session cookie.
 */
export async function verifyViewerSession(cookie: string) {
  try {
    return await adminAuth.verifySessionCookie(cookie, true);
  } catch {
    return null;
  }
}
