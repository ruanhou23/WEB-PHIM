import { NextResponse } from "next/server";
import { isSiteProtected, isUserLoginEnabled } from "@/lib/utils/site-protection";

export const dynamic = "force-dynamic";

/**
 * GET /api/site-status
 * Trả về trạng thái bảo vệ site & trạng thái tính năng đăng nhập người dùng.
 */
export async function GET() {
  try {
    const [isProtected, userLoginEnabled] = await Promise.all([
      isSiteProtected(),
      isUserLoginEnabled(),
    ]);
    return NextResponse.json({
      protected: isProtected,
      userLoginEnabled: userLoginEnabled,
    });
  } catch {
    return NextResponse.json({
      protected: false,
      userLoginEnabled: true,
    });
  }
}
