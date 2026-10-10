import { NextRequest, NextResponse } from "next/server";
import { isUserLoginEnabled, createViewerUser } from "@/lib/utils/site-protection";

/**
 * POST /api/viewer/register
 * Đăng ký tài khoản người dùng / viewer mới phía client.
 * Body: { email, password, displayName? }
 */
export async function POST(req: NextRequest) {
  try {
    const userLoginEnabled = await isUserLoginEnabled();
    if (!userLoginEnabled) {
      return NextResponse.json(
        { error: "Tính năng đăng ký/đăng nhập người dùng hiện đang tạm đóng bởi Quản trị viên." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    const email = body.email?.trim();
    const password = body.password;
    const displayName = body.displayName?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    // Luôn luôn tạo tài khoản với role "viewer", tuyệt đối không bao giờ cấp admin
    const user = await createViewerUser(email, password, displayName);

    return NextResponse.json({
      success: true,
      message: "Đăng ký tài khoản thành công!",
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error: unknown) {
    console.error("[/api/viewer/register] Error:", error);
    const message =
      error instanceof Error ? error.message : "Đăng ký tài khoản thất bại";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
