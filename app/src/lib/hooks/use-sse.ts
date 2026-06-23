"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PipelineEvent } from "../pipeline/types";

export function useSSE(url: string | null) {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [done, setDone] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  const start = useCallback(() => {
    if (!url) return;
    setEvents([]);
    setDone(false);

    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => setConnected(true);

    source.onmessage = (e) => {
      try {
        const event: PipelineEvent = JSON.parse(e.data);
        if (event.status === "completed" && event.phase === "done") {
          setDone(true);
          source.close();
          setConnected(false);
        }
        setEvents((prev) => [...prev, event]);
      } catch {
        // ignore unparseable
      }
    };

    source.onerror = () => {
      setConnected(false);
      source.close();
    };
  }, [url]);

  useEffect(() => {
    return () => {
      sourceRef.current?.close();
    };
  }, []);

  const latestByPhase = events.reduce(
    (acc, ev) => {
      acc[ev.phase] = ev;
      return acc;
    },
    {} as Record<string, PipelineEvent>
  );

  return { events, connected, done, start, latestByPhase };
}
