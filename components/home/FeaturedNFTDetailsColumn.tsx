"use client";
import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import MemeCalendarPeriods from "@/components/the-memes/MemeCalendarPeriods";
import MemePageMintCountdown from "@/components/the-memes/MemePageMintCountdown";
import { MEMES_CONTRACT, MEMES_MANIFOLD_PROXY_CONTRACT } from "@/constants";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import useCapacitor from "@/hooks/useCapacitor";
import { useManifoldClaim } from "@/hooks/useManifoldClaim";
import { useManifoldClaimDisplays } from "@/hooks/useManifoldClaimDisplays";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import FeaturedNFTDetailsTable from "./FeaturedNFTDetailsTable";
import ManifoldClaimTable from "./ManifoldClaimTable";
import MintingApproachSection from "./MintingApproachSection";

interface Props {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly isMemeMintingActive: boolean;
}

export default function FeaturedNFTDetailsColumn({
  featuredNft,
  isMemeMintingActive,
}: Props) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();

  const manifoldClaim = useManifoldClaim(
    MEMES_CONTRACT,
    MEMES_MANIFOLD_PROXY_CONTRACT,
    MEMES_MANIFOLD_PROXY_ABI,
    featuredNft.id
  );

  const {
    editionSizeDisplay: manifoldClaimEditionSizeDisplay,
    statusDisplay: manifoldClaimstatusDisplay,
    costDisplay: manifoldClaimCostDisplay,
  } = useManifoldClaimDisplays({ manifoldClaim });

  return (
    <Col
      className="pt-3 pb-5"
      xs={{ span: 12 }}
      sm={{ span: 12 }}
      md={{ span: 6 }}
      lg={{ span: 6 }}>
      <Container>
        <Row>
          <Col>
            <u>
              <h3>
                <Link href={`/the-memes/${featuredNft.id}`}>
                  Card {featuredNft.id} - {featuredNft.name}
                </Link>
              </h3>
            </u>
          </Col>
        </Row>
        <Row>
          <Col>
            <MemeCalendarPeriods id={featuredNft.id} />
          </Col>
        </Row>
        <Row className="pt-2">
          <Col>
            <FeaturedNFTDetailsTable
              nft={featuredNft}
              editionSizeDisplay={manifoldClaimEditionSizeDisplay}
            />
          </Col>
        </Row>
        {isMemeMintingActive && (
          <Row>
            <Col>
              <MemePageMintCountdown
                nft_id={featuredNft.id}
                is_full_width={true}
                hide_mint_btn={false}
                show_only_if_active={false}
              />
            </Col>
          </Row>
        )}
        <MintingApproachSection nftId={featuredNft.id} />
        <ManifoldClaimTable
          statusDisplay={manifoldClaimstatusDisplay}
          costDisplay={manifoldClaimCostDisplay}
          nft={featuredNft}
        />
        {(!capacitor.isIos || country === "US") && (
          <Row className="pt-3">
            <Col>
              <NFTMarketplaceLinks
                contract={featuredNft.contract}
                id={featuredNft.id}
              />
            </Col>
          </Row>
        )}
      </Container>
    </Col>
  );
}
