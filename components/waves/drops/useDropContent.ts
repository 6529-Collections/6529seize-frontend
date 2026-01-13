"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiFetch } from "@/services/api/common-api";
import { sanitizeErrorForUser } from "@/utils/error-sanitizer";
import type { ProcessedContent } from "./media-utils";
import { buildProcessedContent } from "./media-utils";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
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
  // Fetch drop data
  const {
    data: drop,
    isFetching,
    error,
  } = useQuery<ApiDrop | undefined>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
    initialData: maybeDrop ?? undefined,
    enabled: !maybeDrop,
  });

  const content = useMemo<ProcessedContent>(() => {
    if (isFetching && !drop) {
      return {
        segments: [{ type: "text", content: "Loading..." }],
        apiMedia: [],
      };
    }

    if (error) {
      const regex =
        /Drop [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12} not found/;

      const sanitizedError = sanitizeErrorForUser(error);
      const errorMsg = regex.test(sanitizedError)
        ? "This drop has been deleted by the author"
        : sanitizedError;

      return { segments: [{ type: "text", content: errorMsg }], apiMedia: [] };
    }

    if (!drop) {
      return { segments: [], apiMedia: [] };
    }

    const part = drop.parts.find((p) => p.part_id === dropPartId);
    if (!part) {
      return { segments: [], apiMedia: [] };
    }

    return buildProcessedContent(part.content, part.media);
  }, [drop, dropPartId, isFetching, error]);

  return {
    drop: drop ?? null,
    content,
    isLoading: isFetching && !maybeDrop,
    error,
  };
};
