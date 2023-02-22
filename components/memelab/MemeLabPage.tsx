import styles from "./MemeLab.module.scss";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import {
  Container,
  Row,
  Col,
  Table,
  Carousel,
  Dropdown,
} from "react-bootstrap";
import { useAccount } from "wagmi";
import {
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NULL_ADDRESS,
} from "../../constants";
import { DBResponse } from "../../entities/IDBResponse";
import { LabNFT, LabExtendedData, NFT } from "../../entities/INFT";
import {
  getDateDisplay,
  areEqualAddresses,
  enterArtFullScreen,
  fullScreenSupported,
  numberWithCommas,
  splitArtists,
} from "../../helpers/Helpers";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import Download from "../download/Download";
import LatestActivityRow from "../latest-activity/LatestActivityRow";
import { Transaction } from "../../entities/ITransaction";
import { useRouter } from "next/router";
import { TDHMetrics } from "../../entities/ITDH";
import { TwitterIcon, TwitterShareButton } from "react-share";
import { fetchUrl } from "../../services/6529api";
import Pagination from "../pagination/Pagination";
import { TypeFilter } from "../latest-activity/LatestActivity";

const NFTImage = dynamic(() => import("../nft-image/NFTImage"), {
  ssr: false,
});

const MemeLabLeaderboard = dynamic(
  () => import("../leaderboard/MemeLabLeaderboard"),
  {
    ssr: false,
  }
);

interface MemeTab {
  focus: MEME_FOCUS;
  title: string;
}

export enum MEME_FOCUS {
  LIVE = "live",
  YOUR_CARDS = "your-cards",
  THE_ART = "the-art",
  HODLERS = "hodlers",
  ACTIVITY = "activity",
}

const ACTIVITY_PAGE_SIZE = 25;

