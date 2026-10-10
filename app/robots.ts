import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: ["/admin/", "/api/", "/collection/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/"],
        disallow: ["/admin/", "/api/", "/collection/"],
      },
      {
        // Chặn tất cả các bot crawl dữ liệu
        userAgent: [
          "SemrushBot",
          "AhrefsBot",
          "MJ12bot",
          "DotBot",
          "DataForSeoBot",
          "Screaming Frog SEO Spider",
          "Sogou",
          "PetalBot",
          "Bytespider",
          "GPTBot",
          "CCBot",
          "ChatGPT-User",
          "anthropic-ai",
          "ClaudeBot",
        ],
        disallow: ["/"],
      },
      {
        // Mặc định cho các bot khác
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin/",
          "/api/",
          "/collection/",
          "/_next/",
          "/watch/",
        ],
      },
    ],
  };
}
