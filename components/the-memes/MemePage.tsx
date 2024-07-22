import styles from "./TheMemes.module.scss";

import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Container, Row, Col } from "react-bootstrap";
import { MEMES_CONTRACT } from "../../constants";
import { DBResponse } from "../../entities/IDBResponse";

import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import { Transaction } from "../../entities/ITransaction";
import { useRouter } from "next/router";
import { ConsolidatedTDH } from "../../entities/ITDH";
import { fetchUrl } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";
import { NFT, MemesExtendedData, NftTDH, NftRank } from "../../entities/INFT";
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
import { AuthContext } from "../auth/Auth";
import { commonApiFetch } from "../../services/api/common-api";
import useIsMobileScreen from "../../hooks/isMobileScreen";
import MemePageMintCountdown from "./MemePageMintCountdown";

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

export default function MemePage() {
  const router = useRouter();
  const { connectedProfile } = useContext(AuthContext);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  useEffect(() => {
    setConnectedWallets(
      connectedProfile?.consolidation.wallets.map((w) => w.wallet.address) ?? []
    );
  }, [connectedProfile]);

  const [nftId, setNftId] = useState<string>();

  const [activeTab, setActiveTab] = useState<MEME_FOCUS>();

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const [nft, setNft] = useState<NFT>();
  const [nftMeta, setNftMeta] = useState<MemesExtendedData>();
  const [nftBalance, setNftBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [myOwner, setMyOwner] = useState<ConsolidatedTDH>();
  const [myTDH, setMyTDH] = useState<NftTDH>();
  const [myRank, setMyRank] = useState<NftRank>();

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
        if (activeTab !== initialFocus) {
          setActiveTab(initialFocus);
        } else {
          router.replace(
            {
              query: {
                id: router.query.id,
                focus: initialFocus,
              },
            },
            undefined,
            { shallow: true }
          );
        }
      }
    }
  }, [router.isReady, router.query.id]);

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

  function updateNftBalances(data: Transaction[]) {
    let countIn = 0;
    let countOut = 0;
    data.map((d: Transaction) => {
      if (connectedWallets.some((w) => areEqualAddresses(w, d.from_address))) {
        countOut += d.token_count;
      }
      if (connectedWallets.some((w) => areEqualAddresses(w, d.to_address))) {
        countIn += d.token_count;
      }
    });
    setNftBalance(countIn - countOut);
  }

  useEffect(() => {
    if (connectedWallets.length && nftId) {
      fetchUrl(
        `${
          process.env.API_ENDPOINT
        }/api/transactions?contract=${MEMES_CONTRACT}&wallet=${connectedWallets.join(
          ","
        )}&id=${nftId}`
      ).then((response: DBResponse) => {
        setTransactions(response.data);
        updateNftBalances(response.data);
        setUserLoaded(true);
      });
    } else {
      setNftBalance(0);
      setUserLoaded(true);
      setTransactions([]);
    }
  }, [nftId, connectedWallets]);

  useEffect(() => {
    if (connectedWallets.length > 0 && nftId) {
      commonApiFetch<ConsolidatedTDH>({
        endpoint: `tdh/consolidation/${connectedProfile?.consolidation.consolidation_key}`,
      }).then((response) => {
        setMyOwner(response);
        setMyTDH(response.memes.find((m) => m.id === parseInt(nftId)));
        setMyRank(response.memes_ranks.find((m) => m.id === parseInt(nftId)));
      });
    }
  }, [nftId, connectedWallets]);

  function printContent() {
    return (
      <>
        <Container className="p-0">
          {nft && (
            <Row>
              <Col>
                <MemePageMintCountdown nft_id={nft.id} />
              </Col>
            </Row>
          )}
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
                      showUnseized={connectedWallets.length > 0}
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
                      wallets={connectedWallets}
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
                  <h1>
                    <span className="font-lightest">The</span> Memes
                  </h1>
                </Col>
              </Row>
              {nftMeta && nft && (
                <>
                  <Row className="pt-3 pb-3">
                    <Col className="d-flex gap-2 align-items-center">
                      {nftId && (
                        <>
                          <MemeNavigationBtn nft={nftMeta} icon="previous" />
                          <MemeNavigationBtn nft={nftMeta} icon="next" />
                        </>
                      )}
                    </Col>
                  </Row>
                  <Row className="pt-2">
                    <Col>
                      <h2 className="float-left">
                        <a
                          href={`/the-memes?szn=${nftMeta.season}&sort=age&sort_dir=ASC`}>
                          SZN{nftMeta.season}
                        </a>
                      </h2>
                      <h2 className="float-left">
                        &nbsp;| Card {nft.id} -&nbsp;
                      </h2>
                      <h2 className="float-left">{nft.name}</h2>
                    </Col>
                  </Row>
                  <Row className="pt-3 pb-3">
                    <Col>
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
    </>
  );
}

function MemeNavigationBtn(
  props: Readonly<{
    nft: MemesExtendedData;
    icon: "next" | "previous";
  }>
) {
  const isMobile = useIsMobileScreen();

  const width = isMobile ? 25 : 35;

  const isDisabled =
    props.icon === "previous"
      ? props.nft.id === 1
      : props.nft.id === props.nft.collection_size;

  const icon = (
    <FontAwesomeIcon
      icon={
        props.icon === "previous"
          ? "chevron-circle-left"
          : "chevron-circle-right"
      }
      width={width}
      color={isDisabled ? "#9a9a9a" : "#fff"}
      cursor={isDisabled ? "default" : "pointer"}
    />
  );

  if (isDisabled) {
    return icon;
  } else {
    const href = `/the-memes/${
      props.icon === "previous" ? props.nft.id - 1 : props.nft.id + 1
    }`;
    return <a href={href}>{icon}</a>;
  }
}

function TabButton(
  props: Readonly<{
    tab: MemeTab;
    activeTab: MEME_FOCUS | undefined;
    setActiveTab: (focus: MEME_FOCUS) => void;
  }>
) {
  return (
    <button
      className={`btn-link ${styles.tabFocus} ${
        props.activeTab === props.tab.focus ? styles.tabFocusActive : ""
      }`}
      onClick={() => {
        props.setActiveTab(props.tab.focus);
      }}>
      {props.tab.title}
    </button>
  );
}
