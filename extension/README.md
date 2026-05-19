# TrustHire AI — Chrome Extension

Manifest V3, no build pipeline. Vanilla JS + a single shared CSS file.

## Install (developer mode)

1. Open Chrome → `chrome://extensions/`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this `extension/` folder
5. Pin TrustHire AI to your toolbar for easy access

The extension talks to `http://localhost:8000` (the backend) and `http://localhost:3000` (the dashboard). Start both before reloading the extension.

## How it works

| File | Role |
|---|---|
| `background.js` | Service worker. Maintains the WebSocket to the backend; routes events to/from content scripts. |
| `content/gmail.js` | Runs on `mail.google.com`. MutationObserver watches for an opened email, extracts sender/subject/body/links, pushes a detection event. |
| `content/meet.js` | Runs on `meet.google.com`. Reports session start + simulated voice/lip-sync metrics. |
| `content/zoom.js` | Runs on `*.zoom.us`. Same as Meet, lighter. |
| `content/widget.css` | The floating glassmorphism widget. State classes: `th-idle`, `th-analyzing`, `th-safe`, `th-caution`, `th-danger`. |
| `popup/` | Toolbar popup. Shows last verdict, has buttons to trigger demo scenarios and open the dashboard. |

## Demo trigger from the popup

Two one-click scenario buttons in the popup are wired to the backend's simulator. Useful when judges are looking over your shoulder and you want a 3-click demo:

1. Click the TrustHire icon in the toolbar
2. Click "Run OTP Scam Demo" or "Run Legitimate Demo"
3. Watch the dashboard light up (open it via "Open Command Center")

## Limitations (and how to extend)

- Gmail DOM selectors change occasionally. The current selectors (`h2.hP`, `.gD`, `.a3s`) have been stable for years but if Gmail updates them, update the selectors in `content/gmail.js`.
- Real-world deployment would use the Gmail API + OAuth, not DOM scraping. This is intentional for a hackathon — DOM scraping is faster to demo and doesn't require Google verification.
- The Meet/Zoom voice/lip-sync metrics are simulated. To make them real you'd need to wire up an actual deepfake detector (e.g. Resemble Detect API) against the WebRTC stream.
