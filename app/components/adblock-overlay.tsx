"use client";

import { useEffect, useState } from "react";

export default function AdBlockOverlay() {
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const test = document.createElement("div");
    test.className = "ads ad adsbox doubleclick ad-placement carbon-ads";
    test.style.cssText =
      "width:1px;height:1px;position:absolute;top:-9999px;left:-9999px;opacity:0;pointer-events:none";
    test.innerHTML = "&nbsp;";
    document.body.appendChild(test);

    const timer = setTimeout(() => {
      const cs = window.getComputedStyle(test);
      const blocked =
        test.offsetHeight === 0 ||
        test.offsetWidth === 0 ||
        cs.display === "none" ||
        cs.visibility === "hidden";
      if (test.parentNode) test.parentNode.removeChild(test);

      if (blocked) {
        setDetected(true);
        // Dừng iframe player
        const wrapper = document.getElementById("player-wrapper");
        if (wrapper) {
          wrapper.querySelectorAll<HTMLIFrameElement>("iframe:not([data-ab-saved])").forEach((f) => {
            f.setAttribute("data-ab-saved", f.src);
            f.src = "";
          });
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  if (!detected) return null;

  const handleReload = () => window.location.reload();
  const handleDismiss = () => setDetected(false);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 px-6 text-center backdrop-blur-md">
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-[0_0_32px_rgba(251,191,36,0.4)]">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#111"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      {/* Text */}
      <div>
        <p className="mb-1 text-base font-bold text-white">
          Bạn đang dùng AdBlock 😢
        </p>
        <p className="max-w-xs text-xs leading-relaxed text-white/60">
          Video bị tạm dừng. Vui lòng{" "}
          <span className="font-semibold text-yellow-400">tắt AdBlock</span>{" "}
          hoặc thêm trang này vào whitelist, sau đó tải lại trang để tiếp tục
          xem phim miễn phí.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={handleReload}
          className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 text-xs font-bold text-black shadow-lg transition hover:opacity-90"
        >
          🔄 Tải lại trang
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/20"
        >
          Bỏ qua
        </button>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-white/30">
        mePhim hoạt động nhờ doanh thu quảng cáo ❤️
      </p>
    </div>
  );
}
