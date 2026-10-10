import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/admin/auth";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * POST /api/admin/logout
 * Xóa session cookie và revoke Firebase session.
 */
export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL("/admin", req.url), 303);

  // Lấy session cookie hiện tại
  const cookieHeader = req.headers.get("cookie") ?? "";
  const sessionMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const sessionCookie = sessionMatch?.[1];

  // Revoke session trên Firebase (nếu có)
  if (sessionCookie) {
    try {
      const decoded = await verifySessionCookie(sessionCookie);
      if (decoded) {
        await adminAuth.revokeRefreshTokens(decoded.uid);
      }
    } catch {
      // Ignore errors during logout
    }
  }

  // Xóa cookie
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
