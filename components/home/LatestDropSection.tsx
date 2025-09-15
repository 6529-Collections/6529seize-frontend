import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { Col, Container, Row } from "react-bootstrap";
import FeaturedNFTImageColumn from "./FeaturedNFTImageColumn";
import FeaturedNFTDetailsColumn from "./FeaturedNFTDetailsColumn";

interface Props {
  readonly featuredNft: NFTWithMemesExtendedData;
}

export default function LatestDropSection({ featuredNft }: Props) {
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
        <FeaturedNFTDetailsColumn featuredNft={featuredNft} />
      </Row>
    </Container>
  );
}
