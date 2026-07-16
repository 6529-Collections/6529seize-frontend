"use client";

import { useAuth } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { ActivityTypeItems } from "@/components/latest-activity/ActivityFilters";
import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import MemeLabLeaderboard from "@/components/leaderboard/MemeLabLeaderboard";
import { MemeLabOverviewDetails } from "@/components/memelab/MemeLabAdditionalDetails";
import { getMemeLabRouteHrefWithLocale } from "@/components/memelab/memeLabRouteParams";
import {
  MEME_LAB_STATS_ROW_CLASS,
  MemeLabCardVolumes,
  MemeLabStaticCardHeader,
  MemeLabStatMetric,
} from "@/components/memelab/MemeLabCardHeader";
import {
  MemeLabYourCardsPanel,
  MemeLabYourTransactionsTable,
} from "@/components/memelab/MemeLabYourCards";
import NftNavigation from "@/components/nft-navigation/NftNavigation";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import Pagination from "@/components/pagination/Pagination";
import { printMemeReferences } from "@/components/rememes/RememePage";
import {
  MemePageNavigationSkeleton,
  MemePageSkeleton,
  MemePageTitleSkeleton,
} from "@/components/the-memes/MemePageSkeleton";
import { MEME_FOCUS, MEME_TABS } from "@/components/the-memes/MemeShared";
import Timeline from "@/components/timeline/Timeline";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT, MEMES_CONTRACT } from "@/constants/constants";
import { useTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { LabExtendedData, LabNFT, NFT, NFTHistory } from "@/entities/INFT";
import type { Transaction } from "@/entities/ITransaction";
import { areEqualAddresses } from "@/helpers/Helpers";
import { TypeFilter } from "@/hooks/useActivityData";
import useCapacitor from "@/hooks/useCapacitor";
import { formatInteger, formatPercent } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const ACTIVITY_PAGE_SIZE = 25;
const MEME_LAB_TAB_FOCUSES = [
  MEME_FOCUS.LIVE,
  MEME_FOCUS.COLLECTORS,
  MEME_FOCUS.HISTORY,
  MEME_FOCUS.REFERENCES,
] as const;
const MEME_LAB_FOCUS_VALUES = new Set<MEME_FOCUS>(MEME_LAB_TAB_FOCUSES);
const isMemeLabFocus = (focus: MEME_FOCUS): boolean =>
  MEME_LAB_FOCUS_VALUES.has(focus);
const MEME_LAB_TABS = MEME_LAB_TAB_FOCUSES.map((focus) =>
  MEME_TABS.find((tab) => tab.focus === focus)
).filter((tab): tab is (typeof MEME_TABS)[number] => tab !== undefined);

enum MEME_LAB_HISTORY_TAB {
  ACTIVITY = "activity",
  YOUR_TRANSACTIONS = "your-transactions",
  TIMELINE = "timeline",
}

const MEME_LAB_HISTORY_TABS: {
  readonly focus: MEME_LAB_HISTORY_TAB;
}[] = [
  { focus: MEME_LAB_HISTORY_TAB.ACTIVITY },
  { focus: MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS },
  { focus: MEME_LAB_HISTORY_TAB.TIMELINE },
];

function parseMemeLabFocus(focus: string | null): MEME_FOCUS | undefined {
  if (focus === MEME_FOCUS.THE_ART) {
    return MEME_FOCUS.LIVE;
  }

  if (
    focus === MEME_FOCUS.ACTIVITY ||
    focus === MEME_FOCUS.YOUR_TRANSACTIONS ||
    focus === MEME_FOCUS.TIMELINE
  ) {
    return MEME_FOCUS.HISTORY;
  }

  const resolvedFocus = Object.values(MEME_FOCUS).find(
    (candidate) => candidate === focus
  );
  if (resolvedFocus === undefined || !isMemeLabFocus(resolvedFocus)) {
    return undefined;
  }

  return resolvedFocus;
}

function getMemeLabHistoryTabForFocus(
  focus: string | null
): MEME_LAB_HISTORY_TAB {
  if (focus === MEME_FOCUS.TIMELINE) {
    return MEME_LAB_HISTORY_TAB.TIMELINE;
  }

  if (focus === MEME_FOCUS.YOUR_TRANSACTIONS) {
    return MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS;
  }

  return MEME_LAB_HISTORY_TAB.ACTIVITY;
}

function getMemeLabRouteFocus(
  activeTab: MEME_FOCUS,
  activeHistoryTab: MEME_LAB_HISTORY_TAB
): MEME_FOCUS {
  if (activeTab !== MEME_FOCUS.HISTORY) {
    return activeTab;
  }

  if (activeHistoryTab === MEME_LAB_HISTORY_TAB.TIMELINE) {
    return MEME_FOCUS.TIMELINE;
  }

  if (activeHistoryTab === MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS) {
    return MEME_FOCUS.YOUR_TRANSACTIONS;
  }

  return MEME_FOCUS.ACTIVITY;
}

const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }
  return error instanceof Error && error.name === "AbortError";
};

