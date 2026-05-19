"use client";
import { create } from "zustand";

export type AgentState = "idle" | "activated" | "thinking" | "verdict";

export interface AgentMeta {
  name: string;
  icon: string;
  color: string;
}

export interface AgentInfo {
  key: string;
  state: AgentState;
  meta?: AgentMeta;
  flags: string[];
  reasoning: string;
  confidence: number;
  lastUpdate: number;
}

export interface AlertItem {
  id: string;
  ts: number;
  level: "info" | "warning" | "critical" | "safe";
  title: string;
  detail?: string;
  source?: string;
}

export interface ReasoningLine {
  id: string;
  ts: number;
  agent: string;
  agentColor: string;
  text: string;
}

export interface FinalVerdict {
  event_id: string;
  score: number;
  verdict: string;
  verdict_color: string;
  headline: string;
  summary: string;
  top_concerns: string[];
  what_to_do: string[];
  triggered_flags: string[];
}

export interface InputPreviewData {
  sender_email?: string;
  claimed_company?: string;
  subject?: string;
  message_body?: string;
  urls?: string[];
  claimed_role?: string;
  claimed_salary?: string;
}

interface StoreState {
  connected: boolean;
  score: number;
  targetScore: number;       // animates toward this
  verdict: string;
  verdictColor: string;
  agents: Record<string, AgentInfo>;
  alerts: AlertItem[];
  reasoning: ReasoningLine[];
  finalVerdict: FinalVerdict | null;
  currentEventId: string | null;
  flagDetails: Array<{ flag: string; label: string; penalty: number }>;
  inputPreview: InputPreviewData | null;

  setConnected: (b: boolean) => void;
  handleEvent: (e: any) => void;
  reset: () => void;
}

const AGENT_KEYS = ["identity", "nlp", "cyber", "behavior", "deepfake", "decision"];

const initialAgents = (): Record<string, AgentInfo> =>
  Object.fromEntries(
    AGENT_KEYS.map((k) => [
      k,
      { key: k, state: "idle" as AgentState, flags: [], reasoning: "", confidence: 0, lastUpdate: 0 },
    ])
  );

export const useStore = create<StoreState>((set, get) => ({
  connected: false,
  score: 100,
  targetScore: 100,
  verdict: "SAFE",
  verdictColor: "green",
  agents: initialAgents(),
  alerts: [],
  reasoning: [],
  finalVerdict: null,
  currentEventId: null,
  flagDetails: [],
  inputPreview: null,

  setConnected: (b) => set({ connected: b }),

  reset: () =>
    set({
      score: 100,
      targetScore: 100,
      verdict: "SAFE",
      verdictColor: "green",
      agents: initialAgents(),
      finalVerdict: null,
      flagDetails: [],
    }),

  handleEvent: (e) => {
    const state = get();
    const t = e.ts || Date.now() / 1000;

    switch (e.type) {
      case "ws_hello":
        // noop
        return;

      case "analysis_started":
        set({
          currentEventId: e.event_id,
          agents: initialAgents(),
          finalVerdict: null,
          targetScore: 100,
          score: 100,
          verdict: "ANALYZING",
          verdictColor: "cyan",
          flagDetails: [],
          inputPreview: e.input_preview || null,
          alerts: [
            {
              id: `${e.event_id}-start`,
              ts: t,
              level: "info",
              title: "New analysis started",
              detail: `Source: ${e.source}`,
              source: e.source,
            },
            ...state.alerts,
          ].slice(0, 50),
        });
        return;

      case "agent_activated":
        set({
          agents: {
            ...state.agents,
            [e.agent]: {
              ...state.agents[e.agent],
              state: "activated",
              meta: e.meta,
              lastUpdate: t,
            },
          },
        });
        return;

      case "agent_thinking":
        set({
          agents: {
            ...state.agents,
            [e.agent]: {
              ...state.agents[e.agent],
              state: "thinking",
              lastUpdate: t,
            },
          },
        });
        return;

      case "agent_verdict": {
        const meta = state.agents[e.agent]?.meta;
        const color = meta?.color || "#A5AFC8";
        const newReasoning: ReasoningLine[] = e.reasoning
          ? [
              {
                id: `${e.event_id}-${e.agent}-${t}`,
                ts: t,
                agent: meta?.name || e.agent,
                agentColor: color,
                text: e.reasoning,
              },
              ...state.reasoning,
            ].slice(0, 30)
          : state.reasoning;

        // Alerts for flagged agents
        const newAlerts: AlertItem[] = (e.flags || []).map((f: string) => ({
          id: `${e.event_id}-${e.agent}-${f}`,
          ts: t,
          level: "warning" as const,
          title: f.replace(/_/g, " "),
          detail: e.reasoning,
          source: meta?.name || e.agent,
        }));

        set({
          agents: {
            ...state.agents,
            [e.agent]: {
              ...state.agents[e.agent],
              state: "verdict",
              flags: e.flags || [],
              reasoning: e.reasoning || "",
              confidence: e.confidence || 0,
              lastUpdate: t,
            },
          },
          reasoning: newReasoning,
          alerts: [...newAlerts, ...state.alerts].slice(0, 50),
        });
        return;
      }

      case "score_updated":
        set({
          targetScore: e.score,
          verdict: e.verdict,
          verdictColor: e.verdict_color,
          flagDetails: e.flag_details || [],
        });
        return;

      case "final_verdict":
        set({
          finalVerdict: {
            event_id: e.event_id,
            score: e.score,
            verdict: e.verdict,
            verdict_color: e.verdict_color,
            headline: e.headline,
            summary: e.summary,
            top_concerns: e.top_concerns || [],
            what_to_do: e.what_to_do || [],
            triggered_flags: e.triggered_flags || [],
          },
          targetScore: e.score,
          verdict: e.verdict,
          verdictColor: e.verdict_color,
          alerts: [
            {
              id: `${e.event_id}-final`,
              ts: t,
              level:
                e.verdict === "BLOCK"
                  ? "critical"
                  : e.verdict === "WARNING"
                  ? "warning"
                  : e.verdict === "SAFE"
                  ? "safe"
                  : "info",
              title: e.headline || `Verdict: ${e.verdict}`,
              detail: e.summary,
            },
            ...state.alerts,
          ].slice(0, 50),
        });
        return;
    }
  },
}));
