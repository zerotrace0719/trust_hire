// TrustHire AI — Gmail Content Script (Trusted Types-safe)
//
// Gmail enforces Trusted Types CSP which blocks innerHTML assignment.
// This version uses only createElement / appendChild / textContent.

(function () {
  if (window.__trusthireGmailLoaded) return;
  window.__trusthireGmailLoaded = true;

  const RECRUITER_KEYWORDS = [
    "hiring", "recruiter", "interview", "shortlisted", "selected",
    "opening", "opportunity", "offer letter", "joining", "ctc", "lpa",
    "position", "role", "talent acquisition", "career",
    "internship", "intern", "stipend", "induction", "onboarding",
    "meeting", "session", "candidate", "application"
];

  let lastEmailHash = "";
  let scanButton = null;
  let widget = null;
  let mode = "manual";

  // ---------- DOM helpers (no innerHTML) ----------
  function el(tag, opts) {
    const node = document.createElement(tag);
    if (opts) {
      if (opts.className) node.className = opts.className;
      if (opts.id) node.id = opts.id;
      if (opts.text) node.textContent = opts.text;
      if (opts.attrs) {
        for (const k in opts.attrs) node.setAttribute(k, opts.attrs[k]);
      }
      if (opts.style) {
        for (const k in opts.style) node.style[k] = opts.style[k];
      }
    }
    return node;
  }

  // Builds a shield SVG icon without innerHTML
  function shieldSVG(width, height) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z");
    svg.appendChild(path);
    return svg;
  }

  // ---------- Settings ----------
  function loadMode() {
    try {
      chrome.storage.local.get(["trusthire_settings_v1"], (result) => {
        const stored = result && result.trusthire_settings_v1;
        if (stored && stored.mode) mode = stored.mode;
      });
    } catch (e) { mode = "manual"; }
  }

  try {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.trusthire_settings_v1 && changes.trusthire_settings_v1.newValue) {
        mode = changes.trusthire_settings_v1.newValue.mode || "manual";
        setTimeout(checkEmail, 100);
      }
    });
  } catch (e) {}

  // ---------- Email extraction ----------
  function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h.toString(36);
  }

  function extractEmail() {
    const headerEl = document.querySelector('[role="main"] h2.hP');
    const subject = headerEl ? headerEl.textContent.trim() : "";
    if (!subject) return null;

    const senderEl = document.querySelector('[role="main"] .gD');
    const senderEmail = senderEl ? (senderEl.getAttribute("email") || "") : "";

    const bodyEl = document.querySelector('[role="main"] .a3s');
    const body = bodyEl ? bodyEl.innerText : "";

    const urls = [];
    if (bodyEl) {
      bodyEl.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (href && /^https?:\/\//.test(href)) urls.push(href);
      });
    }

    return { senderEmail, subject, body: body.slice(0, 4000), urls };
  }

  function isRecruiterEmail(email) {
    const blob = (email.subject + " " + email.body).toLowerCase();
    return RECRUITER_KEYWORDS.some((k) => blob.includes(k));
  }

  function guessCompany(email) {
    const m = /(?:at|from|with|join)\s+([A-Z][A-Za-z0-9&]+(?:\s+[A-Z][A-Za-z0-9&]+){0,2})/.exec(
      email.subject + " " + email.body
    );
    return m && m[1] && m[1].length < 30 ? m[1].trim() : "";
  }

  // ---------- Floating scan button ----------
  function showScanButton(email) {
    removeScanButton();
    const btn = el("div", {
      id: "trusthire-scan-btn",
      className: "th-scan-button th-scan-floating",
    });
    btn.appendChild(shieldSVG(14, 14));
    const label = el("span", { className: "th-scan-label", text: "Scan with TrustHire AI" });
    btn.appendChild(label);

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      runAnalysis(email);
      btn.classList.add("th-scan-scanning");
      label.textContent = "Scanning…";
    });

    document.body.appendChild(btn);
    scanButton = btn;
  }

  function removeScanButton() {
    if (scanButton && scanButton.parentNode) {
      scanButton.parentNode.removeChild(scanButton);
    }
    scanButton = null;
  }

  // ---------- Verdict widget ----------
  function ensureWidget() {
    if (widget) return widget;
    const w = el("div", { id: "trusthire-widget", className: "th-widget th-idle" });

    const pill = el("div", { className: "th-widget-pill" });
    const iconBox = el("div", { className: "th-icon" });
    iconBox.appendChild(shieldSVG(16, 16));
    pill.appendChild(iconBox);

    const textBox = el("div", { className: "th-text" });
    textBox.appendChild(el("div", { className: "th-label", text: "TrustHire" }));
    const status = el("div", { className: "th-status", text: "Idle" });
    textBox.appendChild(status);
    pill.appendChild(textBox);

    const score = el("div", { className: "th-score", text: "—" });
    pill.appendChild(score);
    w.appendChild(pill);

    w.addEventListener("click", function () {
      window.open("http://localhost:3000", "_blank");
    });

    document.body.appendChild(w);
    widget = w;
    return w;
  }

  function updateWidget(state) {
    const w = ensureWidget();
    w.className = "th-widget th-" + state.state;
    const statusEl = w.querySelector(".th-status");
    const scoreEl = w.querySelector(".th-score");
    if (statusEl) statusEl.textContent = state.verdict || state.state;
    if (scoreEl) scoreEl.textContent = typeof state.score === "number" ? String(state.score) : "—";
  }

  function removeWidget() {
    if (widget && widget.parentNode) widget.parentNode.removeChild(widget);
    widget = null;
  }

  // ---------- Analysis trigger ----------
  function runAnalysis(email) {
    updateWidget({ state: "analyzing", verdict: "Analyzing…" });
    try {
      chrome.runtime.sendMessage({
        type: "trusthire_detected",
        payload: {
          source: "gmail",
          sender_email: email.senderEmail,
          claimed_company: guessCompany(email),
          subject: email.subject,
          message_body: email.body,
          urls: email.urls,
        },
      });
    } catch (e) {
      console.warn("[TrustHire] sendMessage failed", e);
    }
  }

  // ---------- Main check ----------
  function checkEmail() {
    let email;
    try { email = extractEmail(); } catch (e) { return; }

    if (!email) {
      removeScanButton();
      return;
    }

    const h = hashString(email.senderEmail + "|" + email.subject);
    if (h === lastEmailHash) return;

    if (!isRecruiterEmail(email)) {
      removeScanButton();
      removeWidget();
      return;
    }

    lastEmailHash = h;

    if (mode === "always") {
      removeScanButton();
      runAnalysis(email);
    } else {
      removeWidget();
      showScanButton(email);
    }
  }

  // ---------- Listen for verdicts from background ----------
  try {
    chrome.runtime.onMessage.addListener(function (msg) {
      if (!msg || !msg.type) return;
      if (msg.type === "trusthire_verdict" && msg.data) {
        const d = msg.data;
        const v = (d.verdict || "").toLowerCase();
        const state = v === "safe" ? "safe" : v === "caution" ? "caution" : "danger";
        updateWidget({ state, score: d.score, verdict: d.verdict });

        if (scanButton) {
          scanButton.classList.remove("th-scan-scanning");
          scanButton.classList.add("th-scan-" + v);
          const label = scanButton.querySelector(".th-scan-label");
          if (label) label.textContent = d.verdict + " · " + d.score;
        }
      } else if (msg.type === "trusthire_score" && msg.data) {
        updateWidget({ state: "analyzing", score: msg.data.score, verdict: msg.data.verdict });
      }
    });
  } catch (e) {}

  // ---------- Watch for Gmail navigation ----------
  let checkTimer = null;
  function scheduleCheck() {
    if (checkTimer) clearTimeout(checkTimer);
    checkTimer = setTimeout(checkEmail, 300);
  }

  try {
    const observer = new MutationObserver(scheduleCheck);
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

  // ---------- Init ----------
  loadMode();
  setTimeout(checkEmail, 1500);
})();