const MEME_LAB_TAB_BUTTON_BASE_CLASS_NAME =
  "tw-m-0 tw-flex tw-items-center tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-1 tw-py-4 tw-text-base tw-font-semibold tw-leading-4 tw-no-underline tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

function getMemeLabTabButtonClassName(isActive: boolean) {
  return `${MEME_LAB_TAB_BUTTON_BASE_CLASS_NAME} ${
    isActive
      ? "tw-pointer-events-none tw-border-primary-400 tw-text-iron-100"
      : "tw-cursor-pointer tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100"
  }`;
}

function MemeLabPageTabButton({
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
      aria-pressed={isActive}
      className={getMemeLabTabButtonClassName(isActive)}
      onClick={onClick}
    >
      {title}
    </button>
  );
}

function getMemeLabDetailTabLabel(
  focus: MEME_FOCUS,
  locale: SupportedLocale
): string {
  switch (focus) {
    case MEME_FOCUS.LIVE:
      return t(locale, "memeLab.detail.tabs.overview");
    case MEME_FOCUS.REFERENCES:
      return t(locale, "memeLab.detail.tabs.references");
    case MEME_FOCUS.COLLECTORS:
      return t(locale, "memeLab.detail.tabs.collectors");
    case MEME_FOCUS.HISTORY:
      return t(locale, "memeLab.detail.tabs.history");
    default:
      return t(locale, "memeLab.detail.tabs.overview");
  }
}

function getMemeLabHistoryTabLabel(
  focus: MEME_LAB_HISTORY_TAB,
  locale: SupportedLocale
): string {
  switch (focus) {
    case MEME_LAB_HISTORY_TAB.ACTIVITY:
      return t(locale, "memeLab.detail.tabs.cardActivity");
    case MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS:
      return t(locale, "memeLab.detail.tabs.yourTransactions");
    case MEME_LAB_HISTORY_TAB.TIMELINE:
      return t(locale, "memeLab.detail.tabs.timeline");
  }
}

function getMemeLabRouteFocusLabel(
  focus: MEME_FOCUS,
  locale: SupportedLocale
): string {
  if (focus === MEME_FOCUS.ACTIVITY) {
    return t(locale, "memeLab.detail.tabs.cardActivity");
  }

  if (focus === MEME_FOCUS.YOUR_TRANSACTIONS) {
    return t(locale, "memeLab.detail.tabs.yourTransactions");
  }

  if (focus === MEME_FOCUS.TIMELINE) {
    return t(locale, "memeLab.detail.tabs.timeline");
  }

  return getMemeLabDetailTabLabel(parseMemeLabFocus(focus) ?? focus, locale);
}

function getMemeLabBrowserTitle({
  nft,
  nftId,
  routeFocus,
  locale,
}: {
  readonly nft: LabNFT | undefined;
  readonly nftId: string;
  readonly routeFocus: MEME_FOCUS;
  readonly locale: SupportedLocale;
}): string {
  const title = nft
    ? t(locale, "memeLab.detail.browserTitle", {
        name: nft.name,
        tokenId: nft.id,
      })
    : t(locale, "memeLab.detail.heading.card", { tokenId: nftId });

  if (routeFocus === MEME_FOCUS.LIVE) {
    return title;
  }

  return t(locale, "memeLab.detail.browserTitleWithTab", {
    title,
    tab: getMemeLabRouteFocusLabel(routeFocus, locale),
  });
}

