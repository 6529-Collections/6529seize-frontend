import styles from "./NextGen.module.scss";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useContractRead, useContractReads } from "wagmi";
import { NEXT_GEN_CONTRACT } from "../../constants";
import { NEXT_GEN_ABI } from "../../abis";
import { useState } from "react";
import NextGenCollectionPreview from "./NextGenCollectionPreview";

export const COLLECTION_BANNERS = `https://6529bucket.s3.eu-west-1.amazonaws.com/nextgen_collections/banners`;
export const COLLECTION_PREVIEWS = `https://6529bucket.s3.eu-west-1.amazonaws.com/nextgen_collections/previews`;

export default function NextGen() {
  const [collectionIndex, setCollectionIndex] = useState<number>();

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
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
        <Col>
          <h1>
            NEXTGEN
            {collectionIndex
              ? ` [${collectionIndex} COLLECTION${
                  collectionIndex > 1 ? `S` : ``
                }]`
              : ``}
          </h1>
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