export default function LabPage() {
  const router = useRouter();

  const [isFullScreenSupported, setIsFullScreenSupported] = useState(false);

  const [nftId, setNftId] = useState<string>();
  const [fullscreenElementId, setFullscreenElementId] = useState<string>(
    "the-art-fullscreen-img"
  );

  const [activeTab, setActiveTab] = useState<MEME_FOCUS>();

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const { address, connector, isConnected } = useAccount();

  const [nft, setNft] = useState<LabNFT>();
  const [originalMemes, setOriginalMemes] = useState<NFT[]>([]);
  const [nftMeta, setNftMeta] = useState<LabExtendedData>();
  const [nftBalance, setNftBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activity, setActivity] = useState<Transaction[]>([]);

  const [myOwner, setMyOwner] = useState<TDHMetrics>();

  const [userLoaded, setUserLoaded] = useState(false);

  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalResults, setActivityTotalResults] = useState(0);

  const [activityTypeFilter, setActivityTypeFilter] = useState<TypeFilter>(
    TypeFilter.ALL
  );

  const liveTab = {
    focus: MEME_FOCUS.LIVE,
    title: "Live",
  };
  const cardsTab = {
    focus: MEME_FOCUS.YOUR_CARDS,
    title: "Your Cards",
  };
  const artTab = {
    focus: MEME_FOCUS.THE_ART,
    title: "The Art",
  };
  const hodlersTab = {
    focus: MEME_FOCUS.HODLERS,
    title: "HODLers",
  };
  const activityTab = {
    focus: MEME_FOCUS.ACTIVITY,
    title: "Activity",
  };

  const MEME_TABS: MemeTab[] = [
    liveTab,
    cardsTab,
    artTab,
    hodlersTab,
    activityTab,
  ];

  useEffect(() => {
    if (router.isReady) {
      setIsFullScreenSupported(fullScreenSupported());
      let initialFocus = MEME_FOCUS.LIVE;

      const routerFocus = router.query.focus;
      if (routerFocus) {
        const resolvedRouterFocus = Object.values(MEME_FOCUS).find(
          (sd) => sd == routerFocus
        );
        if (resolvedRouterFocus) {
          initialFocus = resolvedRouterFocus;
        }
      }
      if (router.query.id) {
        setNftId(router.query.id as string);
        setActiveTab(initialFocus);
      }
    }
  }, [router.isReady]);

  useEffect(() => {
    if (activeTab && router.isReady) {
      let query: any = { id: nftId };
      if (activeTab) {
        query.focus = activeTab;
      }
      if (router.query != query) {
        router.replace(
          {
            query: query,
          },
          undefined,
          { shallow: true }
        );
      }
    }
  }, [activeTab, router.isReady]);

  useEffect(() => {
    if (nftId) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/lab_extended_data?id=${nftId}`
      ).then((response: DBResponse) => {
        const nftMetas = response.data;
        if (nftMetas.length == 1) {
          setNftMeta(nftMetas[0]);
          fetchUrl(
            `${process.env.API_ENDPOINT}/api/nfts_memelab?id=${nftId}`
          ).then((response: DBResponse) => {
            const nft: LabNFT = response.data[0];
            setNft(nft);
            setBreadcrumbs([
              { display: "Home", href: "/" },
              { display: "Meme Lab", href: "/meme-lab" },
              { display: `Card ${nftId} - ${nft.name}` },
            ]);

            fetchUrl(
              `${
                process.env.API_ENDPOINT
              }/api/nfts?sort_direction=asc&contract=${MEMES_CONTRACT}&id=${nft.meme_references.join(
                ","
              )}`
            ).then((response: DBResponse) => {
              setOriginalMemes(response.data);
            });
          });
        } else {
          setNftMeta(undefined);
          setBreadcrumbs([
            { display: "Home", href: "/" },
            { display: "Meme Lab", href: "/meme-lab" },
            { display: `${nftId}` },
          ]);
        }
      });
    }
  }, [nftId]);

  useEffect(() => {
    if (address && nftId) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/transactions_memelab?wallet=${address}&id=${nftId}`
      ).then((response: DBResponse) => {
        setTransactions(response.data);
        let countIn = 0;
        let countOut = 0;
        response.data.map((d: Transaction) => {
          if (areEqualAddresses(address, d.from_address)) {
            countOut += d.token_count;
          }
          if (areEqualAddresses(address, d.to_address)) {
            countIn += d.token_count;
          }
        });
        setUserLoaded(true);
        setNftBalance(countIn - countOut);
      });
    }
  }, [nftId, address]);

  useEffect(() => {
    if (nftId) {
      let url = `${process.env.API_ENDPOINT}/api/transactions_memelab?id=${nftId}&page_size=${ACTIVITY_PAGE_SIZE}&page=${activityPage}`;
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
      }
      fetchUrl(url).then((response: DBResponse) => {
        setActivityTotalResults(response.count);
        setActivity(response.data);
      });
    }
  }, [nftId, activityPage, activityTypeFilter]);

  function printMintDate(date: Date) {
    const mintDate = new Date(date);
    return (
      <>
        {mintDate.toLocaleString("default", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}{" "}
        ({getDateDisplay(mintDate)})
      </>
    );
  }

  function printContent() {
    if (activeTab == MEME_FOCUS.ACTIVITY) {
      return printActivity();
    }

    if (activeTab == MEME_FOCUS.THE_ART) {
      return printTheArt();
    }

    if (activeTab == MEME_FOCUS.HODLERS) {
      return printHodlers();
    }

    return (
      <Container className="p-0">
        <Row>
          {[MEME_FOCUS.LIVE, MEME_FOCUS.YOUR_CARDS].includes(activeTab!) &&
            nft && (
              <>
                <Col
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 6 }}
                  lg={{ span: 6 }}
                  className="pt-2">
                  <NFTImage
                    nft={nft}
                    animation={true}
                    height={650}
                    balance={nftBalance}
                  />
                </Col>
                {activeTab == MEME_FOCUS.LIVE && <>{printLive()}</>}
                {activeTab == MEME_FOCUS.YOUR_CARDS && <>{printYourCards()}</>}
              </>
            )}
        </Row>
        <Row>
          {activeTab == MEME_FOCUS.LIVE && <>{printLiveSub()}</>}
          {activeTab == MEME_FOCUS.YOUR_CARDS && <>{printYourCardsSub()}</>}
        </Row>
      </Container>
    );
  }

  function printLiveSub() {
    return (
      <>
        <Row className="pt-5">
          <Col>
            <Image
              loading={"lazy"}
              width="0"
              height="0"
              style={{ width: "250px", height: "auto" }}
              src="/memelab.png"
              alt="memelab"
            />
          </Col>
        </Row>
        <Row className="pt-4 pb-4">
          <Col>
            References from <a href="/the-memes">The Memes</a> collection
          </Col>
        </Row>
        {originalMemes.length > 0 && (
          <Row className="pt-2 pb-2">
            {originalMemes.map((nft) => {
              return (
                <Col
                  key={`${nft.contract}-${nft.id}`}
                  className="pt-3 pb-3"
                  xs={{ span: 6 }}
                  sm={{ span: 4 }}
                  md={{ span: 3 }}
                  lg={{ span: 3 }}>
                  <Container fluid className="no-padding">
                    <Row>
                      <Col>
                        <a href={`/the-memes/${nft.id}`}>
                          <NFTImage
                            nft={nft}
                            animation={false}
                            height={300}
                            balance={0}
                            showThumbnail={true}
                          />
                        </a>
                      </Col>
                    </Row>
                    <Row>
                      <Col className="text-center pt-2">
                        <b>
                          #{nft.id} - {nft.name}
                        </b>
                      </Col>
                    </Row>
                    <Row>
                      <Col className="text-center pt-2">
                        Artist: {nft.artist}
                      </Col>
                    </Row>
                  </Container>
                </Col>
              );
            })}
          </Row>
        )}
      </>
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
                      <td>Artist</td>
                      <td>{nft.artist}</td>
                    </tr>
                    <tr>
                      <td>Collection</td>
                      <td>
                        <a
                          href={`/meme-lab/collection/${nftMeta.metadata_collection.replace(
                            " ",
                            "-"
                          )}`}>
                          {nftMeta.metadata_collection}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td>Mint Date</td>
                      <td>{printMintDate(nft.mint_date)}</td>
                    </tr>
                    <tr>
                      <td>Mint Price</td>
                      <td>
                        {nft.mint_price ? `${nft.mint_price} ETH` : `N/A`}
                      </td>
                    </tr>
                    <tr>
                      <td>Floor Price</td>
                      <td>
                        {nft.floor_price
                          ? `${numberWithCommas(
                              Math.round(nft.floor_price * 100) / 100
                            )} ETH`
                          : `N/A`}
                      </td>
                    </tr>
                    <tr>
                      <td>Market Cap</td>
                      <td>
                        {nft.market_cap
                          ? `${numberWithCommas(
                              Math.round(nft.market_cap * 100) / 100
                            )} ETH`
                          : `N/A`}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
            <Row>
              <Col>
                <h3>Meme HODLers</h3>
              </Col>
            </Row>
            <Row>
              <Col>
                <Table bordered={false} className={styles.hodlersTableLive}>
                  <tbody>
                    <tr>
                      <td>Edition Size</td>
                      <td className="text-right">{nftMeta.edition_size}</td>
                      <td className="text-right">
                        {nftMeta.edition_size_rank}/{nftMeta.collection_size}
                      </td>
                    </tr>
                    <tr>
                      <td>6529 Museum</td>
                      <td className="text-right">{nftMeta.museum_holdings}</td>
                      <td className="text-right">
                        {nftMeta.museum_holdings_rank}/{nftMeta.collection_size}
                      </td>
                    </tr>
                    <tr>
                      <td>Edition Size ex. 6529 Museum</td>
                      <td className="text-right">
                        {nftMeta.edition_size_cleaned}
                      </td>
                      <td className="text-right">
                        {nftMeta.edition_size_cleaned_rank}/
                        {nftMeta.collection_size}
                      </td>
                    </tr>
                    <tr>
                      <td>HODLers</td>
                      <td className="text-right">{nftMeta.hodlers}</td>
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
                    <tr>
                      <td>% Unique ex. 6529 Museum</td>
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
            {nftBalance > 0 && (
              <Row className="pt-3">
                <Col>
                  <h3 className="font-color">
                    You Own {nftBalance} edition{nftBalance > 1 && "s"}
                  </h3>
                </Col>
              </Row>
            )}
            <Row className="pt-4">
              <Col>
                <a
                  href={`https://opensea.io/assets/ethereum/${MEMELAB_CONTRACT}/${nft.id}`}
                  target="_blank"
                  rel="noreferrer">
                  <Image
                    className={styles.marketplace}
                    src="/opensea.png"
                    alt="opensea"
                    width={40}
                    height={40}
                  />
                </a>
                {/* <a
                      href={`https://looksrare.org/collections/${MEMES_CONTRACT}/${nft.id}`}
                      target="_blank"
                      rel="noreferrer">
                      <Image
                        className={styles.marketplace}
                        src="/looksrare.png"
                        alt="looksrare"
                        width={40}
                        height={40}
                      />
                    </a> */}
                <a
                  href={`https://x2y2.io/eth/${MEMELAB_CONTRACT}/${nft.id}`}
                  target="_blank"
                  rel="noreferrer">
                  <Image
                    className={styles.marketplace}
                    src="/x2y2.png"
                    alt="x2y2"
                    width={40}
                    height={40}
                  />
                </a>
              </Col>
            </Row>
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

    const airdropped = transactions.filter((t) =>
      areEqualAddresses(t.from_address, NULL_ADDRESS)
    );

    const transferredIn = !address
      ? []
      : transactions.filter(
          (t) =>
            !areEqualAddresses(t.from_address, NULL_ADDRESS) &&
            areEqualAddresses(t.to_address, address) &&
            t.value == 0
        );

    const transferredOut = !address
      ? []
      : transactions.filter(
          (t) => areEqualAddresses(t.from_address, address) && t.value == 0
        );

    const bought = !address
      ? []
      : transactions.filter(
          (t) => areEqualAddresses(t.to_address, address) && t.value > 0
        );

    let boughtSum = 0;
    bought.map((b) => {
      boughtSum += b.value;
    });

    const sold = !address
      ? []
      : transactions.filter(
          (t) => areEqualAddresses(t.from_address, address) && t.value > 0
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
            {!address && (
              <Row className="pt-2">
                <Col>
                  <h4>Connect your wallet to view your cards.</h4>
                </Col>
              </Row>
            )}
            {nftBalance == 0 && address && nft && userLoaded && (
              <Row className="pt-2">
                <Col>
                  <h3>You don&apos;t own any editions of Card {nft.id}</h3>
                </Col>
              </Row>
            )}
            {transactions.length > 0 && address && (
              <>
                {nftBalance > 0 && myOwner && (
                  <>
                    <Row className="pt-2">
                      <Col
                        xs={{ span: 12 }}
                        sm={{ span: 12 }}
                        md={{ span: 12 }}
                        lg={{ span: 8 }}>
                        <Table bordered={false}>
                          <tbody>
                            <tr className={`${styles.overviewColumn}`}>
                              <td>Cards</td>
                              <td className="text-right">{`x${nftBalance}`}</td>
                            </tr>
                            <tr className={`pt-1 ${styles.overviewColumn}`}>
                              <td>Rank</td>
                              <td className="text-right">
                                {`#${numberWithCommas(
                                  myOwner.dense_rank_balance
                                )}`}
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </>
                )}
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
    if (event == 0) {
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
                  icon="expand-alt"
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
                      balance={0}
                      transparentBG={true}
                      showOriginal={true}
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
                      balance={0}
                      transparentBG={true}
                      showOriginal={true}
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
                    balance={0}
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
                        <Col>
                          {nft.metadata.image_details.format}{" "}
                          <a
                            className={styles.arweaveLink}
                            href={nft.metadata.image}
                            target="_blank"
                            rel="noreferrer">
                            {nft.metadata.image}
                          </a>
                          <Download
                            href={nft.metadata.image}
                            name={nft.name}
                            extension={nft.metadata.image_details.format}
                          />
                        </Col>
                      </Row>
                      {nft.metadata.animation && (
                        <Row className="pt-3">
                          <Col>
                            {nft.metadata.animation_details.format}{" "}
                            <a
                              className={styles.arweaveLink}
                              href={nft.metadata.animation}
                              target="_blank"
                              rel="noreferrer">
                              {nft.metadata.animation}
                            </a>
                            <Download
                              href={nft.metadata.animation}
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
                            <td>Artist</td>
                            <td>{nft.artist}</td>
                          </tr>
                          <tr>
                            <td>Mint Date</td>
                            <td>{printMintDate(nft.mint_date)}</td>
                          </tr>
                          <tr>
                            <td>File Type</td>
                            <td>
                              {nft.animation
                                ? nft.metadata.animation_details?.format
                                : nft.metadata.image_details.format}
                            </td>
                          </tr>
                          <tr>
                            <td>Dimensions</td>
                            <td>
                              {nft.metadata.image_details.width} x{" "}
                              {nft.metadata.image_details.height}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </Container>
              </Col>
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
                        __html: parseDescription(nft.description),
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
                    {nft.metadata.attributes.map((a: any) => (
                      <Col
                        key={a.trait_type}
                        xs={{ span: 6 }}
                        sm={{ span: 3 }}
                        md={{ span: 2 }}
                        lg={{ span: 2 }}
                        className="pt-2 pb-2">
                        <Container>
                          <Row>
                            <Col className={styles.nftAttribute}>
                              <span>{a.trait_type}</span>
                              <br />
                              <span title={a.value}>{a.value}</span>
                            </Col>
                          </Row>
                        </Container>
                      </Col>
                    ))}
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
              page={1}
              pageSize={ACTIVITY_PAGE_SIZE}
            />
          </Col>
        </Row>
      );
    }
  }

  function parseDescription(description: string) {
    let d = description.replaceAll("\n", "<br />");
    d = d.replace(
      /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/gi,
      '<a href=\'$1\' target="blank" rel="noreferrer">$1</a>'
    );
    return d;
  }

  function printActivity() {
    return (
      <Container className="p-0">
        <Row>
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
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <Container fluid className={styles.mainContainer}>
        <Row>
          <Col>
            <Container className="pt-4 pb-4">
              <Row>
                <Col>
                  <h1>MEME LAB</h1>
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
                    <Col>
                      {nftId && (
                        <>
                          <h2>
                            <a
                              href={`/meme-lab/${
                                parseInt(nftId) - 1
                              }?focus=${activeTab}`}
                              className={`${styles.nextPreviousNft} ${
                                parseInt(nftId) == 1
                                  ? styles.nftPreviousdisabled
                                  : ""
                              }`}>
                              <FontAwesomeIcon icon="chevron-circle-left" />
                            </a>
                          </h2>
                          <h2>
                            &nbsp;
                            <a
                              href={`/meme-lab/${
                                parseInt(nftId) + 1
                              }?focus=${activeTab}`}
                              className={`${styles.nextPreviousNft} ${
                                parseInt(nftId) == nftMeta.collection_size
                                  ? styles.nftNextdisabled
                                  : ""
                              }`}>
                              <FontAwesomeIcon icon="chevron-circle-right" />
                            </a>
                          </h2>
                        </>
                      )}
                    </Col>
                  </Row>
                  <Row className="pt-2">
                    <Col>
                      <h2>Card {nft.id} -&nbsp;</h2>
                      <h2>{nft.name}</h2>
                    </Col>
                  </Row>
                  <Row className="pt-3 pb-3">
                    <Col>
                      {MEME_TABS.map((tab) => (
                        <span
                          key={`${nft.id}-${nft.contract}-${tab.focus}-tab`}
                          className={`${styles.tabFocus} ${
                            activeTab == tab.focus ? styles.tabFocusActive : ""
                          }`}
                          onClick={() => {
                            setActiveTab(tab.focus);
                          }}>
                          {tab.title}
                        </span>
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
    </>
  );
}
