"use client";

import { AuthContext } from "@/components/auth/Auth";
import {
  getCanonicalNextMintNumber,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import styles from "@/components/user/subscriptions/UserPageSubscriptions.module.scss";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiUpcomingMemeSubscriptionStatus } from "@/generated/models/ApiUpcomingMemeSubscriptionStatus";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import MemeSubscriptionRow from "../../user/subscriptions/MemeSubscriptionRow";

function getProfileKey(
  connectedProfile: ApiIdentity | null
): string | undefined {
  return (
    connectedProfile?.consolidation_key ??
    connectedProfile?.wallets?.map((wallet) => wallet.wallet).join("-")
  );
}

export default function LatestDropNextMintSubscribe() {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const tokenId = useMemo(() => getCanonicalNextMintNumber(), []);
  const hasTokenId = Number.isInteger(tokenId) && tokenId > 0;

  const profileKey = useMemo(
    () => (activeProfileProxy ? undefined : getProfileKey(connectedProfile)),
    [activeProfileProxy, connectedProfile]
  );

  const { data: details } = useQuery<SubscriptionDetails>({
    queryKey: ["next-mint-subscription-details", profileKey],
    queryFn: async () =>
      await commonApiFetch<SubscriptionDetails>({
        endpoint: `subscriptions/consolidation/details/${profileKey}`,
      }),
    enabled: !!profileKey,
  });

  const {
    data: status,
    refetch: refetchStatus,
  } = useQuery<ApiUpcomingMemeSubscriptionStatus>({
    queryKey: ["next-mint-subscription-status", profileKey, tokenId],
    queryFn: async () =>
      await commonApiFetch<ApiUpcomingMemeSubscriptionStatus>({
        endpoint: `subscriptions/consolidation/upcoming-memes/${tokenId}/${profileKey}`,
      }),
    enabled: !!profileKey && hasTokenId,
  });

  const subscription = useMemo<NFTSubscription | null>(() => {
    if (!profileKey || !hasTokenId || !status) {
      return null;
    }

    return {
      consolidation_key: profileKey,
      contract: MEMES_CONTRACT,
      token_id: tokenId,
      subscribed: status.subscribed,
      subscribed_count: status.count ?? 1,
    } as NFTSubscription;
  }, [hasTokenId, profileKey, status, tokenId]);

  if (!profileKey || !subscription) {
    return null;
  }

  return (
    <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-4">
      <div
        className={`${styles["nftSubscriptionsListItem"]} ${styles["odd"]} ${styles["last"]} tw-rounded-xl`}>
        <MemeSubscriptionRow
          profileKey={profileKey}
          title="The Memes"
          subscription={subscription}
          eligibilityCount={
            details?.subscription_eligibility_count ?? status.eligibility ?? 1
          }
          readonly={false}
          refresh={() => {
            void refetchStatus();
          }}
          minting_today={isMintingToday()}
          first
          date={null}
          variant="compact"
        />
      </div>
    </div>
  );
}
