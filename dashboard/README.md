# TrustHire AI — Dashboard

Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion. The realtime SOC command center.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000. The dashboard auto-connects to `ws://localhost:8000/ws` and reconnects on disconnect.

## Components

| Component | Purpose |
|---|---|
| `TrustMeter` | Hero SVG gauge. Spring-animated `useMotionValue` drives both the stroke offset and the displayed number. Color is verdict-driven. |
| `AgentGrid` | 6 agent cards. Each card transitions `idle → activated → thinking → verdict` based on WS events. Reasoning + flags slide in when the verdict arrives. |
| `AlertFeed` | Right-rail live stream. New alerts slide in from the right. |
| `ReasoningConsole` | Terminal-style stream of agent reasoning lines, color-coded per agent. |
| `VerdictCard` | The dramatic reveal. Staggered entrance for headline → concerns → actions. |
| `DemoPanel` | Left-rail scenario launcher. Fetches `/api/scenarios` and POSTs to `/api/simulate/{id}`. |
| `RiskIndicators` | Shows the triggered risk flags + their penalty values from the rule engine. |
| `Header` | Brand + WS connection status dot. |

## State management

A single Zustand store (`lib/store.ts`) holds everything. The WS hook (`lib/useWS.ts`) feeds the store via a `handleEvent` reducer. Each component subscribes to only the slice it needs, so updates don't cause full-tree re-renders.

## Customizing the look

The palette lives in `tailwind.config.js`:

- `bg.base / surface / elevated` — backgrounds
- `line.subtle / DEFAULT / strong` — borders
- `ink.1 / 2 / 3 / 4` — text hierarchy
- `accent.cyan / amber / red / green / violet / pink` — agent + verdict colors
- `verdict.safe / caution / warning / block` — verdict-state colors

Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (numbers + console). All loaded from Google Fonts.

## Adding a panel

1. Create the component in `components/`
2. Subscribe to the relevant slice of `useStore`
3. Drop it into `app/page.tsx` in the grid

The grid is 12-col: 3 left, 6 center, 3 right.
