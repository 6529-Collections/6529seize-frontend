"use client";

import { useAuth } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { ActivityTypeItems } from "@/components/latest-activity/ActivityFilters";
import { getMemeLabRouteHrefWithLocale } from "@/components/memelab/memeLabRouteParams";
import { MemeLabCardVolumes } from "@/components/memelab/MemeLabCardHeader";
import { MemeLabYourTransactionsTable } from "@/components/memelab/MemeLabYourCards";
import NftNavigation from "@/components/nft-navigation/NftNavigation";
import Pagination from "@/components/pagination/Pagination";
import {
  MemePageNavigationSkeleton,
  MemePageSkeleton,
  MemePageTitleSkeleton,
} from "@/components/the-memes/MemePageSkeleton";
import { MEME_FOCUS } from "@/components/the-memes/MemeShared";
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
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ACTIVITY_PAGE_SIZE,
  getMemeLabBrowserTitle,
  getMemeLabDetailTabLabel,
  getMemeLabHistoryTabForFocus,
  getMemeLabHistoryTabLabel,
  getMemeLabRouteFocus,
  isAbortError,
  MEME_LAB_HISTORY_TAB,
  MEME_LAB_HISTORY_TABS,
  MEME_LAB_TABS,
  MemeLabPageTabButton,
  parseMemeLabFocus,
  runAfterCriticalWork,
} from "./MemeLabPage.utils";
import {
  MemeLabActivityContent,
  MemeLabCollectors,
  MemeLabOverview,
  MemeLabReferences,
  MemeLabStaticHeader,
  MemeLabTimeline,
} from "./MemeLabPage.view";

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
  const loadedActivityKeyRef = useRef<string | null>(null);
  const loadedHistoryNftIdRef = useRef<string | null>(null);

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
    if (activeTab !== MEME_FOCUS.REFERENCES || !nft || originalMemesLoaded) {
      return;
    }

    if (!nft.meme_references?.length) {
      setOriginalMemes([]);
      setOriginalMemesLoaded(true);
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();

    fetchUrl<DBResponse<NFT>>(
      `${
        publicEnv.API_ENDPOINT
      }/api/nfts?sort_direction=asc&contract=${MEMES_CONTRACT}&id=${nft.meme_references.join(
        ","
      )}`,
      { signal: abortController.signal }
    )
      .then((response) => {
        if (cancelled) {
          return;
        }
        setOriginalMemes(response.data);
        setOriginalMemesLoaded(true);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) {
          return;
        }
        console.error("Failed to fetch referenced memes", error);
        setOriginalMemes([]);
        setOriginalMemesLoaded(true);
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [activeTab, nft, originalMemesLoaded]);

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
    if (!nftId) {
      return;
    }

    const activityKey = `${nftId}:${activityPage}:${activityTypeFilter}`;
    if (loadedActivityKeyRef.current === activityKey) {
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();
    const { signal } = abortController;

    const loadActivity = () => {
      if (cancelled) {
        return;
      }

      setActivity([]);
      setActivityTotalResults(0);
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

      fetchUrl(url, { signal })
        .then((response: DBResponse<Transaction>) => {
          if (cancelled) {
            return;
          }
          setActivityTotalResults(response.count);
          setActivity(response.data);
          loadedActivityKeyRef.current = activityKey;
        })
        .catch((error) => {
          if (cancelled || isAbortError(error)) {
            return;
          }
          console.error(
            `Failed to fetch Meme Lab activity for ${nftId}`,
            error
          );
          setActivityTotalResults(0);
          setActivity([]);
          loadedActivityKeyRef.current = activityKey;
        })
        .finally(() => {
          if (!cancelled) {
            setActivityLoading(false);
          }
        });
    };

    const activityIsVisible =
      activeTab === MEME_FOCUS.HISTORY &&
      activeHistoryTab === MEME_LAB_HISTORY_TAB.ACTIVITY;
    let cancelScheduledLoad: () => void = () => undefined;
    if (activityIsVisible) {
      loadActivity();
    } else {
      cancelScheduledLoad = runAfterCriticalWork(loadActivity);
    }

    return () => {
      cancelled = true;
      cancelScheduledLoad();
      abortController.abort();
    };
  }, [activeHistoryTab, activeTab, nftId, activityPage, activityTypeFilter]);

  useEffect(() => {
    if (!nftId || loadedHistoryNftIdRef.current === nftId) {
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();
    const initialUrlHistory = `${publicEnv.API_ENDPOINT}/api/nft_history/${MEMELAB_CONTRACT}/${nftId}`;

    const loadHistory = () => {
      if (cancelled) {
        return;
      }

      setNftHistory([]);
      fetchAllPages<NFTHistory>(initialUrlHistory, {
        signal: abortController.signal,
      })
        .then((response) => {
          if (cancelled) {
            return;
          }
          setNftHistory(response);
          loadedHistoryNftIdRef.current = nftId;
        })
        .catch((error: unknown) => {
          if (cancelled || isAbortError(error)) {
            return;
          }
          console.error(
            `Failed to fetch NFT history for Meme Lab ${nftId}`,
            error
          );
          setNftHistory([]);
          loadedHistoryNftIdRef.current = nftId;
        });
    };

    const timelineIsVisible =
      activeTab === MEME_FOCUS.HISTORY &&
      activeHistoryTab === MEME_LAB_HISTORY_TAB.TIMELINE;
    let cancelScheduledLoad: () => void = () => undefined;
    if (timelineIsVisible) {
      loadHistory();
    } else {
      cancelScheduledLoad = runAfterCriticalWork(loadHistory);
    }

    return () => {
      cancelled = true;
      cancelScheduledLoad();
      abortController.abort();
    };
  }, [activeHistoryTab, activeTab, nftId]);

  const activityContent = useMemo(
    () => (
      <MemeLabActivityContent
        activity={activity}
        activityLoading={activityLoading}
        nft={nft}
      />
    ),
    [activity, activityLoading, nft]
  );

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
      return (
        <MemeLabCollectors
          nft={nft}
          nftId={nftId}
          nftMeta={nftMeta}
          locale={locale}
        />
      );
    }

    if (activeTab === MEME_FOCUS.REFERENCES) {
      return (
        <MemeLabReferences
          originalMemes={originalMemes}
          originalMemesLoaded={originalMemesLoaded}
          locale={locale}
        />
      );
    }

    if (activeTab === MEME_FOCUS.LIVE) {
      return (
        <MemeLabOverview
          nft={nft}
          defaultAdditionalDetailsOpen={defaultAdditionalDetailsOpen}
        />
      );
    }

    if (activeTab === MEME_FOCUS.HISTORY) {
      if (activeHistoryTab === MEME_LAB_HISTORY_TAB.TIMELINE) {
        return (
          <MemeLabTimeline nft={nft} nftHistory={nftHistory} locale={locale} />
        );
      }

      if (activeHistoryTab === MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS) {
        return <MemeLabYourTransactionsTable transactions={transactions} />;
      }

      return printActivity();
    }

    return null;
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
                    className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition-transform tw-duration-150 group-hover:-tw-translate-x-0.5 motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
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
            <MemeLabStaticHeader
              nft={nft}
              nftMeta={nftMeta}
              showMarketplaceLinks={!capacitor.isIos || country === "US"}
              locale={locale}
              hasOwnershipContext={hasOwnershipContext}
              nftBalance={nftBalance}
            />
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
