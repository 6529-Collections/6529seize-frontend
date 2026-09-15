"use client";

import type { ApiWalletDistributionAllocations } from "@/generated/models/ApiWalletDistributionAllocations";
import type { NFTFinalSubscription } from "@/generated/models/NFTFinalSubscription";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

const ALLOCATION_REFRESH_INTERVAL = 60_000;

export function useSubscriptionAllocationStatus({
  profileKey,
  contract,
  tokenId,
  first,
  subscribed,
}: Readonly<{
  profileKey: string;
  contract: string;
  tokenId: number;
  first: boolean;
  subscribed: boolean;
}>) {
  const finalQuery = useQuery<NFTFinalSubscription | null>({
    queryKey: [
      "consolidation-final-subscription",
      `${profileKey}-${contract}-${tokenId}`,
    ],
    queryFn: async ({ signal }) => {
      try {
        return await commonApiFetch<NFTFinalSubscription>({
          endpoint: `subscriptions/consolidation/final/${profileKey}/${contract}/${tokenId}`,
          errorMode: "structured",
          signal,
        });
      } catch (error) {
        if (getStructuredApiErrorStatus(error) === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: first && subscribed,
    retry: false,
    refetchInterval: ALLOCATION_REFRESH_INTERVAL,
  });

  // A final row with no phase is still awaiting allocation processing. Only a
  // successful 404 proves this subscribed card was omitted from the finalized
  // subscription list.
  const checkPublication =
    first && subscribed && finalQuery.isSuccess && finalQuery.data === null;
  // Publication is card-wide. Use a wallet from the viewed consolidation only
  // to satisfy the existing endpoint; its wallet allocations are not used here.
  const wallet = profileKey.split("-")[0] ?? "";
  const publicationQuery = useQuery<ApiWalletDistributionAllocations>({
    queryKey: [
      "subscription-distribution-publication",
      contract,
      tokenId,
      wallet,
    ],
    queryFn: async ({ signal }) =>
      await commonApiFetch<ApiWalletDistributionAllocations>({
        endpoint: `distributions/${contract}/${tokenId}/wallet-allocations`,
        params: { wallet },
        includeWalletAuth: false,
        signal,
      }),
    enabled: checkPublication,
    retry: false,
    refetchInterval: ALLOCATION_REFRESH_INTERVAL,
  });

  return {
    final: finalQuery.data,
    hasNoAllocation:
      checkPublication &&
      publicationQuery.isSuccess &&
      publicationQuery.data.has_distribution,
  };
}
