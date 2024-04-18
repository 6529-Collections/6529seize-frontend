import { formatAddress } from "../../../helpers/Helpers";
import { Container, Row, Col } from "react-bootstrap";
import Tippy from "@tippyjs/react";

export default function UserPageSubscriptionsAirdropAddress(
  props: Readonly<{
    airdrop_address?: {
      address: string;
      ens: string;
    };
  }>
) {
  return (
    <Container className="no-padding">
      <Row className="pb-2">
        <Col className="d-flex align-items-center gap-2">
          <h5 className="no-wrap mb-0">Airdrop Address</h5>
        </Col>
      </Row>
      <Row className="pt-1">
        <Col>
          {props.airdrop_address && (
            <>
              <Tippy content={props.airdrop_address.address}>
                <span>{formatAddress(props.airdrop_address.address)}</span>
              </Tippy>
              {props.airdrop_address.ens && (
                <span> - {props.airdrop_address.ens}</span>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}
