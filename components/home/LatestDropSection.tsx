"use client";

import { DBResponse } from "@/entities/IDBResponse";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NftOwner } from "@/entities/IOwner";
import {
  numberWithCommas,
  fromGWEI,
  capitalizeEveryWord,
} from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { ManifoldClaim } from "@/hooks/useManifoldClaim";
import { fetchUrl } from "@/services/6529api";
import dynamic from "next/dynamic";
import { useState, useEffect, useMemo, memo } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import DotLoader from "@/components/dotLoader/DotLoader";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import FeaturedNFTImageColumn from "./FeaturedNFTImageColumn";
import ManifoldClaimTable from "./ManifoldClaimTable";
import FeaturedNFTDetailsTable from "./FeaturedNFTDetailsTable";

// Memoized image column to prevent unnecessary re-renders
const MemoizedFeaturedNFTImageColumn = memo(FeaturedNFTImageColumn);

const MemePageMintCountdown = dynamic(
  () => import("@/components/the-memes/MemePageMintCountdown"),
  { ssr: false }
);

interface Props {
  readonly featuredNft: NFTWithMemesExtendedData;
}

export default function LatestDropSection({ featuredNft }: Props) {

  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { connectedProfile } = useAuth();

  const [nftBalance, setNftBalance] = useState<number>(0);
  const [manifoldClaim, setManifoldClaim] = useState<ManifoldClaim>();

  const manifoldClaimEditionSizeDisplay = useMemo(() => {
    if (!manifoldClaim) return <DotLoader />;
    if (manifoldClaim.isFinalized) {
      return <>{numberWithCommas(manifoldClaim.total)}</>;
    } else {
      return (
        <>
          {numberWithCommas(manifoldClaim.total)} /{" "}
          {numberWithCommas(manifoldClaim.totalMax)}
          {manifoldClaim.isFetching && (
            <>
              {" "}
              <DotLoader />
            </>
          )}
        </>
      );
    }
  }, [manifoldClaim]);

  const manifoldClaimstatusDisplay = useMemo(() => {
    if (!manifoldClaim) return <DotLoader />;
    if (manifoldClaim.isFinalized) {
      return manifoldClaim.remaining > 0 ? "Ended" : "Sold Out";
    } else {
      return capitalizeEveryWord(manifoldClaim.status);
    }
  }, [manifoldClaim]);

  const manifoldClaimCostDisplay = useMemo(() => {
    if (!manifoldClaim) return <DotLoader />;
    if (manifoldClaim.cost > 0) {
      return `${numberWithCommas(
        Math.round(fromGWEI(manifoldClaim.cost) * 100000) / 100000
      )} ETH`;
    } else {
      return `N/A`;
    }
  }, [manifoldClaim]);

  useEffect(() => {
    if (connectedProfile?.consolidation_key && featuredNft) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/nft-owners/consolidation/${connectedProfile?.consolidation_key}?contract=${featuredNft.contract}&token_id=${featuredNft.id}`
      ).then((response: DBResponse) => {
        const balanceObject: NftOwner = response.data[0];
        setNftBalance(balanceObject?.balance ?? 0);
      }).catch((error) => {
        console.error('Failed to fetch NFT balance:', error);
        // Balance remains 0, which is the current fallback behavior
      });
    } else {
      setNftBalance(0);
    }
  }, [connectedProfile, featuredNft]);

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
        <MemoizedFeaturedNFTImageColumn featuredNft={featuredNft} nftBalance={nftBalance} />

        <Col
          className="pt-3 pb-3"
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
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <h3>Minting Approach</h3>
              </Col>
            </Row>
            <Row className="pb-3">
              <Col>
                <Link href={`/the-memes/${featuredNft.id}/distribution`}>
                  Distribution Plan
                </Link>
              </Col>
            </Row>
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
      </Row>
    </Container>
  );
}
