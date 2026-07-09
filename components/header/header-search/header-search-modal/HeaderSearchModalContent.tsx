"use client";

import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FocusTrap } from "focus-trap-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";

import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import DropForgeCraftIcon from "@/components/common/icons/DropForgeCraftIcon";
import DropForgeIcon from "@/components/common/icons/DropForgeIcon";
import DropForgeLaunchIcon from "@/components/common/icons/DropForgeLaunchIcon";
import {
  DROP_FORGE_PATH,
  DROP_FORGE_SECTIONS,
  DROP_FORGE_TITLE,
} from "@/components/drop-forge/drop-forge.constants";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import useCapacitor from "@/hooks/useCapacitor";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useLocalPreference from "@/hooks/useLocalPreference";
import {
  mapSidebarSectionsToPages,
  type SidebarPageEntry,
  useSidebarSections,
} from "@/hooks/useSidebarSections";
import { useWaveDropsSearch } from "@/hooks/useWaveDropsSearch";
import { useWaves } from "@/hooks/useWaves";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";

import type {
  HeaderSearchModalItemType,
  NFTSearchResult,
  PageSearchResult,
} from "../HeaderSearchModalItem";
import {
  CATEGORY,
  DIRECT_NAVIGATION_PAGES,
  EMPTY_NFT_RESULTS,
  EMPTY_PROFILE_RESULTS,
  FILTERABLE_CATEGORIES,
  HEADER_SEARCH_LABELS,
  MIN_SEARCH_LENGTH,
  NFT_SEARCH_MIN_LENGTH,
  SEARCH_MODE,
  SEARCH_ONLY_PAGES,
  STATE,
  isFilterableCategory,
  type FilterableCategory,
} from "./constants";
import { HeaderSearchSiteResults } from "./HeaderSearchSiteResults";
import { HeaderSearchWaveResults } from "./HeaderSearchWaveResults";
import {
  getCompositePageSearchValues,
  getPageMatchPriority,
  getPageSearchTokens,
  PAGE_SEARCH_ALIASES_BY_HREF,
  pageMatchesQuery,
  type RankedPageMatch,
} from "./pageSearch";

const HEADER_SEARCH_DIALOG_TITLE_ID = "header-search-dialog-title";
const HEADER_SEARCH_INPUT_DESCRIPTION_ID = "header-search-input-description";

