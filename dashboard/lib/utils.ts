import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString("en-US", { hour12: false });
}

export function verdictColor(verdict: string) {
  switch (verdict) {
    case "SAFE": return { text: "text-verdict-safe", bg: "bg-verdict-safe", glow: "glow-green", hex: "#00E676" };
    case "CAUTION": return { text: "text-verdict-caution", bg: "bg-verdict-caution", glow: "glow-amber", hex: "#FFB020" };
    case "WARNING": return { text: "text-verdict-warning", bg: "bg-verdict-warning", glow: "glow-amber", hex: "#FF8C42" };
    case "BLOCK": return { text: "text-verdict-block", bg: "bg-verdict-block", glow: "glow-red", hex: "#FF4757" };
    default: return { text: "text-ink-2", bg: "bg-line", glow: "", hex: "#5F6A85" };
  }
}
