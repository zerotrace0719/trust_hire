"""
Multi-Agent Orchestrator
------------------------
Runs the 5 specialist agents in parallel, then the Risk Decision Agent
synthesizes the result. Every step emits a WebSocket event so the
dashboard can animate agent activation, thinking, and verdicts in real time.

We use LangGraph for the orchestration graph but the actual agent calls
are just LLM calls with structured prompts — no tools, no memory. Keeps it
fast and predictable for live demos.
"""
import asyncio
import time
from typing import Any, Dict, List, Callable, Awaitable
from pydantic import BaseModel
from llm_client import call_llm
from prompts import (
    IDENTITY_AGENT_PROMPT, NLP_AGENT_PROMPT, CYBER_AGENT_PROMPT,
    BEHAVIOR_AGENT_PROMPT, DEEPFAKE_AGENT_PROMPT, RISK_DECISION_PROMPT,
)
from trust_engine import compute_trust_score, RiskFlag, TrustScoreResult


# Event emitter type — passed in from main.py so we don't import websocket logic here
Emitter = Callable[[Dict[str, Any]], Awaitable[None]]


class AnalysisInput(BaseModel):
    event_id: str
    source: str                        # "gmail" | "meet" | "zoom" | "manual"
    sender_email: str = ""
    claimed_company: str = ""
    subject: str = ""
    message_body: str = ""
    urls: List[str] = []
    claimed_role: str = ""
    claimed_salary: str = ""
    has_job_description: bool = True
    interview_history: str = "none"
    conversation_summary: str = ""
    voice_anomaly_score: float = 0.0
    lip_sync_offset_ms: int = 0
    pause_naturalness: float = 1.0
    background_noise_profile: str = "normal"


AGENT_META = {
    "identity":  {"name": "Identity Verification",  "icon": "shield-user",  "color": "#00D9FF"},
    "nlp":       {"name": "NLP Scam Detection",     "icon": "message-square","color": "#FFB020"},
    "cyber":     {"name": "Cybersecurity",          "icon": "shield-alert", "color": "#FF4757"},
    "behavior":  {"name": "Behavioral Analysis",    "icon": "activity",     "color": "#A78BFA"},
    "deepfake":  {"name": "Voice / Deepfake Risk",  "icon": "audio-waveform","color": "#F472B6"},
    "decision":  {"name": "Risk Decision",          "icon": "brain",        "color": "#00E676"},
}


async def _run_agent(
    agent_key: str,
    prompt: str,
    emit: Emitter,
    event_id: str,
    thinking_delay: float = 0.0,
) -> Dict[str, Any]:
    """Run one agent. Emits state transitions: activated -> thinking -> verdict."""
    print(f"  [{event_id}] {agent_key} agent: activating...")
    await emit({
        "type": "agent_activated",
        "event_id": event_id,
        "agent": agent_key,
        "meta": AGENT_META[agent_key],
        "ts": time.time(),
    })
    await asyncio.sleep(0.4)  # let activation animation breathe

    await emit({
        "type": "agent_thinking",
        "event_id": event_id,
        "agent": agent_key,
        "ts": time.time(),
    })

    # Run LLM call and the thinking-display delay concurrently so we don't waste time
    print(f"  [{event_id}] {agent_key} agent: calling LLM...")
    llm_task = asyncio.create_task(call_llm(prompt))
    if thinking_delay > 0:
        await asyncio.sleep(thinking_delay)
    try:
        result = await llm_task
        print(f"  [{event_id}] {agent_key} agent: got {len(result.get('flags', []))} flags")
    except Exception as e:
        print(f"  [{event_id}] {agent_key} agent: LLM ERROR: {e}")
        result = {"flags": [], "reasoning": f"(agent error: {e})", "confidence": 0.0}
    flags = result.get("flags", []) or []
    reasoning = result.get("reasoning", "")
    confidence = float(result.get("confidence", 0.5))

    # Normalise flags to valid RiskFlag values, drop unknown
    valid_flags = []
    for f in flags:
        try:
            valid_flags.append(RiskFlag(f).value)
        except ValueError:
            continue

    await emit({
        "type": "agent_verdict",
        "event_id": event_id,
        "agent": agent_key,
        "flags": valid_flags,
        "reasoning": reasoning,
        "confidence": confidence,
        "ts": time.time(),
    })

    return {"agent": agent_key, "flags": valid_flags, "reasoning": reasoning, "confidence": confidence}


