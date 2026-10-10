import { NextRequest, NextResponse } from "next/server";
import { logAccess, isBot, checkRateLimit, isIPBlocked } from "@/lib/utils/access-log";

/**
 * POST /api/log-access
 * Ghi log lượt truy cập trang. Gọi từ client-side.
 * Body: { path: string }
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") || "";

    // Kiểm tra IP bị chặn
    if (isIPBlocked(ip)) {
      return NextResponse.json({ error: "Blocked" }, { status: 403 });
    }

    // Rate limiting
    if (checkRateLimit(ip)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const body = (await req.json().catch(() => ({}))) as { path?: string };
    const path = body.path || "/";

    logAccess({
      path,
      method: "GET",
      ip,
      userAgent: ua,
      timestamp: Date.now(),
      isBot: isBot(ua),
      blocked: false,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
