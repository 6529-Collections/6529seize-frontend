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

const HISTORY_PAGE_SIZE = 10;

export default function UserPageSubscriptions(
  props: Readonly<{
    profile: IProfileAndConsolidations;
  }>
) {
  const { connectedProfile } = useContext(AuthContext);

  const [isFetching, setIsFetching] = useState<boolean>(true);

  const [details, setDetails] = useState<SubscriptionDetails>();
  const [fetchingDetails, setFetchingDetails] = useState<boolean>(true);

  const [topUpHistory, setTopUpHistory] = useState<SubscriptionTopUp[]>([]);
  const [fetchingTopUpHistory, setFetchingTopUpHistory] =
    useState<boolean>(true);

  const [redeemedHistory, setRedeemedHistory] = useState<
    RedeemedSubscription[]
  >([]);
  const [fetchingRedeemedHistory, setFetchingRedeemedHistory] =
    useState<boolean>(true);

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
    if (connectedProfile && props.profile) {
      setIsConnectedAccount(
        connectedProfile.consolidation.consolidation_key ===
          props.profile.consolidation.consolidation_key
      );
    } else {
      setIsConnectedAccount(false);
    }
  }, [connectedProfile, props.profile]);

  useEffect(() => {
    setIsFetching(
      fetchingDetails ||
        fetchingTopUpHistory ||
        fetchingMemeSubscriptions ||
        fetchingSubscriptionLogs ||
        fetchingRedeemedHistory
    );
  }, [
    fetchingDetails,
    fetchingTopUpHistory,
    fetchingMemeSubscriptions,
    fetchingSubscriptionLogs,
    fetchingRedeemedHistory,
  ]);

  function fetchDetails() {
    if (!props.profile.consolidation.consolidation_key) {
      return;
    }
    setFetchingDetails(true);
    commonApiFetch<SubscriptionDetails>({
      endpoint: `subscriptions/consolidation/details/${props.profile.consolidation.consolidation_key}`,
    }).then((data) => {
      setDetails(data);
      setFetchingDetails(false);
    });
  }

  function fetchTopUpHistory() {
    if (!props.profile.consolidation.consolidation_key) {
      return;
    }
    setFetchingTopUpHistory(true);
    commonApiFetch<{
      count: number;
      page: number;
      next: boolean;
      data: SubscriptionTopUp[];
    }>({
      endpoint: `subscriptions/consolidation/top-up/${props.profile.consolidation.consolidation_key}?page=1&page_size=${HISTORY_PAGE_SIZE}`,
    }).then((data) => {
      setTopUpHistory(data.data);
      setFetchingTopUpHistory(false);
    });
  }

  function fetchRedeemHistory() {
    if (!props.profile.consolidation.consolidation_key) {
      return;
    }
    setFetchingRedeemedHistory(true);
    commonApiFetch<{
      count: number;
      page: number;
      next: boolean;
      data: RedeemedSubscription[];
    }>({
      endpoint: `subscriptions/consolidation/redeemed/${props.profile.consolidation.consolidation_key}?page=1&page_size=${HISTORY_PAGE_SIZE}`,
    }).then((data) => {
      setRedeemedHistory(data.data);
      setFetchingRedeemedHistory(false);
    });
  }

  function fetchMemeSubscriptions() {
    if (!props.profile.consolidation.consolidation_key) {
      return;
    }
    setFetchingMemeSubscriptions(true);
    commonApiFetch<NFTSubscription[]>({
      endpoint: `subscriptions/consolidation/upcoming-memes/${props.profile.consolidation.consolidation_key}`,
    }).then((data) => {
      setMemeSubscriptions(data);
      setFetchingMemeSubscriptions(false);
    });
  }

  function fetchLogs() {
    if (!props.profile.consolidation.consolidation_key) {
      return;
    }
    setFetchingSubscriptionLogs(true);
    commonApiFetch<{
      count: number;
      page: number;
      next: boolean;
      data: SubscriptionLog[];
    }>({
      endpoint: `subscriptions/consolidation/logs/${props.profile.consolidation.consolidation_key}?page=1&page_size=${HISTORY_PAGE_SIZE}`,
    }).then((data) => {
      setSubscriptionLogs(data.data);
      setFetchingSubscriptionLogs(false);
    });
  }

  const refresh = (): void => {
    if (!props.profile.consolidation.consolidation_key) {
      return;
    }
    fetchDetails();
    fetchTopUpHistory();
    fetchMemeSubscriptions();
    fetchRedeemHistory();
    fetchLogs();
  };

  useEffect(() => {
    refresh();
  }, [props.profile.consolidation.consolidation_key]);

  if (!props.profile.consolidation.consolidation_key) {
    return (
      <Container className="no-padding pb-5">
        <Row>
          <Col className="d-flex align-items-center gap-2">
            <h4 className="mb-0">Subscribe</h4>
            <span>
              <a
                href="/about/subscriptions"
                className="font-smaller font-color-silver decoration-hover-underline">
                Learn More
              </a>
            </span>
          </Col>
        </Row>
        <Row>
          <Col className="font-color-silver">
            This user is not eligible to Subscribe at this time.
          </Col>
        </Row>
      </Container>
    );
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
                    className="font-smaller font-color-silver decoration-hover-underline">
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
                  profile={props.profile}
                  details={details}
                  readonly={!isConnectedAccount}
                  refresh={refresh}
                />
              </Col>
            </Row>
          </Container>
        </Col>
        {isConnectedAccount && (
          <Col className="pt-2 pb-2" sm={12} md={6}>
            <UserPageSubscriptionsTopUp profile={props.profile} />
          </Col>
        )}
      </Row>
      <Row className="pt-4 pb-2">
        <Col>
          <UserPageSubscriptionsUpcoming
            profile={props.profile}
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
