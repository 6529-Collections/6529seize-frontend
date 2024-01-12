import styles from "../NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import NextGenTokenList from "../NextGenTokenList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NextGenCollection } from "../../../../entities/INextgen";

interface Props {
  collection: NextGenCollection;
  show_view_all?: boolean;
}

export default function NextGenCollectionArt(props: Readonly<Props>) {
  return (
    <Container className="no-padding">
      <Row>
        <Col className="d-flex align-items-center justify-content-between">
          <h3 className="mb-0">The Art</h3>
          {props.show_view_all && (
            <a
              href={`/nextgen/collection/${props.collection.id}/art`}
              className={`d-flex align-items-center gap-2 decoration-none ${styles.viewAllTokens}`}>
              <h5 className="mb-0 font-color d-flex align-items-center gap-2">
                View All
                <FontAwesomeIcon
                  icon="arrow-circle-right"
                  className={styles.viewAllIcon}
                />
              </h5>
            </a>
          )}
        </Col>
      </Row>
      <hr />
      <Row>
        <Col>
          <NextGenTokenList
            collection={props.collection}
            limit={props.show_view_all ? 9 : undefined}
          />
        </Col>
      </Row>
    </Container>
  );
}
