(function () {
  function showAdblockOverlay() {
    if (document.getElementById("ab-overlay")) return;

    var s = document.createElement("style");
    s.textContent =
      "@keyframes abFadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}" +
      "@keyframes abShine{0%{background-position:200% center}100%{background-position:-200% center}}" +
      "@keyframes abBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}" +
      "@keyframes abPulse{0%,100%{opacity:1}50%{opacity:0.7}}";
    document.head.appendChild(s);

    var overlay = document.createElement("div");
    overlay.id = "ab-overlay";
    overlay.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;" +
      "background:rgba(5,8,22,0.96);backdrop-filter:blur(16px);" +
      "-webkit-backdrop-filter:blur(16px);z-index:2147483647;" +
      "display:flex;align-items:center;justify-content:center;" +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;' +
      "animation:abFadeIn 0.4s ease";

    var card = document.createElement("div");
    card.style.cssText = "max-width:460px;width:92%;text-align:center;padding:20px";

    /* Icon */
    var iconWrap = document.createElement("div");
    iconWrap.style.cssText =
      "width:90px;height:90px;margin:0 auto 24px;animation:abBounce 2.5s ease-in-out infinite";
    var iconInner = document.createElement("div");
    iconInner.style.cssText =
      "width:90px;height:90px;background:linear-gradient(135deg,#f7971e,#ffd200);" +
      "border-radius:50%;display:flex;align-items:center;justify-content:center;" +
      "box-shadow:0 0 40px rgba(247,151,30,0.4)";
    iconInner.innerHTML =
      '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>' +
      '<line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' +
      "</svg>";
    iconWrap.appendChild(iconInner);
    card.appendChild(iconWrap);

    /* Title */
    var title = document.createElement("h2");
    title.style.cssText = "color:#fff;font-size:1.6rem;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px";
    title.textContent = "Bạn đang dùng AdBlock! 😢";
    card.appendChild(title);

    /* Subtitle */
    var sub = document.createElement("p");
    sub.style.cssText =
      "background:linear-gradient(90deg,#f7971e,#ffd200,#f7971e);background-size:200% auto;" +
      "-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;" +
      "font-size:0.95rem;font-weight:600;margin:0 0 20px;animation:abShine 3s linear infinite";
    sub.textContent = "mePhim hoạt động nhờ doanh thu quảng cáo";
    card.appendChild(sub);

    /* Info card */
    var infoCard = document.createElement("div");
    infoCard.style.cssText =
      "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);" +
      "border-radius:14px;padding:20px 24px;margin-bottom:24px;text-align:left";
    infoCard.innerHTML =
      '<p style="color:rgba(255,255,255,0.75);font-size:0.88rem;line-height:1.8;margin:0 0 12px">' +
      "Chúng tôi cung cấp nội dung <strong style=\"color:#ffd200\">hoàn toàn miễn phí</strong>. " +
      "Quảng cáo là nguồn thu duy nhất giúp duy trì server và cập nhật phim mới.</p>" +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
      '<div style="display:flex;align-items:center;gap:10px;color:rgba(255,255,255,0.6);font-size:0.85rem">' +
      '<span style="width:20px;height:20px;background:rgba(247,151,30,0.15);border:1px solid rgba(247,151,30,0.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.7rem">1</span>' +
      "Tắt AdBlock hoặc thêm <strong style=\"color:#ffd200\">mephim.vip</strong> vào whitelist</div>" +
      '<div style="display:flex;align-items:center;gap:10px;color:rgba(255,255,255,0.6);font-size:0.85rem">' +
      '<span style="width:20px;height:20px;background:rgba(247,151,30,0.15);border:1px solid rgba(247,151,30,0.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.7rem">2</span>' +
      "Tải lại trang sau khi đã tắt</div></div>";
    card.appendChild(infoCard);

    /* Buttons */
    var btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:12px;justify-content:center";

    var btn1 = document.createElement("button");
    btn1.style.cssText =
      "flex:1;max-width:180px;padding:13px 24px;" +
      "background:linear-gradient(135deg,#f7971e,#ffd200);color:#1a1a1a;" +
      "border:none;border-radius:12px;font-size:0.9rem;font-weight:700;" +
      "cursor:pointer;box-shadow:0 4px 20px rgba(247,151,30,0.35)";
    btn1.textContent = "🔄 Tải lại trang";
    btn1.onclick = function () { window.location.reload(); };

    var btn2 = document.createElement("button");
    btn2.style.cssText =
      "flex:1;max-width:180px;padding:13px 24px;" +
      "background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.6);" +
      "border:1px solid rgba(255,255,255,0.12);border-radius:12px;" +
      "font-size:0.9rem;font-weight:600;cursor:pointer";
    btn2.textContent = "Bỏ qua lần này";
    btn2.onclick = function () {
      var el = document.getElementById("ab-overlay");
      if (el) el.style.display = "none";
    };

    btnRow.appendChild(btn1);
    btnRow.appendChild(btn2);
    card.appendChild(btnRow);

    /* Footer */
    var footer = document.createElement("p");
    footer.style.cssText = "color:rgba(255,255,255,0.25);font-size:0.75rem;margin:16px 0 0";
    footer.textContent = "Cảm ơn bạn đã ủng hộ mePhim ❤️";
    card.appendChild(footer);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function detectAdBlock() {
    var testEl = document.createElement("div");
    testEl.className = "ads ad adsbox doubleclick ad-placement carbon-ads";
    testEl.style.cssText =
      "width:1px;height:1px;position:absolute;top:-999px;left:-999px;opacity:0;pointer-events:none";
    testEl.innerHTML = "&nbsp;";
    document.body.appendChild(testEl);

    setTimeout(function () {
      var cs = window.getComputedStyle(testEl);
      var blocked =
        testEl.offsetHeight === 0 ||
        testEl.offsetWidth === 0 ||
        cs.display === "none" ||
        cs.visibility === "hidden";
      if (testEl.parentNode) testEl.parentNode.removeChild(testEl);
      if (blocked) showAdblockOverlay();
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", detectAdBlock);
  } else {
    detectAdBlock();
  }
})();
