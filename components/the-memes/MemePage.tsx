"use client";

import styles from "./TheMemes.module.scss";

import { MEMES_CONTRACT } from "@/constants";
import { DBResponse } from "@/entities/IDBResponse";
import { useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { AuthContext } from "@/components/auth/Auth";
import NFTImage from "@/components/nft-image/NFTImage";
import NftNavigation from "@/components/nft-navigation/NftNavigation";
import { publicEnv } from "@/config/env";
import { useTitle } from "@/contexts/TitleContext";
import { MemesExtendedData, NFT, NftRank, NftTDH } from "@/entities/INFT";
import { ConsolidatedTDH } from "@/entities/ITDH";
import { Transaction } from "@/entities/ITransaction";
import { areEqualAddresses } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MemePageActivity } from "./MemePageActivity";
import { MemePageArt } from "./MemePageArt";
import {
  MemePageCollectorsRightMenu,
  MemePageCollectorsSubMenu,
} from "./MemePageCollectors";
import { MemePageLiveRightMenu, MemePageLiveSubMenu } from "./MemePageLive";
import MemePageMintCountdown from "./MemePageMintCountdown";
import { MemePageTimeline } from "./MemePageTimeline";
import {
  MemePageYourCardsRightMenu,
  MemePageYourCardsSubMenu,
} from "./MemePageYourCards";
import {
  getMemeTabTitle,
  MEME_FOCUS,
  MEME_TABS,
  TabButton,
} from "./MemeShared";
import UpcomingMemePage from "./UpcomingMemePage";

const ACTIVITY_PAGE_SIZE = 25;

export default function MemePage({ nftId }: { readonly nftId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTitle } = useTitle();
  const { connectedProfile } = useContext(AuthContext);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  useEffect(() => {
    setConnectedWallets(connectedProfile?.wallets?.map((w) => w.wallet) ?? []);
  }, [connectedProfile]);

  const [activeTab, setActiveTab] = useState<MEME_FOCUS>();

  const [nft, setNft] = useState<NFT>();
  const [nftNotFound, setNftNotFound] = useState(false);
  const [nftMeta, setNftMeta] = useState<MemesExtendedData>();
  const [nftBalance, setNftBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [myOwner, setMyOwner] = useState<ConsolidatedTDH>();
  const [myTDH, setMyTDH] = useState<NftTDH>();
  const [myRank, setMyRank] = useState<NftRank>();

  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    setTitle(getMemeTabTitle(`The Memes`, nftId, nft, activeTab));
  }, [nft, nftId, activeTab]);

  useEffect(() => {
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
  }, [searchParams]);

  useEffect(() => {
    if (activeTab && nftId && nftMeta) {
      router.push(`/the-memes/${nftId}?focus=${activeTab}`);
    }
  }, [activeTab, nftId, nftMeta]);

  useEffect(() => {
    if (nftId) {
      fetchUrl(
        `${publicEnv.API_ENDPOINT}/api/memes_extended_data?id=${nftId}`
      ).then((response: DBResponse) => {
        const nftMetas = response.data;
        if (nftMetas.length === 1) {
          setNftMeta(nftMetas[0]);
          fetchUrl(
            `${publicEnv.API_ENDPOINT}/api/nfts?id=${nftId}&contract=${MEMES_CONTRACT}`
          ).then((response: DBResponse) => {
            const mynft = response.data[0];
            setNft(mynft);
          });
        } else {
          setNftMeta(undefined);
          setNftNotFound(true);
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
          publicEnv.API_ENDPOINT
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
        endpoint: `tdh/consolidation/${connectedProfile?.consolidation_key}`,
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
              <Col
                xs={{ span: 12 }}
                sm={{ span: 12 }}
                md={{ span: 12 }}
                lg={{ span: 6 }}>
                <MemePageMintCountdown
                  nft_id={nft.id}
                  hide_mint_btn={false}
                  is_full_width={false}
                  show_only_if_active={true}
                />
              </Col>
            </Row>
          )}
          <Row className={connectedProfile ? styles.nftImagePadding : ""}>
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
                      showBalance={true}
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
          <MemePageLiveSubMenu show={activeTab === MEME_FOCUS.LIVE} nft={nft} />
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
                  <Col className="d-flex">
                    <NftNavigation
                      nftId={nft.id}
                      path="/the-memes"
                      startIndex={1}
                      endIndex={nftMeta.collection_size}
                    />
                  </Col>
                </Row>
                <Row className="pt-2">
                  <Col>
                    <h2 className="float-left">
                      <Link
                        href={`/the-memes?szn=${nftMeta.season}&sort=age&sort_dir=ASC`}>
                        SZN{nftMeta.season}
                      </Link>
                    </h2>
                    <h2 className="float-left">
                      &nbsp;| Card {nft.id} -&nbsp;
                    </h2>
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
            {nftNotFound && <UpcomingMemePage id={nftId} />}
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
