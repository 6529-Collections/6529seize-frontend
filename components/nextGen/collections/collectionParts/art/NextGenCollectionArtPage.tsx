import { Col, Container, Row } from "react-bootstrap";
import NextGenCollectionHeader from "../NextGenCollectionHeader";
import NextGenCollectionArt from "../NextGenCollectionArt";
import { NextGenCollection } from "@/entities/INextgen";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";

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
