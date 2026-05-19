"""
TrustHire AI — FastAPI Server
=============================
Endpoints:
  POST /api/events          — extension pushes a detected event, triggers analysis
  POST /api/simulate/{id}   — replay a canned scenario through the agent pipeline
  GET  /api/scenarios       — list available scenarios for the demo control panel
  GET  /api/health          — health check
  WS   /ws                  — dashboard subscribes here for live events
"""
import os
import json
import uuid
import asyncio
from typing import Set, Dict, Any
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from agents import run_analysis, AnalysisInput
from simulator import list_scenarios, load_scenario

# ---------- WebSocket manager ----------
class WSManager:
    def __init__(self):
        self.connections: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.add(ws)

    def disconnect(self, ws: WebSocket):
        self.connections.discard(ws)

    async def broadcast(self, message: Dict[str, Any]):
        dead = []
        text = json.dumps(message, default=str)
        for ws in list(self.connections):
            try:
                await ws.send_text(text)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = WSManager()


async def emit(event: Dict[str, Any]):
    """Emitter passed into agent pipeline."""
    await manager.broadcast(event)


# ---------- App ----------
@asynccontextmanager
async def lifespan(app: FastAPI):
    provider = os.getenv("LLM_PROVIDER", "groq").lower()
    key_map = {
        "groq": "GROQ_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "openai": "OPENAI_API_KEY",
    }
    key_env = key_map.get(provider, "")
    key_present = bool(os.getenv(key_env))
    print("TrustHire AI backend starting...")
    print(f"  LLM provider: {provider}")
    print(f"  API key configured ({key_env}): {key_present}")
    yield
    print("TrustHire AI backend stopping...")


app = FastAPI(title="TrustHire AI", lifespan=lifespan)

allowed = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # hackathon — open it up
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Models ----------
class EventPayload(BaseModel):
    """Lightweight event from the extension. We map to AnalysisInput."""
    source: str = "extension"              # gmail | meet | zoom | manual
    sender_email: str = ""
    claimed_company: str = ""
    subject: str = ""
    message_body: str = ""
    urls: list[str] = []
    claimed_role: str = ""
    claimed_salary: str = ""
    has_job_description: bool = True
    conversation_summary: str = ""
    voice_anomaly_score: float = 0.0
    lip_sync_offset_ms: int = 0
    pause_naturalness: float = 1.0
    background_noise_profile: str = "normal"


# ---------- Routes ----------
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "ws_clients": len(manager.connections),
        "llm_provider": os.getenv("LLM_PROVIDER", "gemini"),
        "llm_configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")),
    }


@app.get("/api/scenarios")
async def get_scenarios():
    return {"scenarios": list_scenarios()}


@app.post("/api/events")
async def post_event(payload: EventPayload):
    """Extension sends an event. We kick off analysis in the background."""
    event_id = f"evt_{uuid.uuid4().hex[:10]}"
    inp = AnalysisInput(event_id=event_id, **payload.model_dump())
    asyncio.create_task(run_analysis(inp, emit))
    return {"event_id": event_id, "status": "analysis_started"}


async def _simulate_meet_telemetry(scenario_data: dict, duration_seconds: int = 30):
    """Pulse fake Meet telemetry every 1.5s so the Live Interview Monitor lights up."""
    import time as _t
    import random
    session_id = f"sim_meet_{uuid.uuid4().hex[:8]}"
    urls = scenario_data.get("input", {}).get("urls", [])
    meeting_url = urls[0] if urls else "https://meet.google.com/abc-defg-hij"
    # Derive a fake hostname from the URL
    try:
        from urllib.parse import urlparse
        host = urlparse(meeting_url).hostname or "meet.google.com"
    except Exception:
        host = "meet.google.com"
    # Detect risk indicators from the URL
    risk_indicators = []
    if host != "meet.google.com":
        if "meet" in host or "google" in host:
            risk_indicators.append("typo_squatted_domain")
        if host.endswith((".xyz", ".top", ".click", ".work", ".info")):
            risk_indicators.append("suspicious_tld")

    start = _t.time()
    iterations = duration_seconds // 2  # ping every 2 seconds
    for i in range(iterations):
        await emit({
            "type": "meet_telemetry",
            "session_id": session_id,
            "meeting_url": meeting_url,
            "meeting_code": "bzx-mtuq-pkw",
            "participant_count": 2,
            "duration_seconds": int(_t.time() - start),
            "organizer_email": scenario_data.get("input", {}).get("sender_email", ""),
            "organizer_domain": host,
            "is_recording": i > 3,
            "audio_level": 0.2 + random.random() * 0.6,
            "is_speaking": random.random() > 0.5,
            "risk_indicators": risk_indicators,
            "ts": _t.time(),
        })
        await asyncio.sleep(2.0)


@app.post("/api/simulate/{scenario_id}")
async def simulate(scenario_id: str):
    data = load_scenario(scenario_id)
    if not data:
        raise HTTPException(404, f"scenario {scenario_id} not found")
    event_id = f"sim_{uuid.uuid4().hex[:10]}"
    inp = AnalysisInput(event_id=event_id, **data["input"])
    asyncio.create_task(run_analysis(inp, emit))
    # If this is a meet scenario, also pulse fake telemetry for the Live Monitor
    if data.get("input", {}).get("source") == "meet":
        asyncio.create_task(_simulate_meet_telemetry(data, duration_seconds=30))
    return {"event_id": event_id, "scenario": scenario_id, "label": data.get("label")}


class MeetTelemetry(BaseModel):
    """Live telemetry from an ongoing Meet/Zoom session.
    Doesn't trigger full analysis - just broadcasts to dashboard for live monitoring."""
    session_id: str
    meeting_url: str = ""
    meeting_code: str = ""
    participant_count: int = 0
    duration_seconds: int = 0
    organizer_email: str = ""
    organizer_domain: str = ""
    is_recording: bool = False
    audio_level: float = 0.0           # 0.0-1.0
    is_speaking: bool = False
    risk_indicators: list[str] = []    # e.g. ["typo_squatted_domain", "external_organizer"]


@app.post("/api/meet/telemetry")
async def meet_telemetry(payload: MeetTelemetry):
    """Live Meet session updates - dashboard shows in the Live Interview Monitor."""
    import time as _t
    await emit({
        "type": "meet_telemetry",
        **payload.model_dump(),
        "ts": _t.time(),
    })
    return {"status": "ok"}


@app.post("/api/meet/start")
async def meet_start(payload: EventPayload):
    """Meet session started - runs the same analysis pipeline as Gmail."""
    event_id = f"meet_{uuid.uuid4().hex[:10]}"
    inp = AnalysisInput(event_id=event_id, **payload.model_dump())
    asyncio.create_task(run_analysis(inp, emit))
    return {"event_id": event_id, "status": "meet_analysis_started"}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Send hello so dashboard knows it's connected
        await ws.send_text(json.dumps({"type": "ws_hello", "msg": "Connected to TrustHire AI"}))
        while True:
            # We don't need inbound messages, but keep the socket alive
            data = await ws.receive_text()
            # Optional: handle ping/pong or extension commands here
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await ws.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(ws)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )