"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { useContext, useEffect, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import {
  getCardsRemainingUntilEndOf,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { AirdropAddressResult } from "./UserPageSubscriptionsAirdropAddress";
import UserPageSubscriptionsBalance from "./UserPageSubscriptionsBalance";
import UserPageSubscriptionsSettings from "./UserPageSubscriptionsSettings";
import UserPageSubscriptionsHistory from "./UserPageSubscriptionsHistory";
import UserPageSubscriptionsSection from "./UserPageSubscriptionsSection";
import { useSubscriptionDisclosure } from "./useSubscriptionDisclosure";
import { useScrollToHashOnMount } from "@/hooks/useScrollToHashOnMount";
import UserPageSubscriptionsTopUp from "./UserPageSubscriptionsTopUp";
import UserPageSubscriptionsUpcoming from "./UserPageSubscriptionsUpcoming";
import SubscriptionCoverageSummary from "./coverage/SubscriptionCoverageSummary";
import { useSubscriptionCoverage } from "./coverage/useSubscriptionCoverage";
import { getSubscriptionCoveragePresentation } from "./coverage/subscriptionCoverage.helpers";
import { useSubscriptionHistory } from "./useSubscriptionHistory";

const COVERAGE_BORDER_CLASS = {
  neutral: "tw-border-white/[0.04]",
  positive: "tw-border-emerald-400/20",
  caution: "tw-border-amber-300/20",
  danger: "tw-border-red-300/25",
};
function getSubscriptionProfileKey(
  profile: ApiIdentity | null | undefined
): string | undefined {
  return (
    profile?.consolidation_key ??
    profile?.wallets?.map((w) => w.wallet).join("-")
  );
}

