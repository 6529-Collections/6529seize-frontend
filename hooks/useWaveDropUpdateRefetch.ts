"use client";

import { useCallback } from "react";
import { isWsDropUpdateRefData, WsMessageType } from "@/helpers/Types";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";

export function useWaveDropUpdateRefetch({
  enabled,
  waveId,
  requestRefetch,
}: {
  readonly enabled: boolean;
  readonly waveId: string | null;
  readonly requestRefetch: () => void;
}) {
  useWebSocketMessage<unknown>(
    WsMessageType.DROP_UPDATE_REF,
    useCallback(
      (message) => {
        if (
          !enabled ||
          !isWsDropUpdateRefData(message) ||
          waveId !== message.wave_id
        ) {
          return;
        }

        requestRefetch();
      },
      [enabled, requestRefetch, waveId]
    )
  );
}
