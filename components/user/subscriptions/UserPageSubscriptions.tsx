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
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { AirdropAddressResult } from "./UserPageSubscriptionsAirdropAddress";
import UserPageSubscriptionsAirdropAddress from "./UserPageSubscriptionsAirdropAddress";
import UserPageSubscriptionsBalance from "./UserPageSubscriptionsBalance";
import UserPageSubscriptionsEditionPreference from "./UserPageSubscriptionsEditionPreference";
import UserPageSubscriptionsHistory from "./UserPageSubscriptionsHistory";
import UserPageSubscriptionsMode from "./UserPageSubscriptionsMode";
import UserPageSubscriptionsTopUp from "./UserPageSubscriptionsTopUp";
import UserPageSubscriptionsUpcoming from "./UserPageSubscriptionsUpcoming";

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

  const profileKey = activeProfileProxy
    ? undefined
    : getSubscriptionProfileKey(props.profile);
  const connectedProfileKey = activeProfileProxy
    ? undefined
    : getSubscriptionProfileKey(connectedProfile);
  const isConnectedAccount = !!profileKey && connectedProfileKey === profileKey;

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

  const isFetching =
    fetchingDetails ||
    fetchingAirdropAddress ||
    fetchingTopUpHistory ||
    fetchingMemeSubscriptions ||
    fetchingSubscriptionLogs ||
    fetchingRedeemedHistory;

  function fetchDetails() {
    if (!profileKey) {
      return;
    }
    setFetchingDetails(true);
    commonApiFetch<SubscriptionDetails>({
      endpoint: `subscriptions/consolidation/details/${profileKey}`,
    })
      .then((data) => {
        setDetails(data);
      })
      .catch(() => {
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
    commonApiFetch<AirdropAddressResult>({
      endpoint: `subscriptions/consolidation/${profileKey}/airdrop-address`,
    })
      .then((data) => {
        setAirdropResult(data);
      })
      .catch(() => {
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
      .finally(() => {
        setFetchingTopUpHistory(false);
      });
  }

  function fetchRedeemHistory(page: number) {
    if (!profileKey) {
      return;
    }
    setFetchingRedeemedHistory(true);
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
      .finally(() => {
        setFetchingRedeemedHistory(false);
      });
  }

  function fetchMemeSubscriptions() {
    if (!profileKey) {
      return;
    }
    setFetchingMemeSubscriptions(true);
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
      .finally(() => {
        setFetchingMemeSubscriptions(false);
      });
  }

  function fetchLogs(page: number) {
    if (!profileKey) {
      return;
    }
    setFetchingSubscriptionLogs(true);
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
      .finally(() => {
        setFetchingSubscriptionLogs(false);
      });
  }

  const refresh = (): void => {
    if (!profileKey) {
      return;
    }
    fetchDetails();
    fetchAirdropAddress();
    fetchTopUpHistory(1);
    fetchMemeSubscriptions();
    fetchRedeemHistory(1);
    fetchLogs(1);
  };

  useEffect(() => {
    refresh();
  }, [profileKey]);

  if (!profileKey) {
    return <></>;
  }

  return (
    <div className="tw-pb-5">
      <div className="tw-py-2">
        <div>
          <div>
            <div>
              <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                <h4 className="tw-mb-0 tw-font-semibold">Subscribe</h4>
                <Link
                  href="/about/subscriptions"
                  className="desktop-hover:hover:tw-text-primary-200 tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-300 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-rounded-sm focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
                >
                  Learn More
                  <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <hr className="tw-mt-1 tw-border-2 tw-border-white tw-opacity-100" />
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2">
              <div className="tw-pb-4">
                <UserPageSubscriptionsBalance
                  details={details}
                  fetching={isFetching}
                  refresh={refresh}
                  show_refresh={isConnectedAccount}
                />
              </div>
              <div className="tw-pb-4">
                <UserPageSubscriptionsAirdropAddress
                  show_edit={isConnectedAccount}
                  airdrop={airdropResult}
                />
              </div>
              <div className="tw-pb-4">
                <UserPageSubscriptionsMode
                  profileKey={profileKey}
                  details={details}
                  readonly={!isConnectedAccount}
                  refresh={refresh}
                />
              </div>
              <div className="tw-pb-4">
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
      </div>
      {isConnectedAccount && (
        <div className="tw-pb-2 tw-pt-4">
          <div>
            <UserPageSubscriptionsTopUp />
          </div>
        </div>
      )}
      <div className="tw-pb-2 tw-pt-4">
        <div>
          <UserPageSubscriptionsUpcoming
            profileKey={profileKey}
            details={details}
            memes_subscriptions={memeSubscriptions}
            readonly={!isConnectedAccount}
            refresh={refresh}
          />
        </div>
      </div>
      <div className="tw-pb-2 tw-pt-4">
        <div>
          <UserPageSubscriptionsHistory
            topups={topUpHistory}
            redeemed={redeemedHistory}
            logs={subscriptionLogs}
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
      </div>
    </div>
  );
}
