"""
Trust Score Engine
------------------
Deterministic rule-based scoring. The LLM identifies which flags fire,
this module computes the actual score. Keeps demos predictable and debuggable.
"""
from enum import Enum
from typing import List, Dict
from pydantic import BaseModel


class RiskFlag(str, Enum):
    # Identity flags
    UNOFFICIAL_EMAIL_DOMAIN = "unofficial_email_domain"      # gmail/yahoo claiming to be a company
    DOMAIN_MISMATCH = "domain_mismatch"                       # claims X, sends from Y
    SUSPICIOUS_TLD = "suspicious_tld"                         # .xyz .top .work etc
    TYPO_SQUATTED_DOMAIN = "typo_squatted_domain"             # gooogle.com, micros0ft.com
    NO_LINKEDIN_FOOTPRINT = "no_linkedin_footprint"           # recruiter not verifiable

    # NLP / scam language
    URGENCY_LANGUAGE = "urgency_language"                     # "immediate", "today only"
    PAYMENT_REQUEST = "payment_request"                       # processing fee, security deposit
    OTP_REQUEST = "otp_request"                               # share OTP / verification code
    OFFER_BEFORE_INTERVIEW = "offer_before_interview"         # selected without interview
    PERSONAL_INFO_REQUEST = "personal_info_request"           # bank details, aadhaar, ssn
    MOVE_TO_PRIVATE_CHANNEL = "move_to_private_channel"       # whatsapp, telegram, personal email
    POOR_GRAMMAR = "poor_grammar"

    # Cyber
    PHISHING_URL = "phishing_url"
    URL_SHORTENER = "url_shortener"                           # bit.ly, tinyurl
    IP_ADDRESS_URL = "ip_address_url"
    PUNYCODE_DOMAIN = "punycode_domain"
    UNSAFE_MEETING_LINK = "unsafe_meeting_link"               # fake google meet / zoom

    # Behavior
    ABNORMAL_SALARY = "abnormal_salary"                       # 10x market rate
    NO_JOB_DESCRIPTION = "no_job_description"
    REFUSES_VIDEO_CALL = "refuses_video_call"
    INCONSISTENT_TIMELINE = "inconsistent_timeline"

    # Deepfake / voice (simulated demo feature)
    VOICE_ANOMALY = "voice_anomaly"
    LIP_SYNC_MISMATCH = "lip_sync_mismatch"
    UNNATURAL_PAUSES = "unnatural_pauses"


# Weight = how much each flag drops the trust score
FLAG_WEIGHTS: Dict[RiskFlag, int] = {
    # Critical (>= -30)
    RiskFlag.OTP_REQUEST: -40,
    RiskFlag.PAYMENT_REQUEST: -35,
    RiskFlag.PHISHING_URL: -32,
    RiskFlag.TYPO_SQUATTED_DOMAIN: -30,
    RiskFlag.PERSONAL_INFO_REQUEST: -30,

    # High (-20 to -29)
    RiskFlag.UNSAFE_MEETING_LINK: -28,
    RiskFlag.IP_ADDRESS_URL: -25,
    RiskFlag.PUNYCODE_DOMAIN: -25,
    RiskFlag.DOMAIN_MISMATCH: -22,
    RiskFlag.OFFER_BEFORE_INTERVIEW: -22,
    RiskFlag.LIP_SYNC_MISMATCH: -20,

    # Medium (-10 to -19)
    RiskFlag.MOVE_TO_PRIVATE_CHANNEL: -18,
    RiskFlag.SUSPICIOUS_TLD: -16,
    RiskFlag.UNOFFICIAL_EMAIL_DOMAIN: -15,
    RiskFlag.URL_SHORTENER: -14,
    RiskFlag.URGENCY_LANGUAGE: -12,
    RiskFlag.VOICE_ANOMALY: -12,
    RiskFlag.ABNORMAL_SALARY: -12,
    RiskFlag.REFUSES_VIDEO_CALL: -10,

    # Low (< -10)
    RiskFlag.POOR_GRAMMAR: -8,
    RiskFlag.NO_JOB_DESCRIPTION: -8,
    RiskFlag.INCONSISTENT_TIMELINE: -8,
    RiskFlag.UNNATURAL_PAUSES: -7,
    RiskFlag.NO_LINKEDIN_FOOTPRINT: -6,
}


