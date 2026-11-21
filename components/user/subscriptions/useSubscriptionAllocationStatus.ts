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
  waitForRefresh = false,
  verifyAbsence = false,
}: Readonly<{
  profileKey: string;
  contract: string;
  tokenId: number;
  first: boolean;
  subscribed: boolean;
  waitForRefresh?: boolean;
  verifyAbsence?: boolean;
}>) {
  const verification = verifyAbsence || waitForRefresh;
  const queryKey = [
    "consolidation-final-subscription",
    `${profileKey}-${contract}-${tokenId}`,
    ...(verifyAbsence ? ["coverage-verification"] : []),
    ...(waitForRefresh ? ["after-cutoff"] : []),
  ];
  const fetchFinal = async ({ signal }: { signal: AbortSignal }) => {
    try {
      return await commonApiFetch<NFTFinalSubscription>({
        endpoint: `subscriptions/consolidation/final/${profileKey}/${contract}/${tokenId}`,
        errorMode: "structured",
        signal,
      });
    } catch (error) {
      if (getStructuredApiErrorStatus(error) === 404) return null;
      throw error;
    }
  };
  const finalQuery = useQuery<NFTFinalSubscription | null>({
    queryKey,
    queryFn: fetchFinal,
    enabled: first && subscribed,
    ...(verification ? { refetchOnMount: "always" as const } : {}),
    retry: false,
    refetchInterval: ALLOCATION_REFRESH_INTERVAL,
  });

  // A final row with no phase is still awaiting allocation processing. Only a
  // successful 404 together with published distribution evidence proves this
  // subscribed card was omitted from the finalized subscription list.
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

  const published = publicationQuery.data?.has_distribution === true;
  const publishedFinalQuery = useQuery<NFTFinalSubscription | null>({
    queryKey: [...queryKey, "after-publication"],
    queryFn: fetchFinal,
    enabled: verification && checkPublication && published,
    refetchOnMount: "always",
    retry: false,
    refetchInterval: ALLOCATION_REFRESH_INTERVAL,
  });
  const checkingPublishedFinal =
    verification && finalQuery.data === null && published;
  const publishedFinalReady = publishedFinalQuery.isFetchedAfterMount;
  const hasNoAllocation =
    checkPublication &&
    publicationQuery.isSuccess &&
    published &&
    (!verification ||
      (publishedFinalReady &&
        publishedFinalQuery.isSuccess &&
        publishedFinalQuery.data === null));

  let final = finalQuery.data;
  if (checkingPublishedFinal)
    final = publishedFinalReady ? publishedFinalQuery.data : undefined;

  return {
    final,
    isLoading:
      finalQuery.isLoading ||
      (verification &&
        (!finalQuery.isFetchedAfterMount ||
          (checkPublication && !published) ||
          (checkingPublishedFinal && !publishedFinalReady))),
    isError:
      finalQuery.isError ||
      (verification && checkPublication && publicationQuery.isError) ||
      (checkingPublishedFinal && publishedFinalQuery.isError),
    hasNoAllocation,
  };
}
