import styles from "./TheMemes.module.scss";

import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import {
  Container,
  Row,
  Col,
  Table,
  Tabs,
  Tab,
  Carousel,
} from "react-bootstrap";
import { useAccount } from "wagmi";
import { MEMES_CONTRACT, NULL_ADDRESS } from "../../constants";
import { DBResponse } from "../../entities/IDBResponse";
import { NFT, MemesExtendedData, NftTDH, NftRank } from "../../entities/INFT";
import {
  getDateDisplay,
  areEqualAddresses,
  enterArtFullScreen,
  fullScreenSupported,
  numberWithCommas,
} from "../../helpers/Helpers";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import Download from "../download/Download";
import LatestActivityRow from "../latest-activity/LatestActivityRow";
import { Transaction } from "../../entities/ITransaction";
import { useRouter } from "next/router";
import { TDH } from "../../entities/ITDH";
import { TwitterIcon, TwitterShareButton } from "react-share";

const NFTImage = dynamic(() => import("../nft-image/NFTImage"), {
  ssr: false,
});

const NFTLeaderboard = dynamic(() => import("../leaderboard/NFTLeaderboard"), {
  ssr: false,
});

interface MemeTab {
  focus: MEME_FOCUS;
  title: string;
}

export enum MEME_FOCUS {
  LIVE = "live",
  YOUR_CARDS = "your-cards",
  THE_ART = "the-art",
  HODLERS = "hodlers",
}

