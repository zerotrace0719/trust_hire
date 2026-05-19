"""
LLM client wrapper. Supports Groq (default), Gemini, and OpenAI.
Returns parsed JSON from agent prompts.

Switch providers via the LLM_PROVIDER env var in .env:
  LLM_PROVIDER=groq    (recommended - fast, generous free tier)
  LLM_PROVIDER=gemini
  LLM_PROVIDER=openai
"""
import os
import json
import re
import asyncio
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")

PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()

# Model defaults per provider
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Lazy-initialized clients (don't fail at import if a provider isn't installed)
_groq_client = None
_gemini_llm = None


def _get_groq():
    global _groq_client
    if _groq_client is None:
        from groq import AsyncGroq
        _groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
    return _groq_client


def _get_gemini():
    global _gemini_llm
    if _gemini_llm is None:
        from langchain_google_genai import ChatGoogleGenerativeAI
        _gemini_llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            temperature=0.3,
            google_api_key=os.getenv("GEMINI_API_KEY"),
        )
    return _gemini_llm


def _strip_fences(text: str) -> str:
    """Remove ```json ... ``` fences if the model added them."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _has_key() -> bool:
    if PROVIDER == "groq":
        return bool(os.getenv("GROQ_API_KEY"))
    if PROVIDER == "gemini":
        return bool(os.getenv("GEMINI_API_KEY"))
    if PROVIDER == "openai":
        return bool(os.getenv("OPENAI_API_KEY"))
    return False


async def call_llm(prompt: str, max_retries: int = 1) -> Dict[str, Any]:
    """
    Call the configured LLM, parse JSON response, return dict.
    Loud warning if no API key is configured (instead of silent zeros).
    """
    if not _has_key():
        print("!" * 70)
        print(f"! WARNING: No API key for LLM_PROVIDER={PROVIDER}")
        print(f"! Agents will return EMPTY results.")
        print(f"! Set {PROVIDER.upper()}_API_KEY in backend/.env")
        print("!" * 70)
        return {"flags": [], "reasoning": "(LLM key not configured)", "confidence": 0.0}

    last_err = None
    for attempt in range(max_retries + 1):
        try:
            if PROVIDER == "groq":
                client = _get_groq()
                resp = await client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": "You always respond with valid JSON only. No prose, no markdown fences, just JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.3,
                    response_format={"type": "json_object"},
                    max_tokens=800,
                )
                text = resp.choices[0].message.content or "{}"

            elif PROVIDER == "gemini":
                llm = _get_gemini()
                resp = await llm.ainvoke(prompt)
                text = resp.content or "{}"

            elif PROVIDER == "openai":
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                resp = await client.chat.completions.create(
                    model=OPENAI_MODEL,
                    response_format={"type": "json_object"},
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                )
                text = resp.choices[0].message.content or "{}"

            else:
                raise ValueError(f"Unknown LLM_PROVIDER: {PROVIDER}")

            text = _strip_fences(text)
            return json.loads(text)

        except Exception as e:
            last_err = e
            print(f"  LLM attempt {attempt+1} failed: {type(e).__name__}: {str(e)[:200]}")
            if attempt < max_retries:
                await asyncio.sleep(0.5 * (attempt + 1))

    print(f"  LLM call FAILED after {max_retries+1} attempts")
    return {"flags": [], "reasoning": f"(agent error: {last_err})", "confidence": 0.0}