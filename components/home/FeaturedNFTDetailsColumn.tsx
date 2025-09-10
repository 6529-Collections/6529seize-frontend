"use client";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import useCapacitor from "@/hooks/useCapacitor";
import { ManifoldClaim } from "@/hooks/useManifoldClaim";
import { useManifoldClaimDisplays } from "@/hooks/useManifoldClaimDisplays";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import ManifoldClaimTable from "./ManifoldClaimTable";
import FeaturedNFTDetailsTable from "./FeaturedNFTDetailsTable";
import MintingApproachSection from "./MintingApproachSection";
import MemePageMintCountdown from "../the-memes/MemePageMintCountdown";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { useBlackoutSchedule } from "@/hooks/useBlackoutSchedule";
import type { BlackoutWindow } from "@/hooks/useBlackoutSchedule";
import { useState } from "react";

interface Props {
  readonly featuredNft: NFTWithMemesExtendedData;
}

export default function FeaturedNFTDetailsColumn({ featuredNft }: Props) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const ESTONIAN_SCHEDULE: BlackoutWindow[] = [
    { day: 2, startHour: 17, endHour: 0 }, // Tuesday 5pm-midnight
    { day: 4, startHour: 17, endHour: 0 }, // Thursday 5pm-midnight  
    { day: 6, startHour: 17, endHour: 0 }  // Saturday 5pm-midnight
  ];

  const { isActive } = useBlackoutSchedule({
    timezone: "Europe/Tallinn",
    schedule: ESTONIAN_SCHEDULE
  });

  const [manifoldClaim, setManifoldClaim] = useState<ManifoldClaim>();

  const {
    editionSizeDisplay: manifoldClaimEditionSizeDisplay,
    statusDisplay: manifoldClaimstatusDisplay,
    costDisplay: manifoldClaimCostDisplay,
  } = useManifoldClaimDisplays({ manifoldClaim });

  return (
    <Col
      className="pt-4 pb-3"
      xs={{ span: 12 }}
      sm={{ span: 12 }}
      md={{ span: 6 }}
      lg={{ span: 6 }}
    >
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
            <FeaturedNFTDetailsTable
              nft={featuredNft}
              editionSizeDisplay={manifoldClaimEditionSizeDisplay}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <MemePageMintCountdown
              nft_id={featuredNft.id}
              setClaim={setManifoldClaim}
              is_full_width={true}
              hide_mint_btn={false}
              show_only_if_active={isActive}
            />
          </Col>
        </Row>
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
