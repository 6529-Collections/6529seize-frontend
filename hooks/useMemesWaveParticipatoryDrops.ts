"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { MEMES_WAVE_DROPS_LIMIT } from "@/hooks/memesQuickVote.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const fetchAllParticipatoryDrops = async (
  waveId: string,
  contextProfile: string
): Promise<ApiDrop[]> => {
  const collectedDrops: ApiDrop[] = [];
  const seenDropIds = new Set<string>();
  let cursor: number | null = null;

  for (;;) {
    const params: Record<string, string> = {
      wave_id: waveId,
      limit: MEMES_WAVE_DROPS_LIMIT.toString(),
      drop_type: ApiDropType.Participatory,
      context_profile: contextProfile,
    };

    if (typeof cursor === "number") {
      params["serial_no_less_than"] = `${cursor}`;
    }

    const page = await commonApiFetch<ApiDrop[]>({
      endpoint: "drops",
      params,
    });

    if (page.length === 0) {
      break;
    }

    for (const drop of page) {
      if (seenDropIds.has(drop.id)) {
        continue;
      }

      seenDropIds.add(drop.id);
      collectedDrops.push(drop);
    }

    if (page.length < MEMES_WAVE_DROPS_LIMIT) {
      break;
    }

    const nextCursor = page.at(-1)?.serial_no;

    if (typeof nextCursor !== "number" || nextCursor === cursor) {
      break;
    }

    cursor = nextCursor;
  }

  return collectedDrops;
};

export const useMemesWaveParticipatoryDrops = () => {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { seizeSettings, isLoaded } = useSeizeSettings();

  const contextProfile = useMemo(() => {
    const normalizedHandle = connectedProfile?.handle?.trim();
    return normalizedHandle ?? null;
  }, [connectedProfile?.handle]);

  const memesWaveId = seizeSettings.memes_wave_id ?? null;
  const isEnabled =
    isLoaded &&
    typeof memesWaveId === "string" &&
    memesWaveId.length > 0 &&
    typeof contextProfile === "string" &&
    contextProfile.length > 0 &&
    activeProfileProxy === null;

  const queryKey = useMemo(
    () =>
      [
        QueryKey.DROPS,
        {
          waveId: memesWaveId,
          context_profile: contextProfile,
          proxyId: activeProfileProxy?.id ?? null,
          limit: MEMES_WAVE_DROPS_LIMIT,
          dropType: ApiDropType.Participatory,
          context: "memes-wave-footer",
        },
      ] as const,
    [activeProfileProxy?.id, contextProfile, memesWaveId]
  );

  const query = useQuery({
    queryKey,
    enabled: isEnabled,
    queryFn: async () =>
      await fetchAllParticipatoryDrops(memesWaveId!, contextProfile!),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return {
    ...query,
    contextProfile,
    memesWaveId,
    drops: query.data ?? [],
    isEnabled,
    queryKey,
  };
};
