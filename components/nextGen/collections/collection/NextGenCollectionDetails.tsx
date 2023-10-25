import styles from "../NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import {
  AdditionalData,
  Info,
  PhaseTimes,
  TokenURI,
} from "../../nextgen_entities";
import { fromGWEI } from "../../../../helpers/Helpers";
import { NextGenTokenImageContent } from "../NextGenTokenImage";

interface Props {
  collection: number;
  additional_data: AdditionalData;
  info: Info;
  phase_times: PhaseTimes;
  token_uris: TokenURI[];
  burn_amount: number;
  token_start_index: number;
  token_end_index: number;
  mint_price: number;
  artist_signature: string;
}

export default function NextGenCollectionDetails(props: Props) {
  return (
    <Container className="no-padding">
      <Row>
        <Col sm={12} md={5} className="pt-3">
          <Container className="no-padding">
            <Row className="pb-3">
              <Col className={styles.tokenFrameContainerHalf}>
                {props.token_uris.length > 0 && (
                  <NextGenTokenImageContent
                    preview={true}
                    token={props.token_uris[0]}
                  />
                )}
              </Col>
            </Row>
            <Row>
              {props.token_start_index > 0 && props.token_end_index > 0 && (
                <Col xs={12} className="pb-2">
                  Token Indexes{" "}
                  <b>
                    {props.token_start_index} - {props.token_end_index}
                  </b>
                </Col>
              )}
              <Col xs={12} className="pb-2">
                Total Supply <b>x{props.additional_data.total_supply}</b>
              </Col>
              <Col xs={12} className="pb-2">
                Minted <b>x{props.additional_data.circulation_supply}</b>
              </Col>
              {props.burn_amount > 0 && (
                <Col xs={12} className="pb-2">
                  <span>
                    Burnt <b>x{props.burn_amount}</b>
                  </span>
                </Col>
              )}
              <Col xs={12} className="pb-2">
                Available{" "}
                <b>
                  {props.additional_data.total_supply -
                    props.additional_data.circulation_supply -
                    props.burn_amount >
                  0
                    ? `x${
                        props.additional_data.total_supply -
                        props.additional_data.circulation_supply -
                        props.burn_amount
                      }`
                    : `-`}
                </b>
              </Col>
              <Col xs={12} className="pb-2">
                Mint Cost{" "}
                <b>
                  {props.mint_price > 0 ? fromGWEI(props.mint_price) : `Free`}{" "}
                  {props.mint_price > 0 ? `ETH` : ``}
                </b>
              </Col>
              <Col xs={12} className="pb-2">
                <span>
                  Max Purchases (Public Phase){" "}
                  <b>x{props.additional_data.max_purchases}</b>
                </span>
              </Col>
            </Row>
          </Container>
        </Col>
        <Col sm={12} md={7} className="pt-3">
          <Container className="no-padding">
            {props.artist_signature && (
              <>
                <Row>
                  <Col>
                    <b>Artist Signature</b>
                  </Col>
                </Row>
                <Row className="pb-4">
                  <Col xs={12} className="pt-2">
                    <div
                      className={styles.artistSignature}
                      dangerouslySetInnerHTML={{
                        __html: props.artist_signature,
                      }}></div>
                  </Col>
                </Row>
              </>
            )}
            <Row>
              <Col xs={12}>
                <b>Collection Overview</b>
              </Col>
              <Col xs={12}>{props.info.description}</Col>
            </Row>
            <Row className="pt-3">
              <Col xs={12}>
                <b>Licence</b>
              </Col>
              <Col xs={12}>{props.info.licence}</Col>
            </Row>
            <Row className="pt-3">
              <Col xs={12}>
                <b>Base URI</b>
              </Col>
              <Col xs={12}>{props.info.base_uri}</Col>
            </Row>
            <Row className="pt-3">
              <Col xs={12}>
                <b>Merkle Root</b>
              </Col>
              <Col xs={12}>{props.phase_times.merkle_root}</Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
