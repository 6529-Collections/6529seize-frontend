import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { Col, Container, Row } from "react-bootstrap";
import FeaturedNFTDetailsColumn from "./FeaturedNFTDetailsColumn";
import FeaturedNFTImageColumn from "./FeaturedNFTImageColumn";

interface Props {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly isMemeMintingActive: boolean;
}

export default function LatestDropSection({
  featuredNft,
  isMemeMintingActive,
}: Props) {
  return (
    <Container className="pt-4">
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Latest</span> Drop
          </h1>
        </Col>
      </Row>
      <Row>
        <FeaturedNFTImageColumn featuredNft={featuredNft} />
        <FeaturedNFTDetailsColumn
          featuredNft={featuredNft}
          isMemeMintingActive={isMemeMintingActive}
        />
      </Row>
    </Container>
  );
}
