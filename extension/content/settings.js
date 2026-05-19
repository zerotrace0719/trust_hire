// TrustHire AI — Settings Storage
// Shared helper for getting/setting user preferences in chrome.storage.local

const TH_SETTINGS_KEY = "trusthire_settings_v1";
const TH_CONSENT_KEY = "trusthire_consent_v1";

const DEFAULT_SETTINGS = {
  mode: "manual",            // "manual" | "smart" | "always"
  pausedUntil: 0,            // unix ms; 0 = not paused
  hasConsented: false,
  installedAt: 0,
};

async function thGetSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([TH_SETTINGS_KEY], (result) => {
      const stored = result[TH_SETTINGS_KEY] || {};
      resolve({ ...DEFAULT_SETTINGS, ...stored });
    });
  });
}

async function thSetSettings(partial) {
  const current = await thGetSettings();
  const next = { ...current, ...partial };
  return new Promise((resolve) => {
    chrome.storage.local.set({ [TH_SETTINGS_KEY]: next }, () => resolve(next));
  });
}

async function thIsPaused() {
  const s = await thGetSettings();
  return s.pausedUntil > Date.now();
}

async function thIsAllowedToAutoScan() {
  const s = await thGetSettings();
  if (!s.hasConsented) return false;
  if (s.pausedUntil > Date.now()) return false;
  return s.mode === "smart" || s.mode === "always";
}

// Make available to content scripts that include this file
if (typeof window !== "undefined") {
  window.thGetSettings = thGetSettings;
  window.thSetSettings = thSetSettings;
  window.thIsPaused = thIsPaused;
  window.thIsAllowedToAutoScan = thIsAllowedToAutoScan;
}