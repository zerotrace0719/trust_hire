"use client";
import { useWS } from "@/lib/useWS";
import { Header } from "@/components/Header";
import { TrustMeter } from "@/components/TrustMeter";
import { AgentGrid } from "@/components/AgentGrid";
import { AlertFeed } from "@/components/AlertFeed";
import { ReasoningConsole } from "@/components/ReasoningConsole";
import { VerdictCard } from "@/components/VerdictCard";
import { DemoPanel } from "@/components/DemoPanel";
import { RiskIndicators } from "@/components/RiskIndicators";
import { InputPreview } from "@/components/InputPreview";

export default function Page() {
  useWS();

  return (
    <main className="min-h-screen relative">
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid opacity-[0.35] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-base pointer-events-none" />

      <div className="relative z-10">
        <Header />

        <div className="px-6 py-6 grid grid-cols-12 gap-6 max-w-[1600px] mx-auto">
          {/* Left rail */}
          <aside className="col-span-12 lg:col-span-3 space-y-4">
            <section className="glass rounded-xl p-4">
              <DemoPanel />
            </section>
            <section className="glass rounded-xl p-4">
              <RiskIndicators />
            </section>
          </aside>

          {/* Center stage */}
          <section className="col-span-12 lg:col-span-6 space-y-5">
            {/* Top row: trust meter + agent grid side-by-side */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
              {/* Trust meter - compact */}
              <div className="xl:col-span-2 glass rounded-xl p-4 flex flex-col items-center scan-overlay relative overflow-hidden">
                <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em] text-ink-3 font-mono">
                  primary scan
                </div>
                <div className="absolute top-3 right-4 text-[10px] uppercase tracking-[0.2em] text-ink-3 font-mono flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-accent-cyan animate-pulse" />
                  live
                </div>
                <div className="mt-6 scale-[0.78] origin-center">
                  <TrustMeter />
                </div>
              </div>

              {/* Agent grid - takes more space, always visible */}
              <div className="xl:col-span-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] uppercase tracking-wider text-ink-3 font-mono">
                    Multi-Agent Intelligence Layer
                  </span>
                  <span className="text-[10px] font-mono text-ink-4">6 agents</span>
                </div>
                <AgentGrid />
              </div>
            </div>

            <VerdictCard />

            <InputPreview />

            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-3 font-mono mb-2 px-1">
                Agent Reasoning Stream
              </div>
              <ReasoningConsole />
            </div>
          </section>

          {/* Right rail */}
          <aside className="col-span-12 lg:col-span-3">
            <section className="glass rounded-xl p-4 sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider text-ink-3 font-mono">
                  Live Alerts
                </span>
                <span className="text-[10px] font-mono text-accent-cyan flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-accent-cyan animate-pulse" />
                  streaming
                </span>
              </div>
              <AlertFeed />
            </section>
          </aside>
        </div>

        <footer className="border-t border-line-subtle px-6 py-4 text-center">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-3">
            TrustHire AI · FastAPI · Multi-Agent AI · Next.js · Real-time WebSockets
          </div>
        </footer>
      </div>
    </main>
  );
}