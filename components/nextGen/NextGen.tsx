import { Container, Row, Col } from "react-bootstrap";
import { useContractRead } from "wagmi";
import { useState } from "react";
import NextGenCollectionPreview from "./NextGenCollectionPreview";
import { NEXTGEN_CORE } from "./contracts";

export const COLLECTION_BANNERS = `https://6529bucket.s3.eu-west-1.amazonaws.com/nextgen_collections/banners`;
export const COLLECTION_PREVIEWS = `https://6529bucket.s3.eu-west-1.amazonaws.com/nextgen_collections/previews`;

export default function NextGen() {
  const [collectionIndex, setCollectionIndex] = useState<number>();

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CORE.chain_id,
    functionName: "newCollectionIndex",
    watch: true,
    onSettled(data: any, error: any) {
      if (data) {
        setCollectionIndex(parseInt(data) - 1);
      }
    },
  });

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
                xs={6}
                sm={6}
                md={4}
                lg={3}
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
