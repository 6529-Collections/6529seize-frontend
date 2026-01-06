import { Col, Container, Row } from "react-bootstrap";
import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import styles from "../NextGen.module.scss";
import SlideshowHeader from "./hooks/SlideshowHeader";
import TokenSlideshow from "./hooks/TokenSlideshow";

interface Props {
  readonly collection: NextGenCollection;
  readonly initialTokens?: NextGenToken[] | undefined;
}

export default function NextGenCollectionSlideshow(props: Readonly<Props>) {
  return (
    <Container fluid className={styles["slideshowContainer"]}>
      <Row>
        <Col>
          <Container className="pt-3 pb-3">
            <SlideshowHeader collectionName={props.collection.name} />
            <TokenSlideshow
              collectionId={props.collection.id}
              initialTokens={props.initialTokens}
            />
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
