# Architecture Notes

Background on design decisions that aren't obvious from the code.

## Why this is not just "one LLM call"

The brief asked for a multi-agent system, and the obvious shortcut is: one LLM call returning a giant JSON object with all six agents' findings. The dashboard animates the keys as they stream in. That looks identical to a judge.

We don't do that here, for three reasons:

1. **Parallel speed.** Five independent LLM calls running concurrently with `asyncio.gather` finish in roughly the time of the slowest one. A single mega-prompt is serial token generation — the whole thing takes 2–3× longer.

2. **Failure isolation.** If the NLP agent's prompt fails to parse, the other four agents' results are still good. With one mega-call, a parsing failure loses everything.

3. **Swap-out paths.** Three of the six agents are obvious candidates for being replaced by non-LLM detectors as the product matures — the Cybersecurity agent should call a real phishing URL API (PhishTank, Google Safe Browsing), the Deepfake agent should call a real detector, and the Identity agent should query a verified-recruiter registry. Splitting them into independent agents now means we can swap one at a time without rewriting the orchestrator.

## Why the trust score isn't computed by the LLM

LLMs are inconsistent at numerical output. The same flags can produce a 23 one run and a 41 the next. For a security product, this is a credibility killer — the candidate sees different scores for the same email.

The split:

- **LLM identifies risk flags** (`["unofficial_email_domain", "otp_request", "payment_request"]`)
- **Rule engine computes the score** (100 − 15 − 40 − 35 = 10 → BLOCK)

Deterministic, debuggable, demoable. You can tune the weights without retraining anything.

## Why agents emit three events each

Each agent fires `agent_activated → agent_thinking → agent_verdict`. This isn't padding — it's the only way the dashboard can show meaningful state transitions:

- `activated` triggers the card glow + pulse animation
- `thinking` shows the spinner and the sweeping shimmer line
- `verdict` reveals the flags + reasoning

If you only emit one event per agent, the cards just pop from idle to done with no narrative. The three-stage emission turns the agent pipeline into a watchable performance.

## Why artificial delays per agent

In `agents.py`, each `_run_agent` call gets a small `artificial_delay` (0.3 to 1.3 seconds) staggered across agents. The LLM calls themselves are roughly synchronous in duration, so without these delays all five agents' verdicts would arrive within a 200ms window and the dashboard would show them all light up at once.

The staggered delays produce a cascade: identity first, then NLP a beat later, then cyber, behavior, deepfake. This reads as agents collaborating in sequence even though they're running in parallel. It's deliberate stagecraft, not a bug.

## Why the scenario simulator exists alongside the extension

The extension's Gmail content script works. It will, in practice, fire on real recruiter emails when you open them. But:

- Live demos with real Gmail are fragile: the right email needs to be open, the DOM needs to be in the right state, the LLM call needs to succeed
- Judges have 3 minutes; you can't afford the email loading wrong

The simulator endpoint (`POST /api/simulate/{id}`) is the demo-day rescue: it runs the exact same agent pipeline with pre-validated input, producing a deterministic result every time. The extension's popup has buttons to trigger it, so even your *extension* demo doesn't require a real email to function.

In production, the simulator becomes the test suite. Every new scenario JSON is a regression test.

## Why Zustand and not Redux/Context

Three reasons:

1. WebSocket message handling fits naturally into a single reducer function (`handleEvent`)
2. Component subscriptions are slice-based (`useStore(s => s.score)`) — only components that need that slice re-render
3. No provider tree, no boilerplate. The dashboard has ~150 lines of state code total.

For a hackathon-to-production trajectory, Zustand stays appropriate up to about 10k LOC. Past that, consider Redux Toolkit if the state graph gets gnarly.

## Why no MongoDB

The brief mentioned MongoDB. We don't use it. The system is stateless except for the WS connection set, which lives in memory. Reasons:

- No persistence is needed for the demo
- Adding MongoDB is 30 minutes of setup + Dockerfile drama
- A real production version would want Postgres anyway (relational data — users, scenarios, verdicts, feedback labels)

When the time comes, the data model is simple:

```
users(id, email, created_at)
events(id, user_id, source, raw_payload, ts)
analyses(id, event_id, score, verdict, agent_results_json, ts)
feedback(id, analysis_id, user_label, ts)
```

That's a one-evening Prisma migration.

## Why MV3, no React, no build step in the extension

Chrome MV3 service workers have specific constraints (no persistent globals, fast cold-start required). React + a bundler adds:

- ~50KB minimum to every content script
- A webpack/vite config to maintain
- Source maps for debugging
- Hot reload that doesn't work well with MV3 anyway

For a content script that mounts a single floating widget with five states, vanilla DOM + a single CSS file is faster to write, faster to load, and easier to debug. The React tax isn't worth it here.

## What we'd add in week 3+

- **Replay UI** — re-watch any past analysis with the agent timeline scrubbable like a video
- **Recruiter graph** — visualize the sender's email domain, claimed company, and any matching LinkedIn/GitHub data as a connected graph
- **Threat intelligence feed** — aggregate (anonymized) scam patterns across users, surface emerging campaigns
- **Mobile app** — most interview links open on mobile; native iOS share-sheet integration
- **Feedback loop** — let candidates label verdicts; use as supervised training signal for a domain-specific scam classifier
