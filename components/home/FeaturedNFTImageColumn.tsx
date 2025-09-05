import { NFTWithMemesExtendedData } from "@/entities/INFT";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import NFTImage from "../nft-image/NFTImage";

interface Props {
  readonly featuredNft: NFTWithMemesExtendedData;
}

export default function FeaturedNFTImageColumn({ featuredNft }: Props) {
  return (
    <Col
      className="pt-3 pb-3 d-flex align-items-center justify-content-center"
      xs={{ span: 12 }}
      sm={{ span: 12 }}
      md={{ span: 6 }}
      lg={{ span: 6 }}
    >
      <Container className="no-padding">
        <Row>
          {featuredNft.animation || featuredNft.metadata.animation ? (
            <NFTImage
              nft={featuredNft}
              animation={true}
              height={650}
              showOwnedIfLoggedIn={true}
              showUnseizedIfLoggedIn={true}
            />
          ) : (
            <Link href={`/the-memes/${featuredNft.id}`}>
              <NFTImage
                nft={featuredNft}
                animation={true}
                height={650}
                showOwnedIfLoggedIn={true}
                showUnseizedIfLoggedIn={true}
              />
            </Link>
          )}
        </Row>
      </Container>
    </Col>
  );
}
