# Judge Cheat Sheet

Drop this file open on a second monitor or print it. One-page reference for the demo + Q&A.

---

## The 30-second pitch

> "TrustHire AI is a zero-trust security layer for job seekers. A Chrome extension watches your Gmail and interview links in real time. Six AI agents tear apart every recruiter interaction looking for scams, phishing, and deepfake risks. You get a live trust score and clear advice — before you share your OTP."

## The opening hook (pick one)

- "₹120 crore was lost to fake recruiter scams in India last year."
- "More than half of Gen Z candidates have been targeted by a fake recruiter on LinkedIn."
- "Your bank has fraud detection. Your inbox doesn't."

## The wow moments (in order)

1. **Agent cascade** — 6 agents waking up one by one with glowing pulses, not all at once
2. **Trust score crash** — spring animation from 100 to single digits is more visceral than instant
3. **Verdict card slide-in** — concerns and actions stagger in, not all at once
4. **The legit recruiter test** — score holds at 92, proves we're not paranoia-ware

## Q&A — likely judge questions

**"How is this different from existing email spam filters?"**
> Spam filters look at the email shell — sender reputation, links. We analyze recruitment *context*: claimed role, salary plausibility, conversation behavior, deepfake risk on the interview itself. Spam filters miss most of these because the emails are well-formed and target only the candidate.

**"Why six agents and not one model?"**
> Specialization. Each agent has a focused prompt and a narrow output schema. We can debug one agent without breaking the others, swap any agent for a non-LLM detector (e.g. a real phishing URL classifier), and the parallel architecture is 5x faster than a single mega-prompt.

**"What if the recruiter is real but you flag them?"**
> The system never accuses — it returns observed signals and a recommendation to verify through official channels. The borderline scenario (`scn_borderline`) and the Stripe scenario show the score scaling appropriately. We tune toward precision, not recall, because false positives hurt real candidates.

**"How would you monetize?"**
> B2C freemium for individual candidates, then B2B to bootcamps, colleges, and placement agencies that want to protect their students. The threat intelligence layer — anonymized scam patterns aggregated across users — is the long-term defensible asset.

**"Is the deepfake detection real?"**
> The hooks are real (Meet/Zoom content scripts, metric payloads, decision agent). The current metric values are simulated for the demo. Production version wires up an actual deepfake API like Resemble Detect or Pindrop against the WebRTC stream. We separated the orchestration from the detection so the swap is one file.

**"Why doesn't the LLM compute the trust score directly?"**
> LLMs are inconsistent at numerical reasoning — you'd get a 23 one run and a 41 the next on the same input. We let the LLM do what it's good at (reading natural language, spotting patterns) and let a deterministic rule engine do what *it's* good at (consistent numerical scoring). Both layers are auditable.

**"Could a scammer adversarially evade this?"**
> A determined attacker could phrase requests to dodge specific keywords, yes. But the multi-layer design means evading the NLP agent doesn't help if the cybersecurity agent flags their typo-squatted domain. Each layer raises the cost of attack. That's the same logic as any zero-trust architecture.

## If the demo breaks

- **Backend not running** → dashboard shows "Offline" in the top-right. Restart with `uvicorn main:app --reload`.
- **No agents fire** → check the backend console; usually a missing `GEMINI_API_KEY`. The trust engine still works in offline mode; agents return empty findings.
- **Extension popup says "Disconnected"** → reload the extension at `chrome://extensions/`. The service worker times out after 30 seconds of idle.
- **Run the cURL fallback live:**
  ```bash
  curl -X POST localhost:8000/api/simulate/scn_otp_scam
  ```
  This is the demo path that *cannot* break — it doesn't need Gmail, the extension, or any frontend interaction. If everything else fails, you can run this from a terminal on stage.

## Slide deck (5 slides max)

1. **Title** — TrustHire AI: Zero-Trust Recruitment Intelligence
2. **Problem** — Recruitment fraud is exploding; one stat, one screenshot of a real scam email
3. **System** — The architecture diagram from the README, 30 seconds of voiceover
4. **Live demo** — Skip the slide, run the demo
5. **What's next** — 3 bullets: real Gmail API integration, threat intelligence sharing across users, B2B to placement agencies

Don't put the agent list on a slide. Show it in the live dashboard.
