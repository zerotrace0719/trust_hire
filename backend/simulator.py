"""
Demo Scenario Simulator
-----------------------
Loads pre-baked scenarios from scenarios/*.json and replays them through
the agent pipeline. The point: live demos cannot rely on real Gmail / live
recruiter emails — too fragile. Instead, the extension's content scripts
detect when the user is on Gmail / Meet / Zoom and the simulator injects
the appropriate scenario.

Each scenario JSON looks like:
{
  "id": "scn_otp_scam",
  "label": "OTP Scam — Fake Google Recruiter",
  "input": { AnalysisInput fields },
  "expected_score_range": [0, 25]
}
"""
import json
import os
from pathlib import Path
from typing import Dict, Any, List

SCENARIOS_DIR = Path(__file__).parent.parent / "scenarios"


def list_scenarios() -> List[Dict[str, Any]]:
    out = []
    if not SCENARIOS_DIR.exists():
        return out
    for p in sorted(SCENARIOS_DIR.glob("*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            out.append({
                "id": data.get("id", p.stem),
                "label": data.get("label", p.stem),
                "category": data.get("category", "other"),
                "expected_score_range": data.get("expected_score_range", [0, 100]),
            })
        except Exception:
            continue
    return out


def load_scenario(scenario_id: str) -> Dict[str, Any] | None:
    for p in SCENARIOS_DIR.glob("*.json"):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            if data.get("id") == scenario_id:
                return data
        except Exception:
            continue
    return None