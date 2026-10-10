import { NextRequest, NextResponse } from "next/server";
import { getMovieDetail } from "@/lib/api/ophim";
import crypto from "crypto";
import { isBlockedUserAgent } from "@/lib/utils/anti-download";

import { SESSION_COOKIE_NAME, VIEWER_SESSION_COOKIE_NAME } from "@/lib/admin/constants";
import { verifyViewerSession } from "@/lib/utils/site-protection";
import { verifySessionCookie } from "@/lib/admin/auth";

const SECRET = process.env.PLAYER_SECRET ?? "mephim_secret_2025_xK9#pQ";
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 phút (thoải mái hơn)

/** Tạo HMAC-SHA256 */
function signToken(slug: string, sv: string, ep: string, ts: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${slug}:${sv}:${ep}:${ts}`)
    .digest("hex");
}

/**
 * GET /api/player?slug=...&sv=...&ep=...&ts=...&sig=...
 * Xác thực HMAC + TTL → trả về embed URL thật
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug = searchParams.get("slug") ?? "";
  const sv   = searchParams.get("sv")   ?? "0";
  const ep   = searchParams.get("ep")   ?? "0";
  const ts   = searchParams.get("ts")   ?? "0";
  const sig  = searchParams.get("sig")  ?? "";

  // 1. Chặn User-Agent của IDM / download tools
  const ua = req.headers.get("user-agent");
  if (isBlockedUserAgent(ua)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // 1.1 Kiểm tra đăng nhập (bắt buộc người dùng hoặc admin phải đăng nhập trước khi xem phim)
  const viewerSessionCookie = req.cookies.get(VIEWER_SESSION_COOKIE_NAME)?.value;
  const adminSessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isAuthenticated = false;
  if (viewerSessionCookie) {
    const session = await verifyViewerSession(viewerSessionCookie);
    if (session) isAuthenticated = true;
  }
  if (!isAuthenticated && adminSessionCookie) {
    const session = await verifySessionCookie(adminSessionCookie);
    if (session) isAuthenticated = true;
  }

  if (!isAuthenticated) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập tài khoản để xem phim" },
      { status: 401 }
    );
  }

  // 2. Kiểm tra chữ ký HMAC
  const expectedSig = signToken(slug, sv, ep, ts);
  if (
    sig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  // 3. Kiểm tra TTL
  const tsNum = Number(ts);
  if (isNaN(tsNum) || Date.now() - tsNum > TOKEN_TTL_MS) {
    return NextResponse.json({ error: "Token expired" }, { status: 403 });
  }

  // 4. Lấy embed URL từ API nguồn
  try {
    const detail = await getMovieDetail(slug);
    if (detail.status !== "success") {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const episodes  = detail.data.item.episodes ?? detail.data.episodes ?? [];
    const serverIdx = Math.max(0, parseInt(sv, 10));
    const epIdx     = Math.max(0, parseInt(ep, 10));
    const server    = episodes[serverIdx];
    const episode   = server?.server_data?.[epIdx];
    const embedUrl  = episode?.link_embed?.trim() ?? "";

    if (!embedUrl) {
      return NextResponse.json({ error: "No embed URL available" }, { status: 404 });
    }

    return NextResponse.json(
      { url: embedUrl },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          "Pragma": "no-cache",
          "X-Robots-Tag": "noindex",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": "inline",
        },
      }
    );
  } catch (err) {
    console.error("[/api/player]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
