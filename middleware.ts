import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, VIEWER_SESSION_COOKIE_NAME } from "@/lib/admin/constants";
import { isBlockedUserAgent } from "@/lib/utils/anti-download";

// ─── Danh sách bot crawl cần chặn (không phải bot tìm kiếm) ─────────────────
const MALICIOUS_BOT_PATTERNS = [
  /scrapy/i, /python-requests/i, /python-urllib/i,
  /go-http-client/i, /libwww-perl/i,
  /httpclient/i, /node-fetch/i,
  /phantom/i, /headless/i, /puppeteer/i, /selenium/i, /playwright/i,
  /wget\/\d/i, /curl\/\d/i,
  /semrush/i, /ahrefsbot/i, /mj12bot/i, /dotbot/i,
  /dataforseo/i, /screaming frog/i, /deepcrawl/i,
  /sogou/i, /exabot/i, /ia_archiver/i,
];

function isMaliciousBot(ua: string | null): boolean {
  if (!ua || ua.length < 10) return true;
  return MALICIOUS_BOT_PATTERNS.some((p) => p.test(ua));
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );
  return res;
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const ua = req.headers.get("user-agent");

  // ─── Chặn bot crawl trên API routes ──────────────────────────────────────
  if (pathname.startsWith("/api/") && isMaliciousBot(ua)) {
    return new NextResponse(
      JSON.stringify({ error: "Access denied" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // ─── Chặn IDM / download manager trên API player ────────────────────────
  if (pathname.startsWith("/api/player")) {
    if (isBlockedUserAgent(ua)) {
      return new NextResponse(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("X-Robots-Tag", "noindex");
    return addSecurityHeaders(res);
  }

  // ─── Admin route protection ──────────────────────────────────────────────
  const adminSession = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasAdminSession = !!adminSession;

  const isProtectedAdminPath =
    pathname.startsWith("/admin/dashboard") ||
    pathname.startsWith("/admin/movies") ||
    pathname.startsWith("/admin/users") ||
    pathname.startsWith("/admin/analytics") ||
    pathname.startsWith("/admin/settings") ||
    pathname.startsWith("/collection/list");

  if (isProtectedAdminPath && !hasAdminSession) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (pathname.startsWith("/api/admin") && !pathname.includes("/login")) {
    if (!hasAdminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ─── Bảo vệ trang đăng ký ẩn /secret-register ─────────────────────────────
  // Chỉ khi đã đăng nhập (admin_session hoặc viewer_session) mới được vào trang này
  if (pathname.startsWith("/secret-register")) {
    const viewerSession = req.cookies.get(VIEWER_SESSION_COOKIE_NAME)?.value;
    if (!hasAdminSession && !viewerSession) {
      return NextResponse.redirect(new URL("/login?redirect=/secret-register", req.url));
    }
  }

  // ─── Site Protection (viewer login check) ────────────────────────────────
  // Các trang KHÔNG cần kiểm tra protection:
  const isExemptPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt";

  if (!isExemptPath) {
    // Kiểm tra viewer session qua cookie
    // (Trạng thái protection được kiểm tra server-side qua API,
    //  nhưng ở middleware chỉ kiểm tra cookie đơn giản)
    const viewerSession = req.cookies.get(VIEWER_SESSION_COOKIE_NAME)?.value;
    const siteProtected = req.cookies.get("site_protected")?.value === "true";

    if (siteProtected && !viewerSession && !hasAdminSession) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  const res = NextResponse.next();
  return addSecurityHeaders(res);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
