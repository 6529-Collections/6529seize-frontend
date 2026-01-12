import { AIRDROPS_USE_CASE } from "@/components/delegation/delegation-constants";
import { MEMES_CONTRACT } from "@/constants/constants";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Container, Row } from "react-bootstrap";
import { Tooltip } from "react-tooltip";

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
    airdrop?: AirdropAddressResult | undefined;
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
        <Col className="d-flex gap-2">
          <span>
            {props.airdrop?.airdrop_address && (
              <>
                <>
                  <span
                    data-tooltip-id={`airdrop-address-${props.airdrop.airdrop_address.address}`}
                  >
                    {props.airdrop.airdrop_address.address}
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
              <FontAwesomeIcon icon={faEdit} />
            </a>
          )}
        </Col>
      </Row>
    </Container>
  );
}
