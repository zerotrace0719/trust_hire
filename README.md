<div align="center">

# 🛡️ TrustHire AI

### Zero-Trust Recruitment Intelligence

**A privacy-first browser extension + multi-agent AI backend that protects job seekers from recruitment scams in real time.**

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Groq](https://img.shields.io/badge/Groq_Llama_3.3-FF6B35?style=for-the-badge&logo=meta&logoColor=white)](https://groq.com/)
[![Chrome](https://img.shields.io/badge/Manifest_V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [What TrustHire Does](#-what-trusthire-does)
- [Architecture](#-architecture)
- [The Six AI Agents](#-the-six-ai-agents)
- [Trust Score Engine](#-trust-score-engine)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [How to Use](#-how-to-use)
- [Privacy by Design](#-privacy-by-design)
- [Demo Scenarios](#-demo-scenarios)
- [Roadmap](#-roadmap)
- [Why This Matters](#-why-this-matters)

---

## 🚨 The Problem

> **₹120 crore lost to fake recruiter scams in India in 2025.** One in four job seekers has been targeted by recruitment fraud.

The pattern is always the same:

1. A "recruiter" reaches out from what looks like Microsoft, Google, or Amazon
2. They send an **OTP request**, a **"processing fee"**, or a **fake Google Meet link**
3. They pressure with urgency: *"Join in 30 minutes — limited slots"*
4. By the time the candidate realizes it's fake, their **money or identity is gone**

**Existing tools fail because:**
- Generic spam filters miss recruitment-specific patterns
- Enterprise security tools (Microsoft Defender, Proofpoint) target companies, not consumers
- Scam-checker websites are reactive and require manual paste
- Browser anti-phishing extensions check URLs, not email semantics

**TrustHire is the first consumer-grade, real-time, AI-powered defense built specifically for recruitment fraud.**

---

## ✨ What TrustHire Does

TrustHire operates as a **3-layer defense system**:

1. **🔍 Sensor layer** — A Chrome extension that watches Gmail and Google Meet
2. **🧠 Intelligence layer** — A FastAPI backend running six specialist AI agents
3. **🖥️ Command center** — A real-time dashboard streaming agent reasoning via WebSockets

### Core capabilities

| Capability | What it does |
|---|---|
| **One-click email scanning** | Floating "🛡 Scan with TrustHire AI" button appears on suspicious Gmail emails |
| **Multi-agent analysis** | 6 specialist AI agents analyze every signal in parallel |
| **Real-time SOC dashboard** | Live trust score, agent reasoning, alerts streaming via WebSockets |
| **Live interview monitor** | Google Meet session integrity monitoring (URL, participants, recording status) |
| **Privacy-first** | Manual mode by default — nothing scanned without explicit user consent |
| **Custom email tester** | Paste any email content and get instant analysis |
| **Demo scenarios** | 7 pre-built scenarios covering OTP scams, payment fraud, fake interviews, legitimate recruiters |

---

## 🏗️ Architecture

```
┌─────────────────────────┐         ┌──────────────────────────┐         ┌─────────────────────────┐
│   CHROME EXTENSION      │         │   FASTAPI BACKEND        │         │   NEXT.JS DASHBOARD     │
│   (Sensor Layer)        │         │   (Intelligence Layer)   │         │   (Command Center)      │
│                         │         │                          │         │                         │
│  • Gmail content script │ ───────▶│  • 6 AI Agents (Groq)    │────────▶│  • Live trust meter     │
│  • Meet content script  │  HTTPS  │  • Trust Score Engine    │  WSS    │  • Agent cards          │
│  • Manual scan button   │         │  • WebSocket broadcaster │         │  • Reasoning stream     │
│  • Privacy modes        │         │  • Scenario simulator    │         │  • Alert feed           │
│  • Background worker    │         │  • Meet telemetry route  │         │  • Verdict cards        │
└─────────────────────────┘         └──────────────────────────┘         └─────────────────────────┘
        Privacy first                  Multi-agent cascade                    Real-time streaming
```

### Data flow (a single email scan)

```
1. User opens recruiter email in Gmail
2. Extension detects recruiter keywords ("hiring", "interview", etc.)
3. Floating cyan "Scan with TrustHire AI" button appears bottom-left
4. User clicks button → extension scrapes:
   • Sender email & domain
   • Subject line
   • Email body
   • Embedded URLs
5. Extension POSTs to FastAPI /api/events
6. Backend creates AnalysisInput object, spawns async pipeline
7. 6 agents execute SEQUENTIALLY, each emits 3 WebSocket events:
   • agent_activated  → dashboard lights up the agent card
   • agent_thinking   → status spinner
   • agent_verdict    → flags raised + reasoning text
8. Trust Score Engine computes deterministic score from raised flags
9. Risk Decision Agent synthesizes final verdict + recommendations
10. Dashboard renders the entire cascade in real-time
11. Extension widget on Gmail updates with final verdict (SAFE/CAUTION/WARNING/BLOCK)
```

---

## 🤖 The Six AI Agents

Each agent is a specialist with a tightly-scoped responsibility. They run **sequentially** (~1 second each, ~8 seconds total) for visible cascade animation on the dashboard.

### 1. 🛡️ Identity Verification Agent
**Job:** Verify the sender's identity matches the claimed company.

**Detects:**
- Typo-squatted domains (`micros0ft.com`, `gooogle-careers.work`)
- Unofficial email domains (`@gmail.com` claiming to be Microsoft)
- Domain-company mismatch (sender from `guvi.in` claiming to be HCL)
- Suspicious TLDs (`.xyz`, `.work`, `.click`)
- Recognized as legitimate: known ATS platforms (Teamtailor, Greenhouse, Lever, Workday, Ashby)

### 2. 💬 NLP Scam Detection Agent
**Job:** Read the message language for scam patterns and social engineering.

**Detects:**
- OTP requests (`-40` weight — critical)
- Payment / processing fee demands (`-35`)
- Personal info harvesting (Aadhaar, PAN, bank details) (`-30`)
- Move-to-WhatsApp/Telegram pivots (`-18`)
- High-pressure urgency language (`-12`)
- Poor grammar suggesting non-native scammer (`-8`)

### 3. 🔐 Cybersecurity Agent
**Job:** Analyze URLs and links for phishing infrastructure.

**Detects:**
- Phishing URLs against known scam patterns (`-32`)
- IP-address URLs instead of domains (`-25`)
- Punycode/IDN attacks (`-25`)
- URL shorteners hiding destination (`-14`)
- Unsafe meeting links (`-28`)

### 4. 📊 Behavioral Analysis Agent
**Job:** Cross-check the recruitment scenario for behavioral red flags.

**Detects:**
- Abnormal salary (₹50 LPA for an intern) (`-12`)
- Missing job description (`-8`)
- Offer-before-interview (`-22`)
- Inconsistent timeline (`-8`)
- Refuses video call requests (`-10`)

### 5. 🎙️ Voice/Deepfake Risk Agent
**Job:** Analyze interview session audio/video metadata for deepfake indicators.

**Detects:**
- Voice anomaly score (`-12`)
- Lip-sync mismatch >150ms (`-20`)
- Unnatural pauses suggesting AI-generated speech (`-7`)

*Note: Current implementation uses session metadata signals. Production roadmap includes real-time audio analysis via Resemble Detect API.*

### 6. ⚖️ Risk Decision Agent
**Job:** Synthesize all upstream agent outputs into a final verdict.

**Outputs:**
- Final verdict (`SAFE` / `CAUTION` / `WARNING` / `BLOCK`)
- Plain-English headline (e.g., "Likely OTP-harvesting scam")
- Top 3 concerns
- Actionable recommendations ("Do not share the OTP. Report and block this sender.")

---

## 📐 Trust Score Engine

A **deterministic rule engine** sits on top of the LLM outputs. The LLM detects which flags apply; the rule engine computes the score. This guarantees:

✅ **Reproducible results** — same input always produces the same score
✅ **Tamper-resistant** — LLM can't argue its way around critical flags
✅ **Auditable** — every score has a clear explanation trail

### 24 Weighted Risk Flags

#### 🔴 Critical (−30 to −40)
| Flag | Weight |
|---|---|
| OTP request | −40 |
| Payment / processing fee request | −35 |
| Phishing URL | −32 |
| Typo-squatted domain | −30 |
| Personal info request (Aadhaar, bank) | −30 |

#### 🟠 High (−20 to −29)
| Flag | Weight |
|---|---|
| Unsafe meeting link | −28 |
| IP address URL | −25 |
| Punycode domain | −25 |
| Domain mismatch | −22 |
| Offer before interview | −22 |
| Lip-sync mismatch | −20 |

#### 🟡 Medium (−10 to −19)
| Flag | Weight |
|---|---|
| Move to private channel (WhatsApp/Telegram) | −18 |
| Suspicious TLD (.xyz, .work) | −16 |
| Unofficial email domain | −15 |
| URL shortener | −14 |
| Urgency language | −12 |
| Voice anomaly | −12 |
| Abnormal salary | −12 |
| Refuses video call | −10 |

#### 🟢 Low (−6 to −9)
| Flag | Weight |
|---|---|
| Poor grammar | −8 |
| No job description | −8 |
| Inconsistent timeline | −8 |
| Unnatural pauses | −7 |
| No LinkedIn footprint | −6 |

### Score Formula

```
score = max(0, 100 + Σ(penalties from triggered flags))
```

### Verdict Thresholds

| Score | Verdict | Color |
|---|---|---|
| 80–100 | ✅ **SAFE** | Green |
| 60–79 | ⚠️ **CAUTION** | Amber |
| 35–59 | 🚨 **WARNING** | Orange |
| 0–34 | 🛑 **BLOCK** | Red |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.11+** | Language |
| **FastAPI** | Async web framework, automatic OpenAPI docs |
| **WebSockets** | Real-time event streaming to dashboard |
| **Groq API** | LLM inference (Llama 3.3 70B Versatile) |
| **Pydantic** | Type-safe request/response models |
| **uvicorn** | ASGI server with hot-reload |
| **asyncio** | Concurrent agent orchestration |

### Frontend (Dashboard)
| Technology | Purpose |
|---|---|
| **Next.js 14** | React framework (App Router) |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations and transitions |
| **Zustand** | Lightweight state management |
| **Lucide Icons** | Icon library |
| **Custom WebSocket hook** | Real-time event subscription |

### Browser Extension
| Technology | Purpose |
|---|---|
| **Manifest V3** | Chrome extension framework |
| **Vanilla JavaScript** | No framework overhead |
| **Trusted Types-safe DOM** | Compatible with Gmail's strict CSP |
| **Chrome Storage API** | User preferences persistence |
| **Service Worker** | Background WebSocket connection |

### Why These Choices

- **Groq over OpenAI/Anthropic** — Free tier of 14,400 requests/day, sub-second inference for Llama 3.3 70B
- **FastAPI over Flask** — Native async, type validation, WebSocket support
- **Next.js over Vite** — Better tooling for production deployments
- **Vanilla JS for extension** — Smaller bundle, no build step, faster page injection
- **Zustand over Redux** — 1KB, no boilerplate, perfect for the scope

---

## 📁 Project Structure

```
trusthire-ai/
├── backend/                          # FastAPI server
│   ├── main.py                       # FastAPI app, routes, WebSocket endpoint
│   ├── agents.py                     # 6 agent orchestrator + LLM calls
│   ├── prompts.py                    # Hand-crafted prompts for each agent
│   ├── trust_engine.py               # Deterministic scoring rules (24 flags)
│   ├── llm_client.py                 # Groq client wrapper
│   ├── simulator.py                  # Scenario loader for demo mode
│   ├── requirements.txt              # Python dependencies
│   └── .env                          # GROQ_API_KEY (gitignored)
│
├── dashboard/                        # Next.js dashboard
│   ├── app/
│   │   ├── page.tsx                  # Main dashboard layout
│   │   ├── layout.tsx                # Root layout with WS hook
│   │   └── globals.css               # Global styles, theme tokens
│   ├── components/
│   │   ├── Header.tsx                # Top bar with connection status
│   │   ├── TrustMeter.tsx            # Circular score gauge
│   │   ├── AgentGrid.tsx             # 6 agent status cards
│   │   ├── ReasoningConsole.tsx      # Terminal-style agent stream
│   │   ├── AlertFeed.tsx             # Live risk alerts panel
│   │   ├── VerdictCard.tsx           # Final verdict with recommendations
│   │   ├── DemoPanel.tsx             # Scenario selector + custom tester
│   │   ├── RiskIndicators.tsx        # Active flags with penalties
│   │   ├── InputPreview.tsx          # Email content with highlights
│   │   ├── CustomEmailTester.tsx     # Paste-your-own-email UI
│   │   └── LiveInterviewMonitor.tsx  # Meet session monitoring card
│   ├── lib/
│   │   ├── store.ts                  # Zustand global store
│   │   ├── useWS.ts                  # WebSocket subscription hook
│   │   └── utils.ts                  # Color/format helpers
│   └── tailwind.config.js
│
├── extension/                        # Chrome extension (MV3)
│   ├── manifest.json                 # Permissions, content scripts, host rules
│   ├── background.js                 # Service worker, WebSocket connection
│   ├── content/
│   │   ├── gmail.js                  # Gmail DOM scanner + scan button
│   │   ├── meet.js                   # Meet metadata + telemetry stream
│   │   ├── zoom.js                   # Zoom integration (stub)
│   │   └── widget.css                # Floating widget + button styles
│   ├── popup/
│   │   ├── popup.html                # Mode picker + status display
│   │   ├── popup.css
│   │   └── popup.js                  # Mode switching + pause logic
│   └── icons/                        # Extension icons (16/48/128)
│
├── scenarios/                        # Pre-built demo scenarios (JSON)
│   ├── 01_otp_scam.json              # Fake Google recruiter OTP harvest
│   ├── 02_whatsapp_recruiter.json    # Processing fee scam
│   ├── 03_fake_meet.json             # Typo-squatted Meet link
│   ├── 04_training_fee.json          # Training fee scam
│   ├── 05_legit_stripe.json          # Legitimate recruiter (precision test)
│   ├── 06_borderline.json            # Some yellow flags, ambiguous
│   └── 07_meet_live.json             # Live interview monitor demo
│
├── docs/
│   ├── ARCHITECTURE.md               # Deep dive on system design
│   ├── JUDGE_CHEATSHEET.md           # Demo flow walkthrough
│   └── GMAIL_LIVE_DEMO.md            # How the extension works on real Gmail
│
├── .gitignore
└── README.md                         # ← you are here
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Google Chrome** (or any Chromium browser)
- A free **Groq API key** from [console.groq.com](https://console.groq.com/)

### 1. Clone & navigate

```bash
git clone https://github.com/zerotrace0719/trust_hire.git
cd trust_hire
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your Groq API key
echo "GROQ_API_KEY=your_groq_key_here" > .env
echo "LLM_PROVIDER=groq" >> .env
echo "GROQ_MODEL=llama-3.3-70b-versatile" >> .env

# Run the server
uvicorn main:app --reload --port 8000
```

Backend now running at `http://localhost:8000`. Visit `/docs` for the interactive API explorer.

### 3. Dashboard setup

In a new terminal:

```bash
cd dashboard
npm install
npm run dev
```

Dashboard now running at `http://localhost:3000`.

### 4. Extension setup

1. Open Chrome → `chrome://extensions/`
2. Toggle **Developer mode** ON (top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Pin **TrustHire AI** to your toolbar (puzzle icon → pin)

---

## 🎯 How to Use

### Method 1: Live on Gmail

1. Open Gmail in Chrome
2. Open any email that looks like a recruiter message
3. A floating cyan **"🛡 Scan with TrustHire AI"** button appears bottom-left
4. Click it
5. Watch the dashboard at `localhost:3000` light up in real-time
6. Final verdict appears in the floating widget

### Method 2: Demo scenarios (recommended for first try)

1. Open `localhost:3000`
2. Left panel — click any scenario:
   - **OTP Scam** → expect BLOCK
   - **Legitimate Recruiter (Stripe)** → expect SAFE
   - **Live Interview Monitor** → triggers the Meet panel
3. Watch the full agent cascade animate

### Method 3: Custom email tester

1. Dashboard → top-left → click **"Test Your Own Email"**
2. Paste raw email content
3. Click **Analyze**
4. Real-time analysis fires

---

## 🔒 Privacy by Design

TrustHire makes privacy a **first-class product decision**, not an afterthought.

### Three protection modes

| Mode | Behavior | Best for |
|---|---|---|
| **🤚 Manual** *(default)* | Never auto-scans. Shows "Scan" button on recruiter emails. | Privacy-conscious users |
| **🎯 Smart Detection** | Auto-scans only when strong scam signals are present (OTP, payment, urgency) | Active job seekers |
| **🛡️ Always-On** | Auto-scans any email that looks recruitment-related | Maximum protection |

### Master controls

- **⏸️ Pause for 1 hour** — disables all scanning temporarily
- **▶️ Resume anytime** from the popup
- **🔄 Mode switching** is instant — no extension reload needed

### Data handling principles

✅ Email content is **only analyzed when explicitly requested**
✅ Data is sent to **your own backend** at `localhost:8000`
✅ **Nothing is stored permanently** — all state lives in-memory during analysis
✅ No telemetry, no analytics, no third-party trackers
✅ Open source — verify everything yourself

> *"We protect candidates from scammers. And we protect them from us."*

---

## 🎬 Demo Scenarios

| # | Scenario | Expected Verdict | Category |
|---|---|---|---|
| 1 | OTP Scam — Fake Google Recruiter | **BLOCK** (0–20) | Phishing |
| 2 | WhatsApp Recruiter — Processing Fee | **BLOCK** (10–30) | Payment scam |
| 3 | Fake Google Meet — Typo-squatted Domain | **WARNING** (15–35) | Cyber |
| 4 | Training Fee Scam — Suspicious Domain | **BLOCK** (10–30) | Payment scam |
| 5 | Legitimate Recruiter — Stripe | **SAFE** (82–100) | Real recruiter |
| 6 | Borderline — Some Yellow Flags | **CAUTION** (55–75) | Ambiguous |
| 7 | Live Interview Monitor — Demo | **WARNING** (15–35) | Cyber |

The **legitimate** scenario is included intentionally — it proves the system is tuned for **precision over paranoia**.

---

## 🗺️ Roadmap

### v0.2 — Detection depth
- [ ] Real audio deepfake detection via **Resemble Detect API**
- [ ] WhatsApp Web content script for the #1 Indian scam vector
- [ ] LinkedIn message analysis
- [ ] SMS/text message screening (mobile companion app)

### v0.3 — Intelligence layer
- [ ] **Threat intelligence sharing** — aggregated scam signatures across users
- [ ] Live company verification via **Clearbit / LinkedIn API**
- [ ] Reputation database for unknown sender domains
- [ ] User-reported scam patterns feedback loop

### v0.4 — Distribution & UX
- [ ] Firefox extension port
- [ ] Mobile app (Android/iOS) for full SMS + call screening
- [ ] PDF report generation for documented scam attempts
- [ ] Browser-native notifications instead of in-page widget

### v1.0 — Product readiness
- [ ] B2B mode for HR teams to verify candidate-facing communications
- [ ] Enterprise SSO + admin panel
- [ ] Compliance: GDPR, India DPDP Act
- [ ] Public threat intelligence feed (open data for researchers)

---

## 🌟 Why This Matters

Recruitment scams aren't just a tech problem — they're a **trust problem** at scale.

- 🇮🇳 **India:** ₹120 crore lost in 2025 to fake recruiters targeting freshers
- 🇺🇸 **USA:** Job scams up 118% YoY (FTC, 2024)
- 🇬🇧 **UK:** "Recruitment fraud" now a defined category in financial crime reporting
- 🌍 **Globally:** Every major tech company has had its name impersonated by scammers

The people most affected are **first-time job seekers** — students, freshers, career-switchers — exactly the people least equipped to spot a sophisticated scam.

**TrustHire exists because:**
1. Existing security tools are enterprise-focused
2. Scam-checker websites are reactive (paste-after-the-fact)
3. AI assistants exist to write emails, but not to defend you from them
4. Job seekers deserve the same real-time security infrastructure that companies have

This is a small project. But the problem is real, the gap is real, and the architecture is built to grow.

---

## 🤝 Contributing

This started as a hackathon project. If it resonates, contributions are welcome:

- 🐛 **Bug reports** — [open an issue](https://github.com/zerotrace0719/trust_hire/issues)
- 💡 **Feature ideas** — start a discussion
- 🌐 **Localization** — help translate scam patterns for non-English markets
- 🧪 **New scenarios** — add scam patterns you've seen to `scenarios/`
- 🔬 **Better detection** — improve agent prompts, add new agents

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

Use it, fork it, ship it, learn from it. Just don't pretend you wrote it.

---

## 🙏 Acknowledgments

- **Groq** for ridiculously fast Llama 3.3 inference on the free tier
- **Meta** for open-weighting Llama 3.3
- **The FastAPI, Next.js, and Tailwind communities** for tools that just work
- **Every scammer who tried to phish me** — you gave us the training data 😅

---

<div align="center">



**TrustHire AI — because the next generation of job seekers deserves better than blocklists.**

⭐ Star this repo if it helped you · 🐛 [Report a bug](https://github.com/zerotrace0719/trust_hire/issues) · 💬 [Discussion](https://github.com/zerotrace0719/trust_hire/discussions)

</div>
