"use client";

import styles from "./MemeLab.module.scss";

import { useAuth } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import Download from "@/components/download/Download";
import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import MemeLabLeaderboard from "@/components/leaderboard/MemeLabLeaderboard";
import NFTImage from "@/components/nft-image/NFTImage";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import NftNavigation from "@/components/nft-navigation/NftNavigation";
import NFTAttributes from "@/components/nftAttributes/NFTAttributes";
import { NftPageStats } from "@/components/nftAttributes/NftStats";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import Pagination from "@/components/pagination/Pagination";
import { printMemeReferences } from "@/components/rememes/RememePage";
import ArtistProfileHandle from "@/components/the-memes/ArtistProfileHandle";
import {
  getMemeTabTitle,
  MEME_FOCUS,
  MEME_TABS,
  TabButton,
} from "@/components/the-memes/MemeShared";
import Timeline from "@/components/timeline/Timeline";
import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT, MEMES_CONTRACT, NULL_ADDRESS } from "@/constants";
import { useTitle } from "@/contexts/TitleContext";
import { DBResponse } from "@/entities/IDBResponse";
import { LabExtendedData, LabNFT, NFT, NFTHistory } from "@/entities/INFT";
import { Transaction } from "@/entities/ITransaction";
import {
  addProtocol,
  areEqualAddresses,
  enterArtFullScreen,
  fullScreenSupported,
  numberWithCommas,
  parseNftDescriptionToHtml,
  printMintDate,
} from "@/helpers/Helpers";
import {
  getDimensionsFromMetadata,
  getFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import { TypeFilter } from "@/hooks/useActivityData";
import useCapacitor from "@/hooks/useCapacitor";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { faExpandAlt, faFire } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import {
  Carousel,
  Col,
  Container,
  Dropdown,
  Row,
  Table,
} from "react-bootstrap";

const ACTIVITY_PAGE_SIZE = 25;

export default function MemeLabPageComponent({
  nftId,
}: {
  readonly nftId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const capacitor = useCapacitor();

  const { connectedProfile } = useAuth();
  const { country } = useCookieConsent();
  const { setTitle } = useTitle();

  const [isFullScreenSupported, setIsFullScreenSupported] = useState(false);

  const [fullscreenElementId, setFullscreenElementId] = useState<string>(
    "the-art-fullscreen-img"
  );

  const [activeTab, setActiveTab] = useState<MEME_FOCUS>();

  const [nft, setNft] = useState<LabNFT>();
  const [originalMemes, setOriginalMemes] = useState<NFT[]>([]);
  const [nftMeta, setNftMeta] = useState<LabExtendedData>();
  const [nftBalance, setNftBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activity, setActivity] = useState<Transaction[]>([]);

  const [userLoaded, setUserLoaded] = useState(false);
  const [originalMemesLoaded, setOriginalMemesLoaded] = useState(false);

  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalResults, setActivityTotalResults] = useState(0);

  const [nftHistory, setNftHistory] = useState<NFTHistory[]>([]);

  const [activityTypeFilter, setActivityTypeFilter] = useState<TypeFilter>(
    TypeFilter.ALL
  );

  useEffect(() => {
    setTitle(getMemeTabTitle(`Meme Lab`, nftId, nft, activeTab));
  }, [nft, nftId, activeTab]);

  useEffect(() => {
    setIsFullScreenSupported(fullScreenSupported());
    let initialFocus = MEME_FOCUS.LIVE;

    const routerFocus = searchParams?.get("focus");
    if (routerFocus) {
      const resolvedRouterFocus = Object.values(MEME_FOCUS).find(
        (sd) => sd === routerFocus
      );
      if (resolvedRouterFocus) {
        initialFocus = resolvedRouterFocus;
      }
    }
    setActiveTab(initialFocus);
  }, []);

  useEffect(() => {
    if (activeTab) {
      let query: any = { focus: activeTab };
      router.replace(`?${new URLSearchParams(query).toString()}`);
    }
  }, [activeTab]);

  useEffect(() => {
    if (nftId) {
      fetchUrl(
        `${publicEnv.API_ENDPOINT}/api/lab_extended_data?id=${nftId}`
      ).then((response: DBResponse) => {
        const nftMetas = response.data;
        if (nftMetas.length === 1) {
          setNftMeta(nftMetas[0]);
          fetchUrl(
            `${publicEnv.API_ENDPOINT}/api/nfts_memelab?id=${nftId}`
          ).then((response: DBResponse) => {
            const nft: LabNFT = response.data[0];
            setNft(nft);

            if (nft.meme_references.length > 0) {
              fetchUrl(
                `${
                  publicEnv.API_ENDPOINT
                }/api/nfts?sort_direction=asc&contract=${MEMES_CONTRACT}&id=${nft.meme_references.join(
                  ","
                )}`
              ).then((response: DBResponse) => {
                setOriginalMemes(response.data);
                setOriginalMemesLoaded(true);
              });
            } else {
              setOriginalMemesLoaded(true);
            }
          });
        } else {
          setNftMeta(undefined);
        }
      });
    }
  }, [nftId]);

  useEffect(() => {
    const wallets = connectedProfile?.wallets ?? [];
    if (wallets.length > 0 && nftId) {
      fetchUrl(
        `${
          publicEnv.API_ENDPOINT
        }/api/transactions_memelab?wallet=${wallets.join(",")}&id=${nftId}`
      ).then((response: DBResponse) => {
        setTransactions(response.data);
        let countIn = 0;
        let countOut = 0;
        response.data.map((d: Transaction) => {
          if (wallets.some((w) => areEqualAddresses(w, d.from_address))) {
            countOut += d.token_count;
          }
          if (wallets.some((w) => areEqualAddresses(w, d.to_address))) {
            countIn += d.token_count;
          }
        });
        setUserLoaded(true);
        setNftBalance(countIn - countOut);
      });
    } else {
      setNftBalance(0);
    }
  }, [nftId, connectedProfile]);

  useEffect(() => {
    if (nftId) {
      let url = `${publicEnv.API_ENDPOINT}/api/transactions_memelab?id=${nftId}&page_size=${ACTIVITY_PAGE_SIZE}&page=${activityPage}`;
      switch (activityTypeFilter) {
        case TypeFilter.SALES:
          url += `&filter=sales`;
          break;
        case TypeFilter.TRANSFERS:
          url += `&filter=transfers`;
          break;
        case TypeFilter.AIRDROPS:
          url += `&filter=airdrops`;
          break;
        case TypeFilter.MINTS:
          url += `&filter=mints`;
          break;
        case TypeFilter.BURNS:
          url += `&filter=burns`;
          break;
      }
      fetchUrl(url).then((response: DBResponse) => {
        setActivityTotalResults(response.count);
        setActivity(response.data);
      });
    }
  }, [nftId, activityPage, activityTypeFilter]);

  useEffect(() => {
    async function fetchHistory(url: string) {
      return fetchAllPages(url).then((response: NFTHistory[]) => {
        setNftHistory(response);
      });
    }
    if (nftId) {
      const initialUrlHistory = `${publicEnv.API_ENDPOINT}/api/nft_history/${MEMELAB_CONTRACT}/${nftId}`;
      fetchHistory(initialUrlHistory);
    }
  }, [nftId]);

  function printContent() {
    if (activeTab === MEME_FOCUS.ACTIVITY) {
      return printActivity();
    }

    if (activeTab === MEME_FOCUS.THE_ART) {
      return printTheArt();
    }

    if (activeTab === MEME_FOCUS.COLLECTORS) {
      return printHodlers();
    }

    if (activeTab === MEME_FOCUS.TIMELINE) {
      return printTimeline();
    }

    return (
      <Container className="p-0">
        <Row className={connectedProfile ? styles.nftImagePadding : ""}>
          {[MEME_FOCUS.LIVE, MEME_FOCUS.YOUR_CARDS].includes(activeTab!) &&
            nft && (
              <>
                <Col
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 6 }}
                  lg={{ span: 6 }}
                  className={`${styles.nftImageWrapper} pt-2 pb-5`}>
                  <NFTImage
                    nft={nft}
                    animation={true}
                    height={650}
                    showBalance={true}
                  />
                </Col>
                {activeTab === MEME_FOCUS.LIVE && <>{printLive()}</>}
                {activeTab === MEME_FOCUS.YOUR_CARDS && <>{printYourCards()}</>}
              </>
            )}
        </Row>
        <Row>
          {activeTab === MEME_FOCUS.LIVE && (
            <>
              {printMemeReferences(
                originalMemes,
                "the-memes",
                originalMemesLoaded
              )}
            </>
          )}
          {activeTab === MEME_FOCUS.YOUR_CARDS && <>{printYourCardsSub()}</>}
        </Row>
      </Container>
    );
  }

  function printLive() {
    if (nft && nftMeta) {
      return (
        <Col
          xs={{ span: 12 }}
          sm={{ span: 12 }}
          md={{ span: 6 }}
          lg={{ span: 6 }}
          className="pt-2">
          <Container className="p-0">
            <Row className="pt-3">
              <Col>
                <h3>NFT</h3>
              </Col>
            </Row>
            <Row>
              <Col>
                <Table bordered={false}>
                  <tbody>
                    <tr>
                      <td>Artist Name</td>
                      <td>{nft.artist}</td>
                    </tr>
                    <tr>
                      <td>Artist Profile</td>
                      <td>
                        <ArtistProfileHandle nft={nft} />
                      </td>
                    </tr>
                    <tr>
                      <td>Collection</td>
                      <td>
                        <Link
                          href={`/meme-lab/collection/${encodeURIComponent(
                            nftMeta.metadata_collection.replaceAll(" ", "-")
                          )}`}>
                          {nftMeta.metadata_collection}
                        </Link>
                      </td>
                    </tr>
                    {nftMeta.website && (
                      <tr>
                        <td>Website</td>
                        <td>
                          {nftMeta.website.split(" ").map((w) => (
                            <Fragment key={`meta-website-${w}`}>
                              <Link
                                href={addProtocol(w)}
                                target="_blank"
                                rel="noreferrer">
                                {w}
                              </Link>
                              &nbsp;&nbsp;
                            </Fragment>
                          ))}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td>Mint Date</td>
                      <td>{printMintDate(nft.mint_date)}</td>
                    </tr>
                    <NftPageStats nft={nft} />
                  </tbody>
                </Table>
              </Col>
            </Row>
            <Row>
              <Col>
                <h3>Meme Collectors</h3>
              </Col>
            </Row>
            <Row>
              <Col>
                <Table bordered={false} className={styles.hodlersTableLive}>
                  <tbody>
                    <tr>
                      <td>Edition Size</td>
                      <td className="text-right">
                        {numberWithCommas(nftMeta.edition_size)}
                      </td>
                      <td className="text-right">
                        {nftMeta.edition_size_rank}/{nftMeta.collection_size}
                      </td>
                    </tr>
                    {nftMeta.burnt > 0 && (
                      <>
                        <tr>
                          <td>
                            <span className="d-flex align-items-center gap-2">
                              <span>Burnt</span>
                              <FontAwesomeIcon
                                icon={faFire}
                                style={{ height: "22px", color: "#c51d34" }}
                              />
                            </span>
                          </td>
                          <td className="text-right">
                            {numberWithCommas(nftMeta.burnt)}
                          </td>
                        </tr>
                        <tr>
                          <td>Edition Size ex. Burnt</td>
                          <td className="text-right">
                            {numberWithCommas(nftMeta.edition_size_not_burnt)}
                          </td>
                          <td className="text-right">
                            {nftMeta.edition_size_not_burnt_rank}/
                            {nftMeta.collection_size}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td>6529 Museum</td>
                      <td className="text-right">
                        {numberWithCommas(nftMeta.museum_holdings)}
                      </td>
                      <td className="text-right">
                        {nftMeta.museum_holdings_rank}/{nftMeta.collection_size}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Edition Size ex.
                        {nftMeta.burnt > 0 && " Burnt and"} 6529 Museum
                      </td>
                      <td className="text-right">
                        {numberWithCommas(nftMeta.edition_size_cleaned)}
                      </td>
                      <td className="text-right">
                        {nftMeta.edition_size_cleaned_rank}/
                        {nftMeta.collection_size}
                      </td>
                    </tr>
                    <tr>
                      <td>Collectors</td>
                      <td className="text-right">
                        {numberWithCommas(nftMeta.hodlers)}
                      </td>
                      <td className="text-right">
                        {nftMeta.hodlers_rank}/{nftMeta.collection_size}
                      </td>
                    </tr>
                    <tr>
                      <td>% Unique</td>
                      <td className="text-right">
                        {Math.round(nftMeta.percent_unique * 100 * 10) / 10}%
                      </td>
                      <td className="text-right">
                        {nftMeta.percent_unique_rank}/{nftMeta.collection_size}
                      </td>
                    </tr>
                    {nftMeta.burnt > 0 && (
                      <tr>
                        <td>% Unique ex. Burnt</td>
                        <td className="text-right">
                          {Math.round(
                            nftMeta.percent_unique_not_burnt * 100 * 10
                          ) / 10}
                          %
                        </td>
                        <td className="text-right">
                          {nftMeta.percent_unique_not_burnt_rank}/
                          {nftMeta.collection_size}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td>
                        % Unique ex.{nftMeta.burnt > 0 && " Burnt and"} 6529
                        Museum
                      </td>
                      <td className="text-right">
                        {Math.round(nftMeta.percent_unique_cleaned * 100 * 10) /
                          10}
                        %
                      </td>
                      <td className="text-right">
                        {nftMeta.percent_unique_cleaned_rank}/
                        {nftMeta.collection_size}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
            {nft.has_distribution ? (
              <Row className="pt-3 pb-3">
                <Col>
                  <Link href={`/meme-lab/${nft.id}/distribution`}>
                    Distribution Plan
                  </Link>
                </Col>
              </Row>
            ) : (
              ""
            )}
            {nftBalance > 0 && (
              <Row className="pt-3">
                <Col>
                  <h3 className="font-color">
                    You Own {nftBalance} edition{nftBalance > 1 && "s"}
                  </h3>
                </Col>
              </Row>
            )}
            {(!capacitor.isIos || country === "US") && (
              <Row className="pt-4">
                <Col>
                  <NFTMarketplaceLinks contract={nft.contract} id={nft.id} />
                </Col>
              </Row>
            )}
          </Container>
        </Col>
      );
    }
  }

  function getTokenCount(transactions: Transaction[]) {
    let count = 0;
    [...transactions].map((e) => {
      count += e.token_count;
    });
    return count;
  }

  function printYourCardsSub() {
    return (
      <>
        {transactions.length > 0 && (
          <>
            <Row className="pt-4">
              <Col>
                <h3>Your Transaction History</h3>
              </Col>
            </Row>
            <Row className={`pt-4 ${styles.transactionsScrollContainer}`}>
              <Col>
                <Table bordered={false} className={styles.transactionsTable}>
                  <tbody>
                    {transactions.map((tr) => (
                      <LatestActivityRow
                        tr={tr}
                        key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
                      />
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </>
        )}
      </>
    );
  }

  function printYourCards() {
    const firstAcquired = [...transactions].sort((a, b) =>
      a.transaction_date > b.transaction_date ? 1 : -1
    )[0];

    const airdropped = transactions.filter(
      (t) => t.value === 0 && areEqualAddresses(t.from_address, NULL_ADDRESS)
    );

    const wallets = connectedProfile?.wallets ?? [];
    const transferredIn =
      wallets.length === 0
        ? []
        : transactions.filter(
            (t) =>
              !areEqualAddresses(t.from_address, NULL_ADDRESS) &&
              wallets.some((w) => areEqualAddresses(t.to_address, w)) &&
              t.value === 0
          );

    const transferredOut =
      wallets.length === 0
        ? []
        : transactions.filter(
            (t) =>
              wallets.some((w) => areEqualAddresses(t.from_address, w)) &&
              t.value === 0
          );

    const bought =
      wallets.length === 0
        ? []
        : transactions.filter(
            (t) =>
              wallets.some((w) => areEqualAddresses(t.to_address, w)) &&
              t.value > 0
          );

    let boughtSum = 0;
    bought.map((b) => {
      boughtSum += b.value;
    });

    const sold =
      wallets.length === 0
        ? []
        : transactions.filter(
            (t) =>
              wallets.some((w) => areEqualAddresses(t.from_address, w)) &&
              t.value > 0
          );

    let soldSum = 0;
    sold.map((b) => {
      soldSum += b.value;
    });

    return (
      <Col
        xs={{ span: 12 }}
        sm={{ span: 12 }}
        md={{ span: 6 }}
        lg={{ span: 6 }}>
        <Container className="p-0">
          <Row>
            {wallets.length === 0 && (
              <Row className="pt-2">
                <Col>
                  <h4>Connect your wallet to view your cards.</h4>
                </Col>
              </Row>
            )}
            {nftBalance === 0 && wallets.length > 0 && nft && userLoaded && (
              <Row className="pt-2">
                <Col>
                  <h3>You don&apos;t own any editions of Card {nft.id}</h3>
                </Col>
              </Row>
            )}
            {transactions.length > 0 && wallets && (
              <>
                <Row className="pt-2 pb-2">
                  <Col>
                    <h3>Overview</h3>
                  </Col>
                </Row>
                <Row className={`pb-2 ${styles.overviewColumn}`}>
                  <Col>
                    First acquired{" "}
                    {printMintDate(new Date(firstAcquired.transaction_date))}
                  </Col>
                </Row>
                {airdropped.length > 0 && (
                  <Row className={`pt-1 ${styles.overviewColumn}`}>
                    <Col>
                      {getTokenCount(airdropped)} card
                      {getTokenCount(airdropped) > 1 && "s"} airdropped
                    </Col>
                  </Row>
                )}
                {bought.length > 0 && (
                  <Row className={`pt-1 ${styles.overviewColumn}`}>
                    <Col>
                      {getTokenCount(bought)} card
                      {getTokenCount(bought) > 1 && "s"} bought for {boughtSum}{" "}
                      ETH
                    </Col>
                  </Row>
                )}
                {transferredIn.length > 0 && (
                  <Row className={`pt-1 ${styles.overviewColumn}`}>
                    <Col>
                      {getTokenCount(transferredIn)} card
                      {getTokenCount(transferredIn) > 1 && "s"} transferred in
                    </Col>
                  </Row>
                )}
                {sold.length > 0 && (
                  <Row className={`pt-1 ${styles.overviewColumn}`}>
                    <Col>
                      {getTokenCount(sold)} card
                      {getTokenCount(sold) > 1 && "s"} sold for {soldSum} eth
                    </Col>
                  </Row>
                )}
                {transferredOut.length > 0 && (
                  <Row className={`pt-1 ${styles.overviewColumn}`}>
                    <Col>
                      {getTokenCount(transferredOut)} card
                      {getTokenCount(transferredOut) > 1 && "s"} transferred out
                    </Col>
                  </Row>
                )}
              </>
            )}
          </Row>
        </Container>
      </Col>
    );
  }

  function carouselHandlerSlide(event: any) {
    if (event === 0) {
      setFullscreenElementId("the-art-fullscreen-animation");
    } else {
      setFullscreenElementId("the-art-fullscreen-img");
    }
  }

  function printTheArt() {
    // carouselHandlerSlid();
    if (nft && nftMeta) {
      return (
        <>
          <Container className="p-0">
            <Row className="position-relative">
              {isFullScreenSupported && (
                <FontAwesomeIcon
                  icon={faExpandAlt}
                  className={styles.fullScreen}
                  onClick={() =>
                    fullscreenElementId &&
                    enterArtFullScreen(fullscreenElementId)
                  }
                />
              )}
              {nft.animation ? (
                <Carousel
                  className={styles.memesCarousel}
                  interval={null}
                  indicators={false}
                  wrap={false}
                  onSlide={carouselHandlerSlide}>
                  <Carousel.Item className="text-center">
                    <div className="pt-4 pb-3">
                      {nft.metadata.animation_details.format}
                    </div>
                    <NFTImage
                      nft={nft}
                      animation={true}
                      height={650}
                      transparentBG={true}
                      showOriginal={true}
                      showBalance={false}
                      id="the-art-fullscreen-animation"
                    />
                  </Carousel.Item>
                  <Carousel.Item className="text-center">
                    <div className="pt-4 pb-3">
                      {nft.metadata.image_details.format}
                    </div>
                    <NFTImage
                      nft={nft}
                      animation={false}
                      height={650}
                      transparentBG={true}
                      showOriginal={true}
                      showBalance={false}
                      id="the-art-fullscreen-img"
                    />
                  </Carousel.Item>
                </Carousel>
              ) : (
                <>
                  <Col xs={12} className="text-center pb-5">
                    {nft.metadata.image_details.format}
                  </Col>
                  <NFTImage
                    nft={nft}
                    animation={false}
                    height={650}
                    showBalance={false}
                    transparentBG={true}
                    showOriginal={true}
                    id="the-art-fullscreen-img"
                  />
                </>
              )}
            </Row>
          </Container>
          <Container className="pt-5 pb-3">
            <Row>
              <Col>
                <Container>
                  <Row>
                    <Col>
                      <Row>
                        <Col>
                          <h3>Arweave Links</h3>
                        </Col>
                      </Row>
                      <Row>
                        <Col className="tw-flex tw-items-center tw-gap-1">
                          <span>{nft.metadata.image_details.format}</span>
                          <Link
                            className={styles.arweaveLink}
                            href={nft.metadata.image}
                            target="_blank"
                            rel="noreferrer">
                            {nft.metadata.image}
                          </Link>
                          <Download
                            href={nft.metadata.image}
                            name={nft.name}
                            extension={nft.metadata.image_details.format}
                          />
                        </Col>
                      </Row>
                      {(nft.metadata.animation ||
                        nft.metadata.animation_url) && (
                        <Row className="pt-3">
                          <Col className="tw-flex tw-items-center tw-gap-1">
                            <span>{nft.metadata.animation_details.format}</span>
                            <Link
                              className={styles.arweaveLink}
                              href={
                                nft.metadata.animation
                                  ? nft.metadata.animation
                                  : nft.metadata.animation_url
                              }
                              target="_blank"
                              rel="noreferrer">
                              {nft.metadata.animation
                                ? nft.metadata.animation
                                : nft.metadata.animation_url}
                            </Link>
                            <Download
                              href={
                                nft.metadata.animation
                                  ? nft.metadata.animation
                                  : nft.metadata.animation_url
                              }
                              name={nft.name}
                              extension={nft.metadata.animation_details.format}
                            />
                          </Col>
                        </Row>
                      )}
                    </Col>
                  </Row>
                </Container>
              </Col>
            </Row>
          </Container>
          <Container className="pt-3 pb-3">
            <Row>
              <Col
                xs={{ span: 12 }}
                sm={{ span: 6 }}
                md={{ span: 6 }}
                lg={{ span: 6 }}>
                <Container>
                  <Row>
                    <Col>
                      <h3>Card Details</h3>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Table bordered={false}>
                        <tbody>
                          <tr>
                            <td>Edition Size</td>
                            <td>{nft.supply}</td>
                          </tr>
                          <tr>
                            <td>Collection</td>
                            <td>{nft.collection}</td>
                          </tr>
                          <tr>
                            <td>Artist Name</td>
                            <td>{nft.artist}</td>
                          </tr>
                          <tr>
                            <td>Artist Profile</td>
                            <td>
                              <ArtistProfileHandle nft={nft} />
                            </td>
                          </tr>
                          <tr>
                            <td>Mint Date</td>
                            <td>{printMintDate(nft.mint_date)}</td>
                          </tr>
                          <tr>
                            <td>File Type</td>
                            <td>{getFileTypeFromMetadata(nft.metadata)}</td>
                          </tr>
                          <tr>
                            <td>Dimensions</td>
                            <td>{getDimensionsFromMetadata(nft.metadata)}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </Container>
              </Col>
              {nft.metadata.attributes.some(
                (a: any) =>
                  a.trait_type.startsWith("Meme Card Reference") &&
                  a.value != "None" &&
                  a.value
              ) && (
                <Col
                  xs={{ span: 12 }}
                  sm={{ span: 6 }}
                  md={{ span: 6 }}
                  lg={{ span: 6 }}>
                  <Container>
                    <Row>
                      <Col>
                        <h3>References</h3>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <Table>
                          <tbody>
                            {nft.metadata.attributes
                              .filter(
                                (a: any) =>
                                  a.trait_type.startsWith(
                                    "Meme Card Reference"
                                  ) &&
                                  a.value != "None" &&
                                  a.value
                              )
                              .map((a: any) => (
                                <tr key={`${a.trait_type}-${a.value}`}>
                                  <td>{a.trait_type}</td>
                                  <td>{a.value}</td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </Container>
                </Col>
              )}
            </Row>
          </Container>
          <Container className="pt-3 pb-3">
            <Row>
              <Col>
                <Container>
                  <Row>
                    <Col>
                      <h3>Card Description</h3>
                    </Col>
                  </Row>
                  <Row>
                    <Col
                      dangerouslySetInnerHTML={{
                        __html: parseNftDescriptionToHtml(nft.description),
                      }}></Col>
                  </Row>
                </Container>
              </Col>
            </Row>
          </Container>
          <Container className="pt-3 pb-3">
            <Row>
              <Col>
                <Container>
                  <Row>
                    <Col>
                      <h3>Properties</h3>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <NFTAttributes attributes={nft.metadata.attributes} />
                    </Col>
                  </Row>
                </Container>
              </Col>
            </Row>
          </Container>
        </>
      );
    }
  }

  function printHodlers() {
    if (nft && nftId) {
      return (
        <Row className="p-0">
          <Col>
            <MemeLabLeaderboard
              contract={nft.contract}
              nftId={parseInt(nftId)}
            />
          </Col>
        </Row>
      );
    }
  }

  function printTimeline() {
    return (
      <Container className="pt-3 pb-5 no-padding">
        <Row>
          <Col xs={12} md={{ span: 10, offset: 1 }}>
            {nft && <Timeline nft={nft} steps={nftHistory} />}
          </Col>
        </Row>
      </Container>
    );
  }

  function printActivity() {
    return (
      <Container className="p-0">
        {nft && (
          <>
            <Row className="pt-2">
              <Col>
                <h3>Card Volumes</h3>
              </Col>
            </Row>
            <Row className="pt-2">
              <Col>
                <Table className="text-center">
                  <thead>
                    <tr>
                      <th>24 Hours</th>
                      <th>7 Days</th>
                      <th>30 Days</th>
                      <th>All Time</th>
                    </tr>
                  </thead>
                  <tbody className="pt-3">
                    <tr>
                      <td>
                        {nft.total_volume_last_24_hours > 0
                          ? `${numberWithCommas(
                              Math.round(nft.total_volume_last_24_hours * 100) /
                                100
                            )} ETH`
                          : `N/A`}
                      </td>
                      <td>
                        {nft.total_volume_last_7_days > 0
                          ? `${numberWithCommas(
                              Math.round(nft.total_volume_last_7_days * 100) /
                                100
                            )} ETH`
                          : `N/A`}
                      </td>
                      <td>
                        {nft.total_volume_last_1_month > 0
                          ? `${numberWithCommas(
                              Math.round(nft.total_volume_last_1_month * 100) /
                                100
                            )} ETH`
                          : `N/A`}
                      </td>
                      <td>
                        {nft.total_volume > 0
                          ? `${numberWithCommas(
                              Math.round(nft.total_volume * 100) / 100
                            )} ETH`
                          : `N/A`}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          </>
        )}
        <Row className="pt-3">
          <Col
            className="d-flex align-items-center"
            xs={{ span: 7 }}
            sm={{ span: 7 }}
            md={{ span: 9 }}
            lg={{ span: 10 }}>
            <h3>Card Activity</h3>
          </Col>
          <Col
            xs={{ span: 5 }}
            sm={{ span: 5 }}
            md={{ span: 3 }}
            lg={{ span: 2 }}>
            <Dropdown
              className={styles.activityFilterDropdown}
              drop={"down-centered"}>
              <Dropdown.Toggle>Filter: {activityTypeFilter}</Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.values(TypeFilter).map((filter) => (
                  <Dropdown.Item
                    key={`nft-activity-${filter}`}
                    onClick={() => {
                      setActivityPage(1);
                      setActivityTypeFilter(filter);
                    }}>
                    {filter}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
        {activity.length > 0 ? (
          <Row className={`pt-2 ${styles.transactionsScrollContainer}`}>
            <Col>
              <Table bordered={false} className={styles.transactionsTable}>
                <tbody>
                  {activity.map((tr) => (
                    <LatestActivityRow
                      tr={tr}
                      nft={nft}
                      key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
                    />
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        ) : (
          <Row>
            <Col>
              <NothingHereYetSummer />
            </Col>
          </Row>
        )}
        {activity.length > 0 && (
          <Row className="text-center pt-2 pb-3">
            <Pagination
              page={activityPage}
              pageSize={ACTIVITY_PAGE_SIZE}
              totalResults={activityTotalResults}
              setPage={function (newPage: number) {
                setActivityPage(newPage);
                window.scrollTo(0, 0);
              }}
            />
          </Row>
        )}
      </Container>
    );
  }

  return (
    <Container fluid className={styles.mainContainer}>
      <Row>
        <Col>
          <Container className="pt-4 pb-4">
            <Row>
              <Col>
                <h1>
                  <span className="font-lightest">Meme</span> Lab
                </h1>
              </Col>
              {/* {nft && (
                  <Col className="d-flex align-items-center justify-content-end">
                    <TwitterShareButton
                      className="twitter-share-button"
                      url={window.location.href.split("?")[0]}
                      title={`Meme Lab Card #${nft.id} \n${nft.name}\nby ${nft.artist}\n\n#6529SEIZE\n\n`}>
                      <TwitterIcon
                        size={30}
                        round
                        iconFillColor="white"
                        bgStyle={{ fill: "transparent" }}
                      />
                      Tweet
                    </TwitterShareButton>
                  </Col>
                )} */}
            </Row>
            {nftMeta && nft && (
              <>
                <Row className="pt-2">
                  <Col className="d-flex">
                    <NftNavigation
                      nftId={nft.id}
                      path="/meme-lab"
                      startIndex={1}
                      endIndex={nftMeta.collection_size}
                    />
                  </Col>
                </Row>
                <Row className="pt-2">
                  <Col>
                    <h2 className="float-left">Card {nft.id} -&nbsp;</h2>
                    <h2 className="float-left">{nft.name}</h2>
                  </Col>
                </Row>
                <Row className="pt-3 pb-3">
                  <Col className="tw-flex tw-gap-3 tw-items-center tw-flex-wrap">
                    {MEME_TABS.map((tab) => (
                      <TabButton
                        key={`${nft.id}-${nft.contract}-${tab.focus}-tab`}
                        tab={tab}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                      />
                    ))}
                  </Col>
                </Row>
                {printContent()}
              </>
            )}
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
