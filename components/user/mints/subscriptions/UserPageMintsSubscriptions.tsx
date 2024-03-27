import { Col, Container, Row } from "react-bootstrap";
import UserPageMintsSubscriptionsBalance from "./UserPageMintsSubscriptionsBalance";
import UserPageMintsSubscriptionsTopUp from "./UserPageMintsSubscriptionsTopUp";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import UserPageMintsSubscriptionsMode from "./UserPageMintsSubscriptionsMode";
import { useContext, useEffect, useState } from "react";
import { commonApiFetch } from "../../../../services/api/common-api";
import {
  NFTSubscription,
  SubscriptionDetails,
  SubscriptionLog,
  SubscriptionTopUp,
} from "../../../../entities/ISubscription";
import { AuthContext } from "../../../auth/Auth";
import UserPageMintsSubscriptionsUpcoming from "./UserPageMintsSubscriptionsUpcoming";
import UserPageMintsSubscriptionsHistory from "./UserPageMintsSubscriptionsHistory";

const HISTORY_PAGE_SIZE = 10;

export default function UserPageMintsSubscriptions(
  props: Readonly<{
    profile: IProfileAndConsolidations;
  }>
) {
  const { connectedProfile } = useContext(AuthContext);

  const [details, setDetails] = useState<SubscriptionDetails>();
  const [fetchingDetails, setFetchingDetails] = useState<boolean>(true);

  const [topUpHistory, setTopUpHistory] = useState<SubscriptionTopUp[]>([]);
  const [fetchingTopUpHistory, setFetchingTopUpHistory] =
    useState<boolean>(true);

  const [memeSubscriptions, setMemeSubscriptions] = useState<NFTSubscription[]>(
    []
  );
  const [fetchingMemeSubscriptions, setFetchingMemeSubscriptions] =
    useState<boolean>(true);

  const [subscripiongLogs, setSubscriptionLogs] = useState<SubscriptionLog[]>(
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
    }
  }, [connectedProfile, props.profile]);

  function fetchDetails() {
    if (!props.profile.consolidation.consolidation_key) {
      return;
    }
    setFetchingDetails(true);
    commonApiFetch<SubscriptionDetails>({
      endpoint: `subscriptions/consolidation-details/${props.profile.consolidation.consolidation_key}`,
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
      endpoint: `subscriptions/consolidation-top-up/${props.profile.consolidation.consolidation_key}?page=1&size=${HISTORY_PAGE_SIZE}`,
    }).then((data) => {
      setTopUpHistory(data.data);
      setFetchingTopUpHistory(false);
    });
  }

  function fetchMemeSubscriptions() {
    if (!props.profile.consolidation.consolidation_key) {
      return;
    }
    setFetchingMemeSubscriptions(true);
    commonApiFetch<NFTSubscription[]>({
      endpoint: `subscriptions/consolidation-upcoming-memes/${props.profile.consolidation.consolidation_key}`,
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
      endpoint: `subscriptions/consolidation-logs/${props.profile.consolidation.consolidation_key}?page=1&size=${HISTORY_PAGE_SIZE}`,
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
    fetchLogs();
  };

  useEffect(() => {
    refresh();
  }, [props.profile.consolidation.consolidation_key]);

  return (
    <Container className="no-padding pb-5">
      <Row>
        <Col className="d-flex align-items-center justify-content-between">
          <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-2xl sm:tw-tracking-tight">
            Subscribe
          </h2>
          <UserPageMintsSubscriptionsBalance
            details={details}
            fetching={
              fetchingDetails ||
              fetchingTopUpHistory ||
              fetchingMemeSubscriptions ||
              fetchingSubscriptionLogs
            }
            refresh={refresh}
            show_refresh={isConnectedAccount}
          />
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col sm={12} md={6} className="d-flex flex-column gap-3">
          <UserPageMintsSubscriptionsMode
            profile={props.profile}
            details={details}
            readonly={!isConnectedAccount}
            refresh={refresh}
          />
        </Col>
        {isConnectedAccount && (
          <Col sm={12} md={6}>
            <UserPageMintsSubscriptionsTopUp profile={props.profile} />
          </Col>
        )}
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <UserPageMintsSubscriptionsUpcoming
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
          <UserPageMintsSubscriptionsHistory
            topups={topUpHistory}
            logs={subscripiongLogs}
          />
        </Col>
      </Row>
    </Container>
  );
}
