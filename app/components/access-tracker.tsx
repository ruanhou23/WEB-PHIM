"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Component ẩn, tự động ghi log mỗi khi user chuyển trang.
 * Nhúng vào layout chính.
 */
export default function AccessTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Không log trang admin và API
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    const controller = new AbortController();

    // Delay nhỏ để tránh log khi user chuyển trang nhanh
    const timer = setTimeout(() => {
      fetch("/api/log-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        signal: controller.signal,
      }).catch(() => {
        // Bỏ qua lỗi network
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pathname]);

  return null; // Không render gì
}
