import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiOwnerBalanceMemes } from "@/generated/models/ApiOwnerBalanceMemes";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import { commonApiFetch } from "@/services/api/common-api";

import {
  buildTimelineProgress,
  getJoinStatsPath,
  getJoinSubscriptionProfileKey,
  hasActiveMemeSubscription,
  hasMemeCardBalance,
  JOIN_PROGRESS_STALE_TIME_MS,
  JOIN_SUBSCRIPTION_CARD_COUNT,
} from "./journeyProgress";
import type { TimelineProgress } from "./page.types";

const JOIN_PROFILE_SUBSCRIPTIONS_QUERY_KEY = "JOIN_PROFILE_SUBSCRIPTIONS";

export function useJoin6529Progress({
  connectedProfile,
  hasActiveWalletAddress,
  hasEnteredWaves,
  hasFirstPublicMessage,
  hasProfile,
  isProfileStateReady,
}: {
  readonly connectedProfile: ApiIdentity | null;
  readonly hasActiveWalletAddress: boolean;
  readonly hasEnteredWaves: boolean;
  readonly hasFirstPublicMessage: boolean;
  readonly hasProfile: boolean;
  readonly isProfileStateReady: boolean;
}): TimelineProgress {
  const collectionStatsPath = useMemo(
    () => getJoinStatsPath(connectedProfile),
    [connectedProfile]
  );
  const subscriptionProfileKey = useMemo(
    () => getJoinSubscriptionProfileKey(connectedProfile),
    [connectedProfile]
  );

  const { data: balanceMemes } = useQuery({
    queryKey: [
      QueryKey.PROFILE_COLLECTED,
      "join-6529-meme-balance",
      collectionStatsPath,
    ],
    enabled: hasActiveWalletAddress && Boolean(collectionStatsPath),
    staleTime: JOIN_PROGRESS_STALE_TIME_MS,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!collectionStatsPath) {
        return [];
      }
      return await commonApiFetch<ApiOwnerBalanceMemes[]>({
        endpoint: `owners-balances/${collectionStatsPath}/memes`,
        signal,
      });
    },
  });
  const { data: memeSubscriptions } = useQuery({
    queryKey: [
      JOIN_PROFILE_SUBSCRIPTIONS_QUERY_KEY,
      "join-6529-upcoming-memes",
      subscriptionProfileKey,
    ],
    enabled: hasActiveWalletAddress && Boolean(subscriptionProfileKey),
    staleTime: JOIN_PROGRESS_STALE_TIME_MS,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!subscriptionProfileKey) {
        return [];
      }
      return await commonApiFetch<NFTSubscription[]>({
        endpoint: `subscriptions/consolidation/upcoming-memes/${subscriptionProfileKey}`,
        params: { card_count: String(JOIN_SUBSCRIPTION_CARD_COUNT) },
        signal,
      });
    },
  });

  const hasCollectedMemeCards = hasMemeCardBalance(balanceMemes);
  const hasSubscribedToMemeCards = hasActiveMemeSubscription(memeSubscriptions);

  return useMemo(
    () =>
      buildTimelineProgress({
        completed: {
          collect: hasCollectedMemeCards,
          message: hasFirstPublicMessage,
          profile: hasProfile,
          subscribe: hasSubscribedToMemeCards,
          wallet: hasActiveWalletAddress,
          waves: hasEnteredWaves,
        },
        visible: hasActiveWalletAddress && isProfileStateReady,
      }),
    [
      hasActiveWalletAddress,
      hasCollectedMemeCards,
      hasEnteredWaves,
      hasFirstPublicMessage,
      hasProfile,
      hasSubscribedToMemeCards,
      isProfileStateReady,
    ]
  );
}
