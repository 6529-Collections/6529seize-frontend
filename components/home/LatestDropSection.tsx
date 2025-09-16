import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { Col, Container, Row } from "react-bootstrap";
import FeaturedNFTImageColumn from "./FeaturedNFTImageColumn";
import FeaturedNFTDetailsColumn from "./FeaturedNFTDetailsColumn";

interface Props {
  readonly featuredNft: NFTWithMemesExtendedData;
}

export default function LatestDropSection({ featuredNft }: Props) {
  return (
    <Container className="tw-pt-2.5">
      <Row>
        <FeaturedNFTImageColumn featuredNft={featuredNft} />
        <FeaturedNFTDetailsColumn featuredNft={featuredNft} />
      </Row>
    </Container>
  );
}
