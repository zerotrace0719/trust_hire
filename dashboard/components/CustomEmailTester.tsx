"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Mail, Sparkles } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ParsedEmail {
  sender_email: string;
  subject: string;
  message_body: string;
  urls: string[];
  claimed_company: string;
}

function parseEmail(raw: string): ParsedEmail {
  const lines = raw.split("\n");
  let sender = "";
  let subject = "";
  let bodyStart = 0;

  // Look for From: and Subject: headers in first 10 lines
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    const fromMatch = line.match(/^from:\s*(.+)$/i);
    if (fromMatch) {
      const emailMatch = fromMatch[1].match(/<([^>]+)>/) || fromMatch[1].match(/(\S+@\S+)/);
      if (emailMatch) sender = emailMatch[1];
      bodyStart = i + 1;
    }
    const subjMatch = line.match(/^subject:\s*(.+)$/i);
    if (subjMatch) {
      subject = subjMatch[1].trim();
      bodyStart = i + 1;
    }
  }

  // If no headers found, treat whole thing as body
  const body = bodyStart > 0 ? lines.slice(bodyStart).join("\n").trim() : raw.trim();

  // Extract URLs
  const urlRegex = /https?:\/\/[^\s<>"']+/g;
  const urls = Array.from(new Set(body.match(urlRegex) || []));

  // Guess claimed company - look for "at <Company>", "from <Company>", or capitalized company words
  let claimed_company = "";
  const companyPatterns = [
    /(?:at|from|with|join|hiring for)\s+([A-Z][A-Za-z0-9&]+(?:\s+[A-Z][A-Za-z0-9&]+){0,2})/,
    /([A-Z][A-Za-z0-9&]+)\s+(?:hiring|careers|HR|talent acquisition)/i,
  ];
  for (const re of companyPatterns) {
    const m = re.exec(body);
    if (m && m[1] && m[1].length < 30) {
      claimed_company = m[1].trim();
      break;
    }
  }

  return { sender_email: sender, subject, message_body: body, urls, claimed_company };
}

const EXAMPLES = [
  {
    label: "Mild — Cold recruiter",
    text: `From: deepak.recruiter@outlook.com
Subject: Opportunity at Acme Corp

Hi,

Came across your profile and you'd be perfect for a Senior Engineer role at Acme. Compensation is competitive. Can we chat on WhatsApp this week?

Deepak`,
  },
  {
    label: "Spicy — Fake Amazon",
    text: `From: amazon.hr2024@gmail.com
Subject: URGENT — Amazon SDE Selection

Congratulations! You have been SHORTLISTED for SDE role at Amazon with CTC of ₹42 LPA.

To confirm:
1. Share OTP sent to your phone
2. Pay refundable processing fee ₹2,500 via UPI: amazon.hr@paytm
3. Submit Aadhaar and bank details

Contact me on WhatsApp +91-XXXXX for faster processing. Slots filling FAST — respond in 2 hours.

Regards,
Amazon HR Team`,
  },
];

export function CustomEmailTester() {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const parsed = raw.trim() ? parseEmail(raw) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  async function submit() {
    if (!parsed || !parsed.message_body) return;
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "manual",
          ...parsed,
        }),
      });
      setOpen(false);
      setRaw("");
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 9999 }}
          className="flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{ background: "#0C111D" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-line-subtle">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-cyan/15 border border-accent-cyan/40 flex items-center justify-center">
                  <Mail size={16} className="text-accent-cyan" />
                </div>
                <div>
                  <div className="font-display font-semibold text-ink-1">
                    Custom Email Analysis
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">
                    Paste any email — agents will analyze it live
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded hover:bg-white/5 text-ink-3 hover:text-ink-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Quick examples */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-3 font-mono mb-2">
                  Try a sample (click to load)
                </div>
                <div className="flex gap-2 flex-wrap">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.label}
                      onClick={() => setRaw(ex.text)}
                      className="text-xs px-3 py-1.5 rounded-md border border-line bg-bg-elevated hover:border-accent-cyan/40 hover:text-accent-cyan text-ink-2 transition"
                    >
                      {ex.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setRaw("")}
                    className="text-xs px-3 py-1.5 rounded-md border border-line bg-bg-elevated hover:border-accent-red/40 hover:text-accent-red text-ink-3 transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-3 font-mono mb-2">
                  Email content
                </div>
                <textarea
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder={`Paste the full email here, including headers if you have them. For example:\n\nFrom: someone@example.com\nSubject: Job offer\n\nHi, we have an opening at...`}
                  rows={10}
                  className="w-full bg-black/30 border border-line rounded-lg p-3 text-sm text-ink-1 font-mono leading-relaxed placeholder:text-ink-4 focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 resize-none"
                />
              </div>

              {/* Parsed preview */}
              {parsed && parsed.message_body && (
                <div className="border border-accent-cyan/20 bg-accent-cyan/[0.03] rounded-lg p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-accent-cyan font-mono mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent-cyan animate-pulse" />
                    Parsed — this is what the agents will see
                  </div>
                  <ParsedRow label="From" value={parsed.sender_email || "(none detected)"} />
                  <ParsedRow label="Subject" value={parsed.subject || "(none detected)"} />
                  <ParsedRow label="Claims" value={parsed.claimed_company || "(none detected)"} />
                  <ParsedRow
                    label="URLs"
                    value={parsed.urls.length ? parsed.urls.join(", ") : "(none)"}
                  />
                  <ParsedRow
                    label="Body"
                    value={`${parsed.message_body.slice(0, 120)}${
                      parsed.message_body.length > 120 ? "…" : ""
                    } (${parsed.message_body.length} chars)`}
                  />
                </div>
              )}
            </div>

            {/* Footer - sticky, always visible */}
            <div className="border-t border-line-subtle px-5 py-4 flex items-center justify-between shrink-0 bg-bg-surface/80">
              <div className="text-[10px] font-mono text-ink-3 hidden sm:block">
                Tip: leave headers off and just paste the body
              </div>
              <button
                onClick={submit}
                disabled={!parsed?.message_body || submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-cyan/20 border border-accent-cyan/50 text-accent-cyan font-semibold text-sm hover:bg-accent-cyan/30 hover:border-accent-cyan transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {submitting ? "Sending…" : "Analyze Now"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-accent-cyan/30 bg-accent-cyan/5 hover:bg-accent-cyan/10 hover:border-accent-cyan/50 transition group"
      >
        <div className="w-7 h-7 rounded shrink-0 flex items-center justify-center bg-accent-cyan/15 border border-accent-cyan/40">
          <Sparkles size={12} className="text-accent-cyan" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-xs font-medium text-accent-cyan">Test Your Own Email</div>
          <div className="text-[10px] font-mono text-ink-3">
            paste any email • live analysis
          </div>
        </div>
      </button>

      {mounted && createPortal(modal, document.body)}
    </>
  );
}

function ParsedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-xs">
      <span className="text-[10px] uppercase tracking-wider text-ink-3 font-mono w-14 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-ink-2 break-all flex-1">{value}</span>
    </div>
  );
}