FLAG_LABELS: Dict[RiskFlag, str] = {
    RiskFlag.OTP_REQUEST: "Requesting OTP / verification code",
    RiskFlag.PAYMENT_REQUEST: "Asking for payment / processing fee",
    RiskFlag.PHISHING_URL: "Phishing URL detected",
    RiskFlag.TYPO_SQUATTED_DOMAIN: "Typo-squatted domain (impersonation)",
    RiskFlag.PERSONAL_INFO_REQUEST: "Requesting sensitive personal info",
    RiskFlag.UNSAFE_MEETING_LINK: "Unsafe meeting link",
    RiskFlag.IP_ADDRESS_URL: "URL uses raw IP address",
    RiskFlag.PUNYCODE_DOMAIN: "Punycode / unicode disguised domain",
    RiskFlag.DOMAIN_MISMATCH: "Sender domain doesn't match claimed company",
    RiskFlag.OFFER_BEFORE_INTERVIEW: "Offer made without proper interview",
    RiskFlag.LIP_SYNC_MISMATCH: "Lip-sync mismatch (possible deepfake)",
    RiskFlag.MOVE_TO_PRIVATE_CHANNEL: "Pushing to WhatsApp / Telegram",
    RiskFlag.SUSPICIOUS_TLD: "Suspicious top-level domain",
    RiskFlag.UNOFFICIAL_EMAIL_DOMAIN: "Personal email claiming to be a company",
    RiskFlag.URL_SHORTENER: "URL shortener obscures destination",
    RiskFlag.URGENCY_LANGUAGE: "High-pressure urgency language",
    RiskFlag.VOICE_ANOMALY: "Voice anomaly detected",
    RiskFlag.ABNORMAL_SALARY: "Salary far above market rate",
    RiskFlag.REFUSES_VIDEO_CALL: "Refuses video call",
    RiskFlag.POOR_GRAMMAR: "Notable grammar / spelling issues",
    RiskFlag.NO_JOB_DESCRIPTION: "No formal job description provided",
    RiskFlag.INCONSISTENT_TIMELINE: "Inconsistent timeline / story",
    RiskFlag.UNNATURAL_PAUSES: "Unnatural speech pauses",
    RiskFlag.NO_LINKEDIN_FOOTPRINT: "No verifiable LinkedIn footprint",
}


class TrustScoreResult(BaseModel):
    score: int                       # 0-100
    verdict: str                     # SAFE / CAUTION / WARNING / BLOCK
    verdict_color: str               # for UI
    triggered_flags: List[RiskFlag]
    flag_details: List[Dict[str, str | int]]
    recommendation: str


def compute_trust_score(flags: List[RiskFlag]) -> TrustScoreResult:
    base = 100
    total_penalty = 0
    details = []
    # Dedupe while preserving order
    seen = set()
    unique_flags = []
    for f in flags:
        if f not in seen:
            seen.add(f)
            unique_flags.append(f)

    for flag in unique_flags:
        penalty = FLAG_WEIGHTS.get(flag, -5)
        total_penalty += penalty
        details.append({
            "flag": flag.value,
            "label": FLAG_LABELS.get(flag, flag.value),
            "penalty": penalty,
        })

    score = max(0, base + total_penalty)

    if score >= 80:
        verdict = "SAFE"
        color = "green"
        rec = "This recruiter shows normal patterns. Standard caution applies — verify on LinkedIn and the official careers page."
    elif score >= 60:
        verdict = "CAUTION"
        color = "yellow"
        rec = "Some unusual signals detected. Verify the recruiter's identity through the company's official channels before sharing any information."
    elif score >= 35:
        verdict = "WARNING"
        color = "orange"
        rec = "Multiple suspicious patterns detected. Do not share personal information, payment details, or OTPs. Reach out to the company through their official website to verify."
    else:
        verdict = "BLOCK"
        color = "red"
        rec = "Critical risk indicators detected. We strongly recommend not engaging further. Report to your local cybercrime authority if you have already shared any information."

    return TrustScoreResult(
        score=score,
        verdict=verdict,
        verdict_color=color,
        triggered_flags=unique_flags,
        flag_details=details,
        recommendation=rec,
    )
