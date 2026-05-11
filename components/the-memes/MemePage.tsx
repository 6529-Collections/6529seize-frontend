"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import { Container, Row } from "react-bootstrap";
import { mainnet } from "viem/chains";
import { AuthContext } from "@/components/auth/Auth";

import NowMintingCountdown from "@/components/home/now-minting/NowMintingCountdown";
import NFTImage from "@/components/nft-image/NFTImage";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import { useTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { MemesExtendedData, NFT, NftRank, NftTDH } from "@/entities/INFT";
import type { ConsolidatedTDH } from "@/entities/ITDH";
import type { Transaction } from "@/entities/ITransaction";
import { areEqualAddresses } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import NftNavigation from "../nft-navigation/NftNavigation";
import {
  MemePageCollectorsRightMenu,
  MemePageCollectorsSubMenu,
} from "./MemePageCollectors";
import { MemePageLiveRightMenu, MemePageLiveSubMenu } from "./MemePageLive";
import { MemePageReferencesSubMenu } from "./MemePageReferences";
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
import styles from "./TheMemes.module.scss";
import UpcomingMemePage from "./UpcomingMemePage";

const MemePageActivity = dynamic(() =>
  import("./MemePageActivity").then((mod) => mod.MemePageActivity)
);

const MemePageTimeline = dynamic(() =>
  import("./MemePageTimeline").then((mod) => mod.MemePageTimeline)
);

const ACTIVITY_PAGE_SIZE = 25;
const VISIBLE_MEME_TABS = [
  MEME_FOCUS.LIVE,
  MEME_FOCUS.COLLECTORS,
  MEME_FOCUS.HISTORY,
  MEME_FOCUS.REFERENCES,
]
  .map((focus) => MEME_TABS.find((tab) => tab.focus === focus))
  .filter((tab): tab is (typeof MEME_TABS)[number] => tab !== undefined);
const MEME_PAGE_ROOT_CLASSES =
  "tailwind-scope tw-min-h-[calc(100vh-100px)] tw-bg-black tw-pb-5 tw-text-white";
const MEME_PAGE_CONTAINER_CLASSES =
  "tw-mx-auto tw-w-full tw-px-4 tw-py-10 md:tw-px-6 lg:tw-px-8 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]";
const PAGE_TITLE_CLASSES =
  "tw-mb-0 tw-text-xl tw-font-bold tw-leading-tight tw-text-white";
const CARD_TITLE_CLASSES =
  "tw-mb-0 tw-text-lg tw-font-bold tw-leading-tight tw-text-white";
enum MEME_HISTORY_TAB {
  ACTIVITY = "activity",
  TIMELINE = "timeline",
  YOUR_TRANSACTIONS = "your-transactions",
}

const MEME_HISTORY_TABS: {
  readonly focus: MEME_HISTORY_TAB;
  readonly title: string;
}[] = [
  { focus: MEME_HISTORY_TAB.ACTIVITY, title: "Activity" },
  { focus: MEME_HISTORY_TAB.TIMELINE, title: "Timeline" },
  { focus: MEME_HISTORY_TAB.YOUR_TRANSACTIONS, title: "Your Transactions" },
];

const MEME_FOCUS_VALUES: readonly string[] = Object.values(MEME_FOCUS);

function parseMemeFocus(focus: string | null): MEME_FOCUS | undefined {
  if (focus === null || !MEME_FOCUS_VALUES.includes(focus)) {
    return undefined;
  }

  return focus as MEME_FOCUS;
}

function getHistoryTabForFocus(
  focus: MEME_FOCUS | undefined
): MEME_HISTORY_TAB {
  if (focus === MEME_FOCUS.TIMELINE) {
    return MEME_HISTORY_TAB.TIMELINE;
  }
  if (focus === MEME_FOCUS.YOUR_TRANSACTIONS) {
    return MEME_HISTORY_TAB.YOUR_TRANSACTIONS;
  }
  if (focus === MEME_FOCUS.YOUR_CARDS) {
    return MEME_HISTORY_TAB.YOUR_TRANSACTIONS;
  }
  return MEME_HISTORY_TAB.ACTIVITY;
}

function getRouteFocus(
  activeTab: MEME_FOCUS,
  activeHistoryTab: MEME_HISTORY_TAB
) {
  if (activeTab !== MEME_FOCUS.HISTORY) {
    return activeTab;
  }

  if (activeHistoryTab === MEME_HISTORY_TAB.TIMELINE) {
    return MEME_FOCUS.TIMELINE;
  }

  if (activeHistoryTab === MEME_HISTORY_TAB.YOUR_TRANSACTIONS) {
    return MEME_FOCUS.YOUR_TRANSACTIONS;
  }

  return MEME_FOCUS.ACTIVITY;
}

export default function MemePage({ nftId }: { readonly nftId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { setTitle } = useTitle();
  const { connectedProfile } = useContext(AuthContext);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  const focusParam = parseMemeFocus(searchParams.get("focus"));
  const resolvedRouterFocus = useMemo(() => {
    if (focusParam === undefined) {
      return undefined;
    }
    if (focusParam === MEME_FOCUS.THE_ART) {
      return MEME_FOCUS.LIVE;
    }
    if (
      focusParam === MEME_FOCUS.YOUR_CARDS ||
      focusParam === MEME_FOCUS.ACTIVITY ||
      focusParam === MEME_FOCUS.TIMELINE ||
      focusParam === MEME_FOCUS.YOUR_TRANSACTIONS
    ) {
      return MEME_FOCUS.HISTORY;
    }
    return focusParam;
  }, [focusParam]);

  const activeTab = resolvedRouterFocus ?? MEME_FOCUS.LIVE;
  const activeHistoryTab =
    activeTab === MEME_FOCUS.HISTORY
      ? getHistoryTabForFocus(focusParam)
      : MEME_HISTORY_TAB.ACTIVITY;

  const routeFocus = getRouteFocus(activeTab, activeHistoryTab);

  useEffect(() => {
    setConnectedWallets(connectedProfile?.wallets?.map((w) => w.wallet) ?? []);
  }, [connectedProfile]);

  const searchParamsString = useMemo(
    () => searchParams.toString(),
    [searchParams]
  );

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
    setTitle(getMemeTabTitle(`The Memes`, nftId, nft, routeFocus));
  }, [nft, nftId, routeFocus, setTitle]);

  function replaceRouteFocus(nextFocus: MEME_FOCUS) {
    const params = new URLSearchParams(searchParamsString);
    params.set("focus", nextFocus);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  function setActiveMemeTab(nextTab: MEME_FOCUS) {
    if (nextTab === MEME_FOCUS.HISTORY) {
      replaceRouteFocus(getRouteFocus(MEME_FOCUS.HISTORY, activeHistoryTab));
      return;
    }

    replaceRouteFocus(nextTab);
  }

  function setActiveHistoryMemeTab(nextTab: MEME_HISTORY_TAB) {
    replaceRouteFocus(getRouteFocus(MEME_FOCUS.HISTORY, nextTab));
  }

  useEffect(() => {
    if (!nftId) {
      return;
    }

    let cancelled = false;

    const metaPromise = fetchUrl(
      `${publicEnv.API_ENDPOINT}/api/memes_extended_data?id=${nftId}`
    );
    const nftPromise = fetchUrl(
      `${publicEnv.API_ENDPOINT}/api/nfts?id=${nftId}&contract=${MEMES_CONTRACT}`
    );

    Promise.all([metaPromise, nftPromise])
      .then(([metaResponse, nftResponse]: [DBResponse, DBResponse]) => {
        if (cancelled) {
          return;
        }
        const nftMetas = metaResponse.data;
        if (Array.isArray(nftMetas) && nftMetas.length === 1) {
          setNftMeta(nftMetas[0]);
          const mynft = nftResponse.data?.[0];
          setNft(mynft);
          setNftNotFound(false);
        } else {
          setNftMeta(undefined);
          setNft(undefined);
          setNftNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNftMeta(undefined);
          setNft(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
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
    if (
      connectedWallets.length > 0 &&
      nftId &&
      connectedProfile?.consolidation_key
    ) {
      commonApiFetch<ConsolidatedTDH>({
        endpoint: `tdh/consolidation/${connectedProfile.consolidation_key}`,
      })
        .then((response) => {
          setMyOwner(response);
          setMyTDH(
            response.memes.find((m) => m.id === Number.parseInt(nftId, 10))
          );
          setMyRank(
            response.memes_ranks.find(
              (m) => m.id === Number.parseInt(nftId, 10)
            )
          );
        })
        .catch(() => {
          setMyOwner(undefined);
          setMyTDH(undefined);
          setMyRank(undefined);
        });
    }
  }, [nftId, connectedWallets, connectedProfile?.consolidation_key]);

  function printStaticCardHeader() {
    if (!nft) {
      return null;
    }

    return (
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 md:tw-gap-x-6">
        <div>
          <div
            className={`${styles["nftImageWrapper"] ?? ""} tw-pb-12 tw-pt-2`}
          >
            <NFTImage
              nft={nft}
              animation={true}
              height={650}
              showBalance={true}
            />
          </div>
          {userLoaded && (
            <MemePageYourCardsRightMenu
              show={true}
              transactions={transactions}
              wallets={connectedWallets}
              nft={nft}
              nftBalance={nftBalance}
              myOwner={myOwner}
              myTDH={myTDH}
              myRank={myRank}
            />
          )}
        </div>
        <div>
          {isLastCard && (
            <NowMintingCountdown
              nftId={nft.id}
              contract={MEMES_CONTRACT}
              chainId={mainnet.id}
              fullWidth
            />
          )}
          <MemePageLiveRightMenu
            show={true}
            nft={nft}
            nftMeta={nftMeta}
            nftBalance={nftBalance}
          />
        </div>
      </div>
    );
  }

  function printTabs() {
    if (!nft) {
      return null;
    }

    return (
      <nav
        aria-label="Meme page sections"
        className="tw-py-3 [&_button]:tw-text-base"
      >
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          {VISIBLE_MEME_TABS.map((tab) => (
            <TabButton
              key={`${nft.id}-${tab.focus}-tab`}
              tab={tab}
              activeTab={activeTab}
              setActiveTab={setActiveMemeTab}
            />
          ))}
        </div>
      </nav>
    );
  }

  function printHistoryTabs() {
    if (!nft || activeTab !== MEME_FOCUS.HISTORY) {
      return null;
    }

    return (
      <nav
        aria-label="Meme history sections"
        className="tw-pb-3 [&_button]:tw-text-base"
      >
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          {MEME_HISTORY_TABS.map((tab) => {
            const isActive = activeHistoryTab === tab.focus;

            return (
              <button
                key={`${nft.id}-${tab.focus}-history-tab`}
                type="button"
                className={`tw-m-0 tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-no-underline tw-transition-colors tw-duration-200 ${
                  isActive
                    ? "tw-font-semibold tw-text-white"
                    : "tw-text-gray-400 hover:tw-text-white"
                }`}
                onClick={() => setActiveHistoryMemeTab(tab.focus)}
              >
                {tab.title}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  function printContent() {
    return (
      <>
        <Container className="p-0">
          {activeTab === MEME_FOCUS.COLLECTORS && (
            <Row className="pt-3">
              <MemePageCollectorsRightMenu show={true} nft={nft} />
            </Row>
          )}
          <MemePageLiveSubMenu
            show={activeTab === MEME_FOCUS.LIVE}
            nft={nft}
            nftMeta={nftMeta}
            nftBalance={nftBalance}
            defaultAdditionalDetailsOpen={focusParam === MEME_FOCUS.THE_ART}
          />
          <MemePageReferencesSubMenu
            show={activeTab === MEME_FOCUS.REFERENCES}
            nft={nft}
          />
          {userLoaded && (
            <MemePageYourCardsSubMenu
              show={
                activeTab === MEME_FOCUS.HISTORY &&
                activeHistoryTab === MEME_HISTORY_TAB.YOUR_TRANSACTIONS
              }
              transactions={transactions}
            />
          )}
          <MemePageCollectorsSubMenu
            show={activeTab === MEME_FOCUS.COLLECTORS}
            nft={nft}
          />
        </Container>
        {activeTab === MEME_FOCUS.HISTORY &&
          activeHistoryTab === MEME_HISTORY_TAB.ACTIVITY && (
            <MemePageActivity
              show={true}
              nft={nft}
              pageSize={ACTIVITY_PAGE_SIZE}
            />
          )}
        {activeTab === MEME_FOCUS.HISTORY &&
          activeHistoryTab === MEME_HISTORY_TAB.TIMELINE && (
            <MemePageTimeline show={true} nft={nft} />
          )}
      </>
    );
  }

  const isLastCard = nftMeta?.collection_size === nft?.id;

  return (
    <main className={MEME_PAGE_ROOT_CLASSES}>
      <div className={MEME_PAGE_CONTAINER_CLASSES}>
        <header>
          <h1 className={PAGE_TITLE_CLASSES}>The Memes</h1>
          {nftMeta && nft && (
            <div className="tw-flex tw-flex-col tw-gap-4 tw-py-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline">
                <h2 className={CARD_TITLE_CLASSES}>
                  <Link
                    href={`/the-memes?szn=${nftMeta.season}&sort=age&sort_dir=ASC`}
                    className="tw-text-white tw-underline hover:tw-text-iron-300"
                  >
                    SZN{nftMeta.season}
                  </Link>
                </h2>
                <h2 className={CARD_TITLE_CLASSES}>
                  &nbsp;| Card {nft.id} -&nbsp;
                </h2>
                <h2 className={CARD_TITLE_CLASSES}>{nft.name}</h2>
              </div>
              <div className="tw-flex tw-shrink-0 tw-justify-end sm:tw-ml-6">
                <NftNavigation
                  nftId={nft.id}
                  path="/the-memes"
                  startIndex={1}
                  endIndex={nftMeta.collection_size}
                  params={searchParams}
                />
              </div>
            </div>
          )}
        </header>
        {nftMeta && nft && (
          <>
            {printStaticCardHeader()}
            {printTabs()}
            {printHistoryTabs()}
            {printContent()}
          </>
        )}
        {nftNotFound && <UpcomingMemePage id={nftId} />}
      </div>
    </main>
  );
}
