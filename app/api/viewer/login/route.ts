import { NextRequest, NextResponse } from "next/server";
import { VIEWER_SESSION_COOKIE_NAME, VIEWER_SESSION_MAX_AGE } from "@/lib/admin/constants";
import { createViewerSession, verifyViewerSession, isUserLoginEnabled } from "@/lib/utils/site-protection";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * POST /api/viewer/login
 * Đăng nhập tài khoản viewer/user. Body: { idToken }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { idToken?: string };
    if (!body.idToken) {
      return NextResponse.json({ error: "Thiếu ID token" }, { status: 400 });
    }

    // Kiểm tra xem tính năng đăng nhập có bật không
    const userLoginEnabled = await isUserLoginEnabled();

    const { sessionCookie, user } = await createViewerSession(body.idToken);

    // Nếu tính năng đăng nhập người dùng bị tắt và tài khoản KHÔNG phải admin
    if (!userLoginEnabled && !user.isAdmin) {
      return NextResponse.json(
        { error: "Tính năng đăng nhập người dùng hiện đang tạm đóng bởi Quản trị viên." },
        { status: 403 }
      );
    }

    const res = NextResponse.json({ success: true, user });
    res.cookies.set(VIEWER_SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: VIEWER_SESSION_MAX_AGE,
    });

    return res;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Đăng nhập thất bại";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

/**
 * GET /api/viewer/login
 * Kiểm tra trạng thái viewer session và trả về thông tin user.
 */
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(VIEWER_SESSION_COOKIE_NAME)?.value;
  if (!cookie) {
    return NextResponse.json({ authenticated: false });
  }

  const session = await verifyViewerSession(cookie);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const userRecord = await adminAuth.getUser(session.uid);
    const isAdmin = !!userRecord.customClaims?.admin;
    return NextResponse.json({
      authenticated: true,
      user: {
        uid: session.uid,
        email: session.email,
        displayName: userRecord.displayName || session.email?.split("@")[0] || "Thành viên",
        role: isAdmin ? "admin" : "viewer",
        isAdmin,
      },
    });
  } catch {
    return NextResponse.json({
      authenticated: true,
      user: {
        uid: session.uid,
        email: session.email,
        displayName: session.email?.split("@")[0] || "Thành viên",
        role: "viewer",
        isAdmin: false,
      },
    });
  }
}
