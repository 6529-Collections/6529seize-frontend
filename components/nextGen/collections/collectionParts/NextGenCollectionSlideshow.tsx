import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { NextGenCollection } from "../../../../entities/INextgen";
import styles from "../NextGen.module.scss";
import SlideshowHeader from "./hooks/SlideshowHeader";
import TokenSlideshow from "./hooks/TokenSlideshow";

interface Props {
  readonly collection: NextGenCollection;
}

export default function NextGenCollectionSlideshow(props: Readonly<Props>) {
  return (
    <Container fluid className={styles.slideshowContainer}>
      <Row>
        <Col>
          <Container className="pt-3 pb-3">
            <SlideshowHeader collectionName={props.collection.name} />
            <TokenSlideshow collectionId={props.collection.id} />
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
