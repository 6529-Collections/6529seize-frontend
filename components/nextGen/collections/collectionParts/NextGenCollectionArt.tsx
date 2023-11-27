import styles from "../NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { AdditionalData, TokenURI } from "../../nextgen_entities";
import NextGenTokenList from "../NextGenTokenList";
import DotLoader from "../../../dotLoader/DotLoader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  collection: number;
  additional_data: AdditionalData;
  token_ids: number[];
  show_view_all?: boolean;
}

export default function NextGenCollectionArt(props: Readonly<Props>) {
  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h3 className="mb-0">The Art</h3>
        </Col>
      </Row>
      <hr />
      {props.token_ids.length > 0 && (
        <Row>
          <Col>
            {props.token_ids && (
              <NextGenTokenList
                collection={props.collection}
                tokens={props.token_ids}
                hide_info={true}
              />
            )}
          </Col>
        </Row>
      )}
      {props.show_view_all && (
        <Row>
          <Col className="d-flex align-items-center justify-content-end">
            <a
              href={`/nextgen/collection/${props.collection}/art`}
              className={`d-flex align-items-center gap-2 ${styles.viewAllTokens}`}>
              <h5 className="mb-0 font-color">
                <b>View All</b>
              </h5>
              <FontAwesomeIcon icon="arrow-circle-right" />
            </a>
          </Col>
        </Row>
      )}
      {props.token_ids.length === 0 &&
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
