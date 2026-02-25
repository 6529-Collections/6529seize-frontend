"use client";

import { useQuery } from "@tanstack/react-query";

import { buildProcessedContent } from "@/components/waves/drops/media-utils";
import type { ProcessedContent } from "@/components/waves/drops/media-utils";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import { commonApiFetch } from "@/services/api/common-api";

export function useWaveLatestDrop(waveId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["wave-latest-drop", waveId],
    queryFn: async () => {
      const data = await commonApiFetch<ApiWaveDropsFeed>({
        endpoint: `waves/${waveId}/drops`,
        params: { limit: "1" },
      });
      return data.drops[0] ?? null;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Extracts a text preview from drop parts.
 * Concatenates text content from all parts and truncates to maxLength.
 */
export function extractDropPreview(
  drop: ApiDropWithoutWave | null
): ProcessedContent | null {
  if (!drop) return null;

  const textParts = drop.parts
    .map((part) => part.content?.trim())
    .filter((content): content is string => !!content);

  const combinedText = textParts.join("\n\n");
  const media = drop.parts.flatMap((part) => part.media);

  if (!combinedText && media.length === 0) {
    return null;
  }

  return buildProcessedContent(combinedText || null, media, "View drop...");
}
