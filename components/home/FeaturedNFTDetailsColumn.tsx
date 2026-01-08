"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import MemePageMintCountdown from "@/components/mint-countdown-box/MemePageMintCountdown";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import MemeCalendarPeriods from "@/components/the-memes/MemeCalendarPeriods";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import useCapacitor from "@/hooks/useCapacitor";
import { useMemesManifoldClaim } from "@/hooks/useManifoldClaim";
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

  const manifoldClaim = useMemesManifoldClaim(featuredNft.id);

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
              <MemePageMintCountdown nft_id={featuredNft.id} />
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
