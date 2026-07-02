"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import {
  getCanonicalNextMintNumber,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { MEMES_CONTRACT } from "@/constants/constants";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiUpcomingMemeSubscriptionStatus } from "@/generated/models/ApiUpcomingMemeSubscriptionStatus";
import type { NFTFinalSubscription } from "@/generated/models/NFTFinalSubscription";
import type { RedeemedSubscriptionCounts } from "@/generated/models/RedeemedSubscriptionCounts";
import type { SubscriptionCounts } from "@/generated/models/SubscriptionCounts";
import { t, type MessageKey } from "@/i18n/messages";
import useCapacitor from "@/hooks/useCapacitor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import MemeSubscriptionAwarenessRow from "./MemeSubscriptionAwarenessRow";
import { getProfileSubscriptionsHref } from "../../user/subscriptions/subscriptionNavigation";

type SubscriptionTooltipKey = Extract<
  MessageKey,
  | "home.mintSubscriptions.tooltip.connect"
  | "home.mintSubscriptions.tooltip.dropped"
  | "home.mintSubscriptions.tooltip.manage"
  | "home.mintSubscriptions.tooltip.mintDay"
  | "home.mintSubscriptions.tooltip.profileSubscribe"
  | "home.mintSubscriptions.tooltip.proxy"
>;
type SubscriptionStatusSource = "none" | "upcoming";

type RedeemedSubscriptionCountsResponse = {
  data: RedeemedSubscriptionCounts[];
};

function getProfileKey(
  connectedProfile: ApiIdentity | null
): string | undefined {
  return (
    connectedProfile?.consolidation_key ??
    connectedProfile?.wallets?.map((wallet) => wallet.wallet).join("-")
  );
}

function getToggleTooltipKey({
  activeProfileProxy,
  isMintingDay,
  isUpcoming,
  profileKey,
  subscribed,
}: Readonly<{
  activeProfileProxy: boolean;
  isMintingDay: boolean;
  isUpcoming: boolean;
  profileKey: string | undefined;
  subscribed: boolean;
}>): SubscriptionTooltipKey {
  if (activeProfileProxy) {
    return "home.mintSubscriptions.tooltip.proxy";
  }

  if (!profileKey) {
    return "home.mintSubscriptions.tooltip.connect";
  }

  if (subscribed) {
    return "home.mintSubscriptions.tooltip.manage";
  }

  if (isUpcoming && isMintingDay) {
    return "home.mintSubscriptions.tooltip.mintDay";
  }

  if (isUpcoming) {
    return "home.mintSubscriptions.tooltip.profileSubscribe";
  }

  return "home.mintSubscriptions.tooltip.dropped";
}

export default function LatestDropNextMintSubscribe(
  props: Readonly<{
    tokenId?: number;
    readonly?: boolean;
    statusSource?: SubscriptionStatusSource;
  }> = {}
) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { country } = useCookieConsent();
  const { isIos } = useCapacitor();
  const locale = useBrowserLocale();

  const statusSource = props.statusSource ?? "upcoming";
  const shouldQueryUpcomingStatus = statusSource === "upcoming";
  const isMintingDay = shouldQueryUpcomingStatus && isMintingToday();
  const tokenId = props.tokenId ?? getCanonicalNextMintNumber();
  const hasTokenId = Number.isInteger(tokenId) && tokenId > 0;
  const hideSubscriptions = shouldHideSubscriptions({
    capacitorIsIos: isIos,
    country,
  });

  const profileKey = useMemo(
    () => (activeProfileProxy ? undefined : getProfileKey(connectedProfile)),
    [activeProfileProxy, connectedProfile]
  );
  const profileSubscriptionsHref = useMemo(
    () => getProfileSubscriptionsHref(connectedProfile),
    [connectedProfile]
  );

  const { data: upcomingStatus } = useQuery<ApiUpcomingMemeSubscriptionStatus>({
    queryKey: ["mint-subscription-status", "upcoming", profileKey, tokenId],
    queryFn: async () =>
      await commonApiFetch<ApiUpcomingMemeSubscriptionStatus>({
        endpoint: `subscriptions/consolidation/upcoming-memes/${tokenId}/${profileKey}`,
      }),
    enabled:
      !hideSubscriptions &&
      !!profileKey &&
      hasTokenId &&
      shouldQueryUpcomingStatus,
    retry: false,
  });

  const { data: finalStatus } = useQuery<NFTFinalSubscription>({
    queryKey: ["mint-subscription-status", "final", profileKey, tokenId],
    queryFn: async () =>
      await commonApiFetch<NFTFinalSubscription>({
        endpoint: `subscriptions/consolidation/final/${profileKey}/${MEMES_CONTRACT}/${tokenId}`,
      }),
    enabled:
      !hideSubscriptions &&
      !!profileKey &&
      hasTokenId &&
      !shouldQueryUpcomingStatus,
    retry: false,
  });

  const { data: upcomingCounts } = useQuery<SubscriptionCounts[]>({
    queryKey: ["mint-subscription-counts", "upcoming", tokenId],
    queryFn: async () =>
      await commonApiFetch<SubscriptionCounts[]>({
        endpoint: "subscriptions/upcoming-memes-counts?card_count=1",
      }),
    enabled: !hideSubscriptions && hasTokenId && shouldQueryUpcomingStatus,
    retry: false,
  });

  const { data: redeemedCounts } = useQuery<RedeemedSubscriptionCountsResponse>(
    {
      queryKey: ["mint-subscription-counts", "redeemed", tokenId],
      queryFn: async () =>
        await commonApiFetch<RedeemedSubscriptionCountsResponse>({
          endpoint: "subscriptions/redeemed-memes-counts",
          params: {
            page_size: "10",
            page: "1",
          },
        }),
      enabled: !hideSubscriptions && hasTokenId && !shouldQueryUpcomingStatus,
      retry: false,
    }
  );

  let subscribed = false;
  let subscribedCount: number | undefined;
  if (profileKey) {
    if (shouldQueryUpcomingStatus) {
      subscribed = !!upcomingStatus?.subscribed;
      subscribedCount = upcomingStatus?.count;
    } else {
      subscribed = !!finalStatus?.subscribed_count;
      subscribedCount = finalStatus?.subscribed_count;
    }
  }
  const subscribersCount = useMemo(() => {
    const counts = shouldQueryUpcomingStatus
      ? upcomingCounts
      : redeemedCounts?.data;
    return counts?.find((count) => count.token_id === tokenId)?.count;
  }, [
    redeemedCounts?.data,
    shouldQueryUpcomingStatus,
    tokenId,
    upcomingCounts,
  ]);
  const tooltipLabel = t(
    locale,
    getToggleTooltipKey({
      activeProfileProxy: !!activeProfileProxy,
      isMintingDay,
      isUpcoming: shouldQueryUpcomingStatus,
      profileKey,
      subscribed,
    })
  );

  if (hideSubscriptions || !hasTokenId) {
    return null;
  }

  return (
    <MemeSubscriptionAwarenessRow
      profileSubscriptionsHref={profileSubscriptionsHref}
      subscribed={subscribed}
      subscribedCount={subscribedCount}
      subscribersCount={subscribersCount}
      tooltipLabel={tooltipLabel}
    />
  );
}
