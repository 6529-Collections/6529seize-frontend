import { useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { AuthContext } from "../../../auth/Auth";
import { NFTSubscription } from "../../../../entities/ISubscription";

export default function UserPageMintsSubscriptionsNext(
  props: Readonly<{
    profile: IProfileAndConsolidations;
    memes_subscriptions: NFTSubscription[];
    readonly: boolean;
  }>
) {
  const { requestAuth, setToast } = useContext(AuthContext);

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-l sm:tw-tracking-tight">
            Upcoming Drops
          </h2>
        </Col>
      </Row>
      <Row className="pt-1">
        <Col>
          {props.memes_subscriptions.map((subscription) => (
            <Subscription
              key={`${subscription.contract}-${subscription.token_id}`}
              title="The Memes"
              subscription={subscription}
            />
          ))}
        </Col>
      </Row>
    </Container>
  );
}

function Subscription(
  props: Readonly<{ title: string; subscription: NFTSubscription }>
) {
  return (
    <Container className="no-padding pt-2 pb-2">
      <Row>
        <Col>
          {props.title} #{props.subscription.token_id}
        </Col>
      </Row>
    </Container>
  );
}
