# TrustHire AI

**Zero-Trust Recruitment Intelligence Platform**

Real-time multi-agent AI that protects candidates from recruitment fraud — fake recruiters, phishing interview links, social engineering, deepfake interview risks, and scam offer letters.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Chrome Extension  ──►  FastAPI Backend  ──►  Next.js Dashboard     │
│  (Sensor Layer)         (Intelligence Layer)   (Command Center)     │
│                                                                     │
│  Gmail / Meet / Zoom    6 AI agents +          Live trust score,    │
│  content scripts +      rule-based trust       agent reasoning,     │
│  floating widget        score engine            alert feed          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Quickstart (3 terminals)

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set GEMINI_API_KEY (free key from https://aistudio.google.com/apikey)
uvicorn main:app --reload --port 8000
```

You should see:
```
TrustHire AI backend starting...
  LLM provider: gemini
  API key configured: True
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Dashboard

```bash
cd dashboard
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000. You should see the SOC dashboard with **Connected** status in the top-right.

### 3. Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Pin TrustHire AI to your toolbar

Click the extension icon → **Open Command Center** to verify the dashboard tab opens.

---

## The 3-minute demo

> Open the dashboard and the extension popup side-by-side. Have Gmail open in a separate tab (the demo doesn't require a real recruiter email — you'll trigger scenarios from the dashboard).

**0:00 — The hook**
> "₹120 crore was lost to fake recruiter scams in India last year. The victim is always a candidate too excited to ask questions. TrustHire is a zero-trust layer between you and every recruiter you talk to."

**0:20 — Show the system at rest**
> *Point at the dashboard.* "Six specialist AI agents standing by. Trust score at 100. Now let's see what happens when a real scam lands in your inbox."

**0:35 — Run the OTP scam scenario**
> *Click "OTP Scam — Fake Google Recruiter" in the left panel.*
> 
> "Watch the agents wake up." *Agents fire in sequence — identity, NLP, cyber, behavior, deepfake.*
> 
> "Identity agent caught it first — a `gmail.com` address claiming to be Google. NLP agent picked up urgency manipulation, an OTP request, and a payment demand. Cyber agent flagged a typo-squatted domain — `gooogle-careers.xyz` — and a `bit.ly` shortener hiding the real destination."

**1:25 — The reveal**
> *Trust meter crashes from 100 to single digits, verdict card slides in.*
> 
> "Score: 8. Verdict: BLOCK. Not just a score — the system tells the candidate exactly what to do: don't share the OTP, verify on Google's official careers page, report it."

**1:55 — Show precision, not paranoia**
> *Click "Legitimate Recruiter — Stripe".*
> 
> "Same system, real recruiter from `stripe.com`. Score: 92. SAFE. We're not building a paranoia machine — we're building precision."

**2:25 — The extension story**
> *Show the popup, then the Gmail/Meet widgets in screenshots or live.*
> 
> "And this isn't a website you have to remember to visit. The Chrome extension watches Gmail in real-time, monitors Google Meet and Zoom sessions, and floats a glass widget on every interview link you click."

**2:50 — Close**
> "TrustHire AI. Trust, verified. Built in 10 days with FastAPI, LangGraph, and Next.js."

---

## Architecture

### Multi-agent intelligence

Six agents, executed in parallel with staggered emission for visual storytelling:

| Agent | Responsibility |
|---|---|
| **Identity Verification** | Sender domain, company match, typo-squatting, freemail abuse |
| **NLP Scam Detection** | Urgency language, OTP/payment requests, WhatsApp pivots, grammar |
| **Cybersecurity** | Phishing URLs, IP-address links, URL shorteners, fake meet domains |
| **Behavioral Analysis** | Abnormal salary, missing JD, offer-before-interview |
| **Voice / Deepfake Risk** | Voice anomaly, lip-sync offset, unnatural pauses (simulated metrics) |
| **Risk Decision** | Synthesizes all findings, produces candidate-facing summary |

### Trust score engine

The LLM identifies which risk flags fired. A deterministic rule engine computes the score. This split keeps demos predictable (the LLM can't accidentally hand you a 73 when you wanted a 20) and the system debuggable.

24 weighted flags. The big ones:

| Flag | Penalty |
|---|---|
| OTP request | −40 |
| Payment request | −35 |
| Phishing URL | −32 |
| Typo-squatted domain | −30 |
| Personal info request | −30 |
| Unsafe meeting link | −28 |
| Lip-sync mismatch | −20 |

Verdicts: `SAFE` (≥80), `CAUTION` (60–79), `WARNING` (35–59), `BLOCK` (<35).

### Real-time event flow

```
extension (Gmail/Meet/Zoom)
   │  POST /api/events
   ▼
FastAPI ── triggers ──► 5 specialist agents (parallel)
   │                          │
   │       (each emits: agent_activated → agent_thinking → agent_verdict)
   │                          │
   │                          ▼
   │                  trust score computed
   │                          │
   │                          ▼
   │                 Risk Decision Agent
   │                          │
   │                          ▼
   │                   final_verdict
   ▼
WebSocket broadcast to all dashboard clients
   ▼
Zustand store → Framer Motion components animate live
```

---

## Folder structure

```
trusthire/
├── backend/
│   ├── main.py            # FastAPI server, REST + WS
│   ├── agents.py          # multi-agent orchestrator
│   ├── prompts.py         # per-agent prompts
│   ├── trust_engine.py    # rule-based scoring (24 flags)
│   ├── llm_client.py      # Gemini / OpenAI wrapper
│   ├── simulator.py       # scenario loader
│   └── requirements.txt
├── dashboard/
│   ├── app/
│   │   ├── page.tsx       # main SOC dashboard
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── TrustMeter.tsx        # circular gauge hero
│   │   ├── AgentGrid.tsx         # 6 agent cards
│   │   ├── AlertFeed.tsx         # live alert stream
│   │   ├── ReasoningConsole.tsx  # terminal-style log
│   │   ├── VerdictCard.tsx       # dramatic final reveal
│   │   ├── DemoPanel.tsx         # scenario trigger
│   │   ├── RiskIndicators.tsx    # triggered flags
│   │   └── Header.tsx
│   ├── lib/
│   │   ├── store.ts       # Zustand WS-backed store
│   │   ├── useWS.ts       # WebSocket hook
│   │   └── utils.ts
│   └── tailwind.config.js # custom cyberpunk SOC palette
├── extension/
│   ├── manifest.json      # MV3
│   ├── background.js      # WS to backend, message routing
│   ├── content/
│   │   ├── gmail.js       # detects open recruiter emails
│   │   ├── meet.js        # monitors Google Meet
│   │   ├── zoom.js        # monitors Zoom
│   │   └── widget.css     # floating glass widget
│   ├── popup/             # toolbar popup
│   └── icons/             # 16/48/128 px
├── scenarios/             # 6 demo scenarios as JSON
└── docs/                  # judge talking points, etc.
```

---

## Scenarios

| ID | Label | Category | Expected Score |
|---|---|---|---|
| `scn_otp_scam` | Fake Google Recruiter (OTP) | phishing | 0–20 |
| `scn_whatsapp_recruiter` | Amazon WhatsApp Scam | phishing | 10–30 |
| `scn_fake_meet` | Microsoft + Typo-squatted Meet | cyber | 15–35 |
| `scn_training_fee` | Infosys Training Fee Scam | phishing | 10–30 |
| `scn_legit_stripe` | Real Stripe Recruiter | legitimate | 82–100 |
| `scn_borderline` | Acme Corp — Yellow Flags | caution | 55–75 |

Trigger any from the dashboard's left panel, the extension popup, or directly: `curl -X POST localhost:8000/api/simulate/scn_otp_scam`.

---

## Why this design beats the obvious approach

- **Rule-based scoring, LLM-based flag detection.** The LLM is good at reading natural language and spotting patterns; it is bad at consistent numerical output. We let each do what it's good at.
- **Parallel agents with staggered WS emission.** Real `asyncio.gather`, plus deliberate per-agent delays so the dashboard animates in a visually pleasing cascade instead of all agents resolving at the same millisecond.
- **Deterministic demos via canned scenarios.** Live Gmail scraping is too fragile for a 3-minute demo. The extension's content scripts work on real emails, and the simulator endpoint guarantees a working demo if anything else breaks.
- **A legit recruiter scenario.** Most fraud detectors fail by flagging everything. Showing a real recruiter scoring 92 is the credibility moment.
- **Frontend treated as a product, not a wrapper.** Custom Tailwind theme, spring-animated SVG meter, terminal-style reasoning console, glassmorphism alerts. The dashboard is the demo.

---

## Tech stack

- **Backend:** FastAPI, WebSockets, LangGraph-pattern multi-agent orchestration, Google Gemini 2.0 Flash (or OpenAI), Pydantic
- **Dashboard:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand, Lucide icons
- **Extension:** Manifest V3, vanilla JS (no build pipeline), shared CSS widget
- **Fonts:** Space Grotesk, Inter, JetBrains Mono

No build pipeline on the extension is intentional — adding React + webpack to a content script saves nothing demo-side and burns hours.

---

## Roadmap to production

This is a hackathon prototype. To take it to a real product:

1. **Real Gmail/Outlook API integration** — replace DOM scraping with proper OAuth + Gmail API for stability
2. **Verified recruiter registry** — partner with companies to maintain an allowlist of legitimate recruiter domains and LinkedIn profiles
3. **Per-user feedback loop** — let candidates mark verdicts as correct/incorrect; use as training signal
4. **Real deepfake detection** — wire up an actual model (e.g. Resemble Detect, Pindrop) instead of simulated metrics
5. **Mobile companion** — interview links most often arrive on mobile; native iOS/Android with share-sheet integration
6. **B2B angle** — sell to colleges and bootcamps as a safety tool for their students entering the job market
7. **Threat intelligence sharing** — aggregate (anonymized) scam patterns across users to detect emerging campaigns in real time

---

## License

MIT — built for a hackathon. Use it, fork it, ship it.
