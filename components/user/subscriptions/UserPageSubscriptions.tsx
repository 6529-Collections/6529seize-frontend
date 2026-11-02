"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import type { RedeemedSubscription } from "@/generated/models/RedeemedSubscription";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import type { SubscriptionLog } from "@/generated/models/SubscriptionLog";
import type { SubscriptionTopUp } from "@/generated/models/SubscriptionTopUp";
import { useContext, useEffect, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import {
  getCardsRemainingUntilEndOf,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import type { Page } from "@/helpers/Types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useLatestRequestSignal } from "@/hooks/useLatestRequestSignal";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { AirdropAddressResult } from "./UserPageSubscriptionsAirdropAddress";
import UserPageSubscriptionsAirdropAddress from "./UserPageSubscriptionsAirdropAddress";
import UserPageSubscriptionsBalance from "./UserPageSubscriptionsBalance";
import UserPageSubscriptionsEditionPreference from "./UserPageSubscriptionsEditionPreference";
import UserPageSubscriptionsHistory from "./UserPageSubscriptionsHistory";
import UserPageSubscriptionsMode from "./UserPageSubscriptionsMode";
import UserPageSubscriptionsSection from "./UserPageSubscriptionsSection";
import UserPageSubscriptionsTopUp from "./UserPageSubscriptionsTopUp";
import UserPageSubscriptionsUpcoming from "./UserPageSubscriptionsUpcoming";
import SubscriptionCoverageSummary from "./coverage/SubscriptionCoverageSummary";
import { useSubscriptionCoverage } from "./coverage/useSubscriptionCoverage";

const HISTORY_PAGE_SIZE = 10;
const SUBSCRIBE_GROUP_CLASS =
  "tw-relative tw-h-full tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03] tw-transition-all tw-duration-500 tw-ease-out max-md:tw-p-4 max-md:tw-shadow-none max-md:tw-bg-iron-900 md:tw-grid md:tw-grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)]";
const SUBSCRIBE_GROUP_CONTENT_CLASS =
  "tw-min-w-0 md:tw-flex md:tw-h-full md:tw-flex-col";

function createEmptyPage<T>(): Page<T> {
  return { count: 0, page: 1, next: false, data: [] };
}

/**
 * Applies a request's outcome only while it is still the latest request of its
 * kind. An aborted (superseded or unmounted) request changes nothing.
 */
function settleLatest<T>(
  signal: AbortSignal,
  request: Promise<T>,
  onData: (data: T) => void,
  onError: () => void,
  onSettled: () => void
): void {
  request
    .then((data) => {
      if (!signal.aborted) onData(data);
    })
    .catch(() => {
      if (!signal.aborted) onError();
    })
    .finally(() => {
      if (!signal.aborted) onSettled();
    });
}

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

  const [details, setDetails] = useState<SubscriptionDetails>();
  const [fetchingDetails, setFetchingDetails] = useState<boolean>(true);

  const [airdropResult, setAirdropResult] = useState<AirdropAddressResult>();
  const [fetchingAirdropAddress, setFetchingAirdropAddress] =
    useState<boolean>(true);

  const [topUpHistory, setTopUpHistory] = useState<Page<SubscriptionTopUp>>(
    createEmptyPage
  );
  const [fetchingTopUpHistory, setFetchingTopUpHistory] =
    useState<boolean>(true);

  const [redeemedHistory, setRedeemedHistory] = useState<
    Page<RedeemedSubscription>
  >(createEmptyPage);
  const [fetchingRedeemedHistory, setFetchingRedeemedHistory] =
    useState<boolean>(true);

  const remainingMintsForSeason = getCardsRemainingUntilEndOf("szn");
  const [memeSubscriptions, setMemeSubscriptions] = useState<NFTSubscription[]>(
    []
  );
  const [fetchingMemeSubscriptions, setFetchingMemeSubscriptions] =
    useState<boolean>(true);

  const [subscriptionLogs, setSubscriptionLogs] =
    useState<Page<SubscriptionLog>>(createEmptyPage);
  const [fetchingSubscriptionLogs, setFetchingSubscriptionLogs] =
    useState<boolean>(true);

  // Each request kind keeps only its latest request: a newer request (a page
  // change or another profile) aborts the previous one, so a superseded
  // success, failure or loading update cannot overwrite the current state.
  const startDetailsRequest = useLatestRequestSignal();
  const startAirdropRequest = useLatestRequestSignal();
  const startTopUpRequest = useLatestRequestSignal();
  const startRedeemedRequest = useLatestRequestSignal();
  const startUpcomingRequest = useLatestRequestSignal();
  const startLogsRequest = useLatestRequestSignal();

  function fetchDetails() {
    if (!profileKey) {
      return;
    }
    const signal = startDetailsRequest();
    setFetchingDetails(true);
    settleLatest(
      signal,
      commonApiFetch<SubscriptionDetails>({
        endpoint: `subscriptions/consolidation/details/${profileKey}`,
        signal,
      }),
      setDetails,
      () => setDetails(undefined),
      () => setFetchingDetails(false)
    );
  }

  function fetchAirdropAddress() {
    if (!profileKey) {
      return;
    }
    const signal = startAirdropRequest();
    setFetchingAirdropAddress(true);
    settleLatest(
      signal,
      commonApiFetch<AirdropAddressResult>({
        endpoint: `subscriptions/consolidation/${profileKey}/airdrop-address`,
        signal,
      }),
      setAirdropResult,
      () => setAirdropResult(undefined),
      () => setFetchingAirdropAddress(false)
    );
  }

  function fetchTopUpHistory(page: number) {
    if (!profileKey) {
      return;
    }
    const signal = startTopUpRequest();
    setFetchingTopUpHistory(true);
    settleLatest(
      signal,
      commonApiFetch<Page<SubscriptionTopUp>>({
        endpoint: `subscriptions/consolidation/top-up/${profileKey}?page=${page}&page_size=${HISTORY_PAGE_SIZE}`,
        signal,
      }),
      setTopUpHistory,
      () => setTopUpHistory(createEmptyPage()),
      () => setFetchingTopUpHistory(false)
    );
  }

  function fetchRedeemHistory(page: number) {
    if (!profileKey) {
      return;
    }
    const signal = startRedeemedRequest();
    setFetchingRedeemedHistory(true);
    settleLatest(
      signal,
      commonApiFetch<Page<RedeemedSubscription>>({
        endpoint: `subscriptions/consolidation/redeemed/${profileKey}?page=${page}&page_size=${HISTORY_PAGE_SIZE}`,
        signal,
      }),
      setRedeemedHistory,
      () => setRedeemedHistory(createEmptyPage()),
      () => setFetchingRedeemedHistory(false)
    );
  }

  function fetchMemeSubscriptions() {
    if (!profileKey) {
      return;
    }
    const signal = startUpcomingRequest();
    setFetchingMemeSubscriptions(true);
    let upcomingLimit: number = remainingMintsForSeason;
    if (isMintingToday()) {
      upcomingLimit += 1;
    }
    settleLatest(
      signal,
      commonApiFetch<NFTSubscription[]>({
        endpoint: `subscriptions/consolidation/upcoming-memes/${profileKey}?card_count=${upcomingLimit}`,
        signal,
      }),
      setMemeSubscriptions,
      () => setMemeSubscriptions([]),
      () => setFetchingMemeSubscriptions(false)
    );
  }

  function fetchLogs(page: number) {
    if (!profileKey) {
      return;
    }
    const signal = startLogsRequest();
    setFetchingSubscriptionLogs(true);
    settleLatest(
      signal,
      commonApiFetch<Page<SubscriptionLog>>({
        endpoint: `subscriptions/consolidation/logs/${profileKey}?page=${page}&page_size=${HISTORY_PAGE_SIZE}`,
        signal,
      }),
      setSubscriptionLogs,
      () => setSubscriptionLogs(createEmptyPage()),
      () => setFetchingSubscriptionLogs(false)
    );
  }

  const fetchSubscriptionData = (): void => {
    fetchDetails();
    fetchAirdropAddress();
    fetchTopUpHistory(1);
    fetchMemeSubscriptions();
    fetchRedeemHistory(1);
    fetchLogs(1);
  };

  const refresh = (): void => {
    if (!profileKey) {
      return;
    }
    void coverageQuery.refetch();
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
    <div className="tw-space-y-4 tw-pb-6">
      <UserPageSubscriptionsSection
        id="profile-subscriptions-overview"
        title={t(locale, "subscriptions.page.title")}
        action={
          <Link
            href="/about/subscriptions"
            className="tw-inline-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-font-semibold tw-leading-5 tw-text-iron-300 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-rounded-sm focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-900 desktop-hover:hover:tw-text-primary-300"
          >
            {t(locale, "subscriptions.page.learnMore")}
            <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
          </Link>
        }
      >
        <SubscriptionCoverageSummary
          coverage={coverageQuery.data}
          isError={coverageQuery.isError}
          isLoading={coverageQuery.isLoading}
          isOwner={isConnectedAccount}
          onRefresh={() => {
            void coverageQuery.refetch();
          }}
        />
        <div
          id="profile-subscriptions-settings"
          className="tw-mt-6 tw-scroll-mt-24"
        >
          <h3 className="tw-mb-3 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
            {t(locale, "subscriptions.page.settingsTitle")}
          </h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
            <div className={SUBSCRIBE_GROUP_CLASS}>
              <div
                className={`${SUBSCRIBE_GROUP_CONTENT_CLASS} md:-tw-translate-y-1 md:tw-justify-start`}
              >
                <UserPageSubscriptionsBalance
                  coverage={coverageQuery.data}
                  details={details}
                  fetching={fetchingDetails}
                  refresh={refresh}
                  show_refresh={isConnectedAccount}
                />
              </div>
              <div className="tw-my-4 tw-h-px tw-bg-white/[0.05]" />
              <div
                className={`${SUBSCRIBE_GROUP_CONTENT_CLASS} md:tw-justify-start`}
              >
                <UserPageSubscriptionsAirdropAddress
                  show_edit={isConnectedAccount}
                  airdrop={airdropResult}
                  fetching={fetchingAirdropAddress}
                />
              </div>
            </div>
            <div className={SUBSCRIBE_GROUP_CLASS}>
              <div
                className={`${SUBSCRIBE_GROUP_CONTENT_CLASS} md:tw-justify-start`}
              >
                <UserPageSubscriptionsMode
                  profileKey={profileKey}
                  details={details}
                  readonly={!isConnectedAccount}
                  refresh={refresh}
                />
              </div>
              <div className="tw-my-4 tw-h-px tw-bg-white/[0.05]" />
              <div
                className={`${SUBSCRIBE_GROUP_CONTENT_CLASS} md:tw-justify-center`}
              >
                <UserPageSubscriptionsEditionPreference
                  profileKey={profileKey}
                  details={details}
                  readonly={!isConnectedAccount}
                  refresh={refresh}
                />
              </div>
            </div>
          </div>
        </div>
      </UserPageSubscriptionsSection>
      {isConnectedAccount && (
        <UserPageSubscriptionsTopUp
          coverage={coverageQuery.data}
          onTransactionConfirmed={refresh}
        />
      )}
      <UserPageSubscriptionsUpcoming
        profileKey={profileKey}
        details={details}
        memes_subscriptions={memeSubscriptions}
        readonly={!isConnectedAccount}
        refresh={refresh}
        loading={fetchingMemeSubscriptions}
      />
      <UserPageSubscriptionsHistory
        topups={topUpHistory}
        redeemed={redeemedHistory}
        logs={subscriptionLogs}
        topUpsLoading={fetchingTopUpHistory}
        redeemedLoading={fetchingRedeemedHistory}
        logsLoading={fetchingSubscriptionLogs}
        setRedeemedPage={(page: number) => {
          fetchRedeemHistory(page);
        }}
        setTopUpPage={(page: number) => {
          fetchTopUpHistory(page);
        }}
        setLogsPage={(page: number) => {
          fetchLogs(page);
        }}
      />
    </div>
  );
}
