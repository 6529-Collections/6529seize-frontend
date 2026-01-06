import NFTImage from "@/components/nft-image/NFTImage";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";

interface Props {
  readonly featuredNft: NFTWithMemesExtendedData;
}

export default function FeaturedNFTImageColumn({ featuredNft }: Props) {
  return (
    <Col
      className="pt-3 pb-5 d-flex align-items-start justify-content-center"
      xs={{ span: 12 }}
      sm={{ span: 12 }}
      md={{ span: 6 }}
      lg={{ span: 6 }}>
      <Container className="no-padding">
        <Row>
          {featuredNft.animation || featuredNft.metadata.animation ? (
            <NFTImage
              nft={featuredNft}
              animation={true}
              height={650}
              showBalance={true}
            />
          ) : (
            <Link href={`/the-memes/${featuredNft.id}`}>
              <NFTImage
                nft={featuredNft}
                animation={true}
                height={650}
                showBalance={true}
              />
            </Link>
          )}
        </Row>
      </Container>
    </Col>
  );
}
