import styles from "./TheMemes.module.scss";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Container, Row, Col } from "react-bootstrap";
import { MEMES_CONTRACT } from "../../constants";
import { DBResponse } from "../../entities/IDBResponse";

import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import { Transaction } from "../../entities/ITransaction";
import { useRouter } from "next/router";
import { TDHMetrics } from "../../entities/ITDH";
import { fetchUrl } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";
import NFTLeaderboard from "../leaderboard/NFTLeaderboard";
import Timeline from "../timeline/Timeline";
import RememeImage from "../nft-image/RememeImage";
import {
  NFT,
  MemesExtendedData,
  NftTDH,
  NftRank,
  Rememe,
} from "../../entities/INFT";
import { areEqualAddresses } from "../../helpers/Helpers";
import { MemePageActivity } from "./MemePageActivity";
import { MemePageArt } from "./MemePageArt";
import {
  MemePageCollectorsRightMenu,
  MemePageCollectorsSubMenu,
} from "./MemePageCollectors";
import { MemePageLiveRightMenu, MemePageLiveSubMenu } from "./MemePageLive";
import { MemePageTimeline } from "./MemePageTimeline";
import {
  MemePageYourCardsRightMenu,
  MemePageYourCardsSubMenu,
} from "./MemePageYourCards";

interface MemeTab {
  focus: MEME_FOCUS;
  title: string;
}

export enum MEME_FOCUS {
  LIVE = "live",
  YOUR_CARDS = "your-cards",
  THE_ART = "the-art",
  COLLECTORS = "collectors",
  ACTIVITY = "activity",
  TIMELINE = "timeline",
}

const ACTIVITY_PAGE_SIZE = 25;

interface Props {
  wallets: string[];
}

export default function MemePage(props: Readonly<Props>) {
  const router = useRouter();

  const [nftId, setNftId] = useState<string>();

  const [activeTab, setActiveTab] = useState<MEME_FOCUS>();

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const [nft, setNft] = useState<NFT>();
  const [nftMeta, setNftMeta] = useState<MemesExtendedData>();
  const [nftBalance, setNftBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [myOwner, setMyOwner] = useState<TDHMetrics>();
  const [myTDH, setMyTDH] = useState<NftTDH>();
  const [myRank, setMyRank] = useState<NftRank>();

  const [collectionCount, setCollectionCount] = useState(-1);
  const [collectionRank, setCollectionRank] = useState(-1);

  const [userLoaded, setUserLoaded] = useState(false);

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
    focus: MEME_FOCUS.COLLECTORS,
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
      let initialFocus = MEME_FOCUS.LIVE;

      const routerFocus = router.query.focus;
      if (routerFocus) {
        const resolvedRouterFocus = Object.values(MEME_FOCUS).find(
          (sd) => sd === routerFocus
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
        if (nftMetas.length === 1) {
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
        setNftBalance(countIn - countOut);
        setUserLoaded(true);
      });
    } else {
      setNftBalance(0);
      setUserLoaded(true);
      setTransactions([]);
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
          setMyOwner(mine);
          setMyTDH(mine.memes.find((m) => m.id === parseInt(nftId)));
          setMyRank(mine.memes_ranks.find((m) => m.id === parseInt(nftId)));
        }
      });
    }
  }, [props.wallets, nftId]);

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

  function printContent() {
    return (
      <>
        <Container className="p-0">
          <Row>
            {[
              MEME_FOCUS.LIVE,
              MEME_FOCUS.YOUR_CARDS,
              MEME_FOCUS.COLLECTORS,
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
                  <MemePageLiveRightMenu
                    show={activeTab === MEME_FOCUS.LIVE}
                    nft={nft}
                    nftMeta={nftMeta}
                    nftBalance={nftBalance}
                  />
                  {userLoaded && (
                    <MemePageYourCardsRightMenu
                      show={activeTab === MEME_FOCUS.YOUR_CARDS}
                      transactions={transactions}
                      wallets={props.wallets}
                      nft={nft}
                      nftBalance={nftBalance}
                      myOwner={myOwner}
                      myTDH={myTDH}
                      myRank={myRank}
                    />
                  )}
                  <MemePageCollectorsRightMenu
                    show={activeTab === MEME_FOCUS.COLLECTORS}
                    nft={nft}
                    collectionCount={collectionCount}
                    collectionRank={collectionRank}
                  />
                </>
              )}
          </Row>
          <Row>
            <MemePageLiveSubMenu
              show={activeTab === MEME_FOCUS.LIVE}
              nft={nft}
            />
            {userLoaded && (
              <MemePageYourCardsSubMenu
                show={activeTab === MEME_FOCUS.YOUR_CARDS}
                transactions={transactions}
              />
            )}
            <MemePageCollectorsSubMenu
              show={activeTab === MEME_FOCUS.COLLECTORS}
              nft={nft}
              pageSize={ACTIVITY_PAGE_SIZE}
            />
          </Row>
        </Container>
        <MemePageArt
          show={activeTab === MEME_FOCUS.THE_ART}
          nft={nft}
          nftMeta={nftMeta}
        />
        <MemePageActivity
          show={activeTab === MEME_FOCUS.ACTIVITY}
          nft={nft}
          pageSize={ACTIVITY_PAGE_SIZE}
        />
        <MemePageTimeline show={activeTab === MEME_FOCUS.TIMELINE} nft={nft} />
      </>
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
                                parseInt(nftId) === 1
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
                                parseInt(nftId) === nftMeta.collection_size
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
                            activeTab === tab.focus ? styles.tabFocusActive : ""
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
