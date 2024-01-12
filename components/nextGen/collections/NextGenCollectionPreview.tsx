import styles from "./NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { NextGenCollection } from "../../../entities/INextgen";
import Image from "next/image";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollectionPreview(props: Readonly<Props>) {
  if (props.collection.mint_count === 0) {
    return <></>;
  }

  return (
    <a
      href={`/nextgen/collection/${props.collection.id}`}
      className="decoration-none">
      <Container className={styles.collectionPreview}>
        <Row>
          <Col className="pb-4">
            <Image
              priority
              loading={"eager"}
              width="0"
              height="0"
              style={{
                height: "auto",
                width: "auto",
                maxHeight: "100%",
                maxWidth: "100%",
                padding: "10px",
              }}
              src={props.collection.image}
              alt={`NextGen Collection #${props.collection.id} - ${props.collection.name}`}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Container className={styles.collectionPreviewTitle}>
              <Row>
                <Col className="font-larger">
                  <b>
                    #{props.collection.id} - {props.collection.name}
                  </b>
                </Col>
              </Row>
              <Row>
                <Col>
                  by <b>{props.collection.artist}</b>
                </Col>
              </Row>
              <Row>
                <Col className="font-color-h d-flex">
                  {props.collection.mint_count} /{" "}
                  {props.collection.total_supply} minted
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </a>
  );
}
