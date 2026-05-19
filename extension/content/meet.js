// TrustHire AI — Google Meet Content Script
// Trusted Types safe (no innerHTML). Real metadata extraction.
// Streams live telemetry to backend during the meeting.

(function () {
  if (window.__trusthireMeetLoaded) return;
  window.__trusthireMeetLoaded = true;

  const API_URL = "http://localhost:8000";
  const SESSION_ID = "meet_" + Math.random().toString(36).slice(2, 10);
  const SESSION_START = Date.now();

  let widget = null;
  let monitorBtn = null;
  let analysisFired = false;
  let telemetryTimer = null;

  // ---------- DOM helpers (no innerHTML) ----------
  function el(tag, opts) {
    const node = document.createElement(tag);
    if (opts) {
      if (opts.className) node.className = opts.className;
      if (opts.id) node.id = opts.id;
      if (opts.text) node.textContent = opts.text;
    }
    return node;
  }

  function shieldSVG(width, height) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z");
    svg.appendChild(path);
    return svg;
  }

  // ---------- Meeting metadata extraction ----------
  function extractMeetingCode() {
    // URL format: https://meet.google.com/abc-defg-hij
    const m = location.pathname.match(/\/([a-z]{3,4}-[a-z]{3,4}-[a-z]{3,4})/i);
    return m ? m[1] : "";
  }

  function extractMeetingUrl() {
    return location.origin + location.pathname;
  }

  function getParticipantCount() {
    // Try multiple selectors Google Meet uses
    const counters = [
      '[aria-label*="participant" i]',
      '[data-participant-id]',
      '.zWfAib',  // participant tile container
    ];
    for (const sel of counters) {
      const nodes = document.querySelectorAll(sel);
      if (nodes.length > 0) return nodes.length;
    }
    return 0;
  }

  function checkRecording() {
    // "Meeting is being recorded" banner
    return !!document.querySelector('[aria-label*="recording" i]');
  }

  // Detect typo-squatted Meet-like domains (the security indicator that matters most)
  function analyzeMeetingURL() {
    const host = location.hostname.toLowerCase();
    const flags = [];

    // Legit Google Meet domain
    if (host === "meet.google.com") {
      return { flags: [], suspicious: false, host };
    }

    // Anything else claiming to be Meet is suspicious
    if (/meet|google/i.test(host) && host !== "meet.google.com") {
      flags.push("typo_squatted_domain");
    }

    // Suspicious TLDs
    if (/\.(xyz|top|click|work|info|live)$/i.test(host)) {
      flags.push("suspicious_tld");
    }

    // IP address instead of domain
    if (/^\d+\.\d+\.\d+\.\d+/.test(host)) {
      flags.push("ip_address_url");
    }

    return { flags, suspicious: flags.length > 0, host };
  }

  // ---------- Floating widget (verdict display) ----------
  function ensureWidget() {
    if (widget) return widget;
    const w = el("div", { id: "trusthire-widget", className: "th-widget th-analyzing" });
    const pill = el("div", { className: "th-widget-pill" });

    const icon = el("div", { className: "th-icon" });
    icon.appendChild(shieldSVG(16, 16));
    pill.appendChild(icon);

    const textBox = el("div", { className: "th-text" });
    textBox.appendChild(el("div", { className: "th-label", text: "TrustHire" }));
    textBox.appendChild(el("div", { className: "th-status", text: "Meet monitor" }));
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

  function updateWidget(state, score, verdict) {
    const w = ensureWidget();
    w.className = "th-widget th-" + state;
    const s = w.querySelector(".th-status");
    const sc = w.querySelector(".th-score");
    if (s) s.textContent = verdict || state;
    if (sc) sc.textContent = typeof score === "number" ? String(score) : "—";
  }

  // ---------- "Open Live Monitor" button (manual trigger to dashboard) ----------
  function showMonitorButton() {
    if (monitorBtn) return;
    const btn = el("div", {
      id: "trusthire-monitor-btn",
      className: "th-scan-button th-scan-floating",
    });
    btn.appendChild(shieldSVG(14, 14));
    btn.appendChild(el("span", { className: "th-scan-label", text: "Open Live Interview Monitor" }));
    btn.addEventListener("click", function (e) {
  e.preventDefault();
  // Tell background to focus existing dashboard tab or open new one
  try {
    chrome.runtime.sendMessage({ type: "trusthire_open_dashboard" });
  } catch (err) {
    window.open("http://localhost:3000", "_blank");
  }
});
    document.body.appendChild(btn);
    monitorBtn = btn;
  }

  // ---------- Fire initial analysis (once per session) ----------
  function fireAnalysis() {
    if (analysisFired) return;
    analysisFired = true;

    const urlAnalysis = analyzeMeetingURL();
    const meetingCode = extractMeetingCode();
    const meetingUrl = extractMeetingUrl();

    // Try to read the meeting "topic" / organizer hints from the page
    let organizerHint = "";
    const titleEl = document.querySelector('title');
    if (titleEl) organizerHint = titleEl.textContent || "";

    const payload = {
      source: "meet",
      sender_email: "",  // Meet doesn't expose participant emails reliably
      claimed_company: "",
      subject: "Live Google Meet session: " + meetingCode,
      message_body:
        "User joined a Google Meet session.\n" +
        "Meeting code: " + meetingCode + "\n" +
        "Meeting URL: " + meetingUrl + "\n" +
        "Page title: " + organizerHint,
      urls: [meetingUrl],
      // Simulated deepfake metrics seeded by URL trust
      voice_anomaly_score: urlAnalysis.suspicious ? 0.55 : 0.05,
      lip_sync_offset_ms: urlAnalysis.suspicious ? 165 : 20,
      pause_naturalness: urlAnalysis.suspicious ? 0.4 : 0.92,
      background_noise_profile: "live-session",
    };

    try {
      chrome.runtime.sendMessage({ type: "trusthire_detected", payload });
    } catch (e) {
      console.warn("[TrustHire] could not fire analysis", e);
    }
  }

  // ---------- Live telemetry stream ----------
  async function sendTelemetry() {
    const url = extractMeetingUrl();
    const code = extractMeetingCode();
    const urlAnalysis = analyzeMeetingURL();
    const duration = Math.floor((Date.now() - SESSION_START) / 1000);
    const participantCount = getParticipantCount();
    const isRecording = checkRecording();

    const payload = {
      session_id: SESSION_ID,
      meeting_url: url,
      meeting_code: code,
      participant_count: participantCount,
      duration_seconds: duration,
      organizer_email: "",
      organizer_domain: urlAnalysis.host,
      is_recording: isRecording,
      audio_level: 0.3 + Math.random() * 0.4,  // synthesized for demo visualization
      is_speaking: Math.random() > 0.6,
      risk_indicators: urlAnalysis.flags,
    };

    try {
      await fetch(API_URL + "/api/meet/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // Silent - backend might not be running
    }
  }

  function startTelemetry() {
    if (telemetryTimer) return;
    sendTelemetry(); // immediate first ping
    telemetryTimer = setInterval(sendTelemetry, 1500); // every 1.5s
  }

  function stopTelemetry() {
    if (telemetryTimer) {
      clearInterval(telemetryTimer);
      telemetryTimer = null;
    }
  }

  // ---------- Verdict handler from background ----------
  try {
    chrome.runtime.onMessage.addListener(function (msg) {
      if (!msg || !msg.type) return;
      if (msg.type === "trusthire_verdict" && msg.data) {
        const d = msg.data;
        const v = (d.verdict || "").toLowerCase();
        const state = v === "safe" ? "safe" : v === "caution" ? "caution" : "danger";
        updateWidget(state, d.score, d.verdict);
      }
    });
  } catch (e) {}

  // ---------- Init ----------
  // Wait a couple seconds for Meet to fully load, then start everything
  setTimeout(function () {
    ensureWidget();
    showMonitorButton();
    fireAnalysis();
    startTelemetry();
  }, 3500);

  // Stop telemetry when user leaves Meet
  window.addEventListener("beforeunload", stopTelemetry);
})();