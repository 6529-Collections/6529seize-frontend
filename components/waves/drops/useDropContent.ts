"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiFetch } from "@/services/api/common-api";
import { sanitizeErrorForUser } from "@/utils/error-sanitizer";
import type {
  ProcessedContent} from "./media-utils";
import {
  isVideoMimeType,
  processContent,
} from "./media-utils";
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

  // Process content from drop
  const getContent = (): ProcessedContent => {
    if (isFetching && !maybeDrop) {
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

    const part = drop.parts.find((part) => part.part_id === dropPartId);
    if (!part) {
      return { segments: [], apiMedia: [] };
    }

    // Process any API media
    const apiMedia = (part.media || []).map((media) => ({
      alt: "Media",
      url: media.url,
      type: (isVideoMimeType(media.mime_type) ? "video" : "image") as
        | "video"
        | "image",
    }));

    // Handle media-only case (no text content)
    if (!part.content) {
      return {
        segments: apiMedia.length ? [] : [{ type: "text", content: "Media" }],
        apiMedia,
      };
    }

    // Handle case with both text and possibly embedded media
    return processContent(part.content, apiMedia);
  };

  const [content, setContent] = useState<ProcessedContent>(getContent());

  useEffect(() => {
    setContent(getContent());
  }, [drop, dropPartId, isFetching, error]);

  return {
    drop: drop ?? null,
    content,
    isLoading: isFetching && !maybeDrop,
    error,
  };
};
