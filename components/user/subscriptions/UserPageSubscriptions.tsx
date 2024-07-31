import { Col, Container, Row } from "react-bootstrap";
import UserPageSubscriptionsBalance from "./UserPageSubscriptionsBalance";
import UserPageSubscriptionsTopUp from "./UserPageSubscriptionsTopUp";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserPageSubscriptionsMode from "./UserPageSubscriptionsMode";
import { useContext, useEffect, useState } from "react";
import { commonApiFetch } from "../../../services/api/common-api";
import {
  NFTSubscription,
  RedeemedSubscription,
  SubscriptionDetails,
  SubscriptionLog,
  SubscriptionTopUp,
} from "../../../entities/ISubscription";
import { AuthContext } from "../../auth/Auth";
import UserPageSubscriptionsUpcoming from "./UserPageSubscriptionsUpcoming";
import UserPageSubscriptionsHistory from "./UserPageSubscriptionsHistory";
import UserPageSubscriptionsAirdropAddress, {
  AirdropAddressResult,
} from "./UserPageSubscriptionsAirdropAddress";
import {
  isMintingToday,
  numberOfCardsForSeasonEnd,
} from "../../../helpers/meme_calendar.helpers";

const HISTORY_PAGE_SIZE = 10;

export default function UserPageSubscriptions(
  props: Readonly<{
    profile: IProfileAndConsolidations;
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

  const [topUpHistory, setTopUpHistory] = useState<SubscriptionTopUp[]>([]);
  const [fetchingTopUpHistory, setFetchingTopUpHistory] =
    useState<boolean>(true);

  const [redeemedHistory, setRedeemedHistory] = useState<
    RedeemedSubscription[]
  >([]);
  const [fetchingRedeemedHistory, setFetchingRedeemedHistory] =
    useState<boolean>(true);

  const remainingMintsForSeason = numberOfCardsForSeasonEnd();
  const [memeSubscriptions, setMemeSubscriptions] = useState<NFTSubscription[]>(
    []
  );
  const [fetchingMemeSubscriptions, setFetchingMemeSubscriptions] =
    useState<boolean>(true);

  const [subscriptionLogs, setSubscriptionLogs] = useState<SubscriptionLog[]>(
    []
  );
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
      connectedProfile?.consolidation?.consolidation_key ??
      connectedProfile?.consolidation.wallets
        .map((w) => w.wallet.address)
        .join("-");
    const pKey =
      props.profile.consolidation.consolidation_key ??
      props.profile?.consolidation.wallets
        .map((w) => w.wallet.address)
        .join("-");

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
    fetchAirdropAddress,
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
      .finally(() => {
        setFetchingAirdropAddress(false);
      });
  }

  function fetchTopUpHistory() {
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
      endpoint: `subscriptions/consolidation/top-up/${profileKey}?page=1&page_size=${HISTORY_PAGE_SIZE}`,
    })
      .then((data) => {
        setTopUpHistory(data.data);
      })
      .finally(() => {
        setFetchingTopUpHistory(false);
      });
  }

  function fetchRedeemHistory() {
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
      endpoint: `subscriptions/consolidation/redeemed/${profileKey}?page=1&page_size=${HISTORY_PAGE_SIZE}`,
    })
      .then((data) => {
        setRedeemedHistory(data.data);
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
    let upcomingLimit: number = remainingMintsForSeason.count;
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

  function fetchLogs() {
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
      endpoint: `subscriptions/consolidation/logs/${profileKey}?page=1&page_size=${HISTORY_PAGE_SIZE}`,
    })
      .then((data) => {
        setSubscriptionLogs(data.data);
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
    fetchTopUpHistory();
    fetchMemeSubscriptions();
    fetchRedeemHistory();
    fetchLogs();
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
        <Col sm={12} md={6}>
          <Container className="no-padding">
            <Row>
              <Col className="d-flex align-items-center gap-2">
                <h4 className="mb-0">Subscribe</h4>
                <span>
                  <a
                    href="/about/subscriptions"
                    className="font-smaller font-color-silver decoration-hover-underline"
                  >
                    Learn More
                  </a>
                </span>
              </Col>
            </Row>
            <Row>
              <Col className="pt-2 pb-2 d-flex flex-column gap-4">
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
          <Col className="pt-2 pb-2" sm={12} md={6}>
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
          />
        </Col>
      </Row>
    </Container>
  );
}
