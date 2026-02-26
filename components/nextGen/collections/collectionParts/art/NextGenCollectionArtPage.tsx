import { Col, Container, Row } from "react-bootstrap";

import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import type { NextGenCollection } from "@/entities/INextgen";

import NextGenCollectionArt from "../NextGenCollectionArt";
import NextGenCollectionHeader from "../NextGenCollectionHeader";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollectionArtPage(props: Readonly<Props>) {
  return (
    <>
      <NextGenNavigationHeader />
      <Container className="pt-4 pb-4">
        <Row>
          <Col>
            <NextGenCollectionHeader
              collection={props.collection}
              collection_link={true}
            />
          </Col>
        </Row>
        <Row className="pt-4">
          <Col>
            <NextGenCollectionArt collection={props.collection} />
          </Col>
        </Row>
      </Container>
    </>
  );
}
