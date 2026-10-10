import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import AppShell from "@/app/app-shell";
import { getGenres, getCountries } from "@/lib/api";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "mePhim - Web xem phim online",
  description:
    "Giao diện web xem phim được viết lại bằng Next.js/Node.js theo phong cach mePhim.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [genres, countries] = await Promise.all([
    getGenres().catch((err) => {
      console.error("Failed to fetch genres:", err);
      return [];
    }),
    getCountries().catch((err) => {
      console.error("Failed to fetch countries:", err);
      return [];
    }),
  ]);

  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <Script
          id="sanitize-bis-skin-checked"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var removeAttr = function (root) {
                  if (!root || !root.querySelectorAll) return;
                  var nodes = root.querySelectorAll("[bis_skin_checked]");
                  for (var i = 0; i < nodes.length; i++) {
                    nodes[i].removeAttribute("bis_skin_checked");
                  }
                };
                removeAttr(document);
                var observer = new MutationObserver(function (mutations) {
                  for (var i = 0; i < mutations.length; i++) {
                    var target = mutations[i].target;
                    if (target && target.removeAttribute && target.hasAttribute && target.hasAttribute("bis_skin_checked")) {
                      target.removeAttribute("bis_skin_checked");
                    }
                  }
                });
                observer.observe(document.documentElement, {
                  subtree: true,
                  attributes: true,
                  attributeFilter: ["bis_skin_checked"]
                });
                setTimeout(function () {
                  observer.disconnect();
                }, 5000);
              })();
            `,
          }}
        />
        <Script
          id="block-devtools"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                // Chặn chuột phải
                document.addEventListener('contextmenu', function(e) {
                  e.preventDefault();
                  return false;
                });

                // Chặn phím tắt DevTools
                document.addEventListener('keydown', function(e) {
                  if (e.keyCode === 123) { e.preventDefault(); return false; }
                  if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) { e.preventDefault(); return false; }
                  if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
                });

                // Tạo overlay cảnh báo đẹp
                function createOverlay() {
                  if (document.getElementById('dt-overlay')) return;
                  var overlay = document.createElement('div');
                  overlay.id = 'dt-overlay';
                  overlay.style.cssText = [
                    'position:fixed','top:0','left:0','width:100%','height:100%',
                    'background:rgba(0,0,0,0.92)','backdrop-filter:blur(12px)',
                    '-webkit-backdrop-filter:blur(12px)',
                    'z-index:2147483647','display:flex',
                    'align-items:center','justify-content:center',
                    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
                    'animation:dtFadeIn 0.3s ease'
                  ].join(';');

                  var style = document.createElement('style');
                  style.textContent = '@keyframes dtFadeIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}} @keyframes dtPulse{0%,100%{opacity:1}50%{opacity:0.6}}';
                  document.head && document.head.appendChild(style);

                  overlay.innerHTML = [
                    '<div style="max-width:420px;width:90%;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px 36px;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,0.6)">',
                      '<div style="width:72px;height:72px;background:linear-gradient(135deg,#e74c3c,#c0392b);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 8px 24px rgba(231,76,60,0.4)">',
                        '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
                          '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
                        '</svg>',
                      '</div>',
                      '<h2 style="color:#ffffff;font-size:1.4rem;font-weight:700;margin:0 0 10px;letter-spacing:-0.3px">Truy cập bị hạn chế</h2>',
                      '<p style="color:rgba(255,255,255,0.65);font-size:0.92rem;line-height:1.7;margin:0 0 6px">',
                        'Chúng tôi phát hiện <strong style="color:#e74c3c">DevTools</strong> đang được mở.',
                      '</p>',
                      '<p style="color:rgba(255,255,255,0.65);font-size:0.92rem;line-height:1.7;margin:0 0 28px">',
                        'Video đã được <strong style="color:#f39c12">tạm dừng</strong> để bảo vệ nội dung.<br>Vui lòng đóng DevTools để tiếp tục xem.',
                      '</p>',
                      '<div style="display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.25);border-radius:10px;padding:12px 20px">',
                        '<span style="width:8px;height:8px;background:#e74c3c;border-radius:50%;animation:dtPulse 1.5s infinite;flex-shrink:0"></span>',
                        '<span style="color:rgba(255,255,255,0.5);font-size:0.8rem">Đang chờ bạn đóng DevTools...</span>',
                      '</div>',
                    '</div>'
                  ].join('');

                  document.body && document.body.appendChild(overlay);
                }

                function removeOverlay() {
                  var overlay = document.getElementById('dt-overlay');
                  if (overlay) {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.3s ease';
                    setTimeout(function() { overlay && overlay.parentNode && overlay.parentNode.removeChild(overlay); }, 300);
                  }
                }

                function pauseAllVideos() {
                  var videos = document.querySelectorAll('video');
                  for (var i = 0; i < videos.length; i++) {
                    if (!videos[i].paused) {
                      videos[i].pause();
                      videos[i].setAttribute('data-dt-paused', '1');
                    }
                  }
                  // Dừng iframe embed (YouTube, v.v.)
                  var iframes = document.querySelectorAll('iframe');
                  for (var j = 0; j < iframes.length; j++) {
                    try {
                      var src = iframes[j].src;
                      if (src) {
                        iframes[j].setAttribute('data-dt-src', src);
                        iframes[j].src = '';
                      }
                    } catch(e) {}
                  }
                }

                function resumeVideos() {
                  var iframes = document.querySelectorAll('iframe[data-dt-src]');
                  for (var j = 0; j < iframes.length; j++) {
                    try {
                      iframes[j].src = iframes[j].getAttribute('data-dt-src');
                      iframes[j].removeAttribute('data-dt-src');
                    } catch(e) {}
                  }
                }

                // Phát hiện DevTools
                var devtoolsOpen = false;
                var threshold = 160;

                setInterval(function() {
                  var widthDiff = window.outerWidth - window.innerWidth > threshold;
                  var heightDiff = window.outerHeight - window.innerHeight > threshold;

                  if (widthDiff || heightDiff) {
                    if (!devtoolsOpen) {
                      devtoolsOpen = true;
                      pauseAllVideos();
                      createOverlay();
                    }
                  } else {
                    if (devtoolsOpen) {
                      devtoolsOpen = false;
                      removeOverlay();
                      resumeVideos();
                    }
                  }
                }, 500);
              })();
            `,
          }}
        />
        <Script
          id="block-idm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 1. Phát hiện IDM extension (IDM CC - Chrome/Firefox extension)
                // IDM CC thêm attribute "idm_detected" hoặc inject elements vào DOM
                function detectIDMExtension() {
                  // Kiểm tra các dấu hiệu IDM extension để lại trong DOM
                  var idmSigns = [
                    '[idm_extension]',
                    '#IDMDownloadLink',
                    '[idm_id]',
                    'idm-extension',
                  ];
                  for (var i = 0; i < idmSigns.length; i++) {
                    if (document.querySelector(idmSigns[i])) return true;
                  }
                  // Kiểm tra window object (IDM CC inject biến toàn cục)
                  if (typeof window.idm_init !== 'undefined') return true;
                  if (typeof window._idm_cc !== 'undefined') return true;
                  return false;
                }

                // 2. Ngăn sự kiện download / drag-and-drop trên media elements
                function protectMediaElements() {
                  document.querySelectorAll('video, audio, iframe').forEach(function(el) {
                    // Chặn drag (IDM bắt event dragstart để lấy URL)
                    el.addEventListener('dragstart', function(e) { e.preventDefault(); return false; }, true);
                    // Thêm controlsList nodownload cho <video>
                    if (el.tagName === 'VIDEO') {
                      el.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
                      el.setAttribute('disablePictureInPicture', '');
                      el.oncontextmenu = function(e) { e.preventDefault(); return false; };
                    }
                  });

                  // Chặn Ctrl+S (Save page — IDM hook vào đây)
                  document.addEventListener('keydown', function(e) {
                    if (e.ctrlKey && e.keyCode === 83) {
                      e.preventDefault(); return false;
                    }
                    // Ctrl+J (Downloads trong Chrome)
                    if (e.ctrlKey && e.keyCode === 74) {
                      e.preventDefault(); return false;
                    }
                  }, true);
                }

                // 3. Chặn BeforeUnload download trigger
                // IDM capture network request từ <a download> — xóa thuộc tính này
                function removeDownloadAttributes() {
                  document.querySelectorAll('a[download], a[href$=".mp4"], a[href$=".m3u8"], a[href$=".ts"]').forEach(function(a) {
                    a.removeAttribute('download');
                    a.setAttribute('href', '#');
                    a.addEventListener('click', function(e) { e.preventDefault(); });
                  });
                }

                // 4. Poison pill — tạo request fake để confuse IDM
                function poisonIDM() {
                  // Tạo link ẩn với URL giả, IDM sẽ cố download nhưng nhận 403
                  var fakeLinks = [
                    '/api/player?slug=FAKE_IDM_TRAP&sv=0&ep=0&ts=0&sig=invalid',
                  ];
                  fakeLinks.forEach(function(url) {
                    var a = document.createElement('a');
                    a.href = url;
                    a.style.display = 'none';
                    a.setAttribute('data-idm-trap', '1');
                    // Không append vào DOM — chỉ tạo để confuse memory scan
                  });
                }

                // Chạy khi DOM sẵn sàng
                function init() {
                  protectMediaElements();
                  removeDownloadAttributes();
                  poisonIDM();

                  // Theo dõi DOM mới (video thêm sau)
                  var obs = new MutationObserver(function() {
                    protectMediaElements();
                    removeDownloadAttributes();
                  });
                  obs.observe(document.body, { childList: true, subtree: true });
                }

                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', init);
                } else {
                  init();
                }

                // Kiểm tra IDM extension theo chu kỳ
                setInterval(function() {
                  if (detectIDMExtension()) {
                    // Ẩn iframe player nếu có IDM
                    document.querySelectorAll('#player-wrapper iframe').forEach(function(f) {
                      if (!f.getAttribute('data-idm-blocked')) {
                        f.setAttribute('data-idm-src', f.src);
                        f.src = '';
                        f.setAttribute('data-idm-blocked', '1');
                        var warn = document.createElement('div');
                        warn.style.cssText = 'position:absolute;inset:0;z-index:99;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;color:#fff;font-family:sans-serif;font-size:14px;text-align:center;padding:20px';
                        warn.innerHTML = '<div><p style="font-size:24px;margin-bottom:8px">🚫</p><p>Phát hiện IDM đang chạy.<br>Vui lòng tắt IDM để xem phim.</p></div>';
                        f.parentNode && f.parentNode.appendChild(warn);
                      }
                    });
                  }
                }, 2000);
              })();
            `,
          }}
        />
        <Script
          id="detect-adblock"
          src="/detect-adblock.js"
          strategy="afterInteractive"
        />
        <Suspense fallback={null}>
          <AppShell genres={genres} countries={countries}>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
