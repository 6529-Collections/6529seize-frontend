"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { WsMessageType } from "@/helpers/Types";
import { useWebSocketMessage } from "./useWebSocketMessage";

/** Several follows in a row refetch the lists once. */
const WAVES_CHANGED_COALESCE_MS = 250;

interface WavesChangedData {
  readonly profile_id: string;
  readonly wave_ids: readonly string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * `WAVES_CHANGED` (WAVES-PLAN 1.3): `{ profile_id, wave_ids, reason }`. Every
 * reason, known or not, means the profile's wave lists changed.
 */
const asWavesChangedData = (value: unknown): WavesChangedData | null => {
  if (!isRecord(value)) return null;
  const profileId = value["profile_id"];
  const waveIds = value["wave_ids"];
  if (typeof profileId !== "string" || profileId.length === 0) return null;
  return {
    profile_id: profileId,
    wave_ids: Array.isArray(waveIds)
      ? waveIds.filter((id): id is string => typeof id === "string")
      : [],
  };
};

const getWaveQueryId = (queryKey: readonly unknown[]): string | null => {
  const params = queryKey[1];
  return isRecord(params) && typeof params["wave_id"] === "string"
    ? params["wave_id"]
    : null;
};

/**
 * The server says the active profile followed, unfollowed or was added to
 * waves, possibly on another device. Its wave lists and those waves refetch;
 * the frame carries no list content. Frames for other connected accounts are
 * ignored: their lists are not on screen.
 */
export function WavesChangedWebSocketSync() {
  const queryClient = useQueryClient();
  const { connectedAccounts } = useSeizeConnectContext();
  const activeProfileId =
    connectedAccounts.find((account) => account.isActive)?.profileId ?? null;
  const pendingWaveIdsRef = useRef(new Set<string>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
      pendingWaveIdsRef.current.clear();
    },
    []
  );

  useWebSocketMessage<unknown>(WsMessageType.WAVES_CHANGED, (value) => {
    const data = asWavesChangedData(value);
    if (data === null) return;
    if (data.profile_id !== activeProfileId) return;
    for (const waveId of data.wave_ids) pendingWaveIdsRef.current.add(waveId);
    timerRef.current ??= setTimeout(() => {
      timerRef.current = null;
      const waveIds = new Set(pendingWaveIdsRef.current);
      pendingWaveIdsRef.current.clear();
      for (const queryKey of [QueryKey.WAVES_V2, QueryKey.WAVES_OVERVIEW]) {
        queryClient.invalidateQueries({ queryKey: [queryKey] }).catch(() => {
          // A failed refetch keeps the current list until the next change.
        });
      }
      if (waveIds.size === 0) return;
      queryClient
        .invalidateQueries({
          queryKey: [QueryKey.WAVE],
          predicate: (query) => {
            const waveId = getWaveQueryId(query.queryKey);
            return waveId !== null && waveIds.has(waveId);
          },
        })
        .catch(() => {
          // As above: the wave keeps its current follow state.
        });
    }, WAVES_CHANGED_COALESCE_MS);
  });

  return null;
}
