"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Users, Circle, AudioWaveform, ShieldAlert,
  Clock, Globe, AlertTriangle, X,
} from "lucide-react";
import { useStore } from "@/lib/store";

interface MeetTelemetry {
  session_id: string;
  meeting_url: string;
  meeting_code: string;
  participant_count: number;
  duration_seconds: number;
  organizer_email: string;
  organizer_domain: string;
  is_recording: boolean;
  audio_level: number;
  is_speaking: boolean;
  risk_indicators: string[];
  ts: number;
}

export function LiveInterviewMonitor() {
  const [telemetry, setTelemetry] = useState<MeetTelemetry | null>(null);
  const [audioHistory, setAudioHistory] = useState<number[]>([]);
  const [show, setShow] = useState(false);
  const [dismissedAt, setDismissedAt] = useState(0);
  const lastTsRef = useRef(0);

  // Subscribe to WebSocket events via the store's handleEvent
  useEffect(() => {
    function handler(e: any) {
      if (e?.detail?.type === "meet_telemetry") {
        const t = e.detail as MeetTelemetry;
        setTelemetry(t);
        lastTsRef.current = Date.now();
        // If we just dismissed (<3s ago), don't pop back up
        if (Date.now() - dismissedAt < 3000) return;
        setShow(true);
        setAudioHistory((prev) => {
          const next = [...prev, t.audio_level];
          return next.slice(-40); // keep last 40 samples
        });
      }
    }
    window.addEventListener("trusthire-event", handler);
    return () => window.removeEventListener("trusthire-event", handler);
  }, [dismissedAt]);

  // Auto-hide if no telemetry for 5 seconds (meeting ended)
  useEffect(() => {
    if (!show) return;
    const iv = setInterval(() => {
      if (Date.now() - lastTsRef.current > 5000) {
        setShow(false);
        setTelemetry(null);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [show]);

  if (!show || !telemetry) return null;

  const riskLevel =
    telemetry.risk_indicators.length >= 2 ? "high" :
    telemetry.risk_indicators.length === 1 ? "medium" : "low";

  const riskColor =
    riskLevel === "high" ? "#FF4757" :
    riskLevel === "medium" ? "#FFB020" : "#00E676";

  const mins = Math.floor(telemetry.duration_seconds / 60);
  const secs = telemetry.duration_seconds % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-50 w-[400px] glass rounded-2xl overflow-hidden"
          style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${riskColor}22` }}
        >
          {/* Top strip with risk color */}
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, transparent, ${riskColor}, transparent)` }}
          />

          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <motion.div
                  className="w-9 h-9 rounded-lg flex items-center justify-center relative"
                  style={{
                    background: riskColor + "15",
                    border: `1px solid ${riskColor}44`,
                  }}
                  animate={{
                    boxShadow: [
                      `0 0 0 0 ${riskColor}44`,
                      `0 0 0 8px ${riskColor}00`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Video size={16} style={{ color: riskColor }} />
                </motion.div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-ink-3 font-mono leading-none">
                    Live Interview Monitor
                  </div>
                  <div className="text-sm font-semibold text-ink-1 font-display mt-1">
                    Meeting in progress
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShow(false);
                  setDismissedAt(Date.now());
                }}
                className="text-ink-3 hover:text-ink-1 p-1"
              >
                <X size={14} />
              </button>
            </div>

            {/* Risk level banner */}
            <div
              className="rounded-lg p-2.5 mb-4 flex items-center gap-2"
              style={{
                background: riskColor + "10",
                border: `1px solid ${riskColor}33`,
              }}
            >
              <ShieldAlert size={14} style={{ color: riskColor }} />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-wider font-mono" style={{ color: riskColor }}>
                  Risk Level
                </div>
                <div className="text-sm font-semibold capitalize" style={{ color: riskColor }}>
                  {riskLevel}
                  {telemetry.risk_indicators.length > 0 && (
                    <span className="text-ink-3 text-xs font-normal ml-2">
                      · {telemetry.risk_indicators.length} indicator{telemetry.risk_indicators.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              {telemetry.is_recording && (
                <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-accent-red">
                  <Circle size={6} fill="currentColor" />
                  REC
                </div>
              )}
            </div>

            {/* Audio waveform */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px] uppercase tracking-wider text-ink-3 font-mono flex items-center gap-1.5">
                  <AudioWaveform size={11} />
                  Audio Stream
                </div>
                {telemetry.is_speaking && (
                  <div className="text-[10px] font-mono text-accent-cyan flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-accent-cyan animate-pulse" />
                    speaking
                  </div>
                )}
              </div>
              <div className="h-12 flex items-end gap-[2px] bg-black/30 rounded-md p-2 border border-line-subtle">
                {Array.from({ length: 40 }).map((_, i) => {
                  const level = audioHistory[i] || 0;
                  const height = Math.max(2, level * 100);
                  return (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        background: `linear-gradient(180deg, ${riskColor}, ${riskColor}55)`,
                        boxShadow: `0 0 4px ${riskColor}66`,
                      }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Stat icon={<Clock size={11} />} label="Duration" value={timeStr} mono />
              <Stat icon={<Users size={11} />} label="Participants" value={String(telemetry.participant_count || 1)} mono />
              <Stat icon={<Globe size={11} />} label="Domain" value={telemetry.organizer_domain || "—"} suspicious={telemetry.risk_indicators.includes("typo_squatted_domain")} />
            </div>

            {/* Risk indicators */}
            {telemetry.risk_indicators.length > 0 && (
              <div className="border-t border-line-subtle pt-3">
                <div className="text-[10px] uppercase tracking-wider text-ink-3 font-mono mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={11} style={{ color: riskColor }} />
                  Active Risk Indicators
                </div>
                <div className="space-y-1">
                  {telemetry.risk_indicators.map((r) => (
                    <div
                      key={r}
                      className="text-xs px-2 py-1 rounded font-mono"
                      style={{
                        background: riskColor + "10",
                        color: riskColor,
                        border: `1px solid ${riskColor}33`,
                      }}
                    >
                      {r.replace(/_/g, " ")}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({
  icon, label, value, mono, suspicious,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  suspicious?: boolean;
}) {
  return (
    <div
      className="bg-black/20 rounded p-2 border"
      style={{
        borderColor: suspicious ? "rgba(255,71,87,0.3)" : "rgba(255,255,255,0.05)",
      }}
    >
      <div className="text-[9px] uppercase tracking-wider text-ink-3 font-mono flex items-center gap-1 mb-1">
        {icon}
        {label}
      </div>
      <div
        className={`text-xs font-semibold truncate ${mono ? "font-mono" : ""}`}
        style={{ color: suspicious ? "#FF4757" : "#F0F4FF" }}
      >
        {value}
      </div>
    </div>
  );
}