export default function HeaderSearchModal({
  onClose,
  wave,
}: {
  readonly onClose: () => void;
  readonly wave: ApiWave | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useBrowserLocale();
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const waveChatScroll = useWaveChatScrollOptional();
  const [searchMode, setSearchMode] = useState<SEARCH_MODE>(
    wave ? SEARCH_MODE.WAVE : SEARCH_MODE.SITE
  );

  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useLocalPreference<CATEGORY>(
    "headerSearchCategoryFilter",
    CATEGORY.ALL,
    (value): value is CATEGORY =>
      typeof value === "string" &&
      (Object.values(CATEGORY) as CATEGORY[]).includes(value as CATEGORY)
  );

  const [debouncedValue, setDebouncedValue] = useState<string>("");
  useDebounce(
    () => {
      setDebouncedValue(searchValue);
    },
    500,
    [searchValue]
  );

  const trimmedSearchValue = searchValue.trim();
  const trimmedDebouncedValue = debouncedValue.trim();
  const searchInputLength = trimmedSearchValue.length;
  const meetsCharacterThreshold = searchInputLength >= MIN_SEARCH_LENGTH;
  const shouldSearchPages = meetsCharacterThreshold;
  const shouldSearchDefault = trimmedDebouncedValue.length >= MIN_SEARCH_LENGTH;
  const shouldSearchNfts =
    trimmedDebouncedValue.length >= NFT_SEARCH_MIN_LENGTH ||
    (trimmedDebouncedValue.length > 0 &&
      !Number.isNaN(Number(trimmedDebouncedValue)));
  const hasActiveDebouncedSearch = shouldSearchNfts;

  // Wave search (shorter debounce, lower min length)
  const WAVE_SEARCH_MIN_LENGTH = 2;
  const dialogTitle =
    searchMode === SEARCH_MODE.WAVE
      ? t(locale, "headerSearch.dialogTitle.wave")
      : t(locale, "headerSearch.dialogTitle.site");
  const inputMinLength =
    searchMode === SEARCH_MODE.WAVE
      ? WAVE_SEARCH_MIN_LENGTH
      : MIN_SEARCH_LENGTH;
  const [waveSearchDebouncedValue, setWaveSearchDebouncedValue] =
    useState<string>("");
  useDebounce(
    () => {
      setWaveSearchDebouncedValue(searchValue);
    },
    250,
    [searchValue]
  );
  const trimmedWaveSearchValue = waveSearchDebouncedValue.trim();
  const shouldSearchWave =
    wave !== null &&
    searchMode === SEARCH_MODE.WAVE &&
    trimmedWaveSearchValue.length >= WAVE_SEARCH_MIN_LENGTH;
  const {
    winningThreshold,
    winningThresholdMinDurationMs,
    isVotingClosed,
    isVotingControlsLocked,
  } = useApprovalWaveStatus({ wave });

  const {
    drops: waveDropResults,
    isLoading: isLoadingWaveDrops,
    isError: isWaveDropsError,
    hasNextPage: waveDropsHasNextPage,
    fetchNextPage: fetchNextWaveDropsPage,
    isFetchingNextPage: isFetchingNextWaveDropsPage,
  } = useWaveDropsSearch({
    wave,
    term: trimmedWaveSearchValue,
    enabled: shouldSearchWave,
    size: 50,
  });

  const { appWalletsSupported } = useAppWallets();
  const { country } = useCookieConsent();
  const capacitor = useCapacitor();
  const sections = useSidebarSections(
    appWalletsSupported,
    capacitor.isIos,
    country
  );
  const sidebarPages = useMemo(
    () => mapSidebarSectionsToPages(sections),
    [sections]
  );
  const { canAccessLanding, canAccessCraft, canAccessLaunch } =
    useDropForgePermissions();
  const dropForgePages = useMemo<SidebarPageEntry[]>(() => {
    if (!canAccessLanding) {
      return [];
    }

    const pages: SidebarPageEntry[] = [
      {
        name: DROP_FORGE_TITLE,
        href: DROP_FORGE_PATH,
        section: HEADER_SEARCH_LABELS.about,
        subsection: HEADER_SEARCH_LABELS.developerOpenData,
        icon: DropForgeIcon,
      },
    ];

    if (canAccessCraft) {
      pages.push({
        name: DROP_FORGE_SECTIONS.CRAFT.title,
        href: DROP_FORGE_SECTIONS.CRAFT.path,
        section: HEADER_SEARCH_LABELS.about,
        subsection: DROP_FORGE_TITLE,
        icon: DropForgeCraftIcon,
      });
    }

    if (canAccessLaunch) {
      pages.push({
        name: DROP_FORGE_SECTIONS.LAUNCH.title,
        href: DROP_FORGE_SECTIONS.LAUNCH.path,
        section: HEADER_SEARCH_LABELS.about,
        subsection: DROP_FORGE_TITLE,
        icon: DropForgeLaunchIcon,
      });
    }

    return pages;
  }, [canAccessLanding, canAccessCraft, canAccessLaunch]);
  const allPageEntries = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...DIRECT_NAVIGATION_PAGES,
      ...SEARCH_ONLY_PAGES,
      ...sidebarPages,
      ...dropForgePages,
    ].filter((entry) => {
      if (seen.has(entry.href)) return false;
      seen.add(entry.href);
      return true;
    });
  }, [sidebarPages, dropForgePages]);

  const pageCatalog = useMemo<PageSearchResult[]>(
    () =>
      allPageEntries.map((entry) => ({
        type: "PAGE",
        title: entry.name,
        href: entry.href,
        icon: entry.icon,
        searchTerms: PAGE_SEARCH_ALIASES_BY_HREF[entry.href] ?? [],
        breadcrumbs: [entry.section, entry.subsection]
          .filter((value): value is string => !!value)
          .map((value) => value),
      })),
    [allPageEntries]
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchValue(newValue);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const resultsPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (resultsPanelRef.current) {
        resultsPanelRef.current.scrollBy({
          top: event.deltaY,
          left: event.deltaX,
        });
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const sharedQueryDefaults = {
    placeholderData: keepPreviousData,
  } as const;

  const {
    isFetching: isFetchingProfiles,
    data: profiles = EMPTY_PROFILE_RESULTS,
    error: profilesError,
    refetch: refetchProfiles,
  } = useQuery<CommunityMemberMinimal[], Error>({
    queryKey: [QueryKey.PROFILE_SEARCH, trimmedDebouncedValue],
    queryFn: async () =>
      await commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
        params: {
          param: trimmedDebouncedValue,
        },
      }),
    enabled: shouldSearchDefault,
    ...sharedQueryDefaults,
  });

  const {
    isFetching: isFetchingNfts,
    data: nfts = EMPTY_NFT_RESULTS,
    error: nftsError,
    refetch: refetchNfts,
  } = useQuery<NFTSearchResult[], Error>({
    queryKey: [QueryKey.NFTS_SEARCH, trimmedDebouncedValue],
    queryFn: async () => {
      return await commonApiFetch<NFTSearchResult[]>({
        endpoint: "nfts_search",
        params: {
          search: trimmedDebouncedValue,
        },
      });
    },
    enabled: shouldSearchNfts,
    ...sharedQueryDefaults,
  });

  const {
    waves,
    isFetching: isFetchingWaves,
    error: wavesError,
    refetch: refetchWaves,
  } = useWaves({
    identity: null,
    waveName: shouldSearchDefault ? trimmedDebouncedValue : null,
    limit: 20,
    enabled: shouldSearchDefault,
  });

  const pageResults = useMemo(() => {
    if (!shouldSearchPages) {
      return [];
    }
    const normalizedQuery = trimmedSearchValue.toLowerCase();
    const canonicalQueryTokens = getPageSearchTokens(trimmedSearchValue);
    if (!normalizedQuery) {
      return [];
    }

    const rankedMatches = pageCatalog.reduce<RankedPageMatch[]>(
      (accumulator, page) => {
        const normalizedTitle = page.title.toLowerCase();
        const normalizedHref = page.href.toLowerCase();
        const normalizedBreadcrumbs = page.breadcrumbs.map((value) =>
          value.toLowerCase()
        );
        const normalizedSearchTerms = (page.searchTerms ?? []).map((value) =>
          value.toLowerCase()
        );
        const compositeValues = getCompositePageSearchValues(
          normalizedTitle,
          normalizedBreadcrumbs,
          normalizedSearchTerms
        );

        const hrefSegments = normalizedHref.split("/").filter(Boolean);
        const matchInputs = {
          normalizedTitle,
          normalizedHref,
          hrefSegments,
          normalizedBreadcrumbs,
          normalizedSearchTerms,
          compositeValues,
        };
        const matchQuery = {
          normalizedQuery,
          canonicalQueryTokens,
        };

        if (!pageMatchesQuery(matchInputs, matchQuery)) {
          return accumulator;
        }

        accumulator.push({
          page,
          normalizedTitle,
          priority: getPageMatchPriority(
            matchInputs,
            matchQuery.normalizedQuery,
            matchQuery.canonicalQueryTokens
          ),
        });

        return accumulator;
      },
      []
    );

    return rankedMatches
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }

        const titleComparison = a.normalizedTitle.localeCompare(
          b.normalizedTitle
        );
        if (titleComparison !== 0) {
          return titleComparison;
        }

        return a.page.href.localeCompare(b.page.href);
      })
      .map((result) => result.page);
  }, [shouldSearchPages, trimmedSearchValue, pageCatalog]);

  const profileResults: CommunityMemberMinimal[] = useMemo(
    () => (shouldSearchDefault ? profiles : []),
    [shouldSearchDefault, profiles]
  );

  const nftResults: NFTSearchResult[] = useMemo(
    () => (shouldSearchNfts ? nfts : []),
    [shouldSearchNfts, nfts]
  );

  const waveResults: ApiWave[] = useMemo(
    () => (shouldSearchDefault ? waves : []),
    [shouldSearchDefault, waves]
  );

  const charactersRemaining = Math.max(
    MIN_SEARCH_LENGTH - searchInputLength,
    0
  );
  const shouldShowCountdown = searchInputLength > 0 && charactersRemaining > 0;
  const isAwaitingDebouncedSearch =
    meetsCharacterThreshold && trimmedDebouncedValue !== trimmedSearchValue;

  const isSearching = shouldSearchPages || hasActiveDebouncedSearch;

  const resultsByCategory = useMemo<
    Record<FilterableCategory, HeaderSearchModalItemType[]>
  >(
    () => ({
      [CATEGORY.PAGES]: pageResults,
      [CATEGORY.PROFILES]: profileResults,
      [CATEGORY.NFTS]: nftResults,
      [CATEGORY.WAVES]: waveResults,
    }),
    [pageResults, profileResults, nftResults, waveResults]
  );

  const categoriesWithResults = useMemo(
    () =>
      FILTERABLE_CATEGORIES.filter(
        (category) => resultsByCategory[category].length > 0
      ),
    [resultsByCategory]
  );

  const selectedSearchCategory = useMemo(() => {
    if (selectedCategory === CATEGORY.ALL) {
      return CATEGORY.ALL;
    }
    if (!isFilterableCategory(selectedCategory)) {
      return CATEGORY.ALL;
    }
    return categoriesWithResults.includes(selectedCategory)
      ? selectedCategory
      : CATEGORY.ALL;
  }, [categoriesWithResults, selectedCategory]);

  const handleClearSearch = () => {
    setSearchValue("");
    setDebouncedValue("");
    setWaveSearchDebouncedValue("");
    setSelectedCategory(CATEGORY.ALL);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleWaveDropSelect = (serialNo: number) => {
    if (!wave) return;
    if (waveChatScroll) {
      waveChatScroll.requestScrollToSerialNo({ waveId: wave.id, serialNo });
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("serialNo", String(serialNo));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    onClose();
  };

  const derivedState = useMemo(() => {
    if (!isSearching) {
      return STATE.INITIAL;
    }

    const hasResults = categoriesWithResults.length > 0;

    if (hasResults) {
      return STATE.SUCCESS;
    }

    if (isAwaitingDebouncedSearch) {
      return STATE.LOADING;
    }

    const anyFetching =
      (shouldSearchDefault && (isFetchingProfiles || isFetchingWaves)) ||
      (shouldSearchNfts && isFetchingNfts);

    if (anyFetching) {
      return STATE.LOADING;
    }

    const anyError =
      (shouldSearchDefault &&
        (Boolean(profilesError) || Boolean(wavesError))) ||
      (shouldSearchNfts && Boolean(nftsError));

    if (anyError) {
      return STATE.ERROR;
    }

    return STATE.NO_RESULTS;
  }, [
    categoriesWithResults.length,
    isFetchingProfiles,
    isFetchingNfts,
    isFetchingWaves,
    isSearching,
    shouldSearchDefault,
    shouldSearchNfts,
    profilesError,
    nftsError,
    wavesError,
    isAwaitingDebouncedSearch,
  ]);

  const handleRetry = () => {
    const retryProfiles = () => {
      refetchProfiles().catch(() => undefined);
    };
    const retryNfts = () => {
      refetchNfts().catch(() => undefined);
    };
    const retryWaves = () => {
      refetchWaves().catch(() => undefined);
    };

    if (selectedSearchCategory === CATEGORY.PAGES) {
      return;
    }

    if (selectedSearchCategory === CATEGORY.ALL) {
      if (shouldSearchDefault) {
        retryProfiles();
        retryWaves();
      }
      if (shouldSearchNfts) {
        retryNfts();
      }
    } else if (selectedSearchCategory === CATEGORY.PROFILES) {
      if (shouldSearchDefault) {
        retryProfiles();
      }
    } else if (selectedSearchCategory === CATEGORY.NFTS) {
      if (shouldSearchNfts) {
        retryNfts();
      }
    } else if (shouldSearchDefault) {
      retryWaves();
    }
  };

  return createPortal(
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        fallbackFocus: () =>
          (modalRef.current as HTMLElement | null) ??
          (inputRef.current as HTMLElement | null) ??
          document.body,
        initialFocus: () =>
          (inputRef.current as HTMLElement | null) ??
          (modalRef.current as HTMLElement | null) ??
          document.body,
      }}
    >
      <div className="tailwind-scope tw-relative tw-z-1000 tw-cursor-default">
        <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px]"></div>
        <div className="tw-fixed tw-inset-0 tw-z-1000 tw-overflow-y-auto">
          <div className="tw-flex tw-min-h-full tw-items-start tw-justify-center tw-p-4 tw-text-center sm:tw-p-6 lg:tw-items-center">
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={HEADER_SEARCH_DIALOG_TITLE_ID}
              className="tw-relative tw-mt-[env(safe-area-inset-top)] tw-flex tw-h-[520px] tw-max-h-[70vh] tw-min-h-0 tw-w-full tw-max-w-[min(100vw-3rem,900px)] tw-transform tw-flex-col tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-max-w-3xl"
            >
              <h2 id={HEADER_SEARCH_DIALOG_TITLE_ID} className="tw-sr-only">
                {dialogTitle}
              </h2>
              <div className="tw-mt-4 tw-flex tw-items-center tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-4 tw-pb-4">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t(locale, "headerSearch.goBack")}
                  className="-tw-ml-1 tw-mr-1 tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-none tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-150 hover:tw-bg-iron-900 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 sm:tw-hidden"
                >
                  <ChevronLeftIcon className="tw-size-6 tw-flex-shrink-0" />
                </button>

                <div className="tw-relative tw-flex-1">
                  <svg
                    className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <label className="tw-sr-only" htmlFor="header-search-input">
                    {t(locale, "headerSearch.inputLabel")}
                  </label>
                  <p
                    id={HEADER_SEARCH_INPUT_DESCRIPTION_ID}
                    className="tw-sr-only"
                  >
                    {t(locale, "headerSearch.inputDescription", {
                      minLength: inputMinLength,
                    })}
                  </p>
                  <input
                    id="header-search-input"
                    ref={inputRef}
                    type="text"
                    required
                    aria-describedby={HEADER_SEARCH_INPUT_DESCRIPTION_ID}
                    autoComplete="off"
                    value={searchValue}
                    onChange={handleInputChange}
                    className="sm:text-sm tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-3 tw-pl-11 tw-pr-16 tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-600 focus:tw-bg-transparent focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300"
                    placeholder={
                      searchMode === SEARCH_MODE.WAVE
                        ? t(locale, "headerSearch.placeholder.wave")
                        : t(locale, "headerSearch.placeholder.site")
                    }
                  />
                  {searchValue.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      aria-label={t(locale, "headerSearch.clear")}
                      className="tw-absolute tw-right-2.5 tw-top-1/2 tw-flex tw-h-7 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition tw-duration-150 hover:tw-border-iron-600 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
                    >
                      {t(locale, "headerSearch.clearShort")}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t(locale, "headerSearch.close")}
                  className="tw-hidden tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-150 hover:tw-bg-iron-900 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 sm:tw-inline-flex"
                >
                  <XMarkIcon className="tw-size-5" />
                </button>
              </div>
              {wave && (
                <div className="tw-px-4 tw-pb-3 tw-pt-1">
                  <div className="tw-inline-flex tw-gap-0.5 tw-rounded-lg tw-bg-iron-900 tw-p-0.5">
                    <button
                      type="button"
                      onClick={() => setSearchMode(SEARCH_MODE.WAVE)}
                      className={`tw-rounded-md tw-border-0 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-transition tw-duration-150 ${
                        searchMode === SEARCH_MODE.WAVE
                          ? "tw-bg-primary-500 tw-text-white"
                          : "tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-200"
                      }`}
                    >
                      {t(locale, "headerSearch.mode.wave")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchMode(SEARCH_MODE.SITE)}
                      className={`tw-rounded-md tw-border-0 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-transition tw-duration-150 ${
                        searchMode === SEARCH_MODE.SITE
                          ? "tw-bg-primary-500 tw-text-white"
                          : "tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-200"
                      }`}
                    >
                      {t(locale, "headerSearch.mode.site")}
                    </button>
                  </div>
                </div>
              )}
              {searchMode === SEARCH_MODE.WAVE && wave && (
                <HeaderSearchWaveResults
                  wave={wave}
                  resultsPanelRef={resultsPanelRef}
                  isLoadingWaveDrops={isLoadingWaveDrops}
                  isWaveDropsError={isWaveDropsError}
                  shouldSearchWave={shouldSearchWave}
                  waveDropResults={waveDropResults}
                  waveDropsHasNextPage={waveDropsHasNextPage}
                  fetchNextWaveDropsPage={fetchNextWaveDropsPage}
                  isFetchingNextWaveDropsPage={isFetchingNextWaveDropsPage}
                  onSelectSerialNo={handleWaveDropSelect}
                  winningThreshold={winningThreshold}
                  winningThresholdMinDurationMs={winningThresholdMinDurationMs}
                  isVotingClosed={isVotingClosed}
                  isVotingControlsLocked={isVotingControlsLocked}
                />
              )}
              {searchMode === SEARCH_MODE.SITE && (
                <HeaderSearchSiteResults
                  key={trimmedDebouncedValue}
                  selectedCategory={selectedSearchCategory}
                  setSelectedCategory={setSelectedCategory}
                  resultsByCategory={resultsByCategory}
                  categoriesWithResults={categoriesWithResults}
                  derivedState={derivedState}
                  debouncedValue={debouncedValue}
                  onClose={onClose}
                  onRetry={handleRetry}
                  isFetchingProfiles={isFetchingProfiles}
                  isFetchingNfts={isFetchingNfts}
                  isFetchingWaves={isFetchingWaves}
                  shouldShowCountdown={shouldShowCountdown}
                  charactersRemaining={charactersRemaining}
                  resultsPanelRef={resultsPanelRef}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
}
