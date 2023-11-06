import { Container, Row, Col } from "react-bootstrap";
import { AdditionalData, TokenURI } from "../../nextgen_entities";
import NextGenTokenList from "../NextGenTokenList";
import DotLoader from "../../../dotLoader/DotLoader";

interface Props {
  collection: number;
  additional_data: AdditionalData;
  burn_amount: number;
  token_uris: TokenURI[];
}

export default function NextGenCollectionArt(props: Props) {
  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h4>
            Tokens x
            {props.additional_data.circulation_supply - props.burn_amount}
          </h4>
        </Col>
      </Row>
      {props.token_uris.length > 0 && (
        <Row>
          <Col>
            {props.token_uris && (
              <NextGenTokenList
                collection={props.collection}
                tokens={props.token_uris}
              />
            )}
          </Col>
        </Row>
      )}
      {props.token_uris.length === 0 &&
        props.additional_data.circulation_supply > 0 && (
          <Row>
            <Col>
              <DotLoader />
            </Col>
          </Row>
        )}
    </Container>
  );
}
