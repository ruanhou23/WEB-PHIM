import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE, createSessionCookie } from "@/lib/admin/auth";
import { adminAuth } from "@/lib/firebase/admin";

type LoginBody = {
  idToken?: string;
};

/**
 * POST /api/admin/login
 *
 * Client gửi Firebase ID token lên → Server xác thực → Tạo session cookie.
 * Flow: Client signInWithEmailAndPassword → getIdToken → POST /api/admin/login
 */
export async function POST(req: Request) {
  let body: LoginBody = {};
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    body = {};
  }

  const idToken = body.idToken ?? "";

  if (!idToken) {
    return NextResponse.json(
      { success: false, message: "Thiếu token xác thực" },
      { status: 400 }
    );
  }

  try {
    // 1. Xác thực ID token với Firebase Admin
    const decoded = await adminAuth.verifyIdToken(idToken);

    // 2. Kiểm tra custom claim "admin"
    const user = await adminAuth.getUser(decoded.uid);
    let isAdmin = decoded.admin === true || user.customClaims?.admin === true;

    // Dự phòng: nếu là email admin chính (admin@mephim.com) hoặc email admin gốc
    if (!isAdmin && (decoded.email === "admin@mephim.com" || user.email === "admin@mephim.com")) {
      isAdmin = true;
      try {
        await adminAuth.setCustomUserClaims(decoded.uid, { admin: true });
      } catch (claimErr) {
        console.error("Lỗi gán claim admin:", claimErr);
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Tài khoản này là tài khoản người dùng thường, không có quyền truy cập trang quản trị!",
        },
        { status: 403 }
      );
    }

    // 3. Tạo session cookie
    const sessionCookie = await createSessionCookie(idToken);

    // 4. Trả response với cookie
    const response = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || decoded.email?.split("@")[0],
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("[/api/admin/login] Error:", error);
    return NextResponse.json(
      { success: false, message: "Token không hợp lệ hoặc đã hết hạn" },
      { status: 401 }
    );
  }
}
