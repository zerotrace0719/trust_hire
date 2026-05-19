"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Link2, User, Briefcase, Building2 } from "lucide-react";
import { useStore } from "@/lib/store";

// Phrases to highlight as suspicious - matches the patterns the agents look for
const SUSPICIOUS_PATTERNS: { pattern: RegExp; severity: "high" | "medium" | "low" }[] = [
  { pattern: /\b(otp|one[- ]time password|verification code)\b/gi, severity: "high" },
  { pattern: /\b(processing fee|registration fee|security deposit|training fee|joining fee|refundable)\b/gi, severity: "high" },
  { pattern: /\b(aadhaar|aadhar|ssn|pan card|bank account|bank statement)\b/gi, severity: "high" },
  { pattern: /\b(whatsapp|telegram|personal email|personal gmail)\b/gi, severity: "medium" },
  { pattern: /\b(urgent|immediately|today only|limited slots|expires in|respond within|hurry)\b/gi, severity: "medium" },
  { pattern: /\b(shortlisted|selected|congratulations)\b/gi, severity: "low" },
  { pattern: /₹[\d,]+|rs\.?\s*[\d,]+|\$[\d,]+/gi, severity: "low" },
];

function highlightText(text: string) {
  if (!text) return null;
  // Apply highlights iteratively, building up tokens
  type Token = { text: string; severity?: "high" | "medium" | "low" };
  let tokens: Token[] = [{ text }];

  for (const { pattern, severity } of SUSPICIOUS_PATTERNS) {
    const next: Token[] = [];
    for (const tok of tokens) {
      if (tok.severity) {
        next.push(tok);
        continue;
      }
      let lastIndex = 0;
      const re = new RegExp(pattern.source, pattern.flags);
      let m: RegExpExecArray | null;
      while ((m = re.exec(tok.text)) !== null) {
        if (m.index > lastIndex) next.push({ text: tok.text.slice(lastIndex, m.index) });
        next.push({ text: m[0], severity });
        lastIndex = m.index + m[0].length;
        if (m[0].length === 0) re.lastIndex++;
      }
      if (lastIndex < tok.text.length) next.push({ text: tok.text.slice(lastIndex) });
    }
    tokens = next;
  }

  return tokens.map((tok, i) => {
    if (!tok.severity) return <span key={i}>{tok.text}</span>;
    const color =
      tok.severity === "high"
        ? "#FF4757"
        : tok.severity === "medium"
        ? "#FFB020"
        : "#A78BFA";
    return (
      <motion.span
        key={i}
        initial={{ backgroundColor: color + "44" }}
        animate={{ backgroundColor: color + "22" }}
        transition={{ duration: 1.2 }}
        className="px-0.5 rounded font-medium"
        style={{
          color,
          textShadow: `0 0 8px ${color}66`,
          borderBottom: `1px solid ${color}66`,
        }}
      >
        {tok.text}
      </motion.span>
    );
  });
}

export function InputPreview() {
  const input = useStore((s) => s.inputPreview);

  return (
    <AnimatePresence mode="wait">
      {input && (
        <motion.div
          key={input.subject + input.sender_email}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="glass rounded-xl p-5 relative overflow-hidden"
        >
          {/* Scanning beam over the email - signals "agents reading this now" */}
          <motion.div
            key={input.subject}
            className="absolute inset-x-0 h-px pointer-events-none z-10"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0, 217, 255, 0.6), transparent)",
              boxShadow: "0 0 12px rgba(0, 217, 255, 0.5)",
            }}
            initial={{ top: 0, opacity: 0 }}
            animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3.5, ease: "linear", repeat: 2, delay: 0.3 }}
          />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-accent-cyan" />
              <span className="text-[11px] uppercase tracking-wider text-ink-3 font-mono">
                Analyzing — Recruiter Communication
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-accent-cyan flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-accent-cyan animate-pulse" />
              live scan
            </span>
          </div>

          {/* Email header chips */}
          <div className="space-y-2 mb-4">
            {input.sender_email && (
              <HeaderRow
                icon={<User size={11} />}
                label="From"
                value={input.sender_email}
                suspicious={
                  /gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|\.xyz|\.top|\.work|\.click|\.info/i.test(
                    input.sender_email
                  )
                }
              />
            )}
            {input.claimed_company && (
              <HeaderRow
                icon={<Building2 size={11} />}
                label="Claims to be"
                value={input.claimed_company}
              />
            )}
            {input.subject && (
              <HeaderRow
                icon={<Mail size={11} />}
                label="Subject"
                value={input.subject}
                highlight
              />
            )}
            {input.claimed_role && (
              <HeaderRow
                icon={<Briefcase size={11} />}
                label="Role"
                value={`${input.claimed_role}${
                  input.claimed_salary ? " · " + input.claimed_salary : ""
                }`}
              />
            )}
          </div>

          {/* Email body */}
          {input.message_body && (
            <div className="border-t border-line-subtle pt-4">
              <div className="text-[10px] uppercase tracking-wider text-ink-3 font-mono mb-2">
                Message Body
              </div>
              <div className="text-[13px] text-ink-2 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto pr-1">
                {highlightText(input.message_body)}
              </div>
            </div>
          )}

          {/* URLs */}
          {input.urls && input.urls.length > 0 && (
            <div className="border-t border-line-subtle pt-4 mt-4">
              <div className="text-[10px] uppercase tracking-wider text-ink-3 font-mono mb-2">
                Detected URLs ({input.urls.length})
              </div>
              <div className="space-y-1.5">
                {input.urls.map((url, i) => {
                  const isSuspicious =
                    /\.xyz|\.top|\.work|\.click|\.info|bit\.ly|tinyurl|gooogle|micros0ft|amaz0n|\d+\.\d+\.\d+\.\d+/i.test(
                      url
                    );
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      className="flex items-start gap-2 text-[12px] font-mono"
                    >
                      <Link2
                        size={11}
                        className="shrink-0 mt-0.5"
                        style={{ color: isSuspicious ? "#FF4757" : "#5F6A85" }}
                      />
                      <span
                        className="break-all"
                        style={{
                          color: isSuspicious ? "#FF4757" : "#A5AFC8",
                          textShadow: isSuspicious ? "0 0 8px #FF475766" : undefined,
                        }}
                      >
                        {url}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HeaderRow({
  icon,
  label,
  value,
  suspicious,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suspicious?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 text-xs">
      <div className="flex items-center gap-1.5 w-24 shrink-0 text-ink-3 font-mono uppercase tracking-wider text-[10px] pt-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className="flex-1 min-w-0 break-all"
        style={{
          color: suspicious ? "#FF4757" : "#F0F4FF",
          textShadow: suspicious ? "0 0 8px #FF475744" : undefined,
        }}
      >
        {highlight ? highlightText(value) : value}
      </div>
    </div>
  );
}
