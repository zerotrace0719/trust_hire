"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { verdictColor } from "@/lib/utils";

const RADIUS = 140;
const STROKE = 14;
const CIRC = 2 * Math.PI * RADIUS;

export function TrustMeter() {
  const target = useStore((s) => s.targetScore);
  const verdict = useStore((s) => s.verdict);

  const motionScore = useMotionValue(100);
  const spring = useSpring(motionScore, { stiffness: 60, damping: 22, mass: 0.8 });
  const dashOffset = useTransform(spring, (v) => CIRC - (CIRC * v) / 100);
  const displayedScore = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    motionScore.set(target);
  }, [target, motionScore]);

  const colors = verdictColor(verdict);
  const stroke = verdict === "ANALYZING" ? "#00D9FF" : colors.hex;

  return (
    <div className="relative flex flex-col items-center">
      {/* Pulsing ring backdrops */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="absolute w-[320px] h-[320px] rounded-full border"
          style={{ borderColor: stroke + "33" }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[360px] h-[360px] rounded-full border"
          style={{ borderColor: stroke + "1A" }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.05, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </div>

      <svg width={320} height={320} className="relative">
        <defs>
          <linearGradient id="meter-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={stroke} stopOpacity="1" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.4" />
          </linearGradient>
          <filter id="meter-glow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tick marks around the circle */}
        <g>
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
            const x1 = 160 + Math.cos(angle) * 162;
            const y1 = 160 + Math.sin(angle) * 162;
            const x2 = 160 + Math.cos(angle) * (i % 5 === 0 ? 170 : 167);
            const y2 = 160 + Math.sin(angle) * (i % 5 === 0 ? 170 : 167);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 5 === 0 ? stroke : "#38425F"}
                strokeOpacity={i % 5 === 0 ? 0.5 : 0.25}
                strokeWidth={i % 5 === 0 ? 1.5 : 1}
              />
            );
          })}
        </g>

        {/* Background ring */}
        <circle
          cx={160}
          cy={160}
          r={RADIUS}
          fill="none"
          stroke="#1A2138"
          strokeWidth={STROKE}
        />
        {/* Progress ring */}
        <motion.circle
          cx={160}
          cy={160}
          r={RADIUS}
          fill="none"
          stroke="url(#meter-grad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          style={{ strokeDashoffset: dashOffset }}
          transform="rotate(-90 160 160)"
          filter="url(#meter-glow)"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-3 font-mono mb-1">
          Trust Score
        </div>
        <motion.div
          className="font-display font-bold text-7xl tabular-nums"
          style={{ color: stroke, textShadow: `0 0 32px ${stroke}55` }}
        >
          <motion.span>{displayedScore}</motion.span>
        </motion.div>
        <div
          className="mt-2 text-sm font-mono font-semibold tracking-[0.25em]"
          style={{ color: stroke }}
        >
          {verdict}
        </div>
      </div>
    </div>
  );
}
