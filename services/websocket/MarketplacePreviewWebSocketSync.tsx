"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  matchesMarketplacePreviewCanonicalId,
  patchFromMediaLinkUpdate,
  type MarketplacePreviewData,
} from "@/components/waves/marketplace/common";
import type { WsMediaLinkUpdatedData } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import { useWebSocketMessage } from "./useWebSocketMessage";

const isMediaLinkUpdatedData = (
  value: unknown
): value is WsMediaLinkUpdatedData => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return (
    "canonical_id" in value &&
    typeof (value as { canonical_id?: unknown }).canonical_id === "string"
  );
};

export function MarketplacePreviewWebSocketSync() {
  const queryClient = useQueryClient();

  const onMediaLinkUpdated = useCallback(
    (message: unknown) => {
      if (!isMediaLinkUpdatedData(message)) {
        return;
      }

      queryClient.setQueriesData<MarketplacePreviewData>(
        { queryKey: [QueryKey.MARKETPLACE_PREVIEW] },
        (current) => {
          if (!current) {
            return current;
          }

          if (
            !matchesMarketplacePreviewCanonicalId({
              previewCanonicalId: current.canonicalId,
              incomingCanonicalId: message.canonical_id,
            })
          ) {
            return current;
          }

          return patchFromMediaLinkUpdate({
            current,
            update: message,
          });
        }
      );
    },
    [queryClient]
  );

  useWebSocketMessage<unknown>(
    WsMessageType.MEDIA_LINK_UPDATED,
    onMediaLinkUpdated
  );

  return null;
}
