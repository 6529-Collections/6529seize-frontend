"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DROP_DETAIL_STALE_TIME_MS } from "@/services/api/drop-api";
import { fetchDropMetadataByIdV2 } from "@/services/api/wave-drops-v2-api";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

export interface DropMetadataState {
  readonly status: "loading" | "error" | "ready";
  readonly retry: () => void;
}

/** Share complete metadata between drop details and resubmission; failures remain retryable. */
export function useDropDetailMetadata(
  drop: Pick<ExtendedDrop, "id" | "metadata"> | undefined,
  enabled = true
) {
  const dropId = drop?.id ?? "";
  const metadataQuery = useQuery({
    queryKey: [QueryKey.DROP, { drop_id: dropId, view: "metadata" }],
    queryFn: ({ signal }) =>
      fetchDropMetadataByIdV2({
        dropId,
        priorityMetadata: drop?.metadata,
        signal,
        throwOnError: true,
      }),
    enabled: enabled && dropId.trim().length > 0,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
  });
  const { data: metadata, refetch } = metadataQuery;
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);
  let status: DropMetadataState["status"] = "ready";
  if (drop && metadata === undefined) {
    status = metadataQuery.isError ? "error" : "loading";
  }
  const metadataState: DropMetadataState = { status, retry };
  return { metadata, metadataState };
}
