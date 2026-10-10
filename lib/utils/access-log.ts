/**
 * Hệ thống theo dõi lượt truy cập (In-memory).
 * Lưu ý: Dữ liệu sẽ reset khi server khởi động lại.
 * Đây là giải pháp nhẹ, phù hợp cho dự án cá nhân.
 */

export type AccessLogEntry = {
  path: string;
  method: string;
  ip: string;
  userAgent: string;
  timestamp: number;
  country?: string;
  isBot: boolean;
  blocked: boolean;
};

type HourlyStat = {
  hour: string;  // "2025-05-09T12"
  pageViews: number;
  uniqueIPs: Set<string>;
  botHits: number;
  blocked: number;
};

// ─── In-memory storage ─────────────────────────────────────────────────────────
const accessLogs: AccessLogEntry[] = [];
const hourlyStats = new Map<string, HourlyStat>();
const ipRequestCounts = new Map<string, { count: number; firstSeen: number }>();
const blockedIPs = new Set<string>();

const MAX_LOG_SIZE = 5000;       // Giữ tối đa 5000 logs
const RATE_LIMIT_WINDOW = 60000; // 1 phút
const RATE_LIMIT_MAX = 120;      // Tối đa 120 request/phút/IP

// ─── Danh sách User-Agent của bot / crawler ────────────────────────────────────
const BOT_UA_PATTERNS = [
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i,
  /yandexbot/i, /sogou/i, /exabot/i, /facebot/i, /ia_archiver/i,
  /semrush/i, /ahrefsbot/i, /mj12bot/i, /dotbot/i, /rogerbot/i,
  /screaming frog/i, /deepcrawl/i, /dataforseo/i,
  /python-requests/i, /python-urllib/i, /java\//i,
  /go-http-client/i, /libwww-perl/i, /wget/i, /curl\//i,
  /scrapy/i, /httpclient/i, /node-fetch/i, /axios/i,
  /phantom/i, /headless/i, /puppeteer/i, /selenium/i, /playwright/i,
  /crawler/i, /spider/i, /bot\b/i,
];

export function isBot(ua: string | null): boolean {
  if (!ua || ua.length < 10) return true; // UA quá ngắn → khả năng là bot
  return BOT_UA_PATTERNS.some((p) => p.test(ua));
}

// ─── Rate limiting check ───────────────────────────────────────────────────────
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || now - entry.firstSeen > RATE_LIMIT_WINDOW) {
    ipRequestCounts.set(ip, { count: 1, firstSeen: now });
    return false; // Chưa bị giới hạn
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    blockedIPs.add(ip);
    return true; // Bị rate limit
  }

  return false;
}

export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

// ─── Ghi log truy cập ─────────────────────────────────────────────────────────
export function logAccess(entry: AccessLogEntry) {
  // Giới hạn kích thước
  if (accessLogs.length >= MAX_LOG_SIZE) {
    accessLogs.splice(0, 1000); // Xóa 1000 entries cũ nhất
  }
  accessLogs.push(entry);

  // Cập nhật hourly stats
  const hourKey = new Date(entry.timestamp).toISOString().slice(0, 13); // "2025-05-09T12"
  let stat = hourlyStats.get(hourKey);
  if (!stat) {
    stat = { hour: hourKey, pageViews: 0, uniqueIPs: new Set(), botHits: 0, blocked: 0 };
    hourlyStats.set(hourKey, stat);
  }
  stat.pageViews++;
  stat.uniqueIPs.add(entry.ip);
  if (entry.isBot) stat.botHits++;
  if (entry.blocked) stat.blocked++;

  // Dọn dẹp stats cũ hơn 72 giờ
  const cutoff = Date.now() - 72 * 60 * 60 * 1000;
  for (const [key, val] of hourlyStats) {
    if (new Date(val.hour).getTime() < cutoff) {
      hourlyStats.delete(key);
    }
  }
}

// ─── Lấy dữ liệu thống kê ────────────────────────────────────────────────────
export function getAnalytics() {
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;

  // Logs trong 24h gần nhất
  const recentLogs = accessLogs.filter((l) => l.timestamp > last24h);

  // Đếm unique IPs
  const uniqueIPs = new Set(recentLogs.map((l) => l.ip));
  const botCount = recentLogs.filter((l) => l.isBot).length;
  const blockedCount = recentLogs.filter((l) => l.blocked).length;

  // Top pages
  const pageCounts = new Map<string, number>();
  for (const log of recentLogs) {
    pageCounts.set(log.path, (pageCounts.get(log.path) || 0) + 1);
  }
  const topPages = [...pageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([path, count]) => ({ path, count }));

  // Top IPs
  const ipCounts = new Map<string, number>();
  for (const log of recentLogs) {
    ipCounts.set(log.ip, (ipCounts.get(log.ip) || 0) + 1);
  }
  const topIPs = [...ipCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count, isBlocked: blockedIPs.has(ip) }));

  // Hourly chart data (24 giờ)
  const hourlyData: { hour: string; views: number; unique: number; bots: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now - i * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 13);
    const stat = hourlyStats.get(key);
    hourlyData.push({
      hour: d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      views: stat?.pageViews || 0,
      unique: stat?.uniqueIPs.size || 0,
      bots: stat?.botHits || 0,
    });
  }

  // Recent logs (50 gần nhất)
  const recentEntries = accessLogs
    .slice(-50)
    .reverse()
    .map((l) => ({
      path: l.path,
      method: l.method,
      ip: l.ip,
      userAgent: l.userAgent.slice(0, 80),
      timestamp: l.timestamp,
      isBot: l.isBot,
      blocked: l.blocked,
    }));

  return {
    totalRequests24h: recentLogs.length,
    uniqueVisitors24h: uniqueIPs.size,
    botRequests24h: botCount,
    blockedRequests24h: blockedCount,
    topPages,
    topIPs,
    hourlyData,
    recentLogs: recentEntries,
    blockedIPsList: [...blockedIPs],
  };
}

// ─── Quản lý IP ────────────────────────────────────────────────────────────────
export function blockIP(ip: string) {
  blockedIPs.add(ip);
}

export function unblockIP(ip: string) {
  blockedIPs.delete(ip);
}
