// TrustHire AI — Background Service Worker
// Maintains WS connection to backend, forwards events from content scripts.

const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws";

let ws = null;
let reconnectTimer = null;
let lastStatus = { connected: false, lastVerdict: null };

function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  try {
    ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      lastStatus.connected = true;
      console.log("[TrustHire] WS connected");
      broadcastStatus();
    };
    ws.onclose = () => {
      lastStatus.connected = false;
      broadcastStatus();
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 2000);
    };
    ws.onerror = () => ws && ws.close();
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        // Broadcast verdicts to ALL tabs that might have a widget mounted,
        // not just the currently-active one (user may have switched to dashboard)
        const broadcastToTabs = (message) => {
          chrome.tabs.query(
            { url: [
              "https://mail.google.com/*",
              "https://meet.google.com/*",
              "https://*.zoom.us/*"
            ] },
            (tabs) => {
              for (const t of tabs) {
                if (!t.id) continue;
                chrome.tabs.sendMessage(t.id, message).catch(() => {});
              }
            }
          );
        };

        if (data.type === "final_verdict") {
          lastStatus.lastVerdict = {
            score: data.score,
            verdict: data.verdict,
            headline: data.headline,
            ts: data.ts,
          };
          broadcastStatus();
          broadcastToTabs({ type: "trusthire_verdict", data });
          console.log("[TrustHire] verdict broadcast:", data.verdict, data.score);
        } else if (data.type === "score_updated") {
          broadcastToTabs({ type: "trusthire_score", data });
        } else if (data.type === "analysis_started") {
          broadcastToTabs({ type: "trusthire_started", data });
        }
      } catch (e) {
        console.warn("[TrustHire] message parse error", e);
      }
    };
  } catch (e) {
    console.warn("[TrustHire] WS connect failed", e);
  }
}

function broadcastStatus() {
  chrome.runtime.sendMessage({ type: "trusthire_status", status: lastStatus }).catch(() => {});
}

async function postEvent(payload) {
  try {
    const r = await fetch(`${API_URL}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await r.json();
  } catch (e) {
    console.warn("[TrustHire] event POST failed", e);
    return { error: String(e) };
  }
}

async function simulate(scenarioId) {
  try {
    const r = await fetch(`${API_URL}/api/simulate/${scenarioId}`, { method: "POST" });
    return await r.json();
  } catch (e) {
    return { error: String(e) };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "trusthire_open_dashboard") {
  chrome.tabs.query({ url: "http://localhost:3000/*" }, (tabs) => {
    if (tabs.length > 0) {
      // Focus existing tab
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      chrome.tabs.create({ url: "http://localhost:3000" });
    }
  });
  return false;
}
  if (msg?.type === "trusthire_detected") {
    postEvent(msg.payload).then(sendResponse);
    return true;
  }
  if (msg?.type === "trusthire_simulate") {
    simulate(msg.scenarioId).then(sendResponse);
    return true;
  }
  if (msg?.type === "trusthire_get_status") {
    sendResponse(lastStatus);
    return false;
  }
});

connect();