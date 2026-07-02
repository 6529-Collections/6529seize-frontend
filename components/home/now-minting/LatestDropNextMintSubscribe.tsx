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
import { formatNumber, roundTo } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import useCapacitor from "@/hooks/useCapacitor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useContext, useId, useMemo } from "react";
import { Tooltip } from "react-tooltip";
import MemeSubscriptionRow from "../../user/subscriptions/MemeSubscriptionRow";
import SubscriptionHeaderLinks, {
  SubscriptionBalanceLabel,
  SubscriptionInfoLink,
  SubscriptionProfileLink,
} from "../../user/subscriptions/SubscriptionHeaderLinks";
import {
  ABOUT_SUBSCRIPTIONS_HREF,
  getProfileSubscriptionsHref,
} from "../../user/subscriptions/subscriptionNavigation";

const SUBSCRIPTION_SLOT_CLASS_NAME =
  "tw-mt-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-4";
type SubscriptionAwarenessStatusKey = Extract<
  MessageKey,
  | "home.mintSubscriptions.disabled.activeDrop"
  | "home.mintSubscriptions.disabled.connectWallet"
  | "home.mintSubscriptions.status.proxyActive"
>;
type SubscriptionStatusSource = "none" | "upcoming";

function getProfileKey(
  connectedProfile: ApiIdentity | null
): string | undefined {
  return (
    connectedProfile?.consolidation_key ??
    connectedProfile?.wallets?.map((wallet) => wallet.wallet).join("-")
  );
}

function DisabledSubscriptionToggle({
  tooltipLabel,
}: Readonly<{
  tooltipLabel: string;
}>) {
  const tooltipId = `subscription-disabled-${useId().replaceAll(":", "")}`;

  return (
    <>
      <span
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipLabel}
        className="tw-inline-flex tw-shrink-0"
      >
        <span
          role="switch"
          aria-checked="false"
          aria-disabled="true"
          aria-label={tooltipLabel}
          tabIndex={0}
          className="tw-inline-flex tw-h-6 tw-w-12 tw-cursor-not-allowed tw-items-center tw-rounded-full tw-bg-iron-800 tw-p-0.5 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
        >
          <span className="tw-size-5 tw-rounded-full tw-bg-iron-500" />
        </span>
      </span>
      <Tooltip id={tooltipId} place="top" />
    </>
  );
}

function SubscriptionAwarenessRow({
  balanceLabel,
  showStatusLabel = false,
  profileSubscriptionsHref,
  statusLabelKey,
}: Readonly<{
  balanceLabel?: string | undefined;
  showStatusLabel?: boolean;
  profileSubscriptionsHref: string | undefined;
  statusLabelKey?: SubscriptionAwarenessStatusKey | undefined;
}>) {
  const locale = useBrowserLocale();
  const statusLabel = t(
    locale,
    statusLabelKey ?? "home.mintSubscriptions.disabled.connectWallet"
  );

  return (
    <div className={SUBSCRIPTION_SLOT_CLASS_NAME}>
      <div className="tw-py-1">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
          <SubscriptionHeaderLinks labelKey="home.mintSubscriptions.subscribeLabel">
            {balanceLabel && (
              <SubscriptionBalanceLabel balanceLabel={balanceLabel} />
            )}
          </SubscriptionHeaderLinks>
          <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2">
            <DisabledSubscriptionToggle tooltipLabel={statusLabel} />
            {showStatusLabel && (
              <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400">
                {statusLabel}
              </span>
            )}
            {profileSubscriptionsHref && (
              <SubscriptionProfileLink href={profileSubscriptionsHref} />
            )}
            <SubscriptionInfoLink href={ABOUT_SUBSCRIPTIONS_HREF} />
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
    statusSource?: SubscriptionStatusSource;
  }> = {}
) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { country } = useCookieConsent();
  const { isIos } = useCapacitor();
  const locale = useBrowserLocale();

  const statusSource = props.statusSource ?? "upcoming";
  const shouldQueryUpcomingStatus = statusSource === "upcoming";
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
      enabled:
        !hideSubscriptions &&
        !!profileKey &&
        hasTokenId &&
        shouldQueryUpcomingStatus,
      retry: false,
    });

  const subscription = useMemo<NFTSubscription | null>(() => {
    if (!shouldQueryUpcomingStatus || !profileKey || !hasTokenId || !status) {
      return null;
    }

    return {
      consolidation_key: profileKey,
      contract: MEMES_CONTRACT,
      token_id: tokenId,
      subscribed: status.subscribed,
      subscribed_count: status.count ?? 1,
    } as NFTSubscription;
  }, [hasTokenId, profileKey, shouldQueryUpcomingStatus, status, tokenId]);

  const balanceLabel = useMemo(() => {
    const balance = details?.balance ?? 0;
    const safeBalance = Number.isFinite(balance) ? balance : 0;
    return formatNumber(locale, roundTo(safeBalance, 6), {
      maximumFractionDigits: 6,
    });
  }, [details?.balance, locale]);

  if (hideSubscriptions || !hasTokenId) {
    return null;
  }

  if (!profileKey) {
    return (
      <SubscriptionAwarenessRow
        profileSubscriptionsHref={profileSubscriptionsHref}
        statusLabelKey={
          activeProfileProxy
            ? "home.mintSubscriptions.status.proxyActive"
            : "home.mintSubscriptions.disabled.connectWallet"
        }
        showStatusLabel={!!activeProfileProxy}
      />
    );
  }

  if (!shouldQueryUpcomingStatus) {
    return (
      <SubscriptionAwarenessRow
        balanceLabel={details ? balanceLabel : undefined}
        profileSubscriptionsHref={profileSubscriptionsHref}
        statusLabelKey="home.mintSubscriptions.disabled.activeDrop"
        showStatusLabel
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
