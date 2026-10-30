"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { WsMessageType, isWsDropUpdateRefData } from "@/helpers/Types";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";

export function useMemeCollaborationRealtime(
  dropId: string,
  profileId?: string
) {
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({
      queryKey: [QueryKey.DROP, "collaborations", dropId],
    });
  };
  const { isConnected } = useWebSocketMessage<unknown>(
    WsMessageType.IDENTITY_NOTIFICATIONS_CHANGED,
    (message) => {
      if (
        profileId &&
        typeof message === "object" &&
        message !== null &&
        "profile_id" in message &&
        message.profile_id === profileId
      )
        refresh();
    }
  );
  useWebSocketMessage<unknown>(WsMessageType.DROP_UPDATE, (drop) => {
    if (
      typeof drop === "object" &&
      drop !== null &&
      "id" in drop &&
      drop.id === dropId
    )
      refresh();
  });
  useWebSocketMessage<unknown>(WsMessageType.DROP_UPDATE_REF, (message) => {
    if (isWsDropUpdateRefData(message) && message.drop_id === dropId) refresh();
  });
  const wasConnected = useRef(isConnected);
  useEffect(() => {
    if (isConnected && !wasConnected.current) {
      void client.invalidateQueries({
        queryKey: [QueryKey.DROP, "collaborations", dropId],
      });
    }
    wasConnected.current = isConnected;
  }, [client, dropId, isConnected]);
}
