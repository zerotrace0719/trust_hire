const $ = (s) => document.querySelector(s);

const MODE_DESCRIPTIONS = {
  manual: 'Click "Scan with TrustHire AI" on emails to analyze',
  smart: "Auto-scan emails with strong recruiter/scam signals",
  always: "Auto-scan anything that looks like recruitment",
};

let currentSettings = { mode: "manual", hasConsented: false, pausedUntil: 0 };

// ---------- Settings ----------
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["trusthire_settings_v1"], (result) => {
      const stored = result.trusthire_settings_v1 || {};
      currentSettings = {
        mode: stored.mode || "manual",
        hasConsented: !!stored.hasConsented,
        pausedUntil: stored.pausedUntil || 0,
      };
      resolve(currentSettings);
    });
  });
}

function saveSettings(partial) {
  const next = { ...currentSettings, ...partial };
  currentSettings = next;
  return new Promise((resolve) => {
    chrome.storage.local.set({ trusthire_settings_v1: next }, () => resolve(next));
  });
}

function renderMode() {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === currentSettings.mode);
  });
  $("#modeDesc").textContent = MODE_DESCRIPTIONS[currentSettings.mode] || "";
}

function renderPauseState() {
  const paused = currentSettings.pausedUntil > Date.now();
  $("#pauseBtn").style.display = paused ? "none" : "";
  $("#resumeBtn").style.display = paused ? "" : "none";
  if (paused) {
    const minsLeft = Math.ceil((currentSettings.pausedUntil - Date.now()) / 60000);
    $("#pauseStatus").textContent = `paused · ${minsLeft}m left`;
  } else {
    $("#pauseStatus").textContent = "";
  }
}

// ---------- Backend status ----------
function applyStatus(status) {
  const el = $("#status");
  el.classList.toggle("connected", !!status.connected);
  el.classList.toggle("disconnected", !status.connected);
  el.querySelector(".status-text").textContent = status.connected ? "Online" : "Offline";

  if (status.lastVerdict) {
    const v = status.lastVerdict;
    $("#lastScore").textContent = v.score;
    $("#lastScore").className = "hero-score verdict-" + v.verdict;
    $("#lastVerdict").textContent = v.verdict;
    $("#lastVerdict").className = "hero-verdict verdict-" + v.verdict;
    $("#lastHeadline").textContent = v.headline || "";
  }
}

chrome.runtime.sendMessage({ type: "trusthire_get_status" }, applyStatus);
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "trusthire_status") applyStatus(msg.status);
});

// ---------- Event handlers ----------
$("#openDashboard").addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:3000" });
});

document.querySelectorAll("[data-scenario]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-scenario");
    btn.textContent = "Running…";
    chrome.runtime.sendMessage({ type: "trusthire_simulate", scenarioId: id }, () => {
      setTimeout(() => {
        btn.textContent = btn.dataset.scenario === "scn_otp_scam"
          ? "⚠ Run OTP Scam Demo"
          : "✓ Run Legitimate Demo";
      }, 4000);
    });
  });
});

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const mode = btn.dataset.mode;
    // Once user picks here, consider them consented
    await saveSettings({ mode, hasConsented: true });
    renderMode();
  });
});

$("#pauseBtn").addEventListener("click", async () => {
  await saveSettings({ pausedUntil: Date.now() + 60 * 60 * 1000 });
  renderPauseState();
});

$("#resumeBtn").addEventListener("click", async () => {
  await saveSettings({ pausedUntil: 0 });
  renderPauseState();
});

// ---------- Init ----------
(async () => {
  await loadSettings();
  renderMode();
  renderPauseState();
  // Refresh pause countdown every 30s while popup open
  setInterval(renderPauseState, 30000);
})();