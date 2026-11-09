"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { useContext, useEffect, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import SubscriptionTopUpButton from "./coverage/SubscriptionTopUpButton";
import {
  getCardsRemainingUntilEndOf,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { useLatestRequestSignal } from "@/hooks/useLatestRequestSignal";
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
import UserPageSubscriptionsResponsivePanel from "./UserPageSubscriptionsResponsivePanel";
import { useSubscriptionDisclosure } from "./useSubscriptionDisclosure";
import { useScrollToHashOnMount } from "@/hooks/useScrollToHashOnMount";
import UserPageSubscriptionsTopUp from "./UserPageSubscriptionsTopUp";
import UserPageSubscriptionsUpcoming from "./UserPageSubscriptionsUpcoming";
import SubscriptionCoverageSummary from "./coverage/SubscriptionCoverageSummary";
import SubscriptionCoverageNotice from "./coverage/SubscriptionCoverageNotice";
import { useSubscriptionCoverage } from "./coverage/useSubscriptionCoverage";
import { useSubscriptionHistory } from "./useSubscriptionHistory";

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
  const { hideNftPurchasing } = useNftPurchasingVisibility();
  const topUp = useSubscriptionDisclosure(
    "profile-subscriptions-top-up",
    !hideNftPurchasing && isConnectedAccount && !coverageQuery.isLoading,
    "profile-subscriptions-top-up"
  );
  useScrollToHashOnMount("profile-subscriptions-overview", {
    enabled: !!profileKey,
    focusId: "profile-subscriptions-overview-title",
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

  const startDetailsRequest = useLatestRequestSignal();
  const startAirdropRequest = useLatestRequestSignal();
  const startUpcomingRequest = useLatestRequestSignal();

  function fetchDetails() {
    if (!profileKey) {
      return;
    }
    const signal = startDetailsRequest();
    setFetchingDetails(true);
    setFetchError("details", false);
    commonApiFetch<SubscriptionDetails>({
      endpoint: `subscriptions/consolidation/details/${profileKey}`,
      signal,
    })
      .then((data) => {
        if (signal.aborted) return;
        setDetails(data);
      })
      .catch(() => {
        if (signal.aborted) return;
        setFetchError("details", true);
        setDetails(undefined);
      })
      .finally(() => {
        if (signal.aborted) return;
        setFetchingDetails(false);
      });
  }

  function fetchAirdropAddress() {
    if (!profileKey) {
      return;
    }
    const signal = startAirdropRequest();
    setFetchingAirdropAddress(true);
    setFetchError("airdrop", false);
    commonApiFetch<AirdropAddressResult>({
      endpoint: `subscriptions/consolidation/${profileKey}/airdrop-address`,
      signal,
    })
      .then((data) => {
        if (signal.aborted) return;
        setAirdropResult(data);
      })
      .catch(() => {
        if (signal.aborted) return;
        setFetchError("airdrop", true);
        setAirdropResult(undefined);
      })
      .finally(() => {
        if (signal.aborted) return;
        setFetchingAirdropAddress(false);
      });
  }

  function fetchMemeSubscriptions() {
    if (!profileKey) {
      return;
    }
    const signal = startUpcomingRequest();
    setFetchingMemeSubscriptions(true);
    setFetchError("upcoming", false);
    let upcomingLimit: number = remainingMintsForSeason;
    if (isMintingToday()) {
      upcomingLimit += 1;
    }
    commonApiFetch<NFTSubscription[]>({
      endpoint: `subscriptions/consolidation/upcoming-memes/${profileKey}?card_count=${upcomingLimit}`,
      signal,
    })
      .then((data) => {
        if (signal.aborted) return;
        setMemeSubscriptions(data);
      })
      .catch(() => {
        if (signal.aborted) return;
        setFetchError("upcoming", true);
        setMemeSubscriptions([]);
      })
      .finally(() => {
        if (signal.aborted) return;
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
    <div className="tw-relative tw-flex tw-min-w-0 tw-flex-col tw-gap-8 tw-pb-12 md:tw-gap-10">
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3">
        <SubscriptionCoverageNotice
          hasReadError={
            Object.values(fetchErrors).some(Boolean) || history.isError
          }
          onRetry={() => {
            fetchSubscriptionData();
            void history.refresh();
          }}
          show={coverageQuery.isError && !!coverageQuery.data}
          onRefresh={
            isConnectedAccount
              ? () => {
                  void coverageQuery.refetch();
                }
              : undefined
          }
        />
        <div className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-8 lg:tw-grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:tw-gap-x-6 lg:tw-gap-y-10">
          <UserPageSubscriptionsSection
            id="profile-subscriptions"
            className="lg:tw-flex lg:tw-flex-col"
            title={t(locale, "subscriptions.page.title")}
            headerClassName="tw-min-h-11 max-sm:!tw-mb-1"
            action={
              !hideNftPurchasing && (
                <Link
                  href="/about/subscriptions"
                  className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-text-meta tw-font-normal tw-leading-5 tw-text-iron-400 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-rounded-sm focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-900 desktop-hover:hover:tw-text-iron-100"
                >
                  {t(locale, "subscriptions.page.learnMore")}
                  <ArrowRightIcon className="tw-size-3" aria-hidden="true" />
                </Link>
              )
            }
          >
            <section
              id="profile-subscriptions-overview"
              aria-labelledby="profile-subscriptions-overview-title"
              className="tw-relative tw-flex tw-scroll-mt-24 tw-flex-col tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-px-[18px] tw-py-5 sm:tw-p-7 lg:tw-flex-1"
            >
              <div
                aria-hidden="true"
                className="tw-pointer-events-none tw-absolute -tw-top-24 tw-right-[5%] tw-size-80 tw-bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_70%)] lg:-tw-top-32 lg:tw-right-[28%] lg:tw-size-[28rem]"
              />
              <div className="tw-relative tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
                <SubscriptionCoverageSummary
                  coverage={coverageQuery.data}
                  isLoading={coverageQuery.isLoading}
                  isOwner={isConnectedAccount}
                  showFundingPrompt={!hideNftPurchasing}
                  action={
                    <UserPageSubscriptionsBalance
                      coverage={coverageQuery.data}
                      details={details}
                      fetching={fetchingDetails || coverageQuery.isLoading}
                      refresh={refresh}
                      show_refresh={isConnectedAccount}
                    />
                  }
                  topUpAction={
                    !hideNftPurchasing &&
                    isConnectedAccount &&
                    !coverageQuery.isLoading && (
                      <SubscriptionTopUpButton
                        status={coverageQuery.data?.status}
                        expanded={topUp.expanded}
                        onClick={() => topUp.setExpanded(!topUp.expanded)}
                      />
                    )
                  }
                />
              </div>
            </section>
          </UserPageSubscriptionsSection>
          {!hideNftPurchasing && isConnectedAccount && (
            <UserPageSubscriptionsTopUp
              expanded={topUp.expanded}
              coverage={coverageQuery.data}
              onTransactionConfirmed={refresh}
              onCancel={() => {
                topUp.setExpanded(false);
              }}
            />
          )}
          <div className="tw-min-w-0 lg:tw-col-span-2">
            <UserPageSubscriptionsUpcoming
              profileKey={profileKey}
              details={details}
              memes_subscriptions={memeSubscriptions}
              readonly={!isConnectedAccount}
              refresh={refresh}
              loading={fetchingMemeSubscriptions}
              error={fetchErrors["upcoming"]}
              detailsError={fetchErrors["details"]}
              coverage={coverageQuery.isError ? undefined : coverageQuery.data}
            />
          </div>
          <div className="tw-min-w-0 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-rounded-xl tw-bg-iron-950 lg:tw-contents lg:tw-divide-y-0">
            <UserPageSubscriptionsSettings
              profileKey={profileKey}
              details={details}
              readonly={!isConnectedAccount}
              refresh={refresh}
              airdrop={airdropResult}
              fetchingAirdrop={fetchingAirdropAddress}
              detailsError={fetchErrors["details"]}
              airdropError={fetchErrors["airdrop"]}
            />
            <UserPageSubscriptionsResponsivePanel
              key={profileKey}
              id="profile-subscriptions-history"
              title={t(locale, "subscriptions.history.title")}
              className="lg:tw-col-span-2"
              fullHeight
            >
              <UserPageSubscriptionsHistory
                key={profileKey}
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
            </UserPageSubscriptionsResponsivePanel>
          </div>
        </div>
      </div>
    </div>
  );
}
