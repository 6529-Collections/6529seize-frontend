import { formatAddress } from "../../../helpers/Helpers";
import { Container, Row, Col } from "react-bootstrap";
import Tippy from "@tippyjs/react";
import { MEMES_CONTRACT } from "../../../constants";
import { AIRDROPS_USE_CASE } from "../../../pages/delegation/[...section]";

export interface AirdropAddress {
  address: string;
  ens: string;
}

export interface AirdropAddressResult {
  tdh_wallet: AirdropAddress;
  airdrop_address: AirdropAddress;
}

export default function UserPageSubscriptionsAirdropAddress(
  props: Readonly<{
    show_edit: boolean;
    airdrop?: AirdropAddressResult;
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
        <Col className="d-flex gap-3">
          <span>
            {props.airdrop?.airdrop_address && (
              <>
                <Tippy
                  content={props.airdrop.airdrop_address.address}
                  placement="top-end">
                  <span>
                    {formatAddress(props.airdrop.airdrop_address.address)}
                  </span>
                </Tippy>
                {props.airdrop.airdrop_address.ens && (
                  <span> - {props.airdrop.airdrop_address.ens}</span>
                )}
              </>
            )}
          </span>
          {props.airdrop?.airdrop_address && props.show_edit && (
            <a
              href={`/delegation/register-delegation?collection=${MEMES_CONTRACT}&use_case=${AIRDROPS_USE_CASE.use_case}`}>
              Change
            </a>
          )}
        </Col>
      </Row>
    </Container>
  );
}
