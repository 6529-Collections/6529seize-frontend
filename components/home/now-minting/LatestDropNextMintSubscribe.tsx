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
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import useCapacitor from "@/hooks/useCapacitor";
import { commonApiFetch } from "@/services/api/common-api";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useContext, useMemo } from "react";
import Toggle from "react-toggle";
import MemeSubscriptionRow from "../../user/subscriptions/MemeSubscriptionRow";

const SUBSCRIPTION_SLOT_CLASS_NAME =
  "tw-mt-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-4";
const ABOUT_SUBSCRIPTIONS_HREF = "/about/subscriptions";

function getProfileKey(
  connectedProfile: ApiIdentity | null
): string | undefined {
  return (
    connectedProfile?.consolidation_key ??
    connectedProfile?.wallets?.map((wallet) => wallet.wallet).join("-")
  );
}

function getProfileSubscriptionsHref(
  connectedProfile: ApiIdentity | null
): string | undefined {
  const normalisedHandle = connectedProfile?.normalised_handle?.trim();
  if (normalisedHandle) {
    return `/${normalisedHandle}/subscriptions`;
  }

  const handle = connectedProfile?.handle?.trim();
  return handle ? `/${handle}/subscriptions` : undefined;
}

function SubscriptionAwarenessRow({
  profileSubscriptionsHref,
  statusLabel,
  tokenId,
}: Readonly<{
  profileSubscriptionsHref: string | undefined;
  statusLabel: string;
  tokenId: number;
}>) {
  return (
    <div className={SUBSCRIPTION_SLOT_CLASS_NAME}>
      <div className="tw-py-1">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
          <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-leading-none">
            <span className="tw-font-medium tw-leading-none">Subscribe</span>
            <Link
              href={ABOUT_SUBSCRIPTIONS_HREF}
              aria-label="Learn more about The Memes subscriptions"
              className="tw-inline-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-text-iron-400 tw-no-underline tw-transition-colors desktop-hover:hover:tw-text-iron-200"
            >
              <FontAwesomeIcon icon={faInfoCircle} className="tw-size-3.5" />
            </Link>
            {profileSubscriptionsHref && (
              <Link
                href={profileSubscriptionsHref}
                className="tw-text-sm tw-leading-none tw-text-iron-400 tw-no-underline tw-transition-colors desktop-hover:hover:tw-text-iron-200"
              >
                My subscriptions
              </Link>
            )}
          </span>
          <div className="tw-flex tw-items-center tw-gap-2">
            <Toggle
              id={`subscription-awareness-${tokenId}`}
              checked={false}
              disabled
              icons={false}
              aria-label={statusLabel}
            />
            <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400">
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LatestDropNextMintSubscribe(
  props: Readonly<{
    tokenId?: number;
    readonly?: boolean;
  }> = {}
) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { country } = useCookieConsent();
  const { isIos } = useCapacitor();

  const tokenId = useMemo(
    () => props.tokenId ?? getCanonicalNextMintNumber(),
    [props.tokenId]
  );
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

  const { data: details } = useQuery<SubscriptionDetails>({
    queryKey: ["next-mint-subscription-details", profileKey],
    queryFn: async () =>
      await commonApiFetch<SubscriptionDetails>({
        endpoint: `subscriptions/consolidation/details/${profileKey}`,
      }),
    enabled: !hideSubscriptions && !!profileKey,
    retry: false,
  });

  const { data: status, refetch: refetchStatus } =
    useQuery<ApiUpcomingMemeSubscriptionStatus>({
      queryKey: ["next-mint-subscription-status", profileKey, tokenId],
      queryFn: async () =>
        await commonApiFetch<ApiUpcomingMemeSubscriptionStatus>({
          endpoint: `subscriptions/consolidation/upcoming-memes/${tokenId}/${profileKey}`,
        }),
      enabled: !hideSubscriptions && !!profileKey && hasTokenId,
      retry: false,
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

  const balanceLabel = useMemo(() => {
    const balance = details?.balance ?? 0;
    const safeBalance = Number.isFinite(balance) ? balance : 0;
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 6,
    }).format(Math.round(safeBalance * 1_000_000) / 1_000_000);
  }, [details?.balance]);

  if (hideSubscriptions || !hasTokenId) {
    return null;
  }

  if (!profileKey) {
    return (
      <SubscriptionAwarenessRow
        profileSubscriptionsHref={profileSubscriptionsHref}
        statusLabel={activeProfileProxy ? "Proxy active" : "Connect profile"}
        tokenId={tokenId}
      />
    );
  }

  if (!subscription) {
    return (
      <div className={SUBSCRIPTION_SLOT_CLASS_NAME} aria-hidden>
        <div className="tw-py-1">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <span className="tw-flex tw-w-full tw-leading-none">
              <span className="tw-h-6 tw-w-full tw-animate-pulse tw-rounded-md tw-bg-white/10" />
            </span>
          </div>
          <div className="font-smaller font-color-silver d-flex align-items-center gap-2 tw-mt-2">
            <span className="tw-h-5 tw-w-[180px] tw-animate-pulse tw-rounded-md tw-bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={SUBSCRIPTION_SLOT_CLASS_NAME}>
      <div className="tw-rounded-xl tw-bg-transparent">
        <MemeSubscriptionRow
          profileKey={profileKey}
          title="The Memes"
          subscription={subscription}
          eligibilityCount={
            details?.subscription_eligibility_count ?? status?.eligibility ?? 1
          }
          balanceLabel={balanceLabel}
          readonly={props.readonly ?? false}
          infoHref={ABOUT_SUBSCRIPTIONS_HREF}
          profileSubscriptionsHref={profileSubscriptionsHref}
          refresh={() => {
            refetchStatus();
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
