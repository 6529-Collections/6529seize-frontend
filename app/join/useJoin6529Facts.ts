import { STATS_QUERY_KEY } from "@/components/user/collected/stats/constants";
import type { ApiCollectedStats } from "@/generated/models/ApiCollectedStats";
import { useIdentityActivity } from "@/hooks/useIdentityActivity";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

import {
  hasCollectedSupportedNft,
  hasPublicWavePost,
  type Join6529Facts,
} from "./journeyFacts";

export function useJoin6529Facts({
  enabled,
  identity,
}: {
  readonly enabled: boolean;
  readonly identity: string | null;
}): Join6529Facts {
  const canonicalIdentity = identity?.trim().toLowerCase() ?? "";
  const activityQuery = useIdentityActivity({
    identity: canonicalIdentity,
    enabled,
  });
  const collectedStatsQuery = useQuery<ApiCollectedStats, Error>({
    queryKey: [STATS_QUERY_KEY, "collected-stats", canonicalIdentity],
    queryFn: async ({ signal }) => {
      if (!canonicalIdentity) {
        throw new Error("Identity is required to fetch collected stats");
      }

      return await commonApiFetch<ApiCollectedStats>({
        endpoint: `collected-stats/${encodeURIComponent(canonicalIdentity)}`,
        signal,
      });
    },
    enabled: enabled && canonicalIdentity.length > 0,
    retry: false,
  });

  return {
    hasCollected: hasCollectedSupportedNft(collectedStatsQuery.data),
    hasParticipated: hasPublicWavePost(activityQuery.data),
  };
}
