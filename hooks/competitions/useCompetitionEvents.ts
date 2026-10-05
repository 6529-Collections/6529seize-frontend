"use client";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/services/websocket/useWebSocket";
import { WsMessageType } from "@/helpers/Types";
import { invalidateCompetitionWave } from "@/services/api/competitions-api";

function parseCompetitionEvent(
  value: unknown
): { event_id: string; wave_id: string; competition_id: string } | null {
  if (value === null || typeof value !== "object") return null;
  const event = value as Record<string, unknown>;
  if (
    event["event_version"] !== 1 ||
    typeof event["event_id"] !== "string" ||
    typeof event["wave_id"] !== "string" ||
    typeof event["competition_id"] !== "string"
  )
    return null;
  return {
    event_id: event["event_id"],
    wave_id: event["wave_id"],
    competition_id: event["competition_id"],
  };
}

export function useCompetitionEvents(waveId: string, enabled = true) {
  const { subscribe } = useWebSocket();
  const client = useQueryClient();
  const seen = useRef(new Set<string>());
  useEffect(() => {
    if (!enabled) return;
    let refresh: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribe(
      WsMessageType.COMPETITION_UPDATE,
      (data: unknown) => {
        const event = parseCompetitionEvent(data);
        if (event?.wave_id !== waveId || seen.current.has(event.event_id))
          return;
        seen.current.add(event.event_id);
        if (seen.current.size > 500)
          seen.current.delete(seen.current.values().next().value!);
        // The decision loop sends a burst for every competition in the wave.
        // Refresh each active query once per batch, not once per event.
        refresh ??= setTimeout(() => {
          refresh = undefined;
          void invalidateCompetitionWave(client, waveId);
        }, 1_000);
      }
    );
    return () => {
      unsubscribe();
      if (refresh !== undefined) clearTimeout(refresh);
    };
  }, [client, subscribe, waveId, enabled]);
}
