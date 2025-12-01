"use client";

import {
  NFTSubscription,
  RedeemedSubscription,
  SubscriptionDetails,
  SubscriptionLog,
  SubscriptionTopUp,
} from "@/entities/ISubscription";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { AuthContext } from "@/components/auth/Auth";
import {
  getCardsRemainingUntilEndOf,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import Link from "next/link";
import UserPageSubscriptionsAirdropAddress, {
  AirdropAddressResult,
} from "./UserPageSubscriptionsAirdropAddress";
import UserPageSubscriptionsBalance from "./UserPageSubscriptionsBalance";
import UserPageSubscriptionsHistory from "./UserPageSubscriptionsHistory";
import UserPageSubscriptionsMode from "./UserPageSubscriptionsMode";
import UserPageSubscriptionsTopUp from "./UserPageSubscriptionsTopUp";
import UserPageSubscriptionsUpcoming from "./UserPageSubscriptionsUpcoming";

const HISTORY_PAGE_SIZE = 10;

export default function UserPageSubscriptions(
  props: Readonly<{
    profile: ApiIdentity;
  }>
) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const [profileKey, setProfileKey] = useState<string>();

  const [isFetching, setIsFetching] = useState<boolean>(true);

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

  const [isConnectedAccount, setIsConnectedAccount] = useState<boolean>(false);

  useEffect(() => {
    if (activeProfileProxy) {
      setIsConnectedAccount(false);
      setProfileKey(undefined);
      return;
    }

    const connectedKey =
      connectedProfile?.consolidation_key ??
      connectedProfile?.wallets?.map((w) => w.wallet).join("-");
    const pKey =
      props.profile.consolidation_key ??
      props.profile.wallets?.map((w) => w.wallet).join("-");

    setIsConnectedAccount(connectedKey === pKey);
    setProfileKey(pKey);
  }, [connectedProfile, activeProfileProxy, props.profile]);

  useEffect(() => {
    setIsFetching(
      fetchingDetails ||
        fetchingAirdropAddress ||
        fetchingTopUpHistory ||
        fetchingMemeSubscriptions ||
        fetchingSubscriptionLogs ||
        fetchingRedeemedHistory
    );
  }, [
    fetchingDetails,
    fetchingAirdropAddress,
    fetchingTopUpHistory,
    fetchingMemeSubscriptions,
    fetchingSubscriptionLogs,
    fetchingRedeemedHistory,
  ]);

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
    <Container className="no-padding pb-5">
      <Row className="pt-2 pb-2">
        <Col sm={12} md={isConnectedAccount ? 6 : 12}>
          <Container className="no-padding">
            <Row className="pb-2">
              <Col className="d-flex align-items-center gap-2">
                <h4 className="mb-0">Subscribe</h4>
                <span>
                  <Link
                    href="/about/subscriptions"
                    className="font-smaller font-color-silver decoration-hover-underline">
                    Learn More
                  </Link>
                </span>
              </Col>
            </Row>
            <Row>
              <Col
                className={`pt-2 pb-2 d-flex ${
                  isConnectedAccount
                    ? "flex-column gap-4"
                    : "flex-wrap flex-md-nowrap gap-4 justify-content-between"
                }`}>
                <UserPageSubscriptionsBalance
                  details={details}
                  fetching={isFetching}
                  refresh={refresh}
                  show_refresh={isConnectedAccount}
                />
                <UserPageSubscriptionsMode
                  profileKey={profileKey}
                  details={details}
                  readonly={!isConnectedAccount}
                  refresh={refresh}
                />
                <UserPageSubscriptionsAirdropAddress
                  show_edit={isConnectedAccount}
                  airdrop={airdropResult}
                />
              </Col>
            </Row>
          </Container>
        </Col>
        {isConnectedAccount && (
          <Col sm={12} md={6}>
            <UserPageSubscriptionsTopUp />
          </Col>
        )}
      </Row>
      <Row className="pt-4 pb-2">
        <Col>
          <UserPageSubscriptionsUpcoming
            profileKey={profileKey}
            details={details}
            memes_subscriptions={memeSubscriptions}
            readonly={!isConnectedAccount}
            refresh={refresh}
          />
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
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
        </Col>
      </Row>
    </Container>
  );
}
