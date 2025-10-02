import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { Container, Row } from "react-bootstrap";
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
    <Container className="tw-pt-2.5">
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
