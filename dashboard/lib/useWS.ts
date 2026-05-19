"use client";
import { useEffect, useRef } from "react";
import { useStore } from "./store";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export function useWS() {
  const setConnected = useStore((s) => s.setConnected);
  const handleEvent = useStore((s) => s.handleEvent);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let stopped = false;
    let retry = 0;

    function connect() {
      if (stopped) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        setConnected(true);
      };
      ws.onclose = () => {
        setConnected(false);
        retry = Math.min(retry + 1, 5);
        setTimeout(connect, 500 * retry);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (msg) => {
        try {
          const e = JSON.parse(msg.data);
          handleEvent(e);
          // Also dispatch as DOM event for components that subscribe directly
          // (e.g. LiveInterviewMonitor listens for meet_telemetry without storing it)
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("trusthire-event", { detail: e }));
          }
        } catch {}
      };
    }

    connect();
    return () => {
      stopped = true;
      wsRef.current?.close();
    };
  }, [setConnected, handleEvent]);
}