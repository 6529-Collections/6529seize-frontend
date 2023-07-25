import styles from "./TheMemes.module.scss";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Container,
  Row,
  Col,
  Table,
  Carousel,
  Dropdown,
} from "react-bootstrap";
import { MEMES_CONTRACT, NULL_ADDRESS } from "../../constants";
import { DBResponse } from "../../entities/IDBResponse";
import {
  NFT,
  MemesExtendedData,
  NftTDH,
  NftRank,
  NFTHistory,
  Rememe,
} from "../../entities/INFT";
import {
  getDateDisplay,
  areEqualAddresses,
  enterArtFullScreen,
  fullScreenSupported,
  numberWithCommas,
  formatAddress,
} from "../../helpers/Helpers";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import Download from "../download/Download";
import LatestActivityRow from "../latest-activity/LatestActivityRow";
import { Transaction } from "../../entities/ITransaction";
import { useRouter } from "next/router";
import { TDHMetrics } from "../../entities/ITDH";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import Pagination from "../pagination/Pagination";
import { TypeFilter } from "../latest-activity/LatestActivity";
import {
  IDistribution,
  IDistributionPhoto,
} from "../../entities/IDistribution";
import NFTImage from "../nft-image/NFTImage";
import NFTLeaderboard from "../leaderboard/NFTLeaderboard";
import Timeline from "../timeline/Timeline";
import RememeImage from "../nft-image/RememeImage";

interface MemeTab {
  focus: MEME_FOCUS;
  title: string;
}

export enum MEME_FOCUS {
  LIVE = "live",
  YOUR_CARDS = "your-cards",
  THE_ART = "the-art",
  HODLERS = "collectors",
  ACTIVITY = "activity",
  TIMELINE = "timeline",
}

const ACTIVITY_PAGE_SIZE = 25;

interface Props {
  wallets: string[];
}

