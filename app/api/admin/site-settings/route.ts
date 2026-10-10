import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/admin/constants";
import { verifySessionCookie } from "@/lib/admin/auth";
import {
  isSiteProtected,
  setSiteProtection,
  isUserLoginEnabled,
  setUserLoginEnabled,
  createViewerUser,
  listViewerUsers,
  deleteViewerUser,
} from "@/lib/utils/site-protection";

async function requireAdmin(req: NextRequest) {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  return verifySessionCookie(sessionCookie);
}

/**
 * GET /api/admin/site-settings
 * Lấy trạng thái bảo vệ site + trạng thái đăng nhập người dùng + danh sách viewer.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [isProtected, userLoginEnabled, viewers] = await Promise.all([
      isSiteProtected(),
      isUserLoginEnabled(),
      listViewerUsers(),
    ]);

    return NextResponse.json({
      siteProtection: isProtected,
      userLoginEnabled: userLoginEnabled,
      viewers: viewers.map((u) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        createdAt: u.metadata.creationTime,
        lastSignIn: u.metadata.lastSignInTime,
      })),
    });
  } catch (error) {
    console.error("[site-settings] GET error:", error);
    return NextResponse.json({ error: "Lỗi lấy cài đặt" }, { status: 500 });
  }
}

/**
 * POST /api/admin/site-settings
 * Các action: toggle, create-viewer, delete-viewer
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      action: string;
      enabled?: boolean;
      email?: string;
      password?: string;
      displayName?: string;
      uid?: string;
    };

    switch (body.action) {
      case "toggle": {
        if (typeof body.enabled !== "boolean") {
          return NextResponse.json({ error: "Thiếu trạng thái" }, { status: 400 });
        }
        await setSiteProtection(body.enabled);
        const res = NextResponse.json({
          success: true,
          message: body.enabled ? "Đã bật bảo vệ trang web" : "Đã tắt bảo vệ trang web",
          siteProtection: body.enabled,
        });
        // Set cookie để middleware có thể đọc trạng thái (Edge Runtime)
        res.cookies.set("site_protected", body.enabled ? "true" : "false", {
          httpOnly: false, // Cần đọc trong middleware
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365, // 1 năm
        });
        return res;
      }

      case "toggle-user-login": {
        if (typeof body.enabled !== "boolean") {
          return NextResponse.json({ error: "Thiếu trạng thái" }, { status: 400 });
        }
        await setUserLoginEnabled(body.enabled);
        const res = NextResponse.json({
          success: true,
          message: body.enabled
            ? "Đã bật tính năng đăng nhập người dùng"
            : "Đã tắt tính năng đăng nhập người dùng",
          userLoginEnabled: body.enabled,
        });
        res.cookies.set("user_login_enabled", body.enabled ? "true" : "false", {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
        return res;
      }

      case "create-viewer": {
        if (!body.email || !body.password) {
          return NextResponse.json({ error: "Cần email và mật khẩu" }, { status: 400 });
        }
        if (body.password.length < 6) {
          return NextResponse.json({ error: "Mật khẩu ít nhất 6 ký tự" }, { status: 400 });
        }
        const user = await createViewerUser(body.email, body.password, body.displayName);
        return NextResponse.json({
          success: true,
          message: "Tạo tài khoản viewer thành công",
          user: { uid: user.uid, email: user.email, displayName: user.displayName },
        });
      }

      case "delete-viewer": {
        if (!body.uid) {
          return NextResponse.json({ error: "Thiếu UID" }, { status: 400 });
        }
        await deleteViewerUser(body.uid);
        return NextResponse.json({ success: true, message: "Đã xóa tài khoản viewer" });
      }

      default:
        return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("[site-settings] POST error:", error);
    const msg = error instanceof Error ? error.message : "Lỗi xử lý yêu cầu";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
