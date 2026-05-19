"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, AlertTriangle, Ban } from "lucide-react";
import { useStore } from "@/lib/store";
import { verdictColor } from "@/lib/utils";

const ICONS: Record<string, any> = {
  SAFE: ShieldCheck,
  CAUTION: AlertTriangle,
  WARNING: ShieldAlert,
  BLOCK: Ban,
};

export function VerdictCard() {
  const fv = useStore((s) => s.finalVerdict);

  return (
    <AnimatePresence>
      {fv && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-xl overflow-hidden"
        >
          <VerdictContent fv={fv} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VerdictContent({ fv }: { fv: any }) {
  const c = verdictColor(fv.verdict);
  const Icon = ICONS[fv.verdict] || ShieldAlert;

  return (
    <div className="relative">
      {/* Top bar */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${c.hex}, transparent)` }}
      />

      <div className="p-5">
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0.6, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", damping: 14 }}
            className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center"
            style={{
              background: c.hex + "1A",
              border: `1px solid ${c.hex}55`,
              boxShadow: `0 0 32px ${c.hex}33`,
            }}
          >
            <Icon size={28} style={{ color: c.hex }} />
          </motion.div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[11px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded"
                style={{ background: c.hex + "1A", color: c.hex, border: `1px solid ${c.hex}33` }}
              >
                Final Verdict
              </span>
              <span
                className="text-[11px] font-mono uppercase tracking-[0.2em]"
                style={{ color: c.hex }}
              >
                {fv.verdict}
              </span>
            </div>
            <h2
              className="font-display text-2xl font-semibold leading-tight"
              style={{ color: c.hex }}
            >
              {fv.headline}
            </h2>
            <p className="text-ink-2 mt-2 leading-relaxed text-sm">{fv.summary}</p>
          </div>
        </div>

        {/* Top concerns */}
        {fv.top_concerns?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-5 pt-5 border-t border-line-subtle"
          >
            <div className="text-[11px] uppercase tracking-wider text-ink-3 font-mono mb-2">
              Top Concerns
            </div>
            <ul className="space-y-1.5">
              {fv.top_concerns.map((concern: string, i: number) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-start gap-2 text-sm text-ink-1"
                >
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: c.hex }}
                  />
                  <span>{concern}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Recommended actions */}
        {fv.what_to_do?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-5 pt-5 border-t border-line-subtle"
          >
            <div className="text-[11px] uppercase tracking-wider text-ink-3 font-mono mb-2">
              Recommended Actions
            </div>
            <ul className="space-y-1.5">
              {fv.what_to_do.map((action: string, i: number) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="flex items-start gap-2 text-sm text-ink-2"
                >
                  <span className="text-ink-3 font-mono shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{action}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
