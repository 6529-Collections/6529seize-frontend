

import { NFTWithMemesExtendedData } from "@/entities/INFT";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import { useAuth } from "@/components/auth/Auth";
import NFTImage from "../nft-image/NFTImage";

interface Props {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly nftBalance: number;
}

export default function FeaturedNFTImageColumn({
  featuredNft,
  nftBalance,
}: Props) {
  const { connectedProfile } = useAuth();

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
            <span className={connectedProfile ? "tw-pb-[35px]" : ""}>
              <NFTImage
                nft={featuredNft}
                animation={true}
                height={650}
                balance={nftBalance}
                showUnseized={!!connectedProfile}
              />
            </span>
          ) : (
            <Link
              href={`/the-memes/${featuredNft.id}`}
              className={connectedProfile ? "tw-pb-[35px]" : ""}
            >
              <NFTImage
                nft={featuredNft}
                animation={true}
                height={650}
                balance={nftBalance}
                showUnseized={!!connectedProfile}
              />
            </Link>
          )}
        </Row>
      </Container>
    </Col>
  );
}
