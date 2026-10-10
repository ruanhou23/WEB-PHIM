import { NextResponse } from "next/server";
import { VIEWER_SESSION_COOKIE_NAME } from "@/lib/admin/constants";
import { verifyViewerSession } from "@/lib/utils/site-protection";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * POST /api/viewer/logout
 * Đăng xuất tài khoản viewer/user: xóa cookie viewer_session và revoke refresh token.
 */
export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const sessionMatch = cookieHeader.match(new RegExp(`${VIEWER_SESSION_COOKIE_NAME}=([^;]+)`));
  const sessionCookie = sessionMatch?.[1];

  if (sessionCookie) {
    try {
      const decoded = await verifyViewerSession(sessionCookie);
      if (decoded?.uid) {
        await adminAuth.revokeRefreshTokens(decoded.uid);
      }
    } catch {
      // Bỏ qua lỗi khi revoke
    }
  }

  const response = NextResponse.json({ success: true, message: "Đã đăng xuất" });

  response.cookies.set(VIEWER_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
