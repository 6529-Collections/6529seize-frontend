"use client";

import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";

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
  drop: ApiDropWithoutWave | null,
  maxLength: number = 100
): string | null {
  if (!drop) return null;

  const textParts = drop.parts
    .map((part) => part.content)
    .filter((content): content is string => !!content);

  if (textParts.length === 0) return null;

  const fullText = textParts.join(" ").trim();
  if (fullText.length === 0) return null;

  return fullText.length > maxLength
    ? `${fullText.slice(0, maxLength)}…`
    : fullText;
}
