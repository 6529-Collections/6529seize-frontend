"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { sanitizeErrorForUser } from "@/utils/error-sanitizer";
import type { ProcessedContent } from "./media-utils";
import { buildProcessedContent } from "./media-utils";
import {
  DROP_DETAIL_STALE_TIME_MS,
  fetchDropByIdBatched,
  getDropQueryKey,
} from "@/services/api/drop-api";

interface UseDropContentResult {
  drop: ApiDrop | null;
  content: ProcessedContent;
  isLoading: boolean;
  error: unknown;
}

/**
 * Custom hook to fetch and process drop content
 */
export const useDropContent = (
  dropId: string,
  dropPartId: number,
  maybeDrop: ApiDrop | null
): UseDropContentResult => {
  const previewPart = maybeDrop?.parts.find((p) => p.part_id === dropPartId);
  const authoritativeModeratedDrop =
    maybeDrop?.moderation?.status !== undefined &&
    maybeDrop.moderation.status !== ApiDropModerationStatus.Visible
      ? maybeDrop
      : null;
  const shouldFetchDrop =
    authoritativeModeratedDrop === null &&
    (!maybeDrop ||
      (!previewPart?.content?.trim() &&
        (previewPart?.media.length ?? 0) === 0));

  // Fetch drop data
  const {
    data: drop,
    isFetching,
    error,
  } = useQuery<ApiDrop | undefined>({
    queryKey: getDropQueryKey(dropId),
    queryFn: () => fetchDropByIdBatched(dropId),
    placeholderData: (previousDrop) => maybeDrop ?? previousDrop,
    enabled: shouldFetchDrop,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
    ...(!shouldFetchDrop && maybeDrop !== null
      ? { initialData: maybeDrop }
      : {}),
  });
  const resolvedDrop: ApiDrop | null =
    authoritativeModeratedDrop ?? drop ?? null;

  const content = useMemo<ProcessedContent>(() => {
    if (isFetching && resolvedDrop === null) {
      return {
        segments: [{ type: "text", content: "Loading..." }],
        apiMedia: [],
      };
    }

    if (error !== null) {
      const regex =
        /Drop [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12} not found/;

      const sanitizedError = sanitizeErrorForUser(error);
      const errorMsg = regex.test(sanitizedError)
        ? "This drop has been deleted by the author"
        : sanitizedError;

      return { segments: [{ type: "text", content: errorMsg }], apiMedia: [] };
    }

    if (resolvedDrop === null) {
      return { segments: [], apiMedia: [] };
    }

    const part = resolvedDrop.parts.find((p) => p.part_id === dropPartId);
    if (part === undefined) {
      return { segments: [], apiMedia: [] };
    }

    return buildProcessedContent(part.content, part.media);
  }, [resolvedDrop, dropPartId, isFetching, error]);

  return {
    drop: resolvedDrop,
    content,
    isLoading: isFetching && resolvedDrop === null,
    error,
  };
};
