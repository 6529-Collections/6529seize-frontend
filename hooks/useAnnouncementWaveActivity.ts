"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWaveDropsFeedV2 } from "@/generated/models/ApiWaveDropsFeedV2";
import type { WsDropUpdateMessage } from "@/helpers/Types";
import { isWsDropUpdateRefData, WsMessageType } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import {
  useWebSocketMessage,
  useWebsocketStatus,
} from "@/services/websocket/useWebSocketMessage";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { SidebarWave } from "@/types/waves.types";

// A connected socket reports each new top-level announcement (the frames
// below), so the feed is re-read only then. Without one (signed out, or
// reconnecting) the row falls back to a slow poll, which React Query runs
// only while the tab is visible.
const ANNOUNCEMENT_FALLBACK_POLL_MS = 5 * 60 * 1000;

// Wave metrics include replies. The main feed excludes collapsed replies and
// supplies the correct timestamp even after a reload or deletion.
function useAnnouncementWaveTimestamp({
  waveId,
  enabled,
  viewerIdentityKey,
}: {
  readonly waveId: string | null;
  readonly enabled: boolean;
  readonly viewerIdentityKey: string | null;
}): number | null {
  const queryClient = useQueryClient();
  const isSocketConnected = useWebsocketStatus() === WebSocketStatus.CONNECTED;
  const queryKey = useMemo(
    () => [QueryKey.ANNOUNCEMENT_LATEST_DROP, { waveId, viewerIdentityKey }],
    [waveId, viewerIdentityKey]
  );
  const { data } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!waveId)
        throw new Error("Cannot fetch an announcement without a wave id");
      const feed = await commonApiFetch<ApiWaveDropsFeedV2>({
        endpoint: `v2/waves/${encodeURIComponent(waveId)}/drops`,
        params: { limit: "1" },
        signal,
      });
      return feed.drops[0]?.created_at ?? null;
    },
    enabled: enabled && waveId !== null,
    staleTime: ANNOUNCEMENT_FALLBACK_POLL_MS,
    refetchInterval: isSocketConnected ? false : ANNOUNCEMENT_FALLBACK_POLL_MS,
    refetchIntervalInBackground: false,
  });
  const refresh = useCallback(() => {
    if (enabled && waveId) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }, [enabled, waveId, queryClient, queryKey]);

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    (drop) => {
      if (drop.wave.id === waveId && !drop.reply_to) refresh();
    }
  );
  useWebSocketMessage<unknown>(WsMessageType.DROP_UPDATE_REF, (message) => {
    if (
      isWsDropUpdateRefData(message) &&
      message.wave_id === waveId &&
      message.update_type === WsMessageType.DROP_UPDATE
    ) {
      refresh();
    }
  });
  useWebSocketMessage<{ readonly wave_id: string }>(
    WsMessageType.DROP_DELETE,
    (message) => {
      if (message.wave_id === waveId) refresh();
    }
  );
  return data ?? null;
}

export function useAnnouncementWaveActivity(
  wave: SidebarWave | null,
  viewerIdentityKey: string | null
): SidebarWave | null {
  const timestamp = useAnnouncementWaveTimestamp({
    waveId: wave?.id ?? null,
    enabled: wave?.repliesCollapsed === true,
    viewerIdentityKey,
  });
  return useMemo(
    () =>
      wave?.repliesCollapsed
        ? { ...wave, latestTopLevelDropTimestamp: timestamp }
        : wave,
    [wave, timestamp]
  );
}
