"use client";

import { AuthContext } from "@/components/auth/Auth";
import { getDistributionDetailHref } from "@/components/distribution/distributionRouteParams";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import { mainnet } from "viem/chains";

import LatestDropNextMintSubscribe from "@/components/home/now-minting/LatestDropNextMintSubscribe";
import NowMintingCountdown from "@/components/home/now-minting/NowMintingCountdown";
import { getMemeYearFromMintNumber } from "@/components/the-memes/theMemesFilters";
import { getTheMemesRouteHrefWithLocale } from "@/components/the-memes/theMemesRouteParams";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import { useTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NftRank, NftTDH } from "@/entities/INFT";
import type { ConsolidatedTDH } from "@/entities/ITDH";
import type { Transaction } from "@/entities/ITransaction";
import { areEqualAddresses } from "@/helpers/Helpers";
import { formatInteger } from "@/i18n/format";
import { normalizeLocale, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import NftNavigation from "../nft-navigation/NftNavigation";
import MemeCalendarPeriods from "./MemeCalendarPeriods";
import { MemePageArtViewer } from "./MemePageArtViewer";
import { MemePageLiveRightMenu, MemePageLiveSubMenu } from "./MemePageLive";
import {
  MemePageNavigationSkeleton,
  MemePageSkeleton,
  MemePageTitleSkeleton,
} from "./MemePageSkeleton";
import {
  MemePageYourCardsRightMenu,
  MemePageYourCardsSubMenu,
} from "./MemePageYourCards";
import {
  getMemeFocusLabel,
  getMemeTabTitle,
  isMemeFocus,
  MEME_FOCUS,
  MEME_TABS,
} from "./MemeShared";
import styles from "./TheMemes.module.css";
import UpcomingMemePage from "./UpcomingMemePage";
import {
  isAbortError,
  type MemePageInitialData,
  useMemePageFallbackData,
} from "./useMemePageFallbackData";

const MemePageActivity = dynamic(() =>
  import("./MemePageActivity").then((mod) => mod.MemePageActivity)
);

const MemePageTimeline = dynamic(() =>
  import("./MemePageTimeline").then((mod) => mod.MemePageTimeline)
);

const MemePageCollectorsSubMenu = dynamic(() =>
  import("./MemePageCollectors").then((mod) => mod.MemePageCollectorsSubMenu)
);

const MemePageReferencesSubMenu = dynamic(() =>
  import("./MemePageReferences").then((mod) => mod.MemePageReferencesSubMenu)
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
}[] = [
  { focus: MEME_HISTORY_TAB.ACTIVITY },
  { focus: MEME_HISTORY_TAB.YOUR_TRANSACTIONS },
  { focus: MEME_HISTORY_TAB.TIMELINE },
];

const MEME_TAB_BUTTON_BASE_CLASS_NAME =
  "tw-m-0 tw-flex tw-items-center tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-1 tw-py-4 tw-text-base tw-font-semibold tw-leading-4 tw-no-underline tw-transition-colors tw-duration-150 tw-ease-out motion-reduce:tw-transition-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

interface MemeOwnerState {
  readonly consolidationKey: string;
  readonly owner: ConsolidatedTDH;
}

function getMemeHistoryTabLabel(
  tab: MEME_HISTORY_TAB,
  locale: SupportedLocale
): string {
  switch (tab) {
    case MEME_HISTORY_TAB.ACTIVITY:
      return t(locale, "theMemes.detail.tabs.cardActivity");
    case MEME_HISTORY_TAB.YOUR_TRANSACTIONS:
      return t(locale, "theMemes.detail.tabs.yourTransactions");
    case MEME_HISTORY_TAB.TIMELINE:
      return t(locale, "theMemes.detail.tabs.timeline");
    default: {
      const unhandled: never = tab;
      throw new Error(`Unhandled MEME_HISTORY_TAB: ${String(unhandled)}`);
    }
  }
}

function getMemePageTabButtonClassName(isActive: boolean) {
  return `${MEME_TAB_BUTTON_BASE_CLASS_NAME} ${
    isActive
      ? "tw-cursor-default tw-border-primary-400 tw-text-iron-100"
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
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
    >
      {title}
    </button>
  );
}

function UpcomingMemeDistributionHeaderLink({
  id,
  locale,
}: {
  readonly id: number;
  readonly locale: SupportedLocale;
}) {
  return (
    <Link
      href={getDistributionDetailHref({
        basePath: "/the-memes",
        id,
        locale,
      })}
      className="tw-ml-auto tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-md tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-text-sm"
    >
      <span className="tw-whitespace-nowrap">
        {t(locale, "distribution.planLink")}
      </span>
      <ArrowUpRightIcon
        aria-hidden="true"
        className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400"
      />
    </Link>
  );
}

function parseMemeFocus(focus: string | null): MEME_FOCUS | undefined {
  if (focus === null || !isMemeFocus(focus)) {
    return undefined;
  }

  return focus;
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

export default function MemePage({
  nftId,
  initialData,
}: {
  readonly nftId: string;
  readonly initialData?: MemePageInitialData | undefined;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = normalizeLocale(searchParams.get("locale"));
  const { setTitle } = useTitle();
  const { connectedProfile } = useContext(AuthContext);
  const connectedWallets = useMemo(
    () => connectedProfile?.wallets?.map((wallet) => wallet.wallet) ?? [],
    [connectedProfile?.wallets]
  );

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
  const [loadedPrimaryTabs, setLoadedPrimaryTabs] = useState<
    ReadonlySet<MEME_FOCUS>
  >(() => new Set([activeTab]));
  const requestedHistoryTab =
    activeTab === MEME_FOCUS.HISTORY
      ? getHistoryTabForFocus(focusParam)
      : MEME_HISTORY_TAB.ACTIVITY;

  const searchParamsString = useMemo(
    () => searchParams.toString(),
    [searchParams]
  );

  const { pageData, cardLoadFailed, retryCardData } = useMemePageFallbackData({
    nftId,
    initialData,
  });
  const nft = pageData?.nft;
  const nftMeta = pageData?.nftMeta;
  const nftNotFound = pageData?.nftNotFound ?? false;
  const [nftBalance, setNftBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [ownerState, setOwnerState] = useState<MemeOwnerState>();
  const consolidationKey = connectedProfile?.consolidation_key;
  const hasConnectedWallets = connectedWallets.length > 0;
  const myOwner =
    hasConnectedWallets && ownerState?.consolidationKey === consolidationKey
      ? ownerState?.owner
      : undefined;
  const numericNftId = Number.parseInt(nftId, 10);
  const myTDH = useMemo<NftTDH | undefined>(
    () => myOwner?.memes.find((meme) => meme.id === numericNftId),
    [myOwner, numericNftId]
  );
  const myRank = useMemo<NftRank | undefined>(
    () => myOwner?.memes_ranks.find((meme) => meme.id === numericNftId),
    [myOwner, numericNftId]
  );

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
        label: getMemeHistoryTabLabel(tab.focus, locale),
        value: tab.focus,
      })),
    [locale, visibleHistoryTabs]
  );

  const routeFocus = getRouteFocus(activeTab, activeHistoryTab);

  useEffect(() => {
    setTitle(
      getMemeTabTitle(
        t(locale, "theMemes.title"),
        nftId,
        nft,
        routeFocus,
        locale
      )
    );
  }, [locale, nft, nftId, routeFocus, setTitle]);

  function replaceRouteFocus(nextFocus: MEME_FOCUS) {
    const params = new URLSearchParams(searchParamsString);
    params.set("focus", nextFocus);
    const queryString = params.toString();
    globalThis.history.replaceState(
      null,
      "",
      queryString ? `${pathname}?${queryString}` : pathname
    );
  }

  function setActiveMemeTab(nextTab: MEME_FOCUS) {
    if (nextTab === activeTab) {
      return;
    }

    setLoadedPrimaryTabs((current) => {
      if (current.has(activeTab) && current.has(nextTab)) {
        return current;
      }
      return new Set([...current, activeTab, nextTab]);
    });

    if (nextTab === MEME_FOCUS.HISTORY) {
      replaceRouteFocus(getRouteFocus(MEME_FOCUS.HISTORY, activeHistoryTab));
      return;
    }

    replaceRouteFocus(nextTab);
  }

  function setActiveHistoryMemeTab(nextTab: MEME_HISTORY_TAB) {
    replaceRouteFocus(getRouteFocus(MEME_FOCUS.HISTORY, nextTab));
  }

  function updateNftBalances(data: Transaction[]) {
    let countIn = 0;
    let countOut = 0;
    data.forEach((d: Transaction) => {
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
      const controller = new AbortController();
      setUserLoaded(false);
      setTransactions([]);
      setNftBalance(0);

      async function loadTransactions() {
        try {
          const response = await fetchUrl<DBResponse<Transaction>>(
            `${
              publicEnv.API_ENDPOINT
            }/api/transactions?contract=${MEMES_CONTRACT}&wallet=${connectedWallets.join(
              ","
            )}&id=${nftId}`,
            { signal: controller.signal }
          );
          if (controller.signal.aborted) {
            return;
          }
          setTransactions(response.data);
          updateNftBalances(response.data);
          setUserLoaded(true);
        } catch (error: unknown) {
          if (isAbortError(error)) {
            return;
          }
          setTransactions([]);
          setNftBalance(0);
          setUserLoaded(true);
        }
      }

      void loadTransactions();

      return () => controller.abort();
    } else {
      setNftBalance(0);
      setUserLoaded(true);
      setTransactions([]);
      return undefined;
    }
  }, [nftId, connectedWallets]);

  useEffect(() => {
    if (hasConnectedWallets && consolidationKey) {
      const controller = new AbortController();
      const activeConsolidationKey = consolidationKey;

      async function loadOwner() {
        try {
          const response = await commonApiFetch<ConsolidatedTDH>({
            endpoint: `tdh/consolidation/${activeConsolidationKey}`,
            signal: controller.signal,
          });
          setOwnerState({
            consolidationKey: activeConsolidationKey,
            owner: response,
          });
        } catch (error: unknown) {
          if (isAbortError(error)) {
            return;
          }
          // Preserve already loaded metrics for this profile on transient errors.
        }
      }

      void loadOwner();
      return () => controller.abort();
    }
    return undefined;
  }, [consolidationKey, hasConnectedWallets]);

  function printStaticCardHeader() {
    if (!nft) {
      return null;
    }

    const hasMintingBox = isLastCard;
    const artworkColumnBaseClassName =
      "tw-relative lg:tw-flex lg:tw-flex-col lg:tw-self-stretch";
    const cardHeaderClassName = hasMintingBox
      ? "tw-mb-6 tw-grid tw-grid-cols-1 tw-gap-y-0 lg:tw-grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:tw-items-center lg:tw-gap-x-16"
      : "tw-mb-6 tw-grid tw-grid-cols-1 tw-gap-x-10 lg:tw-grid-cols-[minmax(0,11fr)_minmax(0,9fr)] xl:tw-gap-x-16";
    const artworkColumnClassName = hasMintingBox
      ? `${artworkColumnBaseClassName} tw-order-2 tw-mt-6 tw-self-start lg:tw-order-none lg:tw-col-start-1 lg:tw-row-start-1 lg:tw-mt-0`
      : artworkColumnBaseClassName;
    const detailsColumnClassName = hasMintingBox
      ? "tw-contents [&>*:first-child]:tw-order-1 [&>*:nth-child(2)]:tw-order-3 [&>*:nth-child(2)]:tw-pt-0 lg:tw-col-start-2 lg:tw-row-start-1 lg:tw-block lg:[&>*]:tw-order-none lg:[&>*]:tw-w-full lg:[&>*:nth-child(2)]:tw-pt-6"
      : undefined;

    return (
      <div className={cardHeaderClassName}>
        <div className={artworkColumnClassName}>
          <div className={`${styles["nftImageWrapper"] ?? ""} lg:tw-flex-1`}>
            <MemePageArtViewer
              key={`${nft.contract}-${nft.id}`}
              nft={nft}
              showBalance={true}
              locale={locale}
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
        <div className={detailsColumnClassName}>
          {isLastCard && (
            <div className="tw-w-full tw-space-y-3">
              <NowMintingCountdown
                nftId={nft.id}
                contract={MEMES_CONTRACT}
                chainId={mainnet.id}
                fullWidth
              />
              <LatestDropNextMintSubscribe
                appearance="quiet"
                tokenId={nft.id}
                statusSource="none"
              />
            </div>
          )}
          <MemePageLiveRightMenu
            show={true}
            nft={nft}
            nftMeta={nftMeta}
            locale={locale}
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
        aria-label={t(locale, "theMemes.detail.sections.ariaLabel")}
        className="tw-relative tw-mb-8 tw-overflow-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800"
      >
        <div className="tw-w-full tw-overflow-x-auto tw-overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:tw-hidden">
          <div className="-tw-mb-px tw-flex tw-min-w-max tw-gap-x-3 lg:tw-gap-x-4">
            {VISIBLE_MEME_TABS.map((tab) => (
              <MemePageTabButton
                key={`${nft.id}-${tab.focus}-tab`}
                title={getMemeFocusLabel(tab.focus, locale)}
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
      <nav
        aria-label={t(locale, "theMemes.detail.history.ariaLabel")}
        className="tw-pb-8"
      >
        <div className="tw-w-fit tw-max-w-full">
          <CommonTabs<MEME_HISTORY_TAB>
            items={visibleHistoryTabItems}
            activeItem={activeHistoryTab}
            filterLabel={t(locale, "theMemes.detail.history.ariaLabel")}
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
        <div className="tw-p-0">
          <MemePageLiveSubMenu
            show={activeTab === MEME_FOCUS.LIVE}
            nft={nft}
            nftMeta={nftMeta}
            nftBalance={nftBalance}
            defaultAdditionalDetailsOpen={focusParam === MEME_FOCUS.THE_ART}
            locale={locale}
          />
          {(activeTab === MEME_FOCUS.REFERENCES ||
            loadedPrimaryTabs.has(MEME_FOCUS.REFERENCES)) && (
            <MemePageReferencesSubMenu
              show={activeTab === MEME_FOCUS.REFERENCES}
              nft={nft}
              locale={locale}
            />
          )}
          {userLoaded && (
            <MemePageYourCardsSubMenu
              show={
                activeTab === MEME_FOCUS.HISTORY &&
                activeHistoryTab === MEME_HISTORY_TAB.YOUR_TRANSACTIONS
              }
              transactions={transactions}
            />
          )}
          {(activeTab === MEME_FOCUS.COLLECTORS ||
            loadedPrimaryTabs.has(MEME_FOCUS.COLLECTORS)) && (
            <MemePageCollectorsSubMenu
              show={activeTab === MEME_FOCUS.COLLECTORS}
              nft={nft}
              nftMeta={nftMeta}
              locale={locale}
            />
          )}
        </div>
        {activeTab === MEME_FOCUS.HISTORY &&
          activeHistoryTab === MEME_HISTORY_TAB.ACTIVITY && (
            <MemePageActivity
              show={true}
              nft={nft}
              pageSize={ACTIVITY_PAGE_SIZE}
              locale={locale}
            />
          )}
        {activeTab === MEME_FOCUS.HISTORY &&
          activeHistoryTab === MEME_HISTORY_TAB.TIMELINE && (
            <MemePageTimeline show={true} nft={nft} locale={locale} />
          )}
      </>
    );
  }

  const isLastCard = nftMeta?.collection_size === nft?.id;
  const isLoadingNft =
    !cardLoadFailed && (pageData === undefined || (!nft && !nftNotFound));
  const nftYear = nft === undefined ? null : getMemeYearFromMintNumber(nft.id);
  const parsedNftId = Number(nftId);
  const showUpcomingDistributionLink =
    nftNotFound && Number.isInteger(parsedNftId) && parsedNftId > 0;

  return (
    <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-800 tw-bg-[#0D0D0F] tw-pb-5 tw-text-white">
      <div className="tw-px-4 tw-py-4 md:tw-px-6 md:tw-pb-10 lg:tw-px-8">
        <header className="tw-pb-8">
          <div className="tw-flex tw-flex-col tw-gap-4">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2 md:tw-justify-start">
              <div className="tw-mb-0 tw-flex tw-items-center">
                <Link
                  href={getTheMemesRouteHrefWithLocale({
                    href: "/the-memes",
                    locale,
                  })}
                  aria-label={t(locale, "theMemes.detail.backLink.ariaLabel")}
                  className="tw-group -tw-ml-2 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-px-2 tw-py-2 tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                >
                  <ArrowLeftIcon
                    aria-hidden="true"
                    className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition-transform group-hover:-tw-translate-x-0.5"
                  />
                  {t(locale, "theMemes.title")}
                </Link>
              </div>
              {showUpcomingDistributionLink && (
                <UpcomingMemeDistributionHeaderLink
                  id={parsedNftId}
                  locale={locale}
                />
              )}
              {nftMeta && nft && (
                <div className="tw-ml-auto tw-flex tw-min-w-0 tw-items-center md:tw-ml-0">
                  <MemeCalendarPeriods
                    id={nft.id}
                    locale={locale}
                    seasonHref={`/the-memes?szn=${nftMeta.season}&sort=age&sort_dir=ASC`}
                    yearHref={
                      nftYear === null
                        ? undefined
                        : `/the-memes?year=${nftYear}&sort=age&sort_dir=ASC`
                    }
                    showOnlySeasonOnMobile
                  />
                </div>
              )}
            </div>
            {nftMeta && nft ? (
              <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-3 md:tw-flex-wrap md:tw-justify-start">
                <div className="tw-order-2 tw-flex tw-shrink-0 tw-justify-end md:tw-order-1">
                  <NftNavigation
                    nftId={nft.id}
                    path="/the-memes"
                    startIndex={1}
                    endIndex={nftMeta.collection_size}
                    params={searchParams}
                  />
                </div>
                <div className="tw-order-1 tw-min-w-0 tw-flex-1 md:tw-order-2">
                  <h1
                    className="tw-m-0 tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1 md:tw-flex-nowrap md:tw-gap-x-0"
                    aria-label={t(locale, "theMemes.detail.heading.ariaLabel", {
                      tokenId: formatInteger(locale, nft.id),
                      name: nft.name,
                    })}
                  >
                    <span className="tw-mb-0 tw-shrink-0 tw-text-lg tw-font-normal tw-leading-tight tw-text-iron-400 sm:tw-text-2xl">
                      {t(locale, "theMemes.detail.heading.card", {
                        tokenId: formatInteger(locale, nft.id),
                      })}
                    </span>
                    <span
                      aria-hidden="true"
                      className="tw-mx-3 tw-h-5 tw-w-px tw-self-center tw-bg-white/[0.16] sm:tw-h-6"
                    />
                    <span className="tw-mb-0 tw-min-w-0 tw-whitespace-normal tw-break-words tw-text-lg tw-font-semibold tw-leading-tight tw-text-iron-100 sm:tw-text-2xl md:tw-truncate">
                      {nft.name}
                    </span>
                  </h1>
                </div>
              </div>
            ) : (
              isLoadingNft && (
                <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-3 md:tw-flex-wrap md:tw-justify-start">
                  <div className="tw-order-2 tw-flex tw-shrink-0 tw-justify-end md:tw-order-1">
                    <MemePageNavigationSkeleton />
                  </div>
                  <div className="tw-order-1 tw-min-w-0 tw-flex-1 md:tw-order-2">
                    <MemePageTitleSkeleton />
                  </div>
                </div>
              )
            )}
          </div>
        </header>
        {cardLoadFailed && (
          <div
            role="alert"
            className="tw-mb-8 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/60 tw-p-5 tw-text-center"
          >
            <p className="tw-m-0 tw-text-sm tw-text-iron-300">
              {t(locale, "theMemes.detail.loadError.message")}
            </p>
            <button
              type="button"
              onClick={retryCardData}
              className="tw-mt-4 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors tw-duration-150 hover:tw-bg-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none"
            >
              {t(locale, "theMemes.detail.loadError.retry")}
            </button>
          </div>
        )}
        {isLoadingNft && <MemePageSkeleton />}
        {nftMeta && nft && (
          <>
            {printStaticCardHeader()}
            {printTabs()}
            {printHistoryTabs()}
            {printContent()}
          </>
        )}
        {nftNotFound && <UpcomingMemePage id={nftId} locale={locale} />}
      </div>
    </div>
  );
}
