import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/admin/auth";
import { getAnalytics, blockIP, unblockIP } from "@/lib/utils/access-log";

export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest) {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  return verifySessionCookie(sessionCookie);
}

/**
 * GET /api/admin/analytics
 * Lấy dữ liệu thống kê truy cập.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = getAnalytics();
  return NextResponse.json(data);
}

/**
 * POST /api/admin/analytics
 * Quản lý block/unblock IP.
 * Body: { action: "block" | "unblock", ip: string }
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { action?: string; ip?: string };

  if (!body.ip) {
    return NextResponse.json({ error: "Thiếu IP" }, { status: 400 });
  }

  if (body.action === "block") {
    blockIP(body.ip);
    return NextResponse.json({ success: true, message: `Đã chặn IP ${body.ip}` });
  } else if (body.action === "unblock") {
    unblockIP(body.ip);
    return NextResponse.json({ success: true, message: `Đã bỏ chặn IP ${body.ip}` });
  }

  return NextResponse.json({ error: "action phải là 'block' hoặc 'unblock'" }, { status: 400 });
}