export default function MemePage(props: Props) {
  const router = useRouter();

  const [isFullScreenSupported, setIsFullScreenSupported] = useState(false);

  const [nftId, setNftId] = useState<string>();
  const [fullscreenElementId, setFullscreenElementId] = useState<string>(
    "the-art-fullscreen-img"
  );

  const [activeTab, setActiveTab] = useState<MEME_FOCUS>();

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const [nft, setNft] = useState<NFT>();
  const [memeLabNfts, setMemeLabNfts] = useState<NFT[]>([]);
  const [nftMeta, setNftMeta] = useState<MemesExtendedData>();
  const [nftBalance, setNftBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activity, setActivity] = useState<Transaction[]>([]);

  const [myTDH, setMyTDH] = useState<NftTDH>();
  const [myRank, setMyRank] = useState<NftRank>();

  const [collectionCount, setCollectionCount] = useState(-1);
  const [collectionRank, setCollectionRank] = useState(-1);

  const [userLoaded, setUserLoaded] = useState(false);
  const [memeLabNftsLoaded, setMemeLabNftsLoaded] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalResults, setActivityTotalResults] = useState(0);

  const [activityTypeFilter, setActivityTypeFilter] = useState<TypeFilter>(
    TypeFilter.ALL
  );

  const [nftHistory, setNftHistory] = useState<NFTHistory[]>([]);

  const [rememes, setRememes] = useState<Rememe[]>([]);
  const [rememesLoaded, setRememesLoaded] = useState(false);

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
    title: "Collectors",
  };
  const activityTab = {
    focus: MEME_FOCUS.ACTIVITY,
    title: "Activity",
  };
  const timelineTab = {
    focus: MEME_FOCUS.TIMELINE,
    title: "Timeline",
  };

  const MEME_TABS: MemeTab[] = [
    liveTab,
    cardsTab,
    artTab,
    hodlersTab,
    activityTab,
    timelineTab,
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
        `${process.env.API_ENDPOINT}/api/memes_extended_data?id=${nftId}`
      ).then((response: DBResponse) => {
        const nftMetas = response.data;
        if (nftMetas.length == 1) {
          setNftMeta(nftMetas[0]);
          fetchUrl(
            `${process.env.API_ENDPOINT}/api/nfts?id=${nftId}&contract=${MEMES_CONTRACT}`
          ).then((response: DBResponse) => {
            const mynft = response.data[0];
            setNft(mynft);
            setBreadcrumbs([
              { display: "Home", href: "/" },
              { display: "The Memes", href: "/the-memes" },
              {
                display: `SZN${nftMetas[0].season}`,
                href: `/the-memes?szn=${nftMetas[0].season}&sort=age&sort_dir=ASC`,
              },
              { display: `Card ${nftId} - ${mynft.name}` },
            ]);

            fetchUrl(
              `${process.env.API_ENDPOINT}/api/nfts_memelab?sort_direction=asc&meme_id=${nftId}`
            ).then((response: DBResponse) => {
              setMemeLabNfts(response.data);
              setMemeLabNftsLoaded(true);
            });

            fetchUrl(
              `${process.env.API_ENDPOINT}/api/rememes?meme_id=${nftId}&page_size=4`
            ).then((response: DBResponse) => {
              setRememes(response.data);
              setRememesLoaded(true);
            });
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
    if (props.wallets.length > 0 && nftId) {
      fetchUrl(
        `${
          process.env.API_ENDPOINT
        }/api/transactions?contract=${MEMES_CONTRACT}&wallet=${props.wallets.join(
          ","
        )}&id=${nftId}`
      ).then((response: DBResponse) => {
        setTransactions(response.data);
        let countIn = 0;
        let countOut = 0;
        response.data.map((d: Transaction) => {
          if (props.wallets.some((w) => areEqualAddresses(w, d.from_address))) {
            countOut += d.token_count;
          }
          if (props.wallets.some((w) => areEqualAddresses(w, d.to_address))) {
            countIn += d.token_count;
          }
        });
        setUserLoaded(true);
        setNftBalance(countIn - countOut);
      });
    } else {
      setNftBalance(0);
    }
  }, [nftId, props.wallets]);

  useEffect(() => {
    if (props.wallets.length > 0 && nftId) {
      const url = `${process.env.API_ENDPOINT}/api/${
        props.wallets.length > 1 ? "consolidated_tdh" : "tdh"
      }/${MEMES_CONTRACT}/${nftId}?wallet=${props.wallets[0]}`;
      fetchUrl(url).then((response: DBResponse) => {
        if (response.data.length > 0) {
          const mine: TDHMetrics = response.data[0];
          setMyTDH(mine.memes.find((m) => m.id == parseInt(nftId)));
          setMyRank(mine.memes_ranks.find((m) => m.id == parseInt(nftId)));
        }
      });
    }
  }, [props.wallets, nftId]);

  useEffect(() => {
    if (nftId) {
      let url = `${process.env.API_ENDPOINT}/api/transactions?contract=${MEMES_CONTRACT}&id=${nftId}&page_size=${ACTIVITY_PAGE_SIZE}&page=${activityPage}`;
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

  useEffect(() => {
    async function fetchNfts(url: string, mynfts: NFT[]) {
      return fetchUrl(url).then((response: DBResponse) => {
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

  useEffect(() => {
    async function fetchHistory(url: string) {
      return fetchAllPages(url).then((response: NFTHistory[]) => {
        setNftHistory(response);
      });
    }
    if (router.isReady && nftId) {
      const initialUrlHistory = `${process.env.API_ENDPOINT}/api/nft_history/${MEMES_CONTRACT}/${nftId}`;
      fetchHistory(initialUrlHistory);
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

  function printContent() {
    if (activeTab == MEME_FOCUS.ACTIVITY) {
      return printActivity();
    }

    if (activeTab == MEME_FOCUS.TIMELINE) {
      return printTimeline();
    }

    if (activeTab == MEME_FOCUS.THE_ART) {
      return printTheArt();
    }
    return (
      <Container className="p-0">
        <Row>
          {[
            MEME_FOCUS.LIVE,
            MEME_FOCUS.YOUR_CARDS,
            MEME_FOCUS.HODLERS,
          ].includes(activeTab!) &&
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
                    balance={nftBalance}
                    showUnseized={props.wallets.length > 0}
                  />
                </Col>
                {activeTab == MEME_FOCUS.LIVE && <>{printLive()}</>}
                {activeTab == MEME_FOCUS.YOUR_CARDS && <>{printYourCards()}</>}
                {activeTab == MEME_FOCUS.HODLERS && <>{printHodlers()}</>}
              </>
            )}
        </Row>
        <Row>
          {activeTab == MEME_FOCUS.LIVE && <>{printLiveSub()}</>}
          {activeTab == MEME_FOCUS.YOUR_CARDS && <>{printYourCardsSub()}</>}
          {activeTab == MEME_FOCUS.HODLERS && <>{printHodlersSub()}</>}
        </Row>
      </Container>
    );
  }

  function printLiveSub() {
    return (
      <>
        <Row className="pt-3">
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
            The Meme Lab is the lab for Meme Artists to release work that is
            related to The Meme Cards.
            {memeLabNftsLoaded && memeLabNfts.length == 0 && (
              <>
                <br />
                Meme Lab NFTs that reference this NFT will appear here once the
                Meme Lab is launched.
              </>
            )}
          </Col>
        </Row>
        {memeLabNfts.length > 0 && (
          <Row className="pt-2 pb-2">
            {memeLabNfts.map((nft) => {
              return (
                <Col
                  key={`${nft.contract}-${nft.id}`}
                  className="pt-3 pb-3"
                  xs={{ span: 6 }}
                  sm={{ span: 4 }}
                  md={{ span: 3 }}
                  lg={{ span: 3 }}>
                  <a
                    href={`/meme-lab/${nft.id}`}
                    className="decoration-none decoration-hover-underline scale-hover">
                    <Container fluid className="no-padding">
                      <Row>
                        <Col>
                          <NFTImage
                            nft={nft}
                            animation={false}
                            height={300}
                            balance={0}
                            showThumbnail={true}
                            showUnseized={false}
                          />
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
                          Artists: {nft.artist}
                        </Col>
                      </Row>
                    </Container>
                  </a>
                </Col>
              );
            })}
          </Row>
        )}
        <Row className="pt-5">
          <Col>
            <h1 className="d-flex align-items-center mb-0">
              <Image
                loading={"lazy"}
                width="0"
                height="0"
                style={{ width: "250px", height: "auto", float: "left" }}
                src="/re-memes.png"
                alt="re-memes"
              />
              {rememes.length > 0 && (
                <a href={`/rememes?meme_id=${nft?.id}`}>
                  <span className={styles.viewAllLink}>VIEW ALL</span>
                </a>
              )}
            </h1>
          </Col>
        </Row>
        <Row className="pt-4 pb-4">
          <Col>
            ReMemes are community-driven derivatives inspired by the Meme Cards.
            We hope to display them here once we find a &quot;safe&quot; way to
            do so.
            {rememesLoaded && rememes.length == 0 && (
              <>
                <br />
                ReMemes that reference this NFT will appear here.
              </>
            )}
          </Col>
        </Row>
        {rememes.length > 0 && (
          <Row className="pt-2 pb-2">
            {rememes.map((rememe) => {
              return (
                <Col
                  key={`${rememe.contract}-${rememe.id}`}
                  className="pt-3 pb-3"
                  xs={{ span: 6 }}
                  sm={{ span: 4 }}
                  md={{ span: 3 }}
                  lg={{ span: 3 }}>
                  <a
                    href={`/rememes/${rememe.contract}/${rememe.id}`}
                    className="decoration-none decoration-hover-underline scale-hover">
                    <Container fluid className="no-padding">
                      <Row>
                        <Col>
                          <RememeImage
                            nft={rememe}
                            animation={false}
                            height={300}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col className="text-center pt-2">
                          <b>
                            {rememe.metadata.name
                              ? rememe.metadata.name
                              : `${formatAddress(rememe.contract)} #${
                                  rememe.id
                                }`}
                          </b>
                        </Col>
                      </Row>
                    </Container>
                  </a>
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
                      <td>Collectors</td>
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
                      <td>TDH Rate</td>
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
            <Row>
              <Col>
                <a
                  href={
                    nft.has_distribution
                      ? `/the-memes/${nft.id}/distribution`
                      : `https://github.com/6529-Collections/thememecards/tree/main/card${nft.id}`
                  }
                  target={nft.has_distribution ? "_self" : "_blank"}
                  rel="noreferrer">
                  Distribution Plan
                </a>
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
                  href={`https://opensea.io/assets/ethereum/${MEMES_CONTRACT}/${nft.id}`}
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
                  href={`https://x2y2.io/eth/${MEMES_CONTRACT}/${nft.id}`}
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

    const airdropped = transactions.filter(
      (t) => t.value == 0 && areEqualAddresses(t.from_address, NULL_ADDRESS)
    );

    const transferredIn =
      props.wallets.length == 0
        ? []
        : transactions.filter(
            (t) =>
              !areEqualAddresses(t.from_address, NULL_ADDRESS) &&
              props.wallets.some((w) => areEqualAddresses(t.to_address, w)) &&
              t.value == 0
          );

    const transferredOut =
      props.wallets.length == 0
        ? []
        : transactions.filter(
            (t) =>
              props.wallets.some((w) => areEqualAddresses(t.from_address, w)) &&
              t.value == 0
          );

    const bought =
      props.wallets.length == 0
        ? []
        : transactions.filter(
            (t) =>
              props.wallets.some((w) => areEqualAddresses(t.to_address, w)) &&
              t.value > 0
          );

    let boughtSum = 0;
    bought.map((b) => {
      boughtSum += b.value;
    });

    const sold =
      props.wallets.length == 0
        ? []
        : transactions.filter(
            (t) =>
              props.wallets.some((w) => areEqualAddresses(t.from_address, w)) &&
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
            {props.wallets.length == 0 && (
              <Row className="pt-2">
                <Col>
                  <h4>Connect your wallet to view your cards.</h4>
                </Col>
              </Row>
            )}
            {nftBalance == 0 &&
              props.wallets.length > 0 &&
              nft &&
              userLoaded && (
                <Row className="pt-2">
                  <Col>
                    <h3>You don&apos;t own any editions of Card {nft.id}</h3>
                  </Col>
                </Row>
              )}
            {transactions.length > 0 && props.wallets.length > 0 && (
              <>
                {nftBalance > 0 && (
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
                            {/* <tr className={`pt-1 ${styles.overviewColumn}`}>
                              <td>Rank</td>
                              <td className="text-right">
                                {`#${numberWithCommas(
                                  myOwner.dense_rank_balance
                                )}`}
                              </td>
                            </tr> */}
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                    {myRank && nft && myTDH ? (
                      <Row className="pt-2">
                        <Col
                          xs={{ span: 12 }}
                          sm={{ span: 12 }}
                          md={{ span: 12 }}
                          lg={{ span: 8 }}>
                          <Table bordered={false}>
                            <tbody>
                              <tr className={`pt-1 ${styles.overviewColumn}`}>
                                <td>TDH</td>
                                <td className="text-right">
                                  {numberWithCommas(Math.round(myTDH.tdh))}
                                </td>
                              </tr>
                              <tr className={`${styles.overviewColumn}`}>
                                <td>Rank</td>
                                <td className="text-right">#{myRank?.rank}</td>
                              </tr>
                            </tbody>
                          </Table>
                        </Col>
                      </Row>
                    ) : (
                      <Row>
                        <Col className={`pt-1 ${styles.overviewColumn}`}>
                          No TDH accrued
                        </Col>
                      </Row>
                    )}
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
                      showUnseized={false}
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
                      showUnseized={false}
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
                    showUnseized={false}
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
                      {(nft.metadata.animation ||
                        nft.metadata.animation_url) && (
                        <Row className="pt-3">
                          <Col>
                            {nft.metadata.animation_details.format}{" "}
                            <a
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
                            </a>
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
                        onClick={() => {
                          if (nft.has_distribution) {
                            router.push(`/the-memes/${nft.id}/distribution`);
                          } else {
                            let link;
                            if (nft.id > 3) {
                              link = `https://github.com/6529-Collections/thememecards/tree/main/card${nft.id}`;
                            } else {
                              link = `https://github.com/6529-Collections/thememecards/tree/main/card1-3`;
                            }
                            window.open(link, "_blank");
                          }
                        }}
                        target={nft.has_distribution ? "_self" : "_blank"}
                        rel="noreferrer"
                        className={styles.distributionPlanLink}>
                        Distribution Plan
                      </a>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      Mint price:{" "}
                      {nft.mint_price > 0
                        ? `${numberWithCommas(
                            Math.round(nft.mint_price * 100000) / 100000
                          )} ETH`
                        : `N/A`}
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

  function printHodlersSub() {
    if (nft && nftId) {
      return (
        <Row className="pt-3">
          <Col>
            <NFTLeaderboard
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

  function printHodlers() {
    if (nft && nftMeta) {
      return (
        <Col
          xs={{ span: 12 }}
          sm={{ span: 12 }}
          md={{ span: 6 }}
          lg={{ span: 6 }}
          className="pt-2">
          <Container className="p-0">
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
                      <td>Mint Price</td>
                      <td>
                        {nft.mint_price > 0
                          ? `${numberWithCommas(
                              Math.round(nft.mint_price * 100000) / 100000
                            )} ETH`
                          : `N/A`}
                      </td>
                    </tr>
                    <tr>
                      <td>TDH Rate</td>
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
                        {numberWithCommas(Math.round(nft.tdh * 100) / 100)}
                      </td>
                    </tr>
                    <tr>
                      <td>Unweighted TDH</td>
                      <td>
                        {numberWithCommas(Math.round(nft.tdh__raw * 100) / 100)}
                      </td>
                    </tr>
                    <tr>
                      <td>Meme Rank</td>
                      <td>
                        {collectionRank ? collectionRank : collectionCount}/
                        {collectionCount}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Container>
        </Col>
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
                      <th>1 Month</th>
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
                  <h1>THE MEMES</h1>
                </Col>
                {/* {nft && (
                  <Col className="d-flex align-items-center justify-content-end">
                    <TwitterShareButton
                      className="twitter-share-button"
                      url={window.location.href.split("?")[0]}
                      title={`Meme Card #${nft.id} \n${nft.name}\nby ${nft.artist}\n\n#6529SEIZE\n\n`}>
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
