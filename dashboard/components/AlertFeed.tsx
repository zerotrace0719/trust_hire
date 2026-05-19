"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, Info, AlertOctagon } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertOctagon,
  safe: ShieldCheck,
};

const COLORS = {
  info: { fg: "#00D9FF", bg: "rgba(0, 217, 255, 0.08)", border: "rgba(0, 217, 255, 0.25)" },
  warning: { fg: "#FFB020", bg: "rgba(255, 176, 32, 0.08)", border: "rgba(255, 176, 32, 0.25)" },
  critical: { fg: "#FF4757", bg: "rgba(255, 71, 87, 0.1)", border: "rgba(255, 71, 87, 0.3)" },
  safe: { fg: "#00E676", bg: "rgba(0, 230, 118, 0.08)", border: "rgba(0, 230, 118, 0.25)" },
};

export function AlertFeed() {
  const alerts = useStore((s) => s.alerts);

  return (
    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-ink-3 text-sm font-mono">
            No alerts. System nominal.
          </div>
        ) : (
          alerts.map((a) => {
            const Icon = ICONS[a.level];
            const c = COLORS[a.level];
            return (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, x: 20, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="rounded-lg p-3 flex gap-3"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div
                  className="w-7 h-7 rounded shrink-0 flex items-center justify-center"
                  style={{ background: c.fg + "1A", border: `1px solid ${c.fg}33` }}
                >
                  <Icon size={14} style={{ color: c.fg }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="text-sm font-medium capitalize truncate"
                      style={{ color: c.fg }}
                    >
                      {a.title}
                    </div>
                    <div className="text-[10px] font-mono text-ink-3 shrink-0">
                      {formatTime(a.ts)}
                    </div>
                  </div>
                  {a.detail && (
                    <div className="text-xs text-ink-2 mt-0.5 line-clamp-2 leading-relaxed">
                      {a.detail}
                    </div>
                  )}
                  {a.source && (
                    <div className="text-[10px] font-mono text-ink-3 mt-1">
                      via {a.source}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}
