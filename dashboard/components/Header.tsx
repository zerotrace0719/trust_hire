"use client";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useStore } from "@/lib/store";

export function Header() {
  const connected = useStore((s) => s.connected);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-line-subtle relative">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 border border-accent-cyan/30 flex items-center justify-center">
            <Shield size={20} className="text-accent-cyan" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-xl border border-accent-cyan/40"
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
          />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-none text-gradient">
            TrustHire AI
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-3 mt-1">
            Zero-Trust Recruitment Intelligence
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connected ? "bg-accent-green animate-pulse" : "bg-accent-red"
            }`}
          />
          <span className="text-ink-2 uppercase tracking-wider">
            {connected ? "Connected" : "Offline"}
          </span>
        </div>
        <div className="text-[10px] font-mono text-ink-3 hidden sm:block">
          sys.v0.1 • realtime
        </div>
      </div>
    </header>
  );
}