function formatMemeLabPercent(value: number, locale: SupportedLocale) {
  return formatPercent(locale, value);
}

export default function MemeLabPageComponent({
  nftId,
  locale = DEFAULT_LOCALE,
}: {
  readonly nftId: string;
  readonly locale?: SupportedLocale | undefined;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const capacitor = useCapacitor();

  const { connectedProfile } = useAuth();
  const { country } = useCookieConsent();
  const { setTitle } = useTitle();

  const focusParam = searchParams.get("focus");
  const defaultAdditionalDetailsOpen = focusParam === MEME_FOCUS.THE_ART;
  const searchParamsString = useMemo(
    () => searchParams.toString(),
    [searchParams]
  );
  const routeTab = parseMemeLabFocus(focusParam) ?? MEME_FOCUS.LIVE;
  const activitySectionRef = useRef<HTMLElement | null>(null);

  const [nft, setNft] = useState<LabNFT>();
  const [originalMemes, setOriginalMemes] = useState<NFT[]>([]);
  const [nftMeta, setNftMeta] = useState<LabExtendedData>();
  const [nftLoading, setNftLoading] = useState(true);
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
  const [activityLoading, setActivityLoading] = useState(false);
  const hasUserCards = userLoaded && nftBalance > 0;
  const hasOwnershipContext = hasUserCards;
  const hasUserTransactions =
    userLoaded &&
    (connectedProfile?.wallets?.length ?? 0) > 0 &&
    transactions.length > 0;
  const activeTab = routeTab;
  const requestedHistoryTab = getMemeLabHistoryTabForFocus(focusParam);
  const activeHistoryTab =
    requestedHistoryTab === MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS &&
    !hasUserTransactions
      ? MEME_LAB_HISTORY_TAB.ACTIVITY
      : requestedHistoryTab;
  const visibleMemeLabTabs = MEME_LAB_TABS;
  const visibleHistoryTabItems = useMemo(
    () =>
      MEME_LAB_HISTORY_TABS.filter(
        (tab) =>
          tab.focus !== MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS ||
          hasUserTransactions
      ).map((tab) => ({
        key: tab.focus,
        label: getMemeLabHistoryTabLabel(tab.focus, locale),
        value: tab.focus,
      })),
    [hasUserTransactions, locale]
  );
  const routeFocus = getMemeLabRouteFocus(activeTab, activeHistoryTab);
  const isLoadingNft = nftLoading && (!nft || !nftMeta);

  useEffect(() => {
    setTitle(getMemeLabBrowserTitle({ nft, nftId, routeFocus, locale }));
  }, [locale, nft, nftId, routeFocus, setTitle]);

  function replaceRouteFocus(nextFocus: MEME_FOCUS) {
    const query = new URLSearchParams(searchParamsString);
    query.set("focus", nextFocus);
    const queryString = query.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  function setActiveMemeLabTab(nextTab: MEME_FOCUS) {
    if (nextTab === MEME_FOCUS.HISTORY) {
      replaceRouteFocus(
        getMemeLabRouteFocus(MEME_FOCUS.HISTORY, activeHistoryTab)
      );
      return;
    }

    replaceRouteFocus(nextTab);
  }

  function setActiveHistoryMemeLabTab(nextTab: MEME_LAB_HISTORY_TAB) {
    replaceRouteFocus(getMemeLabRouteFocus(MEME_FOCUS.HISTORY, nextTab));
  }

  useEffect(() => {
    setNft(undefined);
    setNftMeta(undefined);
    setNftLoading(Boolean(nftId));
    setOriginalMemes([]);
    setOriginalMemesLoaded(false);

    if (!nftId) {
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();
    const { signal } = abortController;

    const setOriginalMemesState = (memes: NFT[]) => {
      if (cancelled) {
        return;
      }
      setOriginalMemes(memes);
      setOriginalMemesLoaded(true);
    };

    const resetNftState = () => {
      if (cancelled) {
        return;
      }
      setNftMeta(undefined);
      setNft(undefined);
      setNftLoading(false);
      setOriginalMemesState([]);
    };

    const getSingleMeta = (
      response: DBResponse<LabExtendedData>
    ): LabExtendedData | undefined => {
      const nftMetas = response.data;
      if (Array.isArray(nftMetas) && nftMetas.length === 1) {
        return nftMetas[0];
      }
      console.warn(
        `Expected exactly 1 meta for id ${nftId}, got ${
          Array.isArray(nftMetas) ? nftMetas.length : 0
        }`
      );
      return undefined;
    };

    const loadOriginalMemes = async (fetchedNft?: LabNFT) => {
      if (!fetchedNft?.meme_references?.length) {
        setOriginalMemesState([]);
        return;
      }

      try {
        const referencesResponse = await fetchUrl<DBResponse<NFT>>(
          `${
            publicEnv.API_ENDPOINT
          }/api/nfts?sort_direction=asc&contract=${MEMES_CONTRACT}&id=${fetchedNft.meme_references.join(
            ","
          )}`,
          { signal }
        );
        if (cancelled) {
          return;
        }
        setOriginalMemesState(referencesResponse.data);
      } catch (error) {
        if (cancelled || isAbortError(error)) {
          return;
        }
        console.error("Failed to fetch referenced memes", error);
        setOriginalMemesState([]);
      }
    };

    const loadNft = async () => {
      try {
        const metaResponse = await fetchUrl<DBResponse<LabExtendedData>>(
          `${publicEnv.API_ENDPOINT}/api/lab_extended_data?id=${nftId}`,
          { signal }
        );
        if (cancelled) {
          return;
        }

        const meta = getSingleMeta(metaResponse);
        if (!meta) {
          resetNftState();
          return;
        }

        setNftMeta(meta);

        const nftResponse = await fetchUrl<DBResponse<LabNFT>>(
          `${publicEnv.API_ENDPOINT}/api/nfts_memelab?id=${nftId}`,
          { signal }
        );
        if (cancelled) {
          return;
        }

        const fetchedNft: LabNFT | undefined =
          Array.isArray(nftResponse.data) && nftResponse.data.length === 1
            ? nftResponse.data[0]
            : undefined;

        if (!fetchedNft) {
          console.warn(
            `Expected exactly 1 NFT for id ${nftId}, got ${
              nftResponse.data?.length ?? 0
            }`
          );
          resetNftState();
          return;
        }

        setNft(fetchedNft);
        setNftLoading(false);

        await loadOriginalMemes(fetchedNft);
      } catch (error) {
        if (cancelled || isAbortError(error)) {
          return;
        }
        console.error(`Failed to fetch Meme Lab NFT ${nftId}`, error);
        resetNftState();
      }
    };

    loadNft();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [nftId]);

  useEffect(() => {
    const walletObjects = connectedProfile?.wallets ?? [];
    const wallets = walletObjects.map((w) => w.wallet);
    let cancelled = false;
    const abortController = new AbortController();
    const { signal } = abortController;

    if (wallets.length > 0 && nftId) {
      fetchUrl(
        `${
          publicEnv.API_ENDPOINT
        }/api/transactions_memelab?wallet=${wallets.join(",")}&id=${nftId}`,
        { signal }
      )
        .then((response: DBResponse<Transaction>) => {
          if (cancelled) {
            return;
          }
          setTransactions(response.data);
          let countIn = 0;
          let countOut = 0;
          response.data.forEach((d: Transaction) => {
            if (wallets.some((w) => areEqualAddresses(w, d.from_address))) {
              countOut += d.token_count;
            }
            if (wallets.some((w) => areEqualAddresses(w, d.to_address))) {
              countIn += d.token_count;
            }
          });
          setUserLoaded(true);
          setNftBalance(countIn - countOut);
        })
        .catch((error) => {
          if (cancelled || isAbortError(error)) {
            return;
          }
          console.error(
            `Failed to fetch Meme Lab wallet transactions for nft ${nftId}`,
            error
          );
          setTransactions([]);
          setUserLoaded(false);
          setNftBalance(0);
        });
    } else {
      setTransactions([]);
      setUserLoaded(false);
      setNftBalance(0);
    }

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [nftId, connectedProfile]);

  useEffect(() => {
    setActivity([]);
    setActivityTotalResults(0);

    if (!nftId) {
      return;
    }

    setActivityLoading(true);
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

    let cancelled = false;
    const abortController = new AbortController();
    const { signal } = abortController;

    fetchUrl(url, { signal })
      .then((response: DBResponse<Transaction>) => {
        if (cancelled) {
          return;
        }
        setActivityTotalResults(response.count);
        setActivity(response.data);
      })
      .catch((error) => {
        if (cancelled || isAbortError(error)) {
          return;
        }
        console.error(`Failed to fetch Meme Lab activity for ${nftId}`, error);
        setActivityTotalResults(0);
        setActivity([]);
      })
      .finally(() => {
        setActivityLoading(false);
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [nftId, activityPage, activityTypeFilter]);

  useEffect(() => {
    setNftHistory([]);

    let cancelled = false;
    const abortController = new AbortController();
    const { signal } = abortController;

    async function fetchHistory(url: string) {
      try {
        const response = await fetchAllPages<NFTHistory>(url, { signal });
        if (!cancelled) {
          setNftHistory(response);
        }
      } catch (error) {
        if (cancelled || isAbortError(error)) {
          return;
        }
        console.error(
          `Failed to fetch NFT history for Meme Lab ${nftId}`,
          error
        );
        setNftHistory([]);
      }
    }

    if (!nftId) {
      return;
    }

    const initialUrlHistory = `${publicEnv.API_ENDPOINT}/api/nft_history/${MEMELAB_CONTRACT}/${nftId}`;
    fetchHistory(initialUrlHistory);

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [nftId]);

  const activityContent = useMemo(() => {
    if (activity.length > 0) {
      return (
        <div className="tw-overflow-x-auto">
          <table className="tw-w-full tw-min-w-[760px] tw-border-collapse">
            <tbody>
              {activity.map((tr) => (
                <LatestActivityRow
                  tr={tr}
                  nft={nft}
                  key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
                />
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activityLoading) {
      return (
        <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
          <CircleLoader size={CircleLoaderSize.LARGE} />
        </div>
      );
    }

    if (activity.length === 0) {
      return (
        <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-py-2">
          <NothingHereYetSummer />
        </div>
      );
    }
    return;
  }, [activity, activityLoading, nft]);

  function handleActivityPageChange(newPage: number) {
    setActivityPage(newPage);
    activitySectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function printHistoryTabs() {
    if (!nft || activeTab !== MEME_FOCUS.HISTORY) {
      return null;
    }

    return (
      <nav
        aria-label={t(locale, "memeLab.detail.sections.history")}
        className="tw-pb-8"
      >
        <div className="tw-w-fit tw-max-w-full">
          <CommonTabs<MEME_LAB_HISTORY_TAB>
            items={visibleHistoryTabItems}
            activeItem={activeHistoryTab}
            filterLabel={t(locale, "memeLab.detail.sections.history")}
            setSelected={setActiveHistoryMemeLabTab}
            fill={false}
          />
        </div>
      </nav>
    );
  }

  function printContent() {
    if (activeTab === MEME_FOCUS.COLLECTORS) {
      return printHodlers();
    }

    if (activeTab === MEME_FOCUS.REFERENCES) {
      return printReferences();
    }

    if (activeTab === MEME_FOCUS.LIVE) {
      return printOverview();
    }

    if (activeTab === MEME_FOCUS.HISTORY) {
      if (activeHistoryTab === MEME_LAB_HISTORY_TAB.TIMELINE) {
        return printTimeline();
      }

      if (activeHistoryTab === MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS) {
        return <MemeLabYourTransactionsTable transactions={transactions} />;
      }

      return printActivity();
    }

    return null;
  }

  function printOverview() {
    if (!nft) {
      return null;
    }

    return (
      <MemeLabOverviewDetails
        nft={nft}
        defaultAdditionalDetailsOpen={defaultAdditionalDetailsOpen}
      />
    );
  }

  function printReferences() {
    return (
      <section
        aria-labelledby="meme-lab-references-heading"
        className="tw-pb-3"
      >
        <h2
          id="meme-lab-references-heading"
          className="tw-mb-4 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100"
        >
          {t(locale, "memeLab.detail.references.title")}
        </h2>
        {printMemeReferences(
          originalMemes,
          "the-memes",
          originalMemesLoaded,
          true,
          locale
        )}
      </section>
    );
  }

  function printStaticCardHeader() {
    if (!nft || !nftMeta) {
      return null;
    }

    return (
      <MemeLabStaticCardHeader
        nft={nft}
        nftMeta={nftMeta}
        showMarketplaceLinks={!capacitor.isIos || country === "US"}
        locale={locale}
        artworkFooter={
          hasOwnershipContext ? (
            <MemeLabYourCardsPanel nft={nft} nftBalance={nftBalance} />
          ) : undefined
        }
      />
    );
  }

  function printCollectorsStatsMetrics() {
    if (!nftMeta) {
      return null;
    }

    return (
      <div className={MEME_LAB_STATS_ROW_CLASS}>
        <MemeLabStatMetric
          label={t(locale, "memeLab.detail.collectors.collectors")}
          value={formatInteger(locale, nftMeta.hodlers)}
          rank={nftMeta.hodlers_rank}
          total={nftMeta.collection_size}
        />
        <MemeLabStatMetric
          label={t(locale, "memeLab.detail.collectors.museum")}
          value={formatInteger(locale, nftMeta.museum_holdings)}
          rank={nftMeta.museum_holdings_rank}
          total={nftMeta.collection_size}
        />
        <MemeLabStatMetric
          label={t(locale, "memeLab.detail.collectors.unique")}
          value={formatMemeLabPercent(nftMeta.percent_unique, locale)}
          rank={nftMeta.percent_unique_rank}
          total={nftMeta.collection_size}
        />
        {nftMeta.burnt > 0 && (
          <MemeLabStatMetric
            label={t(locale, "memeLab.detail.collectors.uniqueExBurnt")}
            value={formatMemeLabPercent(
              nftMeta.percent_unique_not_burnt,
              locale
            )}
            rank={nftMeta.percent_unique_not_burnt_rank}
            total={nftMeta.collection_size}
          />
        )}
        <MemeLabStatMetric
          label={t(
            locale,
            nftMeta.burnt > 0
              ? "memeLab.detail.collectors.uniqueExBurntAndMuseum"
              : "memeLab.detail.collectors.uniqueExMuseum"
          )}
          value={formatMemeLabPercent(nftMeta.percent_unique_cleaned, locale)}
          rank={nftMeta.percent_unique_cleaned_rank}
          total={nftMeta.collection_size}
        />
      </div>
    );
  }

  function printHodlers() {
    if (nft && nftId) {
      return (
        <section
          aria-label={t(locale, "memeLab.detail.collectors.leaderboard")}
          className="tw-py-2"
        >
          {printCollectorsStatsMetrics()}
          <div className="tw-pt-3">
            <MemeLabLeaderboard
              contract={nft.contract}
              nftId={parseInt(nftId)}
            />
          </div>
        </section>
      );
    }
    return;
  }

  function printTimeline() {
    return (
      <section
        aria-label={t(locale, "memeLab.detail.timeline.region")}
        className="tw-pb-5 tw-pt-3"
      >
        <div className="tw-mx-auto tw-w-full md:tw-w-10/12">
          {nft && <Timeline nft={nft} steps={nftHistory} locale={locale} />}
        </div>
      </section>
    );
  }

  function printActivity() {
    return (
      <section
        aria-label={t(locale, "memeLab.detail.activity.region")}
        className="tw-space-y-8 tw-pb-5"
      >
        {nft && <MemeLabCardVolumes nft={nft} />}
        <section
          ref={activitySectionRef}
          aria-labelledby="meme-lab-card-activity-heading"
          className="tw-scroll-mt-24"
        >
          <div className="tw-mb-4 tw-flex tw-flex-col tw-items-stretch tw-justify-between tw-gap-3 md:tw-flex-row md:tw-items-center">
            <h3
              id="meme-lab-card-activity-heading"
              className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-200"
            >
              {t(locale, "memeLab.detail.tabs.cardActivity")}
            </h3>
            <div className="tw-w-full tw-shrink-0 md:tw-w-72">
              <CommonDropdown
                items={ActivityTypeItems}
                activeItem={activityTypeFilter}
                filterLabel={t(
                  locale,
                  "memeLab.detail.activity.transactionType"
                )}
                setSelected={(filter) => {
                  setActivityPage(1);
                  setActivityTypeFilter(filter);
                }}
              />
            </div>
          </div>
          {activityContent}
        </section>
        {activity.length > 0 && !activityLoading && (
          <div className="tw-flex tw-justify-center tw-pb-3 tw-pt-4">
            <Pagination
              page={activityPage}
              pageSize={ACTIVITY_PAGE_SIZE}
              totalResults={activityTotalResults}
              setPage={handleActivityPageChange}
            />
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-800 tw-bg-[#0D0D0F] tw-pb-5 tw-text-white">
      <div className="tw-px-4 tw-py-4 md:tw-px-6 md:tw-pb-10 lg:tw-px-8">
        <header className="tw-pb-8">
          <div className="tw-flex tw-flex-col tw-gap-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2 md:tw-justify-start">
              <div className="tw-mb-0 tw-flex tw-items-center">
                <Link
                  href={getMemeLabRouteHrefWithLocale({
                    href: "/meme-lab",
                    locale,
                  })}
                  aria-label={t(locale, "memeLab.detail.backLink.ariaLabel")}
                  className="tw-group -tw-ml-2 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-px-2 tw-py-2 tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                >
                  <ArrowLeftIcon
                    aria-hidden="true"
                    className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition-transform group-hover:-tw-translate-x-0.5"
                  />
                  {t(locale, "memeLab.detail.backLink.label")}
                </Link>
              </div>
            </div>
            {nftMeta && nft ? (
              <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-3 md:tw-flex-wrap md:tw-justify-start">
                <div className="tw-order-2 tw-flex tw-shrink-0 tw-justify-end md:tw-order-1">
                  <NftNavigation
                    nftId={nft.id}
                    path="/meme-lab"
                    startIndex={1}
                    endIndex={nftMeta.collection_size}
                    params={searchParams}
                  />
                </div>
                <div className="tw-order-1 tw-min-w-0 tw-flex-1 md:tw-order-2">
                  <h1
                    className="tw-m-0 tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1 md:tw-flex-nowrap md:tw-gap-x-0"
                    aria-label={t(locale, "memeLab.detail.heading.ariaLabel", {
                      tokenId: nft.id,
                      name: nft.name,
                    })}
                  >
                    <span className="tw-mb-0 tw-shrink-0 tw-text-lg tw-font-normal tw-leading-tight tw-text-iron-400 sm:tw-text-2xl">
                      {t(locale, "memeLab.detail.heading.card", {
                        tokenId: nft.id,
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
              <>
                {isLoadingNft ? (
                  <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-3 md:tw-flex-wrap md:tw-justify-start">
                    <div className="tw-order-2 tw-flex tw-shrink-0 tw-justify-end md:tw-order-1">
                      <MemePageNavigationSkeleton />
                    </div>
                    <div className="tw-order-1 tw-min-w-0 tw-flex-1 md:tw-order-2">
                      <MemePageTitleSkeleton />
                    </div>
                  </div>
                ) : (
                  <h1 className="tw-mb-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-100">
                    {t(locale, "memeLab.detail.heading.fallback")}
                  </h1>
                )}
              </>
            )}
          </div>
        </header>
        {isLoadingNft && <MemePageSkeleton />}
        {nftMeta && nft && (
          <>
            {printStaticCardHeader()}
            <nav
              aria-label={t(locale, "memeLab.detail.sections.tabs")}
              className="tw-relative tw-mb-8 tw-overflow-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800"
            >
              <div className="tw-w-full tw-overflow-x-auto tw-overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:tw-hidden">
                <div className="-tw-mb-px tw-flex tw-min-w-max tw-gap-x-3 lg:tw-gap-x-4">
                  {visibleMemeLabTabs.map((tab) => (
                    <MemeLabPageTabButton
                      key={`${nft.id}-${nft.contract}-${tab.focus}-tab`}
                      title={getMemeLabDetailTabLabel(tab.focus, locale)}
                      isActive={activeTab === tab.focus}
                      onClick={() => setActiveMemeLabTab(tab.focus)}
                    />
                  ))}
                </div>
              </div>
            </nav>
            {printHistoryTabs()}
            {printContent()}
          </>
        )}
      </div>
    </div>
  );
}
