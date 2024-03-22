import { Col, Container, Row } from "react-bootstrap";
import UserPageMintsSubscriptionsBalance from "./UserPageMintsSubscriptionsBalance";
import UserPageMintsSubscriptionsTopUp from "./UserPageMintsSubscriptionsTopUp";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import UserPageMintsSubscriptionsTopUpHistory from "./UserPageMintsSubscriptionsTopUpHistory";

export default function UserPageMintsSubscriptions(
  props: Readonly<{
    profile: IProfileAndConsolidations;
  }>
) {
  return (
    <Container className="no-padding pb-5">
      <Row>
        <Col className="d-flex align-items-center justify-content-between">
          <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-2xl sm:tw-tracking-tight">
            Subscribe
          </h2>
          <UserPageMintsSubscriptionsBalance profile={props.profile} />
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <UserPageMintsSubscriptionsTopUp />
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <UserPageMintsSubscriptionsTopUpHistory profile={props.profile} />
        </Col>
      </Row>
    </Container>
  );
}
