import { Col, Container, Row } from "react-bootstrap";
import UserPageMintsSubscriptionsBalance from "./UserPageMintsSubscriptionsBalance";
import UserPageMintsSubscriptionsTopUp from "./UserPageMintsSubscriptionsTopUp";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import UserPageMintsSubscriptionsTopUpHistory from "./UserPageMintsSubscriptionsTopUpHistory";
import UserPageMintsSubscriptionsMode from "./UserPageMintsSubscriptionsMode";
import { useContext, useEffect, useState } from "react";
import { setBalance } from "viem/_types/actions/test/setBalance";
import { commonApiFetch } from "../../../../services/api/common-api";
import {
  SubscriptionDetails,
  SubscriptionTopUp,
} from "../../../../entities/ISubscription";
import { AuthContext } from "../../../auth/Auth";

export default function UserPageMintsSubscriptions(
  props: Readonly<{
    profile: IProfileAndConsolidations;
  }>
) {
  const { connectedProfile } = useContext(AuthContext);
  const [details, setDetails] = useState<SubscriptionDetails>();
  const [topUpHistory, setTopUpHistory] = useState<SubscriptionTopUp[]>([]);
  const [fetchingDetails, setFetchingDetails] = useState<boolean>(true);
  const [fetchingTopUpHistory, setFetchingTopUpHistory] =
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

  const refresh = (): void => {
    if (!props.profile.consolidation.consolidation_key) {
      return;
    }
    setFetchingDetails(true);
    setFetchingTopUpHistory(true);
    commonApiFetch<SubscriptionDetails>({
      endpoint: `subscriptions/consolidation-details/${props.profile.consolidation.consolidation_key}`,
    }).then((data) => {
      setDetails(data);
      setFetchingDetails(false);
    });
    commonApiFetch<{
      count: number;
      page: number;
      next: boolean;
      data: SubscriptionTopUp[];
    }>({
      endpoint: `subscriptions/consolidation-top-up/${props.profile.consolidation.consolidation_key}`,
    }).then((data) => {
      setTopUpHistory(data.data);
      setFetchingTopUpHistory(false);
    });
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
            fetching={fetchingDetails || fetchingTopUpHistory}
            refresh={refresh}
            show_refresh={isConnectedAccount}
          />
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col sm={12} md={6}>
          <UserPageMintsSubscriptionsMode
            profile={props.profile}
            details={details}
            readonly={!isConnectedAccount}
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
          <UserPageMintsSubscriptionsTopUpHistory history={topUpHistory} />
        </Col>
      </Row>
    </Container>
  );
}
