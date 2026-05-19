# TrustHire AI — Backend

FastAPI server with multi-agent orchestration and WebSocket streaming.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env to set your GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

Get a free Gemini key at https://aistudio.google.com/apikey. Free tier handles hackathon demos comfortably.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health + LLM config check |
| GET | `/api/scenarios` | List available demo scenarios |
| POST | `/api/events` | Push a detected event (from the extension) |
| POST | `/api/simulate/{scenario_id}` | Replay a canned scenario |
| WS | `/ws` | Live event stream (dashboard subscribes here) |

## WebSocket event types

The dashboard listens for these. Each carries an `event_id` so concurrent analyses don't collide.

| Type | Emitted when |
|---|---|
| `ws_hello` | On connect |
| `analysis_started` | New event arrives |
| `agent_activated` | An agent starts (animates the card) |
| `agent_thinking` | LLM call in flight |
| `agent_verdict` | Agent returns flags + reasoning |
| `score_updated` | Trust score recomputed |
| `final_verdict` | Risk Decision Agent produces final summary |

## Adding new scenarios

Drop a JSON file into `/scenarios/`. Schema:

```json
{
  "id": "scn_my_scenario",
  "label": "My Scenario — Short Description",
  "category": "phishing | cyber | legitimate | caution | other",
  "expected_score_range": [0, 100],
  "input": {
    "source": "gmail",
    "sender_email": "...",
    "claimed_company": "...",
    "subject": "...",
    "message_body": "...",
    "urls": ["..."],
    "claimed_role": "...",
    "claimed_salary": "...",
    "has_job_description": false,
    "conversation_summary": "..."
  }
}
```

Restart isn't needed — `simulator.list_scenarios()` re-reads the directory.

## Adding new risk flags

1. Add the flag to `RiskFlag` enum in `trust_engine.py`
2. Add its weight to `FLAG_WEIGHTS`
3. Add a human label to `FLAG_LABELS`
4. Mention it in the relevant agent's prompt in `prompts.py`

## Switching to OpenAI

Set `LLM_PROVIDER=openai` and `OPENAI_API_KEY=...` in `.env`. The wrapper auto-routes.

## Offline / no-key mode

The system runs without an API key — agents return empty findings, score stays at 100. Useful for testing UI plumbing without burning quota.
