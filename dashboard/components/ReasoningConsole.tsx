"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";

export function ReasoningConsole() {
  const lines = useStore((s) => s.reasoning);

  return (
    <div className="bg-black/30 border border-line-subtle rounded-lg p-4 mono-console max-h-[280px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-line-subtle">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-red/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent-amber/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent-green/70" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-ink-3 ml-2">
          agent_reasoning_stream
        </span>
      </div>

      {lines.length === 0 ? (
        <div className="text-ink-3 text-xs">
          <span className="text-accent-cyan">$</span> waiting for input...
          <span className="inline-block w-2 h-3 bg-accent-cyan ml-1 animate-pulse" />
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-2"
            >
              <span className="text-ink-3">[{formatTime(l.ts)}]</span>{" "}
              <span style={{ color: l.agentColor }}>{l.agent}</span>
              <span className="text-ink-3"> :: </span>
              <span className="text-ink-1">{l.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
