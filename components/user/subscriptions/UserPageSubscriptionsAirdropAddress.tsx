import { formatAddress } from "../../../helpers/Helpers";
import { Container, Row, Col } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import { MEMES_CONTRACT } from "../../../constants";
import { AIRDROPS_USE_CASE } from "../../../pages/delegation/[...section]";

interface AirdropAddress {
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
                <>
                  <span data-tooltip-id={`airdrop-address-${props.airdrop.airdrop_address.address}`}>
                    {formatAddress(props.airdrop.airdrop_address.address)}
                  </span>
                  <Tooltip
                    id={`airdrop-address-${props.airdrop.airdrop_address.address}`}
                    style={{
                      backgroundColor: "#1F2937",
                      color: "white",
                      padding: "4px 8px",
                    }}
                  >
                    {props.airdrop.airdrop_address.address}
                  </Tooltip>
                </>
                {props.airdrop.airdrop_address.ens && (
                  <span> - {props.airdrop.airdrop_address.ens}</span>
                )}
              </>
            )}
          </span>
          {props.airdrop?.airdrop_address && props.show_edit && (
            <a
              href={`/delegation/register-delegation?collection=${MEMES_CONTRACT}&use_case=${AIRDROPS_USE_CASE.use_case}`}
              aria-label="Change airdrop address"
            >
              Change
            </a>
          )}
        </Col>
      </Row>
    </Container>
  );
}
