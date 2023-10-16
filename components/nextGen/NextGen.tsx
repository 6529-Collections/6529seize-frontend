import { Container, Row, Col } from "react-bootstrap";
import { useState } from "react";
import NextGenCollectionPreview from "./NextGenCollectionPreview";
import { useCollectionIndex } from "./NextGenAdmin/admin_helpers";

export const COLLECTION_BANNERS = `https://6529bucket.s3.eu-west-1.amazonaws.com/nextgen_collections/banners`;
export const COLLECTION_PREVIEWS = `https://6529bucket.s3.eu-west-1.amazonaws.com/nextgen_collections/previews`;

export default function NextGen() {
  const collectionIndexRead = useCollectionIndex();
  const [collectionIndex, setCollectionIndex] = useState<number>(
    collectionIndexRead.data
      ? parseInt(collectionIndexRead.data as string) - 1
      : 0
  );

  return (
    <Container>
      <Row className="d-flex align-items-center pt-4">
        <Col xs={12}>
          <h1>NEXTGEN</h1>
        </Col>
        <Col xs={12}>
          {collectionIndex
            ? ` [${collectionIndex} COLLECTION${
                collectionIndex > 1 ? `S` : ``
              }]`
            : ``}
        </Col>
      </Row>
      <Row className="pt-4 pb-4">
        {collectionIndex &&
          collectionIndex > 0 &&
          Array(collectionIndex)
            .fill(null)
            .map((_, index) => (
              <Col
                xs={12}
                sm={12}
                md={6}
                lg={4}
                key={`collection-preview-${index}`}>
                <NextGenCollectionPreview
                  collection={index + 1}
                  key={`gen-memes-collection-${index}`}
                />
              </Col>
            ))}
      </Row>
    </Container>
  );
}