export default function UserPageSubscriptions(
  props: Readonly<{
    profile: ApiIdentity;
  }>
) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const locale = useBrowserLocale();

  const profileKey = activeProfileProxy
    ? undefined
    : getSubscriptionProfileKey(props.profile);
  const connectedProfileKey = activeProfileProxy
    ? undefined
    : getSubscriptionProfileKey(connectedProfile);
  const isConnectedAccount = !!profileKey && connectedProfileKey === profileKey;
  const coverageQuery = useSubscriptionCoverage({ profileKey });
  const history = useSubscriptionHistory(profileKey);
  const coverageTone =
    coverageQuery.isLoading || coverageQuery.isError || !coverageQuery.data
      ? "neutral"
      : getSubscriptionCoveragePresentation(locale, coverageQuery.data.status)
          .tone;
  const topUp = useSubscriptionDisclosure(
    "profile-subscriptions-top-up",
    isConnectedAccount,
    "profile-subscriptions-top-up"
  );
  useScrollToHashOnMount("profile-subscriptions-overview", {
    enabled: !!profileKey,
    focusId: "profile-subscriptions-overview-title",
  });

  useScrollToHashOnMount("profile-subscriptions-history", {
    enabled: !!profileKey,
    focusId: "profile-subscriptions-history-title",
  });

  const [fetchErrors, setFetchErrors] = useState<Record<string, boolean>>({});
  const setFetchError = (request: string, failed: boolean) => {
    setFetchErrors((current) => ({ ...current, [request]: failed }));
  };

  const [details, setDetails] = useState<SubscriptionDetails>();
  const [fetchingDetails, setFetchingDetails] = useState<boolean>(true);

  const [airdropResult, setAirdropResult] = useState<AirdropAddressResult>();
  const [fetchingAirdropAddress, setFetchingAirdropAddress] =
    useState<boolean>(true);

  const remainingMintsForSeason = getCardsRemainingUntilEndOf("szn");
  const [memeSubscriptions, setMemeSubscriptions] = useState<NFTSubscription[]>(
    []
  );
  const [fetchingMemeSubscriptions, setFetchingMemeSubscriptions] =
    useState<boolean>(true);

  function fetchDetails() {
    if (!profileKey) {
      return;
    }
    setFetchingDetails(true);
    setFetchError("details", false);
    commonApiFetch<SubscriptionDetails>({
      endpoint: `subscriptions/consolidation/details/${profileKey}`,
    })
      .then((data) => {
        setDetails(data);
      })
      .catch(() => {
        setFetchError("details", true);
        setDetails(undefined);
      })
      .finally(() => {
        setFetchingDetails(false);
      });
  }

  function fetchAirdropAddress() {
    if (!profileKey) {
      return;
    }
    setFetchingAirdropAddress(true);
    setFetchError("airdrop", false);
    commonApiFetch<AirdropAddressResult>({
      endpoint: `subscriptions/consolidation/${profileKey}/airdrop-address`,
    })
      .then((data) => {
        setAirdropResult(data);
      })
      .catch(() => {
        setFetchError("airdrop", true);
        setAirdropResult(undefined);
      })
      .finally(() => {
        setFetchingAirdropAddress(false);
      });
  }

  function fetchMemeSubscriptions() {
    if (!profileKey) {
      return;
    }
    setFetchingMemeSubscriptions(true);
    setFetchError("upcoming", false);
    let upcomingLimit: number = remainingMintsForSeason;
    if (isMintingToday()) {
      upcomingLimit += 1;
    }
    commonApiFetch<NFTSubscription[]>({
      endpoint: `subscriptions/consolidation/upcoming-memes/${profileKey}?card_count=${upcomingLimit}`,
    })
      .then((data) => {
        setMemeSubscriptions(data);
      })
      .catch(() => {
        setFetchError("upcoming", true);
      })
      .finally(() => {
        setFetchingMemeSubscriptions(false);
      });
  }

  const fetchSubscriptionData = (): void => {
    fetchDetails();
    fetchAirdropAddress();
    fetchMemeSubscriptions();
  };

  const refresh = (): void => {
    if (!profileKey) {
      return;
    }
    void coverageQuery.refetch();
    void history.refresh();
    fetchSubscriptionData();
  };

  useEffect(() => {
    const fetchTimeout = window.setTimeout(() => {
      fetchSubscriptionData();
    }, 0);

    return () => {
      window.clearTimeout(fetchTimeout);
    };
  }, [profileKey]);

  if (!profileKey) {
    return <></>;
  }

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-8 tw-pb-12 md:tw-gap-10">
      {(Object.values(fetchErrors).some(Boolean) || history.isError) && (
        <div
          role="status"
          className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/30 tw-p-4 tw-text-sm tw-text-amber-200"
        >
          <span>{t(locale, "subscriptions.page.refreshError")}</span>
          <button
            type="button"
            onClick={() => {
              fetchSubscriptionData();
              void history.refresh();
            }}
            className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-amber-300/40 tw-bg-transparent tw-px-4 tw-font-medium tw-text-amber-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "subscriptions.page.retry")}
          </button>
        </div>
      )}
      <UserPageSubscriptionsSection
        id="profile-subscriptions"
        title={t(locale, "subscriptions.page.title")}
        titleAction={
          <Link
            href="/about/subscriptions"
            className="tw-inline-flex tw-min-h-8 tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-font-semibold tw-leading-5 tw-text-iron-300 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-rounded-sm focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-900 desktop-hover:hover:tw-text-primary-300"
          >
            {t(locale, "subscriptions.page.learnMore")}
            <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
          </Link>
        }
      >
        <section
          id="profile-subscriptions-overview"
          aria-labelledby="profile-subscriptions-overview-title"
          className={`tw-relative tw-isolate tw-scroll-mt-24 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-bg-iron-950 tw-px-4 tw-py-5 tw-shadow-[0_15px_40px_rgba(0,0,0,0.35)] md:tw-px-5 ${COVERAGE_BORDER_CLASS[coverageTone]}`}
        >
          <div
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute -tw-top-24 tw-right-[5%] -tw-z-10 tw-size-80 tw-bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_70%)] lg:-tw-top-32 lg:tw-right-[28%] lg:tw-size-[28rem]"
          />
          <SubscriptionCoverageSummary
            coverage={coverageQuery.data}
            isError={coverageQuery.isError}
            isLoading={coverageQuery.isLoading}
            isOwner={isConnectedAccount}
            onRefresh={() => {
              void coverageQuery.refetch();
            }}
            details={details}
            action={
              <div
                id="subscription-overview-actions"
                className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-2 md:tw-flex-col md:tw-items-end md:tw-gap-y-3"
              >
                <div className="tw-min-w-0 tw-flex-1">
                  <UserPageSubscriptionsBalance
                    coverage={coverageQuery.data}
                    details={details}
                    fetching={fetchingDetails}
                    refresh={refresh}
                    show_refresh={isConnectedAccount}
                  />
                </div>
                {isConnectedAccount && (
                  <button
                    id="subscription-top-up-opener"
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={topUp.expanded}
                    aria-controls="profile-subscriptions-top-up"
                    onClick={() => topUp.setExpanded(!topUp.expanded)}
                    className="tw-inline-flex tw-min-h-9 tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-950 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                  >
                    {t(locale, "subscriptions.page.topUpTitle")}
                  </button>
                )}
              </div>
            }
          >
            {isConnectedAccount && (
              <UserPageSubscriptionsTopUp
                expanded={topUp.expanded}
                coverage={coverageQuery.data}
                onTransactionConfirmed={refresh}
                onCancel={() => {
                  topUp.setExpanded(false);
                }}
              />
            )}
          </SubscriptionCoverageSummary>
        </section>
      </UserPageSubscriptionsSection>
      <UserPageSubscriptionsSettings
        profileKey={profileKey}
        details={details}
        readonly={!isConnectedAccount}
        refresh={refresh}
        airdrop={airdropResult}
        fetchingAirdrop={fetchingAirdropAddress}
      />
      <UserPageSubscriptionsUpcoming
        profileKey={profileKey}
        details={details}
        memes_subscriptions={memeSubscriptions}
        readonly={!isConnectedAccount}
        refresh={refresh}
        loading={fetchingMemeSubscriptions}
        coverage={coverageQuery.isError ? undefined : coverageQuery.data}
      />
      <UserPageSubscriptionsSection
        id="profile-subscriptions-history"
        title={t(locale, "subscriptions.history.title")}
      >
        <UserPageSubscriptionsHistory
          selectedIndex={history.selectedIndex}
          onSelectionChange={history.setSelectedIndex}
          topups={history.topups}
          redeemed={history.redeemed}
          logs={history.logs}
          topUpsLoading={history.topupsLoading}
          redeemedLoading={history.redeemedLoading}
          logsLoading={history.logsLoading}
          setRedeemedPage={(page) => history.setPage("redeemed", page)}
          setTopUpPage={(page) => history.setPage("topups", page)}
          setLogsPage={(page) => history.setPage("logs", page)}
        />
      </UserPageSubscriptionsSection>
    </div>
  );
}
