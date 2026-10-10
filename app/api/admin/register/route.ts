import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie, createAdminUser, listAdminUsers, deleteAdminUser } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/**
 * Kiểm tra quyền admin từ session cookie.
 */
async function requireAdmin(req: NextRequest) {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  return verifySessionCookie(sessionCookie);
}

/**
 * GET /api/admin/register
 * Lấy danh sách tài khoản admin hiện có.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await listAdminUsers();
    return NextResponse.json({
      users: users.map((u) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        createdAt: u.metadata.creationTime,
        lastSignIn: u.metadata.lastSignInTime,
      })),
    });
  } catch (error) {
    console.error("[/api/admin/register] GET error:", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách admin" }, { status: 500 });
  }
}

/**
 * POST /api/admin/register
 * Tạo tài khoản admin mới. Chỉ admin đã đăng nhập mới được phép.
 * Body: { email, password, displayName? }
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const user = await createAdminUser(email, password, displayName);

    return NextResponse.json({
      success: true,
      message: "Tạo tài khoản admin thành công",
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error: unknown) {
    console.error("[/api/admin/register] POST error:", error);
    const message =
      error instanceof Error ? error.message : "Lỗi tạo tài khoản";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/register
 * Xóa tài khoản admin. Body: { uid }
 */
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { uid?: string };
    const uid = body.uid;

    if (!uid) {
      return NextResponse.json({ error: "Thiếu UID" }, { status: 400 });
    }

    // Không cho phép tự xóa chính mình
    if (uid === admin.uid) {
      return NextResponse.json(
        { error: "Không thể tự xóa tài khoản của mình" },
        { status: 400 }
      );
    }

    await deleteAdminUser(uid);

    return NextResponse.json({
      success: true,
      message: "Đã xóa tài khoản admin",
    });
  } catch (error: unknown) {
    console.error("[/api/admin/register] DELETE error:", error);
    const message =
      error instanceof Error ? error.message : "Lỗi xóa tài khoản";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
