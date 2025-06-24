"use client";

import { DBResponse } from "@/entities/IDBResponse";
import { NextGenCollection } from "@/entities/INextgen";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NftOwner } from "@/entities/IOwner";
import {
  numberWithCommas,
  fromGWEI,
  printMintDate,
  isEmptyObject,
  capitalizeEveryWord,
} from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { ManifoldClaim } from "@/hooks/useManifoldClaim";
import { fetchUrl } from "@/services/6529api";
import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import DotLoader from "@/components/dotLoader/DotLoader";
import Link from "next/link";
import { Col, Container, Row, Table } from "react-bootstrap";
import ArtistProfileHandle from "@/components/the-memes/ArtistProfileHandle";
import {
  getDimensionsFromMetadata,
  getFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import { NftPageStats } from "@/components/nftAttributes/NftStats";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import NextGenCollectionSlideshow from "@/components/nextGen/collections/collectionParts/NextGenCollectionSlideshow";

const NFTImage = dynamic(() => import("@/components/nft-image/NFTImage"), {
  ssr: false,
});

const LatestActivity = dynamic(
  () => import("@/components/latest-activity/LatestActivity"),
  { ssr: false }
);

const MemePageMintCountdown = dynamic(
  () => import("@/components/the-memes/MemePageMintCountdown"),
  { ssr: false }
);

export default function Home({
  featuredNft,
  featuredNextgen,
}: {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly featuredNextgen: NextGenCollection;
}) {
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

  useEffect(() => {
    if (connectedProfile?.consolidation_key && featuredNft) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/nft-owners/consolidation/${connectedProfile?.consolidation_key}?contract=${featuredNft.contract}&token_id=${featuredNft.id}`
      ).then((response: DBResponse) => {
        const balanceObject: NftOwner = response.data[0];
        setNftBalance(balanceObject?.balance ?? 0);
      });
    } else {
      setNftBalance(0);
    }
  }, [connectedProfile]);

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

  return (
    <>
      <Container className="pt-4">
        <Row>
          <Col>
            <h1>
              <span className="font-lightest">Latest</span> Drop
            </h1>
          </Col>
        </Row>
        <Row>
          <Col
            className="pt-3 pb-3 d-flex align-items-center justify-content-center"
            xs={{ span: 12 }}
            sm={{ span: 12 }}
            md={{ span: 6 }}
            lg={{ span: 6 }}>
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
                    className={connectedProfile ? "tw-pb-[35px]" : ""}>
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
                  <Table bordered={false}>
                    <tbody>
                      <tr>
                        <td>Edition Size</td>
                        <td>
                          <b>{manifoldClaimEditionSizeDisplay}</b>
                        </td>
                      </tr>
                      <tr>
                        <td>Collection</td>
                        <td>
                          <b>{featuredNft.collection}</b>
                        </td>
                      </tr>
                      <tr>
                        <td>Season</td>
                        <td>
                          <b>{featuredNft.season}</b>
                        </td>
                      </tr>
                      <tr>
                        <td>Meme</td>
                        <td>
                          <b>{featuredNft.meme_name}</b>
                        </td>
                      </tr>
                      <tr>
                        <td>Artist Name</td>
                        <td>
                          <b>{featuredNft.artist}</b>
                        </td>
                      </tr>
                      <tr>
                        <td>Artist Profile</td>
                        <td>
                          <b>
                            <ArtistProfileHandle nft={featuredNft} />
                          </b>
                        </td>
                      </tr>
                      <tr>
                        <td>Mint Date</td>
                        <td>
                          <b>{printMintDate(featuredNft.mint_date)}</b>
                        </td>
                      </tr>
                      <tr>
                        <td>File Type</td>
                        <td>
                          <b>{getFileTypeFromMetadata(featuredNft.metadata)}</b>
                        </td>
                      </tr>
                      <tr>
                        <td>Dimensions</td>
                        <td>
                          <b>
                            {getDimensionsFromMetadata(featuredNft.metadata)}
                          </b>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
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
              <Table bordered={false}>
                <tbody>
                  <tr>
                    <td>Status</td>
                    <td>
                      <b>{manifoldClaimstatusDisplay}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>Mint Price</td>
                    <td>
                      <b>{manifoldClaimCostDisplay}</b>
                    </td>
                  </tr>
                  <NftPageStats
                    nft={featuredNft}
                    hide_mint_price={true}
                    hide_hodl_rate={true}
                  />
                </tbody>
              </Table>
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
      {featuredNextgen && !isEmptyObject(featuredNextgen) && (
        <Container className="pt-3 pb-5">
          <Row>
            <Col className="d-flex align-items-center gap-3">
              <h1>
                <span className="font-lightest">Discover</span> NextGen -{" "}
                {featuredNextgen.name}{" "}
              </h1>
              <Link
                href={`/nextgen/collection/${formatNameForUrl(
                  featuredNextgen.name
                )}`}
                className="tw-no-underline">
                <span className="tw-whitespace-nowrap tw-text-sm tw-font-bold tw-border-b-[3px] tw-border-current hover:tw-text-[#222] hover:tw-border-[#222]max-[800px]:tw-text-[12px]">
                  View Collection
                </span>
              </Link>
            </Col>
          </Row>
          <Row className="pat-3">
            <Col>
              <NextGenCollectionSlideshow collection={featuredNextgen} />
            </Col>
          </Row>
        </Container>
      )}
      <Container>
        <Row className="pt-3">
          <Col xs={12} sm={12} md={12} lg={12}>
            <LatestActivity page={1} pageSize={12} showMore={false} />
          </Col>
        </Row>
      </Container>
    </>
  );
}
