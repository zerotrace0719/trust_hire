"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, MessageSquare, ShieldAlert, Activity,
  AudioWaveform, Brain, Loader2, CheckCircle2,
} from "lucide-react";
import { useStore, type AgentInfo } from "@/lib/store";

const ICONS: Record<string, any> = {
  identity: ShieldCheck,
  nlp: MessageSquare,
  cyber: ShieldAlert,
  behavior: Activity,
  deepfake: AudioWaveform,
  decision: Brain,
};

const NAMES: Record<string, string> = {
  identity: "Identity Verification",
  nlp: "NLP Scam Detection",
  cyber: "Cybersecurity",
  behavior: "Behavioral Analysis",
  deepfake: "Voice / Deepfake Risk",
  decision: "Risk Decision",
};

const COLORS: Record<string, string> = {
  identity: "#00D9FF",
  nlp: "#FFB020",
  cyber: "#FF4757",
  behavior: "#A78BFA",
  deepfake: "#F472B6",
  decision: "#00E676",
};

export function AgentGrid() {
  const agents = useStore((s) => s.agents);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {Object.keys(NAMES).map((key) => (
        <AgentCard key={key} agentKey={key} agent={agents[key]} />
      ))}
    </div>
  );
}

function AgentCard({ agentKey, agent }: { agentKey: string; agent: AgentInfo }) {
  const Icon = ICONS[agentKey];
  const color = COLORS[agentKey];
  const state = agent?.state || "idle";
  const flagCount = agent?.flags?.length || 0;

  const isActive = state !== "idle";
  const isDone = state === "verdict";
  const hasFlags = isDone && flagCount > 0;

  return (
    <motion.div
      layout
      className="glass rounded-lg p-3 relative overflow-hidden"
      animate={{
        borderColor: isActive ? color + "55" : "rgba(255,255,255,0.06)",
        boxShadow: hasFlags
          ? `0 0 24px ${color}33, inset 0 0 0 1px ${color}44`
          : isActive
          ? `0 0 16px ${color}22`
          : "none",
      }}
      transition={{ duration: 0.4 }}
    >
      {/* Activation pulse */}
      <AnimatePresence>
        {state === "activated" && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${color}22 0%, transparent 70%)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* Thinking sweep - much more visible now */}
      {state === "thinking" && (
        <>
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: `linear-gradient(135deg, ${color}11, transparent, ${color}11)` }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-y-0 w-1 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
              boxShadow: `0 0 16px ${color}`,
              filter: "blur(0.5px)",
            }}
            animate={{ left: ["-4px", "calc(100% + 4px)"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
        </>
      )}

      <div className="flex items-start justify-between relative">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center relative"
            style={{
              background: isActive ? color + "1A" : "#11172A",
              border: `1px solid ${isActive ? color + "55" : "#252D45"}`,
            }}
          >
            <Icon size={16} style={{ color: isActive ? color : "#5F6A85" }} />
            {state === "thinking" && (
              <div
                className="absolute -inset-1 rounded-lg animate-pulse-ring"
                style={{ border: `1px solid ${color}55` }}
              />
            )}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-3 font-mono">
              Agent
            </div>
            <div className="text-sm font-medium text-ink-1">{NAMES[agentKey]}</div>
          </div>
        </div>

        <StateBadge state={state} color={color} flagCount={flagCount} />
      </div>

      {/* Reasoning preview when verdict is in */}
      <AnimatePresence>
        {isDone && agent.reasoning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 pt-3 border-t border-line-subtle"
          >
            <div className="text-[11px] text-ink-2 leading-relaxed line-clamp-3">
              {agent.reasoning}
            </div>
            {flagCount > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {agent.flags.slice(0, 3).map((f) => (
                  <span
                    key={f}
                    className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                    style={{ background: color + "1A", color, border: `1px solid ${color}33` }}
                  >
                    {f.replace(/_/g, " ")}
                  </span>
                ))}
                {flagCount > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-ink-3">
                    +{flagCount - 3} more
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StateBadge({
  state,
  color,
  flagCount,
}: {
  state: string;
  color: string;
  flagCount: number;
}) {
  if (state === "idle") {
    return (
      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-4 border border-line-subtle rounded px-1.5 py-0.5">
        Standby
      </span>
    );
  }
  if (state === "activated") {
    return (
      <span
        className="text-[10px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5"
        style={{ color, border: `1px solid ${color}55`, background: color + "15" }}
      >
        Active
      </span>
    );
  }
  if (state === "thinking") {
    return (
      <span
        className="text-[10px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5 flex items-center gap-1"
        style={{ color, border: `1px solid ${color}55`, background: color + "15" }}
      >
        <Loader2 size={10} className="animate-spin" />
        Analyzing
      </span>
    );
  }
  // verdict
  return (
    <span
      className="text-[10px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5 flex items-center gap-1"
      style={{ color, border: `1px solid ${color}55`, background: color + "15" }}
    >
      <CheckCircle2 size={10} />
      {flagCount > 0 ? `${flagCount} flag${flagCount > 1 ? "s" : ""}` : "Clear"}
    </span>
  );
}