export default function MemePage() {
  const router = useRouter();

  const [isFullScreenSupported, setIsFullScreenSupported] = useState(false);

  const [nftId, setNftId] = useState<string>();
  const [fullscreenElementId, setFullscreenElementId] = useState<string>(
    "the-art-fullscreen-img"
  );

  const [activeTab, setActiveTab] = useState<MEME_FOCUS>();

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const { address, connector, isConnected } = useAccount();

  const [nft, setNft] = useState<NFT>();
  const [nftMeta, setNftMeta] = useState<MemesExtendedData>();
  const [nftBalance, setNftBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [myOwner, setMyOwner] = useState<TDH>();
  const [myTDH, setMyTDH] = useState<NftTDH>();
  const [myRank, setMyRank] = useState<NftRank>();

  const [collectionCount, setCollectionCount] = useState(-1);
  const [collectionRank, setCollectionRank] = useState(-1);
  const [totalNftCount, setTotalNftCount] = useState(-1);

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

  const MEME_TABS: MemeTab[] = [liveTab, cardsTab, artTab, hodlersTab];

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
        router.replace({
          query: query,
        });
      }
    }
  }, [activeTab, router.isReady]);

  useEffect(() => {
    if (nftId) {
      fetch(`${process.env.API_ENDPOINT}/api/memes_extended_data?id=${nftId}`)
        .then((res) => res.json())
        .then((response: DBResponse) => {
          const nftMetas = response.data;
          if (nftMetas.length == 1) {
            setNftMeta(nftMetas[0]);
            fetch(
              `${process.env.API_ENDPOINT}/api/nfts?id=${nftId}&contract=${MEMES_CONTRACT}`
            )
              .then((res) => res.json())
              .then((response: DBResponse) => {
                setNft(response.data[0]);
                setBreadcrumbs([
                  { display: "Home", href: "/" },
                  { display: "The Memes", href: "/the-memes" },
                  {
                    display: `SZN${nftMetas[0].season}`,
                    href: `/the-memes?szn=${nftMetas[0].season}&sort=age&sort_dir=ASC`,
                  },
                  { display: `Card ${nftId} - ${response.data[0].name}` },
                ]);
              });
          } else {
            setNftMeta(undefined);
            setBreadcrumbs([
              { display: "Home", href: "/" },
              { display: "The Memes", href: "/the-memes" },
              { display: `${nftId}` },
            ]);
          }
        });
    }
  }, [nftId]);

  useEffect(() => {
    if (address && nftId) {
      fetch(
        `${process.env.API_ENDPOINT}/api/transactions?contract=${MEMES_CONTRACT}&wallet=${address}&id=${nftId}`
      )
        .then((res) => res.json())
        .then((response: DBResponse) => {
          setTransactions(response.data);
          let countIn = 0;
          let countOut = 0;
          response.data.map((d: Transaction) => {
            if (areEqualAddresses(address, d.from_address)) {
              countOut += 1;
            }
            if (areEqualAddresses(address, d.to_address)) {
              countIn += 1;
            }
          });
          setNftBalance(countIn - countOut);
        });
    }
  }, [nftId, address]);

  useEffect(() => {
    if (address && nftId) {
      fetch(`${process.env.API_ENDPOINT}/api/tdh?wallet=${address}`)
        .then((res) => res.json())
        .then((response: DBResponse) => {
          if (response.data.length > 0) {
            const mine: TDH = response.data[0];
            setMyOwner(mine);
            setMyTDH(mine.memes.find((m) => m.id == parseInt(nftId)));
            setMyRank(mine.memes_ranks.find((m) => m.id == parseInt(nftId)));
          }
        });
    }
  }, [address, nftId]);

  useEffect(() => {
    fetch(`${process.env.API_ENDPOINT}/api/nfts`)
      .then((res) => res.json())
      .then((response: DBResponse) => {
        setTotalNftCount(response.count);
      });
  }, []);

  useEffect(() => {
    async function fetchNfts(url: string, mynfts: NFT[]) {
      return fetch(url)
        .then((res) => res.json())
        .then((response: DBResponse) => {
          if (response.next) {
            fetchNfts(response.next, [...mynfts].concat(response.data));
          } else {
            const newnfts = [...mynfts]
              .concat(response.data)
              .filter((value, index, self) => {
                return self.findIndex((v) => v.id === value.id) === index;
              });

            const rankedNFTs = newnfts.sort((a, b) =>
              a.tdh_rank > b.tdh_rank ? 1 : -1
            );
            setCollectionCount(newnfts.length);
            if (nftId) {
              setCollectionRank(
                rankedNFTs.map((r) => r.id).indexOf(parseInt(nftId))
              );
            }
          }
        });
    }
    if (router.isReady && nftId) {
      const initialUrlNfts = `${process.env.API_ENDPOINT}/api/nfts?contract=${MEMES_CONTRACT}`;
      fetchNfts(initialUrlNfts, []);
    }
  }, [router.isReady, nftId]);

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

  function printContent(focus: MEME_FOCUS) {
    switch (focus) {
      case MEME_FOCUS.LIVE:
        return printLive();
      case MEME_FOCUS.YOUR_CARDS:
        return printYourCards();
      case MEME_FOCUS.THE_ART:
        return printTheArt();
      case MEME_FOCUS.HODLERS:
        return printHodlers();
    }
  }

  function printLive() {
    return (
      <Container>
        <Row>
          <Col
            xs={{ span: 12 }}
            sm={{ span: 12 }}
            md={{ span: 6 }}
            lg={{ span: 6 }}
            className="pt-2">
            {nft && (
              <NFTImage
                nft={nft}
                animation={false}
                height={650}
                balance={nftBalance}
              />
            )}
          </Col>
          {nft && nftMeta && (
            <Col
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 6 }}
              lg={{ span: 6 }}
              className="pt-2">
              <Container>
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
                            {nftMeta.edition_size_rank}/
                            {nftMeta.collection_size}
                          </td>
                        </tr>
                        <tr>
                          <td>6529 Museum</td>
                          <td className="text-right">
                            {nftMeta.museum_holdings}
                          </td>
                          <td className="text-right">
                            {nftMeta.museum_holdings_rank}/
                            {nftMeta.collection_size}
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
                            {Math.round(nftMeta.percent_unique * 100 * 10) / 10}
                            %
                          </td>
                          <td className="text-right">
                            {nftMeta.percent_unique_rank}/
                            {nftMeta.collection_size}
                          </td>
                        </tr>
                        <tr>
                          <td>% Unique ex. 6529 Museum</td>
                          <td className="text-right">
                            {Math.round(
                              nftMeta.percent_unique_cleaned * 100 * 10
                            ) / 10}
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
                          <td>Mint Date</td>
                          <td>{printMintDate(nft.mint_date)}</td>
                        </tr>
                        <tr>
                          <td>HODL Rate</td>
                          <td>{Math.round(nft.hodl_rate * 100) / 100}</td>
                        </tr>
                        <tr>
                          <td>Floor Price</td>
                          <td>
                            {nft.floor_price > 0
                              ? `${numberWithCommas(
                                  Math.round(nft.floor_price * 100) / 100
                                )} ETH`
                              : `N/A`}
                          </td>
                        </tr>
                        <tr>
                          <td>Market Cap</td>
                          <td>
                            {nft.market_cap > 0
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
                {nftBalance > 0 && (
                  <Row className="pt-3">
                    <Col>
                      <h3>
                        You Own {nftBalance} edition{nftBalance > 1 && "s"}
                      </h3>
                    </Col>
                  </Row>
                )}
                <Row className="pt-4">
                  <Col>
                    <a
                      href={`https://opensea.io/assets/ethereum/${MEMES_CONTRACT}/${nft.id}`}
                      target="_blank"
                      rel="noreferrer">
                      <img className={styles.marketplace} src="/opensea.png" />
                    </a>
                    {/* <a
                      href={`https://looksrare.org/collections/${MEMES_CONTRACT}/${nft.id}`}
                      target="_blank"
                      rel="noreferrer">
                      <img
                        className={styles.marketplace}
                        src="/looksrare.png"
                      />
                    </a> */}
                    <a
                      href={`https://x2y2.io/eth/${MEMES_CONTRACT}/${nft.id}`}
                      target="_blank"
                      rel="noreferrer">
                      <img className={styles.marketplace} src="/x2y2.png" />
                    </a>
                  </Col>
                </Row>
              </Container>
            </Col>
          )}
        </Row>
        <Row className="pt-5">
          <Col>
            <h3>ReMemes</h3>
          </Col>
        </Row>
        <Row className="pt-2">
          <Col>Coming Soon</Col>
        </Row>
      </Container>
    );
  }

  function printYourCards() {
    const firstAcquired = transactions[0];

    const airdropped = transactions.filter((t) =>
      areEqualAddresses(t.from_address, NULL_ADDRESS)
    ).length;

    const transferredIn = !address
      ? 0
      : transactions.filter(
          (t) =>
            !areEqualAddresses(t.from_address, NULL_ADDRESS) &&
            areEqualAddresses(t.to_address, address) &&
            t.value == 0
        ).length;

    const transferredOut = !address
      ? 0
      : transactions.filter(
          (t) => areEqualAddresses(t.from_address, address) && t.value == 0
        ).length;

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
      <Container>
        <Row>
          <Col
            xs={{ span: 12 }}
            sm={{ span: 12 }}
            md={{ span: 6 }}
            lg={{ span: 6 }}
            className="pt-2">
            {nft && (
              <NFTImage
                nft={nft}
                animation={false}
                height={650}
                balance={nftBalance}
              />
            )}
          </Col>
          <Col
            xs={{ span: 12 }}
            sm={{ span: 12 }}
            md={{ span: 6 }}
            lg={{ span: 6 }}>
            <Container>
              <Row>
                {!address && (
                  <Row className="pt-2">
                    <Col>
                      <h4>Connect your wallet to view your cards.</h4>
                    </Col>
                  </Row>
                )}
                {nftBalance == 0 && address && nft && (
                  <Row className="pt-2">
                    <Col>
                      <h3>You don&apos;t own any editions of Card {nft.id}</h3>
                    </Col>
                  </Row>
                )}
                {transactions.length > 0 && (
                  <>
                    <>
                      <Row className="pt-2">
                        <Col>
                          <h3>Rank</h3>
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          {myRank && myTDH ? (
                            <h4 className={styles.rankSubheading}>
                              #{myRank?.rank} in Total Days HODLed (
                              {myTDH && Math.round(myTDH.tdh)})
                            </h4>
                          ) : (
                            "No TDH accrued"
                          )}
                        </Col>
                      </Row>
                    </>
                    <Row className="pt-4">
                      <Col>
                        <h3>Total Summary</h3>
                      </Col>
                    </Row>
                    <Row className="pb-2">
                      <Col>
                        First acquired{" "}
                        {getDateDisplay(
                          new Date(firstAcquired.transaction_date)
                        )}
                      </Col>
                    </Row>
                    {airdropped > 0 && (
                      <Row>
                        <Col>
                          {airdropped} card{airdropped > 1 && "s"} airdropped
                        </Col>
                      </Row>
                    )}
                    {bought.length > 0 && (
                      <Row>
                        <Col>
                          {bought.length} card{bought.length > 1 && "s"} bought
                          for {boughtSum} ETH
                        </Col>
                      </Row>
                    )}
                    {transferredIn > 0 && (
                      <Row>
                        <Col>
                          {transferredIn} card{transferredIn > 1 && "s"}{" "}
                          transferred in
                        </Col>
                      </Row>
                    )}
                    {sold.length > 0 && (
                      <Row>
                        <Col>
                          {sold.length} card{sold.length > 1 && "s"} sold for{" "}
                          {soldSum}
                        </Col>
                      </Row>
                    )}
                    {transferredOut > 0 && (
                      <Row>
                        <Col>
                          {transferredOut} card{transferredOut > 1 && "s"}{" "}
                          transferred out
                        </Col>
                      </Row>
                    )}
                  </>
                )}
              </Row>
            </Container>
          </Col>
        </Row>
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
      </Container>
    );
  }

  function carouselHandlerSlide(event: any) {
    if (event == 0) {
      setFullscreenElementId("the-art-fullscreen-animation");
    } else {
      setFullscreenElementId("the-art-fullscreen-img");
    }

    const videos = document.querySelectorAll("video");
    videos.forEach((video, key) => {
      if (video.currentTime > 0) {
        video.currentTime = 0;
        video.load();
        video.pause();
      }
    });
  }

  function carouselHandlerSlid() {
    const videos = document.querySelectorAll("video");
    videos.forEach((video, key) => {
      video.play();
    });
  }

  function printTheArt() {
    carouselHandlerSlid();
    if (nft && nftMeta) {
      return (
        <>
          <Container>
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
                  onSlide={carouselHandlerSlide}
                  onSlid={carouselHandlerSlid}>
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
                            <td>Season</td>
                            <td>{nftMeta.season}</td>
                          </tr>
                          <tr>
                            <td>Meme</td>
                            <td>{nftMeta.meme_name}</td>
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
                      <h3>Minting Approach</h3>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <a
                        href={
                          nft.id > 3
                            ? `https://github.com/6529-Collections/thememecards/tree/main/card` +
                              nft.id
                            : `https://github.com/6529-Collections/thememecards/tree/main/card1-3`
                        }
                        target="_blank"
                        rel="noreferrer">
                        Distribution Plan
                      </a>
                    </Col>
                  </Row>
                  {/* <Row>
                    <Col>
                      <a
                        href={
                          `https://github.com/6529-Collections/thememecards/tree/main/card` +
                          nft.id
                        }
                        target="_blank"
                        rel="noreferrer">
                        Allowlist
                      </a>
                    </Col>
                  </Row> */}
                  {/* <Row>
                    <Col>
                      <a
                        href={
                          `https://github.com/6529-Collections/thememecards/tree/main/card` +
                          nft.id
                        }
                        target="_blank"
                        rel="noreferrer">
                        Randomization
                      </a>
                    </Col>
                  </Row> */}
                  <Row>
                    <Col>
                      Mint price:{" "}
                      {nft.mint_price > 0 ? `${nft.mint_price} ETH` : `N/A`}
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
                    {nft.metadata.attributes
                      .filter(
                        (a: any) =>
                          !a.display_type &&
                          a.trait_type != "Type - Season" &&
                          a.trait_type != "Type - Meme" &&
                          a.trait_type != "Type - Card"
                      )
                      .map((a: any) => (
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
                      <h3>Stats</h3>
                    </Col>
                  </Row>
                  <Row>
                    <Col
                      xs={{ span: 12 }}
                      sm={{ span: 10 }}
                      md={{ span: 8 }}
                      lg={{ span: 6 }}>
                      <Table>
                        <tbody>
                          <tr>
                            <td>Type - Season</td>
                            <td className="text-right">
                              {
                                nft.metadata.attributes.find(
                                  (a: any) => a.trait_type == "Type - Season"
                                ).value
                              }
                            </td>
                          </tr>
                          <tr>
                            <td>Type - Meme</td>
                            <td className="text-right">
                              {
                                nft.metadata.attributes.find(
                                  (a: any) => a.trait_type == "Type - Meme"
                                ).value
                              }
                            </td>
                          </tr>
                          <tr>
                            <td>Type - Card</td>
                            <td className="text-right">
                              {
                                nft.metadata.attributes.find(
                                  (a: any) => a.trait_type == "Type - Card"
                                ).value
                              }
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
                      <h3>Boosts</h3>
                    </Col>
                  </Row>
                  <Row>
                    <Col
                      xs={{ span: 12 }}
                      sm={{ span: 10 }}
                      md={{ span: 8 }}
                      lg={{ span: 6 }}>
                      <Table>
                        <tbody>
                          {nft.metadata.attributes
                            .filter(
                              (a: any) => a.display_type == "boost_percentage"
                            )
                            .map((a: any) => (
                              <tr key={a.trait_type}>
                                <td>{a.trait_type}</td>
                                <td className="text-right">
                                  {a.value > 0 && "+"}
                                  {a.value}%
                                </td>
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
        </>
      );
    }
  }

  function printHodlers() {
    if (nft && nftMeta)
      return (
        <Container>
          <Row>
            <Col
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 6 }}
              lg={{ span: 6 }}
              className="pt-2">
              {nft && (
                <NFTImage
                  nft={nft}
                  animation={false}
                  height={650}
                  balance={nftBalance}
                />
              )}
            </Col>
            {nft && nftMeta && (
              <Col
                xs={{ span: 12 }}
                sm={{ span: 12 }}
                md={{ span: 6 }}
                lg={{ span: 6 }}
                className="pt-2">
                <Container>
                  <Row>
                    <Col>
                      <h3>NFT</h3>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Table bordered={false} className={styles.hodlersTable}>
                        <tbody>
                          <tr>
                            <td>Mint Date</td>
                            <td>{printMintDate(nft.mint_date)}</td>
                          </tr>
                          <tr>
                            <td>HODL Rate</td>
                            <td>
                              {numberWithCommas(
                                Math.round(nft.hodl_rate * 100) / 100
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td>Floor Price</td>
                            <td>
                              {nft.floor_price > 0
                                ? `${numberWithCommas(
                                    Math.round(nft.floor_price * 100) / 100
                                  )} ETH`
                                : `N/A`}
                            </td>
                          </tr>
                          <tr>
                            <td>Market Cap</td>
                            <td>
                              {nft.market_cap > 0
                                ? `${numberWithCommas(
                                    Math.round(nft.market_cap * 100) / 100
                                  )} ETH`
                                : `N/A`}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                      <Row className="pt-2">
                        <Col>
                          <h3>TDH</h3>
                        </Col>
                      </Row>
                      <Table bordered={false} className={styles.hodlersTable}>
                        <tbody>
                          <tr>
                            <td>TDH</td>
                            <td>
                              {numberWithCommas(
                                Math.round(nft.tdh * 100) / 100
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td>Unweighted TDH</td>
                            <td>
                              {numberWithCommas(
                                Math.round(nft.tdh__raw * 100) / 100
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td>Meme Rank</td>
                            <td>
                              {collectionRank
                                ? collectionRank
                                : collectionCount}
                              /{collectionCount}
                            </td>
                          </tr>
                          <tr>
                            <td>Total Rank</td>
                            <td>
                              {nft.tdh_rank ? nft.tdh_rank : totalNftCount}/
                              {totalNftCount}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </Container>
              </Col>
            )}
          </Row>
          {nftId && (
            <Row className="pt-3">
              <Col>
                <NFTLeaderboard
                  contract={nft.contract}
                  nftId={parseInt(nftId)}
                  page={1}
                  pageSize={25}
                />
              </Col>
            </Row>
          )}
        </Container>
      );
  }

  function parseDescription(description: string) {
    let d = description.replaceAll("\n", "<br />");
    d = d.replace(
      /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi,
      '<a href=\'$1\' target="blank" rel="noreferrer">$1</a>'
    );
    return d;
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
                  <h1>THE MEMES</h1>
                </Col>
                {nft && (
                  <Col className="d-flex align-items-center justify-content-end">
                    <TwitterShareButton
                      className="twitter-share-button"
                      url={window.location.href.split("?")[0]}
                      title={`Meme Card #${nft.id} \n${nft.name}\nby ${nft.artist}\n#6529Seize\n\n`}>
                      <TwitterIcon
                        size={30}
                        round
                        iconFillColor="white"
                        bgStyle={{ fill: "transparent" }}
                      />
                      Tweet
                    </TwitterShareButton>
                  </Col>
                )}
              </Row>
              {nftMeta && nft && (
                <>
                  <Row className="pt-2">
                    <Col>
                      {nftId && (
                        <>
                          <h2>
                            <a
                              href={`/the-memes/${
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
                              href={`/the-memes/${
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
                      <h2>
                        <a
                          href={`/the-memes?szn=${nftMeta.season}&sort=age&sort_dir=ASC`}>
                          SZN{nftMeta.season}
                        </a>
                      </h2>
                      <h2>&nbsp;| Card {nft.id} -&nbsp;</h2>
                      <h2>{nft.name}</h2>
                    </Col>
                  </Row>
                  <Row className="pt-2">
                    <Col>
                      <Tabs
                        activeKey={activeTab}
                        className={`mb-3`}
                        onSelect={(view) => {
                          const newTab = MEME_TABS.find((t) => t.focus == view);
                          if (newTab) {
                            if (newTab.focus != MEME_FOCUS.THE_ART) {
                              carouselHandlerSlide(
                                nft.animation ? 0 : undefined
                              );
                            }
                            setActiveTab(newTab.focus);
                          }
                        }}>
                        {MEME_TABS.map((tab) => (
                          <Tab
                            key={`${nft.id}-${nft.contract}-${tab.focus}-tab`}
                            eventKey={tab.focus}
                            title={tab.title}>
                            {printContent(tab.focus)}
                          </Tab>
                        ))}
                      </Tabs>
                    </Col>
                  </Row>
                </>
              )}
            </Container>
          </Col>
        </Row>
      </Container>
    </>
  );
}
