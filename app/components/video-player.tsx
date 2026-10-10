"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface VideoPlayerProps {
  slug: string;
  sv: string;
  ep: string;
  title: string;
}

/**
 * Phát hiện IDM extension đang chạy.
 * IDM CC (Chrome/Firefox extension) để lại dấu vết trong DOM và window.
 */
function detectIDM(): boolean {
  // Dấu hiệu DOM của IDM CC extension
  const domSigns = [
    "[idm_extension]",
    "#IDMDownloadLink",
    "[idm_id]",
    "[idm_initialized]",
  ];
  for (const sel of domSigns) {
    try {
      if (document.querySelector(sel)) return true;
    } catch {
      /* ignore */
    }
  }

  // Dấu hiệu window vars
  if ("idm_init" in window || "_idm_cc" in window || "IDM" in window) {
    return true;
  }

  // Kiểm tra các link element IDM inject
  const links = document.querySelectorAll("link[href*='idm'], script[src*='idm']");
  if (links.length > 0) return true;

  return false;
}

/**
 * Phát hiện network sniffer qua PerformanceObserver.
 * IDM lấy URL bằng cách monitor network — ta tạo "honeypot" URL
 * rồi kiểm tra xem nó có bị gọi ngoài luồng JS không.
 */
function monitorUnauthorizedRequests(embedUrl: string, onDetect: () => void) {
  if (typeof PerformanceObserver === "undefined") return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const e = entry as PerformanceResourceTiming;
      // Nếu embed URL bị gọi lại từ nguồn không phải iframe
      if (e.name === embedUrl && e.initiatorType !== "iframe") {
        onDetect();
      }
    }
  });

  try {
    observer.observe({ type: "resource", buffered: false });
  } catch {
    /* ignore */
  }

  return () => observer.disconnect();
}

export default function VideoPlayer({ slug, sv, ep, title }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "idm">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const handleIDMDetected = useCallback(() => {
    // Dừng iframe ngay lập tức
    if (iframeRef.current) {
      iframeRef.current.src = "about:blank";
    }
    setStatus("idm");
  }, []);

  useEffect(() => {
    let cancelled = false;
    let idmCheckInterval: ReturnType<typeof setInterval> | null = null;
    let cleanupNetworkMonitor: (() => void) | undefined;

    async function loadPlayer() {
      setStatus("loading");
      try {
        // Kiểm tra IDM ngay từ đầu
        if (detectIDM()) {
          setStatus("idm");
          return;
        }

        const ts = Date.now().toString();

        // Bước 1: Lấy chữ ký HMAC
        const sigRes = await fetch(
          `/api/player/sign?slug=${encodeURIComponent(slug)}&sv=${sv}&ep=${ep}&ts=${ts}`,
          { headers: { "X-Requested-With": "XMLHttpRequest" } }
        );
        if (!sigRes.ok) throw new Error("Không thể xác thực yêu cầu");
        const { sig } = (await sigRes.json()) as { sig: string };

        // Bước 2: Lấy embed URL qua API bảo mật
        const res = await fetch(
          `/api/player?slug=${encodeURIComponent(slug)}&sv=${sv}&ep=${ep}&ts=${ts}&sig=${sig}`,
          { headers: { "X-Requested-With": "XMLHttpRequest" } }
        );
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "Lỗi tải video");
        }
        const { url: realUrl } = (await res.json()) as { url: string };

        if (cancelled) return;

        // Bước 3: Gắn vào iframe
        if (iframeRef.current) {
          iframeRef.current.src = realUrl;
        }
        setStatus("ready");

        // Bước 4: Monitor network để phát hiện IDM download
        cleanupNetworkMonitor = monitorUnauthorizedRequests(realUrl, handleIDMDetected);

        // Bước 5: Kiểm tra IDM extension định kỳ (mỗi 3 giây)
        idmCheckInterval = setInterval(() => {
          if (detectIDM()) {
            handleIDMDetected();
            if (idmCheckInterval) clearInterval(idmCheckInterval);
          }
        }, 3000);
      } catch (err: unknown) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "Lỗi không xác định");
          setStatus("error");
        }
      }
    }

    loadPlayer();

    return () => {
      cancelled = true;
      if (idmCheckInterval) clearInterval(idmCheckInterval);
      cleanupNetworkMonitor?.();
    };
  }, [slug, sv, ep, handleIDMDetected]);

  return (
    <>
      {/* Loading */}
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <div
              className="absolute inset-2 animate-spin rounded-full border-2 border-emerald-300/40 border-b-transparent"
              style={{ animationDirection: "reverse" }}
            />
          </div>
          <p className="text-xs text-slate-400">Đang tải trình phát bảo mật...</p>
        </div>
      )}

      {/* IDM Detected */}
      {status === "idm" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/95 px-6 text-center backdrop-blur-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-700 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <p className="mb-1 text-base font-bold text-white">
              Phát hiện IDM đang chạy
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-white/60">
              Trình tải video <strong className="text-red-400">IDM</strong> đang được kích hoạt.
              Video đã bị tạm dừng để bảo vệ nội dung bản quyền.
            </p>
            <p className="mt-2 text-xs text-white/40">
              Vui lòng tắt IDM và tải lại trang để xem phim.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg transition hover:opacity-90"
          >
            🔄 Tải lại trang
          </button>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950 px-4 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm font-semibold text-slate-200">Không thể tải video</p>
          <p className="text-xs text-slate-400">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/30"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* iframe — src gắn động bởi JS, không có trong SSR HTML */}
      <iframe
        ref={iframeRef}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
      />
    </>
  );
}