async def run_analysis(inp: AnalysisInput, emit: Emitter, demo_mode: bool = True) -> Dict[str, Any]:
    """
    Run the full multi-agent pipeline.

    demo_mode=True (default): agents fire SEQUENTIALLY with visible gaps so the
    dashboard can show a watchable cascade. Adds ~3-5s to total time.
    demo_mode=False: agents fire in parallel for production speed.
    """
    print(f"\n[{inp.event_id}] === ANALYSIS START === source={inp.source}")
    print(f"[{inp.event_id}] sender={inp.sender_email[:50]!r} subject={inp.subject[:50]!r}")

    # Announce start — and send the input data so the dashboard can show what's being analyzed
    await emit({
        "type": "analysis_started",
        "event_id": inp.event_id,
        "source": inp.source,
        "input_preview": {
            "sender_email": inp.sender_email,
            "claimed_company": inp.claimed_company,
            "subject": inp.subject,
            "message_body": inp.message_body,
            "urls": inp.urls,
            "claimed_role": inp.claimed_role,
            "claimed_salary": inp.claimed_salary,
        },
        "ts": time.time(),
    })

    # Give the user a beat to register the input before agents start firing
    if demo_mode:
        await asyncio.sleep(1.2)

    # Build per-agent prompts
    identity_prompt = IDENTITY_AGENT_PROMPT.format(
        sender_email=inp.sender_email or "(not provided)",
        claimed_company=inp.claimed_company or "(not specified)",
        subject=inp.subject or "(no subject)",
    )
    nlp_prompt = NLP_AGENT_PROMPT.format(
        message_body=inp.message_body or "(no body)",
    )
    cyber_prompt = CYBER_AGENT_PROMPT.format(
        urls="\n".join(inp.urls) if inp.urls else "(no URLs)",
    )
    behavior_prompt = BEHAVIOR_AGENT_PROMPT.format(
        claimed_role=inp.claimed_role or "(unspecified)",
        claimed_salary=inp.claimed_salary or "(unspecified)",
        has_job_description=str(inp.has_job_description),
        interview_history=inp.interview_history,
        conversation_summary=inp.conversation_summary or "(none)",
    )
    deepfake_prompt = DEEPFAKE_AGENT_PROMPT.format(
        voice_anomaly_score=inp.voice_anomaly_score,
        lip_sync_offset_ms=inp.lip_sync_offset_ms,
        pause_naturalness=inp.pause_naturalness,
        background_noise_profile=inp.background_noise_profile,
    )

    # Sequential cascade in demo mode (watchable), parallel in production
    agent_specs = [
        ("identity",  identity_prompt),
        ("nlp",       nlp_prompt),
        ("cyber",     cyber_prompt),
        ("behavior",  behavior_prompt),
        ("deepfake",  deepfake_prompt),
    ]

    agent_results = []
    cumulative_flags: List[RiskFlag] = []

    if demo_mode:
        # SEQUENTIAL — each agent visibly activates, thinks, returns, then live score ticks
        for agent_key, prompt in agent_specs:
            result = await _run_agent(agent_key, prompt, emit, inp.event_id, thinking_delay=0.9)
            agent_results.append(result)

            # Live score tick — add this agent's flags to the running total and update score
            new_flags = [RiskFlag(f) for f in result["flags"] if f in RiskFlag._value2member_map_]
            cumulative_flags.extend(new_flags)
            interim_score = compute_trust_score(cumulative_flags)
            await emit({
                "type": "score_updated",
                "event_id": inp.event_id,
                "score": interim_score.score,
                "verdict": interim_score.verdict if interim_score.score < 100 else "ANALYZING",
                "verdict_color": interim_score.verdict_color,
                "flag_details": interim_score.flag_details,
                "ts": time.time(),
            })
            # Brief pause between agents so the cascade is visible
            await asyncio.sleep(0.5)
    else:
        # PARALLEL — fast path
        tasks = [_run_agent(k, p, emit, inp.event_id, thinking_delay=0.0) for k, p in agent_specs]
        agent_results = await asyncio.gather(*tasks)
        for r in agent_results:
            cumulative_flags.extend(
                [RiskFlag(f) for f in r["flags"] if f in RiskFlag._value2member_map_]
            )

    all_flags = list(cumulative_flags)
    trust_result: TrustScoreResult = compute_trust_score(all_flags)

    # Final score snap (in case live ticks diverged from final dedup)
    await emit({
        "type": "score_updated",
        "event_id": inp.event_id,
        "score": trust_result.score,
        "verdict": trust_result.verdict,
        "verdict_color": trust_result.verdict_color,
        "flag_details": trust_result.flag_details,
        "ts": time.time(),
    })

    # Risk Decision Agent
    findings_str = "\n".join(
        f"- {AGENT_META[r['agent']]['name']}: flags={r['flags']}, reasoning={r['reasoning']}"
        for r in agent_results
    )
    decision_prompt = RISK_DECISION_PROMPT.format(
        agent_findings=findings_str,
        all_flags=[f.value for f in all_flags],
        trust_score=trust_result.score,
        verdict=trust_result.verdict,
    )
    await emit({
        "type": "agent_activated",
        "event_id": inp.event_id,
        "agent": "decision",
        "meta": AGENT_META["decision"],
        "ts": time.time(),
    })
    await asyncio.sleep(0.2)
    await emit({"type": "agent_thinking", "event_id": inp.event_id, "agent": "decision", "ts": time.time()})

    decision = await call_llm(decision_prompt)

    await emit({
        "type": "agent_verdict",
        "event_id": inp.event_id,
        "agent": "decision",
        "flags": [],
        "reasoning": decision.get("summary", ""),
        "confidence": 1.0,
        "ts": time.time(),
    })

    # Final consolidated event
    final = {
        "type": "final_verdict",
        "event_id": inp.event_id,
        "score": trust_result.score,
        "verdict": trust_result.verdict,
        "verdict_color": trust_result.verdict_color,
        "headline": decision.get("headline", trust_result.verdict),
        "summary": decision.get("summary", trust_result.recommendation),
        "top_concerns": decision.get("top_concerns", [d["label"] for d in trust_result.flag_details[:3]]),
        "what_to_do": decision.get("what_to_do", [trust_result.recommendation]),
        "triggered_flags": [f.value for f in all_flags],
        "agent_results": agent_results,
        "ts": time.time(),
    }
    await emit(final)
    print(f"[{inp.event_id}] === ANALYSIS DONE === score={trust_result.score} verdict={trust_result.verdict}\n")
    return final