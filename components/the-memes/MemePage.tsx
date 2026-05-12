"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import { Container, Row } from "react-bootstrap";
import { mainnet } from "viem/chains";
import { AuthContext } from "@/components/auth/Auth";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

import NowMintingCountdown from "@/components/home/now-minting/NowMintingCountdown";
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
import { MemePageArtViewer } from "./MemePageArtViewer";
import MemeCalendarPeriods from "./MemeCalendarPeriods";
import { MemePageLiveRightMenu, MemePageLiveSubMenu } from "./MemePageLive";
import { MemePageReferencesSubMenu } from "./MemePageReferences";
import {
  MemePageYourCardsRightMenu,
  MemePageYourCardsSubMenu,
} from "./MemePageYourCards";
import { getMemeTabTitle, MEME_FOCUS, MEME_TABS } from "./MemeShared";
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
enum MEME_HISTORY_TAB {
  ACTIVITY = "activity",
  TIMELINE = "timeline",
  YOUR_TRANSACTIONS = "your-transactions",
}

const MEME_HISTORY_TABS: {
  readonly focus: MEME_HISTORY_TAB;
  readonly title: string;
}[] = [
  { focus: MEME_HISTORY_TAB.TIMELINE, title: "Timeline" },
  { focus: MEME_HISTORY_TAB.ACTIVITY, title: "Card Activity" },
  { focus: MEME_HISTORY_TAB.YOUR_TRANSACTIONS, title: "Your Transactions" },
];

const MEME_FOCUS_VALUES: readonly string[] = Object.values(MEME_FOCUS);
const MEME_TAB_BUTTON_BASE_CLASS_NAME =
  "tw-m-0 tw-flex tw-items-center tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-1 tw-py-4 tw-text-base tw-font-semibold tw-leading-4 tw-no-underline tw-transition tw-duration-300 tw-ease-out";

function getMemePageTabButtonClassName(isActive: boolean) {
  return `${MEME_TAB_BUTTON_BASE_CLASS_NAME} ${
    isActive
      ? "tw-pointer-events-none tw-border-primary-400 tw-text-iron-100"
      : "tw-cursor-pointer tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100"
  }`;
}

function MemePageTabButton({
  title,
  isActive,
  onClick,
}: {
  readonly title: string;
  readonly isActive: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={getMemePageTabButtonClassName(isActive)}
      onClick={onClick}
    >
      {title}
    </button>
  );
}

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
  const requestedHistoryTab =
    activeTab === MEME_FOCUS.HISTORY
      ? getHistoryTabForFocus(focusParam)
      : MEME_HISTORY_TAB.ACTIVITY;

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

  const hasUserTransactions =
    userLoaded && connectedWallets.length > 0 && transactions.length > 0;

  const activeHistoryTab =
    requestedHistoryTab === MEME_HISTORY_TAB.YOUR_TRANSACTIONS &&
    !hasUserTransactions
      ? MEME_HISTORY_TAB.ACTIVITY
      : requestedHistoryTab;

  const visibleHistoryTabs = useMemo(
    () =>
      MEME_HISTORY_TABS.filter(
        (tab) =>
          tab.focus !== MEME_HISTORY_TAB.YOUR_TRANSACTIONS ||
          hasUserTransactions
      ),
    [hasUserTransactions]
  );
  const visibleHistoryTabItems = useMemo(
    () =>
      visibleHistoryTabs.map((tab) => ({
        key: tab.focus,
        label: tab.title,
        value: tab.focus,
      })),
    [visibleHistoryTabs]
  );

  const routeFocus = getRouteFocus(activeTab, activeHistoryTab);

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
            <MemePageArtViewer
              key={`${nft.contract}-${nft.id}`}
              nft={nft}
              showBalance={true}
            />
          </div>
          {userLoaded && (
            <MemePageYourCardsRightMenu
              show={hasUserTransactions}
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
        className="tw-relative tw-overflow-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-700 tw-pb-6"
      >
        <div className="tw-w-full tw-overflow-x-auto tw-overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:tw-hidden">
          <div className="-tw-mb-px tw-flex tw-min-w-max tw-gap-x-3 lg:tw-gap-x-4">
            {VISIBLE_MEME_TABS.map((tab) => (
              <MemePageTabButton
                key={`${nft.id}-${tab.focus}-tab`}
                title={tab.title}
                isActive={activeTab === tab.focus}
                onClick={() => setActiveMemeTab(tab.focus)}
              />
            ))}
          </div>
        </div>
      </nav>
    );
  }

  function printHistoryTabs() {
    if (!nft || activeTab !== MEME_FOCUS.HISTORY) {
      return null;
    }

    return (
      <nav aria-label="Meme history sections" className="tw-pb-5">
        <div className="tw-w-fit tw-max-w-full">
          <CommonTabs<MEME_HISTORY_TAB>
            items={visibleHistoryTabItems}
            activeItem={activeHistoryTab}
            filterLabel="Meme history sections"
            setSelected={setActiveHistoryMemeTab}
            fill={false}
          />
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
            nftMeta={nftMeta}
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
    <main className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-bg-black tw-pb-5 tw-text-white">
      <div className="tw-mx-auto tw-w-full tw-px-4 tw-py-10 md:tw-px-6 min-[1000px]:tw-max-w-[850px] lg:tw-px-8 min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        <header className="tw-pb-3">
          <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
            <div className="tw-min-w-0">
              <div className="tw-mb-2 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
                <h1 className="tw-mb-0 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
                  <Link
                    href="/the-memes"
                    className="tw-uppercase tw-text-iron-300 tw-underline tw-decoration-iron-600 tw-underline-offset-2 hover:tw-text-white"
                  >
                    The Memes
                  </Link>
                </h1>
                {nftMeta && nft && (
                  <>
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="tw-h-3 tw-w-3 tw-flex-shrink-0 tw-text-iron-500"
                    />
                    <div className="tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
                      <MemeCalendarPeriods id={nft.id} />
                    </div>
                  </>
                )}
              </div>
              {nftMeta && nft && (
                <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline">
                  <h2 className="tw-mb-0 tw-text-lg tw-font-medium tw-leading-tight tw-text-iron-400 sm:tw-text-2xl">
                    Card {nft.id}{" "}
                    <span className="tw-font-light tw-text-iron-400">—</span>{" "}
                    <span className="tw-font-semibold tw-text-iron-100">
                      {nft.name}
                    </span>
                  </h2>
                </div>
              )}
            </div>
            {nftMeta && nft && (
              <div className="tw-flex tw-shrink-0 tw-justify-end sm:tw-ml-6">
                <NftNavigation
                  nftId={nft.id}
                  path="/the-memes"
                  startIndex={1}
                  endIndex={nftMeta.collection_size}
                  params={searchParams}
                />
              </div>
            )}
          </div>
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
