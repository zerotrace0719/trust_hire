// TrustHire AI — Zoom Content Script
(function () {
  if (window.__trusthireZoomLoaded) return;
  window.__trusthireZoomLoaded = true;

  let widget = document.createElement("div");
  widget.id = "trusthire-widget";
  widget.className = "th-widget th-analyzing";
  widget.innerHTML = `
    <div class="th-widget-pill">
      <div class="th-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div class="th-text">
        <div class="th-label">TrustHire</div>
        <div class="th-status">Zoom monitor</div>
      </div>
      <div class="th-score">—</div>
    </div>
  `;
  document.body.appendChild(widget);

  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: "trusthire_detected",
      payload: {
        source: "zoom",
        subject: "Live Zoom session",
        message_body: `User joined a Zoom session at ${location.href}`,
        urls: [location.href],
      },
    });
  }, 3000);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "trusthire_verdict") {
      const d = msg.data;
      const cls = d.verdict === "SAFE" ? "th-safe" : d.verdict === "CAUTION" ? "th-caution" : "th-danger";
      widget.className = `th-widget ${cls}`;
      widget.querySelector(".th-status").textContent = d.verdict;
      widget.querySelector(".th-score").textContent = d.score;
    }
  });
})();
