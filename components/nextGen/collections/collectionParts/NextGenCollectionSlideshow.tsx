import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { NextGenCollection } from "../../../../entities/INextgen";
import styles from "../NextGen.module.scss";
import { fetchInitialTokens } from "./hooks/fetchInitialTokens";
import SlideshowHeader from "./hooks/SlideshowHeader";
import TokenSlideshow from "./hooks/TokenSlideshow";

interface Props {
  readonly collection: NextGenCollection;
}

export default async function NextGenCollectionSlideshow(props: Readonly<Props>) {
  // Fetch initial tokens on the server for faster first paint
  const initialTokens = await fetchInitialTokens(props.collection.id);

  return (
    <Container fluid className={styles.slideshowContainer}>
      <Row>
        <Col>
          <Container className="pt-3 pb-3">
            <SlideshowHeader collectionName={props.collection.name} />
            <TokenSlideshow 
              collectionId={props.collection.id}
              initialTokens={initialTokens}
            />
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
