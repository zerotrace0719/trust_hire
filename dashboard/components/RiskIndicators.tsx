"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";

export function RiskIndicators() {
  const flagDetails = useStore((s) => s.flagDetails);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] uppercase tracking-wider text-ink-3 font-mono">
          Risk Indicators
        </span>
        <span className="text-[10px] text-ink-4 font-mono">{flagDetails.length}</span>
      </div>
      <AnimatePresence initial={false}>
        {flagDetails.length === 0 ? (
          <div className="text-xs text-ink-3 font-mono py-2">No flags raised.</div>
        ) : (
          flagDetails.map((f, i) => {
            const severity =
              f.penalty <= -30 ? "critical" : f.penalty <= -18 ? "high" : "medium";
            const color =
              severity === "critical"
                ? "#FF4757"
                : severity === "high"
                ? "#FF8C42"
                : "#FFB020";
            return (
              <motion.div
                key={f.flag}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between gap-2 p-2 rounded border border-line-subtle bg-bg-surface/40"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-1 h-1 rounded-full shrink-0"
                    style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                  <span className="text-xs text-ink-1 truncate">{f.label}</span>
                </div>
                <span
                  className="text-[10px] font-mono shrink-0 tabular-nums"
                  style={{ color }}
                >
                  {f.penalty}
                </span>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}
