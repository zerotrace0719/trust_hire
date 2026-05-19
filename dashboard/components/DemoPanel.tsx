"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Loader2 } from "lucide-react";
import { CustomEmailTester } from "./CustomEmailTester";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Scenario {
  id: string;
  label: string;
  category: string;
  expected_score_range: [number, number];
}

const CATEGORY_COLOR: Record<string, string> = {
  phishing: "#FF4757",
  cyber: "#FFB020",
  legitimate: "#00E676",
  caution: "#FFB020",
  other: "#A5AFC8",
};

export function DemoPanel() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/scenarios`)
      .then((r) => r.json())
      .then((d) => setScenarios(d.scenarios || []))
      .catch(() => {});
  }, []);

  async function run(id: string) {
    setRunning(id);
    try {
      await fetch(`${API_URL}/api/simulate/${id}`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setRunning(null), 4000);
  }

  return (
    <div className="space-y-3">
      {/* Custom email tester - prominent at the top */}
      <CustomEmailTester />

      <div className="h-px bg-line-subtle" />

      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] uppercase tracking-wider text-ink-3 font-mono">
            Or try a Scenario
          </span>
          <span className="text-[10px] text-ink-4 font-mono">{scenarios.length}</span>
        </div>
        {scenarios.length === 0 && (
          <div className="text-xs text-ink-3 font-mono py-2">
            Backend unreachable. Start it: <span className="text-accent-cyan">cd backend && uvicorn main:app</span>
          </div>
        )}
        {scenarios.map((s) => {
          const color = CATEGORY_COLOR[s.category] || "#A5AFC8";
          const isRunning = running === s.id;
          return (
            <motion.button
              key={s.id}
              onClick={() => run(s.id)}
              disabled={isRunning}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg border border-line-subtle hover:border-accent-cyan/30 bg-bg-surface/40 transition disabled:opacity-60"
            >
              <div
                className="w-7 h-7 rounded shrink-0 flex items-center justify-center"
                style={{ background: color + "1A", border: `1px solid ${color}33` }}
              >
                {isRunning ? (
                  <Loader2 size={12} className="animate-spin" style={{ color }} />
                ) : (
                  <Play size={12} style={{ color }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-ink-1 truncate">{s.label}</div>
                <div className="text-[10px] font-mono text-ink-3 capitalize">
                  {s.category} • expect {s.expected_score_range[0]}–{s.expected_score_range[1]}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
