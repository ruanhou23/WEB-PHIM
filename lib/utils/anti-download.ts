/**
 * Danh sách User-Agent của IDM và các download manager phổ biến
 */
export const BLOCKED_UA_PATTERNS = [
  // IDM - Internet Download Manager
  /IDM\b/i,
  /Internet\s*Download\s*Manager/i,
  /\bIDM\//i,

  // Aria2, wget, curl khi download
  /aria2/i,
  /\bwget\b/i,
  /\bcurl\b/i,

  // JDownloader
  /JDownloader/i,

  // Free Download Manager
  /FDM\b/i,
  /Free\s*Download\s*Manager/i,

  // GetRight, FlashGet, DAP...
  /GetRight/i,
  /FlashGet/i,
  /\bDAP\b/i,
  /Download\s*Accelerator/i,

  // youtube-dl / yt-dlp
  /youtube-dl/i,
  /yt-dlp/i,
  /yt_dlp/i,

  // python-requests (thường dùng để scrape stream)
  /python-requests/i,
  /python-urllib/i,
  /Go-http-client/i,
  /Java\/\d/i,
  /okhttp/i,

  // Empty UA hoặc tool UA đơn giản
  /^-$/,
  /^$/,
];

/**
 * Kiểm tra xem User-Agent có bị block không
 */
export function isBlockedUserAgent(ua: string | null): boolean {
  if (!ua || ua.trim() === "") return true;
  return BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

/**
 * Headers chặn download / cache / index
 */
export const ANTI_DOWNLOAD_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  "Pragma":        "no-cache",
  "X-Robots-Tag":  "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  "Content-Disposition": "inline",
  // Ngăn được nhúng vào công cụ khác
  "X-Frame-Options": "SAMEORIGIN",
  // Không cho phép chia sẻ qua CDN
  "Surrogate-Control": "no-store",
  "Vary": "Origin",
};
