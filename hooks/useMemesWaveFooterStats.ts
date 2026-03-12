"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { commonApiFetch } from "@/services/api/common-api";

const MEMES_WAVE_DROPS_LIMIT = 20 as const;

type MemesWaveFooterQueryResult = {
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
};

type MemesWaveFooterStats = {
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
  readonly isReady: boolean;
};

const EMPTY_STATS: MemesWaveFooterStats = {
  uncastPower: null,
  unratedCount: 0,
  votingLabel: null,
  isReady: false,
};

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

const deriveFooterStats = (drops: ApiDrop[]): MemesWaveFooterQueryResult => {
  let uncastPower: number | null = null;
  let unratedCount = 0;
  let votingLabel: string | null = null;

  for (const drop of drops) {
    const profileContext = drop.context_profile_context;

    votingLabel ??= WAVE_VOTING_LABELS[drop.wave.voting_credit_type];

    if (!profileContext) {
      continue;
    }

    if (typeof profileContext.max_rating === "number") {
      uncastPower =
        uncastPower === null
          ? profileContext.max_rating
          : Math.max(uncastPower, profileContext.max_rating);
    }

    if (profileContext.rating === 0) {
      unratedCount += 1;
    }
  }

  return {
    uncastPower,
    unratedCount,
    votingLabel,
  };
};

export const useMemesWaveFooterStats = (): MemesWaveFooterStats => {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { seizeSettings, isLoaded } = useSeizeSettings();

  const contextProfile = useMemo(() => {
    const normalizedHandle = connectedProfile?.handle?.trim();
    return normalizedHandle ?? null;
  }, [connectedProfile?.handle]);
  const memesWaveId = seizeSettings.memes_wave_id;
  const isEnabled =
    isLoaded &&
    !!memesWaveId &&
    !!contextProfile &&
    activeProfileProxy === null;

  const queryKey = useMemo(
    () =>
      [
        QueryKey.DROPS,
        {
          waveId: memesWaveId ?? null,
          context_profile: contextProfile,
          proxyId: activeProfileProxy?.id ?? null,
          limit: MEMES_WAVE_DROPS_LIMIT,
          dropType: ApiDropType.Participatory,
          context: "memes-wave-footer-stats",
        },
      ] as const,
    [activeProfileProxy?.id, contextProfile, memesWaveId]
  );

  const { data } = useQuery({
    queryKey,
    enabled: isEnabled,
    queryFn: async () => {
      const drops = await fetchAllParticipatoryDrops(
        memesWaveId!,
        contextProfile!
      );
      return deriveFooterStats(drops);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  if (typeof data?.uncastPower !== "number") {
    return EMPTY_STATS;
  }

  return {
    uncastPower: data.uncastPower,
    unratedCount: data.unratedCount,
    votingLabel: data.votingLabel ?? "Votes",
    isReady: true,
  };
};
