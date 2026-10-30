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
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { formatAddress } from "@/helpers/Helpers";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { AirdropAddressResult } from "./UserPageSubscriptionsAirdropAddress";
import UserPageSubscriptionsAirdropAddress from "./UserPageSubscriptionsAirdropAddress";
import UserPageSubscriptionsBalance from "./UserPageSubscriptionsBalance";
import UserPageSubscriptionsEditionPreference from "./UserPageSubscriptionsEditionPreference";
import UserPageSubscriptionsHistory from "./UserPageSubscriptionsHistory";
import UserPageSubscriptionsDisclosure from "./UserPageSubscriptionsDisclosure";
import { useSubscriptionDisclosure } from "./useSubscriptionDisclosure";
import { useScrollToHashOnMount } from "@/hooks/useScrollToHashOnMount";
import UserPageSubscriptionsTopUp from "./UserPageSubscriptionsTopUp";
import UserPageSubscriptionsUpcoming from "./UserPageSubscriptionsUpcoming";
import SubscriptionCoverageSummary from "./coverage/SubscriptionCoverageSummary";
import { useSubscriptionCoverage } from "./coverage/useSubscriptionCoverage";

const HISTORY_PAGE_SIZE = 10;
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
  const topUp = useSubscriptionDisclosure(
    "profile-subscriptions-top-up",
    isConnectedAccount
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

  const [topUpHistory, setTopUpHistory] = useState<Page<SubscriptionTopUp>>({
    count: 0,
    page: 1,
    next: false,
    data: [],
  });
  const [fetchingTopUpHistory, setFetchingTopUpHistory] =
    useState<boolean>(true);

  const [redeemedHistory, setRedeemedHistory] = useState<
    Page<RedeemedSubscription>
  >({
    count: 0,
    page: 1,
    next: false,
    data: [],
  });
  const [fetchingRedeemedHistory, setFetchingRedeemedHistory] =
    useState<boolean>(true);

  const remainingMintsForSeason = getCardsRemainingUntilEndOf("szn");
  const [memeSubscriptions, setMemeSubscriptions] = useState<NFTSubscription[]>(
    []
  );
  const [fetchingMemeSubscriptions, setFetchingMemeSubscriptions] =
    useState<boolean>(true);

  const [subscriptionLogs, setSubscriptionLogs] = useState<
    Page<SubscriptionLog>
  >({
    count: 0,
    page: 1,
    next: false,
    data: [],
  });
  const [fetchingSubscriptionLogs, setFetchingSubscriptionLogs] =
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

  function fetchTopUpHistory(page: number) {
    if (!profileKey) {
      return;
    }
    setFetchingTopUpHistory(true);
    setFetchError("topups", false);
    commonApiFetch<{
      count: number;
      page: number;
      next: boolean;
      data: SubscriptionTopUp[];
    }>({
      endpoint: `subscriptions/consolidation/top-up/${profileKey}?page=${page}&page_size=${HISTORY_PAGE_SIZE}`,
    })
      .then((data) => {
        setTopUpHistory(data);
      })
      .catch(() => {
        setFetchError("topups", true);
      })
      .finally(() => {
        setFetchingTopUpHistory(false);
      });
  }

  function fetchRedeemHistory(page: number) {
    if (!profileKey) {
      return;
    }
    setFetchingRedeemedHistory(true);
    setFetchError("redeemed", false);
    commonApiFetch<{
      count: number;
      page: number;
      next: boolean;
      data: RedeemedSubscription[];
    }>({
      endpoint: `subscriptions/consolidation/redeemed/${profileKey}?page=${page}&page_size=${HISTORY_PAGE_SIZE}`,
    })
      .then((data) => {
        setRedeemedHistory(data);
      })
      .catch(() => {
        setFetchError("redeemed", true);
      })
      .finally(() => {
        setFetchingRedeemedHistory(false);
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

  function fetchLogs(page: number) {
    if (!profileKey) {
      return;
    }
    setFetchingSubscriptionLogs(true);
    setFetchError("logs", false);
    commonApiFetch<{
      count: number;
      page: number;
      next: boolean;
      data: SubscriptionLog[];
    }>({
      endpoint: `subscriptions/consolidation/logs/${profileKey}?page=${page}&page_size=${HISTORY_PAGE_SIZE}`,
    })
      .then((data) => {
        setSubscriptionLogs(data);
      })
      .catch(() => {
        setFetchError("logs", true);
      })
      .finally(() => {
        setFetchingSubscriptionLogs(false);
      });
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

  const settingsSummary = [
    t(
      locale,
      details?.subscribe_all_editions
        ? "subscriptions.settings.all"
        : "subscriptions.coverage.editions.one"
    ),
    airdropResult?.airdrop_address?.address
      ? formatAddress(airdropResult.airdrop_address.address)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-8 tw-pb-12 md:tw-gap-10">
      {Object.values(fetchErrors).some(Boolean) && (
        <div
          role="status"
          className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/30 tw-p-4 tw-text-sm tw-text-amber-200"
        >
          <span>{t(locale, "subscriptions.page.refreshError")}</span>
          <button
            type="button"
            onClick={fetchSubscriptionData}
            className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-amber-300/40 tw-bg-transparent tw-px-4 tw-font-medium tw-text-amber-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "subscriptions.page.retry")}
          </button>
        </div>
      )}
      <section
        id="profile-subscriptions-overview"
        aria-labelledby="profile-subscriptions-overview-title"
        className="tw-scroll-mt-24 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-p-5 md:tw-p-8"
      >
        <SubscriptionCoverageSummary
          coverage={coverageQuery.data}
          isError={coverageQuery.isError}
          isLoading={coverageQuery.isLoading}
          isOwner={isConnectedAccount}
          onRefresh={() => {
            void coverageQuery.refetch();
          }}
          details={details}
          subscriptions={memeSubscriptions}
          upcomingLoading={fetchingMemeSubscriptions}
          topUpExpanded={topUp.expanded}
          onToggleTopUp={() => topUp.setExpanded(!topUp.expanded)}
          balance={
            <UserPageSubscriptionsBalance
              coverage={coverageQuery.data}
              details={details}
              fetching={fetchingDetails}
              refresh={refresh}
              show_refresh={isConnectedAccount}
            />
          }
        >
          {isConnectedAccount && (
            <div hidden={!topUp.expanded}>
              <UserPageSubscriptionsTopUp
                expanded={topUp.expanded}
                coverage={coverageQuery.data}
                onTransactionConfirmed={refresh}
                onCancel={() => {
                  topUp.setExpanded(false);
                  requestAnimationFrame(() =>
                    document
                      .getElementById("subscription-top-up-opener")
                      ?.focus()
                  );
                }}
              />
            </div>
          )}
        </SubscriptionCoverageSummary>
      </section>
      <UserPageSubscriptionsUpcoming
        profileKey={profileKey}
        details={details}
        memes_subscriptions={memeSubscriptions}
        readonly={!isConnectedAccount}
        refresh={refresh}
        loading={fetchingMemeSubscriptions}
        coverage={coverageQuery.isError ? undefined : coverageQuery.data}
      />
      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950">
        <UserPageSubscriptionsDisclosure
          id="profile-subscriptions-settings"
          title={t(locale, "subscriptions.page.settingsTitle")}
          summary={fetchingDetails ? undefined : settingsSummary}
        >
          <UserPageSubscriptionsEditionPreference
            profileKey={profileKey}
            details={details}
            readonly={!isConnectedAccount}
            refresh={refresh}
          />
          <div className="tw-mt-4 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4">
            <UserPageSubscriptionsAirdropAddress
              show_edit={isConnectedAccount}
              airdrop={airdropResult}
              fetching={fetchingAirdropAddress}
            />
          </div>
        </UserPageSubscriptionsDisclosure>
        <UserPageSubscriptionsDisclosure
          id="profile-subscriptions-history"
          title={t(locale, "subscriptions.history.title")}
        >
          <UserPageSubscriptionsHistory
            topups={topUpHistory}
            redeemed={redeemedHistory}
            logs={subscriptionLogs}
            topUpsLoading={fetchingTopUpHistory}
            redeemedLoading={fetchingRedeemedHistory}
            logsLoading={fetchingSubscriptionLogs}
            setRedeemedPage={fetchRedeemHistory}
            setTopUpPage={fetchTopUpHistory}
            setLogsPage={fetchLogs}
          />
        </UserPageSubscriptionsDisclosure>
        <Link
          href="/about/subscriptions"
          className="tw-flex tw-min-h-14 tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-rounded-lg tw-px-5 tw-py-4 tw-text-sm tw-text-iron-100 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 max-md:tw-px-4"
        >
          <span className="tw-text-[15px] tw-font-medium">
            {t(locale, "subscriptions.page.learnMore")}
          </span>
          <ArrowRightIcon
            aria-hidden="true"
            className="tw-size-4 tw-text-iron-400"
          />
        </Link>
      </div>
    </div>
  );
}
