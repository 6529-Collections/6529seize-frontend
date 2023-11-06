import { Container, Row, Col } from "react-bootstrap";
import { useState } from "react";
import NextGenCollectionPreview from "./NextGenCollectionPreview";
import { useCollectionIndex } from "../nextgen_helpers";
import Image from "next/image";

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
        <Col xs={12} className="pt-3 pb-3">
          <Image
            width="0"
            height="0"
            style={{ width: "400px", maxWidth: "85vw", height: "auto" }}
            src="/nextgen-logo.png"
            alt="nextgen"
          />
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
                className="pb-3"
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
