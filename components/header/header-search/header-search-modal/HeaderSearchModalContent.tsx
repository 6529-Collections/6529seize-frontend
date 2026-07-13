"use client";

import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { FocusTrap } from "focus-trap-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";

import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useAuth } from "@/components/auth/authContext";
import DropForgeCraftIcon from "@/components/common/icons/DropForgeCraftIcon";
import DropForgeIcon from "@/components/common/icons/DropForgeIcon";
import DropForgeLaunchIcon from "@/components/common/icons/DropForgeLaunchIcon";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import {
  DROP_FORGE_PATH,
  DROP_FORGE_SECTIONS,
  DROP_FORGE_TITLE,
} from "@/components/drop-forge/drop-forge.constants";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiWave } from "@/generated/models/ApiWave";
import useCapacitor from "@/hooks/useCapacitor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import useLocalPreference from "@/hooks/useLocalPreference";
import {
  mapSidebarSectionsToPages,
  type SidebarPageEntry,
  useSidebarSections,
} from "@/hooks/useSidebarSections";
import { useWaves } from "@/hooks/useWaves";
import { formatInteger } from "@/i18n/format";
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
  HEADER_SEARCH_RESULTS_LISTBOX_ID,
  MIN_SEARCH_LENGTH,
  NFT_SEARCH_MIN_LENGTH,
  SEARCH_ONLY_PAGES,
  STATE,
  isFilterableCategory,
  type FilterableCategory,
} from "./constants";
import { HeaderSearchSiteResults } from "./HeaderSearchSiteResults";
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
const HEADER_SEARCH_SESSION_QUERY_KEY = "headerSearchLastQuery";
const HEADER_SEARCH_RECENT_QUERIES_KEY = "headerSearchRecentQueries";
const MAX_RECENT_SEARCHES = 5;

const getScopedStorageKey = (key: string, scope: string): string =>
  `${key}:${scope}`;

const readSessionQuery = (storageKey: string): string => {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
};

const readRecentSearches = (storageKey: string): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const savedRecent = sessionStorage.getItem(storageKey);
    if (!savedRecent) return [];
    const parsed: unknown = JSON.parse(savedRecent);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string")
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
};

const rankPageResults = ({
  locale,
  pageCatalog,
  query,
}: {
  readonly locale: string;
  readonly pageCatalog: readonly PageSearchResult[];
  readonly query: string;
}): PageSearchResult[] => {
  const normalizedQuery = query.toLocaleLowerCase(locale);
  if (!normalizedQuery) return [];
  const canonicalQueryTokens = getPageSearchTokens(query);

  const rankedMatches = pageCatalog.reduce<RankedPageMatch[]>(
    (accumulator, page) => {
      const normalizedTitle = page.title.toLocaleLowerCase(locale);
      const normalizedHref = page.href.toLocaleLowerCase(locale);
      const normalizedBreadcrumbs = page.breadcrumbs.map((value) =>
        value.toLocaleLowerCase(locale)
      );
      const normalizedSearchTerms = (page.searchTerms ?? []).map((value) =>
        value.toLocaleLowerCase(locale)
      );
      const compositeValues = getCompositePageSearchValues(
        normalizedTitle,
        normalizedBreadcrumbs,
        normalizedSearchTerms
      );
      const matchInputs = {
        normalizedTitle,
        normalizedHref,
        hrefSegments: normalizedHref.split("/").filter(Boolean),
        normalizedBreadcrumbs,
        normalizedSearchTerms,
        compositeValues,
      };
      const matchQuery = { normalizedQuery, canonicalQueryTokens };

      if (!pageMatchesQuery(matchInputs, matchQuery)) return accumulator;
      accumulator.push({
        page,
        normalizedTitle,
        priority: getPageMatchPriority(
          matchInputs,
          normalizedQuery,
          canonicalQueryTokens
        ),
      });
      return accumulator;
    },
    []
  );

  return rankedMatches
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      const titleComparison = a.normalizedTitle.localeCompare(
        b.normalizedTitle,
        locale
      );
      return titleComparison || a.page.href.localeCompare(b.page.href, locale);
    })
    .map((result) => result.page);
};

export default function HeaderSearchModal({
  onClose,
  wave: _wave,
}: {
  readonly onClose: () => void;
  readonly wave: ApiWave | null;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();
  let storageScope = "anonymous";
  const connectedProfileId = connectedProfile?.id?.trim();
  if (connectedProfileId) {
    storageScope = connectedProfileId;
  } else if (connectedProfile) {
    const primaryWallet = connectedProfile.primary_wallet.trim();
    if (primaryWallet) {
      storageScope = primaryWallet.toLocaleLowerCase(locale);
    }
  }
  const sessionQueryStorageKey = getScopedStorageKey(
    HEADER_SEARCH_SESSION_QUERY_KEY,
    storageScope
  );
  const recentQueriesStorageKey = getScopedStorageKey(
    HEADER_SEARCH_RECENT_QUERIES_KEY,
    storageScope
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsPanelRef = useRef<HTMLDivElement>(null);
  const inputKeyHandlerRef = useRef<
    ((event: ReactKeyboardEvent<HTMLInputElement>) => void) | null
  >(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [searchValue, setSearchValue] = useState(() =>
    readSessionQuery(sessionQueryStorageKey)
  );
  const [debouncedValue, setDebouncedValue] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readRecentSearches(recentQueriesStorageKey)
  );
  const activeStorageScopeRef = useRef(storageScope);
  const skipStorageWriteRef = useRef(false);
  const [selectedCategory, setSelectedCategory] = useLocalPreference<CATEGORY>(
    "headerSearchCategoryFilter",
    CATEGORY.ALL,
    (value): value is CATEGORY =>
      typeof value === "string" &&
      (Object.values(CATEGORY) as CATEGORY[]).includes(value as CATEGORY)
  );

  useDebounce(() => setDebouncedValue(searchValue), 350, [searchValue]);

  const trimmedSearchValue = searchValue.trim();
  const trimmedDebouncedValue = debouncedValue.trim();
  const meetsCharacterThreshold =
    trimmedSearchValue.length >= MIN_SEARCH_LENGTH;
  const isLiveNumericSearch =
    trimmedSearchValue.length > 0 && !Number.isNaN(Number(trimmedSearchValue));
  const isLiveSearchEligible = meetsCharacterThreshold || isLiveNumericSearch;
  const shouldSearchDefault = trimmedDebouncedValue.length >= MIN_SEARCH_LENGTH;
  const shouldSearchNfts =
    trimmedDebouncedValue.length >= NFT_SEARCH_MIN_LENGTH ||
    (trimmedDebouncedValue.length > 0 &&
      !Number.isNaN(Number(trimmedDebouncedValue)));
  const isQuerySettled = trimmedSearchValue === trimmedDebouncedValue;
  const isAwaitingDebouncedSearch = isLiveSearchEligible && !isQuerySettled;
  const formattedInputMinLength = formatInteger(locale, MIN_SEARCH_LENGTH);

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
    if (!canAccessLanding) return [];
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
  }, [canAccessCraft, canAccessLanding, canAccessLaunch]);

  const pageCatalog = useMemo<PageSearchResult[]>(() => {
    const seen = new Set<string>();
    return [
      ...DIRECT_NAVIGATION_PAGES,
      ...SEARCH_ONLY_PAGES,
      ...sidebarPages,
      ...dropForgePages,
    ]
      .filter((entry) => {
        if (seen.has(entry.href)) return false;
        seen.add(entry.href);
        return true;
      })
      .map((entry) => {
        const iconProps = entry.icon ? { icon: entry.icon } : {};
        return {
          type: "PAGE",
          title: entry.name,
          href: entry.href,
          searchTerms: PAGE_SEARCH_ALIASES_BY_HREF[entry.href] ?? [],
          breadcrumbs: [entry.section, entry.subsection].filter(
            (value): value is string => Boolean(value)
          ),
          ...iconProps,
        };
      });
  }, [dropForgePages, sidebarPages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (activeStorageScopeRef.current === storageScope) return;
    activeStorageScopeRef.current = storageScope;
    skipStorageWriteRef.current = true;
    setSearchValue(readSessionQuery(sessionQueryStorageKey));
    setDebouncedValue("");
    setRecentSearches(readRecentSearches(recentQueriesStorageKey));
  }, [recentQueriesStorageKey, sessionQueryStorageKey, storageScope]);

  useEffect(() => {
    if (skipStorageWriteRef.current) {
      skipStorageWriteRef.current = false;
      return;
    }
    try {
      if (searchValue) {
        sessionStorage.setItem(sessionQueryStorageKey, searchValue);
      } else {
        sessionStorage.removeItem(sessionQueryStorageKey);
      }
    } catch {
      // Search remains fully functional without session storage.
    }
  }, [searchValue, sessionQueryStorageKey]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0)
      document.body.style.paddingRight = `${scrollbarGap}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  const rememberSearch = useCallback(
    (query: string) => {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) return;
      setRecentSearches((current) => {
        const next = [
          normalizedQuery,
          ...current.filter(
            (item) =>
              item.toLocaleLowerCase(locale) !==
              normalizedQuery.toLocaleLowerCase(locale)
          ),
        ].slice(0, MAX_RECENT_SEARCHES);
        try {
          sessionStorage.setItem(recentQueriesStorageKey, JSON.stringify(next));
        } catch {
          // Navigation must not depend on session storage.
        }
        return next;
      });
    },
    [locale, recentQueriesStorageKey]
  );

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
        params: { param: trimmedDebouncedValue },
      }),
    enabled: shouldSearchDefault,
  });

  const {
    isFetching: isFetchingNfts,
    data: nfts = EMPTY_NFT_RESULTS,
    error: nftsError,
    refetch: refetchNfts,
  } = useQuery<NFTSearchResult[], Error>({
    queryKey: [QueryKey.NFTS_SEARCH, trimmedDebouncedValue],
    queryFn: async () =>
      await commonApiFetch<NFTSearchResult[]>({
        endpoint: "nfts_search",
        params: { search: trimmedDebouncedValue },
      }),
    enabled: shouldSearchNfts,
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

  const pageResults = useMemo(
    () =>
      shouldSearchDefault
        ? rankPageResults({
            locale,
            pageCatalog,
            query: trimmedDebouncedValue,
          })
        : [],
    [locale, pageCatalog, shouldSearchDefault, trimmedDebouncedValue]
  );

  const resultsByCategory = useMemo<
    Record<FilterableCategory, HeaderSearchModalItemType[]>
  >(
    () => ({
      [CATEGORY.PAGES]: isQuerySettled ? pageResults : [],
      [CATEGORY.PROFILES]:
        isQuerySettled && shouldSearchDefault ? profiles : [],
      [CATEGORY.NFTS]: isQuerySettled && shouldSearchNfts ? nfts : [],
      [CATEGORY.WAVES]: isQuerySettled && shouldSearchDefault ? waves : [],
    }),
    [
      isQuerySettled,
      nfts,
      pageResults,
      profiles,
      shouldSearchDefault,
      shouldSearchNfts,
      waves,
    ]
  );

  const categoryFetching = useMemo<Record<FilterableCategory, boolean>>(
    () => ({
      [CATEGORY.PAGES]: isAwaitingDebouncedSearch && meetsCharacterThreshold,
      [CATEGORY.PROFILES]:
        (isAwaitingDebouncedSearch && meetsCharacterThreshold) ||
        (isQuerySettled && shouldSearchDefault && isFetchingProfiles),
      [CATEGORY.NFTS]:
        isAwaitingDebouncedSearch ||
        (isQuerySettled && shouldSearchNfts && isFetchingNfts),
      [CATEGORY.WAVES]:
        (isAwaitingDebouncedSearch && meetsCharacterThreshold) ||
        (isQuerySettled && shouldSearchDefault && isFetchingWaves),
    }),
    [
      isAwaitingDebouncedSearch,
      isFetchingNfts,
      isFetchingProfiles,
      isFetchingWaves,
      isQuerySettled,
      meetsCharacterThreshold,
      shouldSearchDefault,
      shouldSearchNfts,
    ]
  );

  const categoryErrors = useMemo<Record<FilterableCategory, boolean>>(
    () => ({
      [CATEGORY.PAGES]: false,
      [CATEGORY.PROFILES]:
        isQuerySettled && shouldSearchDefault && Boolean(profilesError),
      [CATEGORY.NFTS]: isQuerySettled && shouldSearchNfts && Boolean(nftsError),
      [CATEGORY.WAVES]:
        isQuerySettled && shouldSearchDefault && Boolean(wavesError),
    }),
    [
      isQuerySettled,
      nftsError,
      profilesError,
      shouldSearchDefault,
      shouldSearchNfts,
      wavesError,
    ]
  );

  const selectedSearchCategory = isFilterableCategory(selectedCategory)
    ? selectedCategory
    : CATEGORY.ALL;

  const derivedState = useMemo(() => {
    if (!isLiveSearchEligible) return STATE.INITIAL;
    if (isAwaitingDebouncedSearch || !isQuerySettled) return STATE.LOADING;

    const relevantCategories: readonly FilterableCategory[] =
      isFilterableCategory(selectedSearchCategory)
        ? [selectedSearchCategory]
        : FILTERABLE_CATEGORIES;
    if (
      relevantCategories.some(
        (category) => resultsByCategory[category].length > 0
      )
    ) {
      return STATE.SUCCESS;
    }
    if (relevantCategories.some((category) => categoryFetching[category])) {
      return STATE.LOADING;
    }
    if (relevantCategories.some((category) => categoryErrors[category])) {
      return STATE.ERROR;
    }
    return STATE.NO_RESULTS;
  }, [
    categoryErrors,
    categoryFetching,
    isAwaitingDebouncedSearch,
    isLiveSearchEligible,
    isQuerySettled,
    resultsByCategory,
    selectedSearchCategory,
  ]);

  const handleRetry = (categories: readonly FilterableCategory[]) => {
    const retryCategories = new Set(categories);
    if (retryCategories.has(CATEGORY.PROFILES) && shouldSearchDefault) {
      refetchProfiles().catch(() => undefined);
    }
    if (retryCategories.has(CATEGORY.NFTS) && shouldSearchNfts) {
      refetchNfts().catch(() => undefined);
    }
    if (retryCategories.has(CATEGORY.WAVES) && shouldSearchDefault) {
      refetchWaves().catch(() => undefined);
    }
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setDebouncedValue("");
    setSelectedCategory(CATEGORY.ALL);
    globalThis.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };
  const charactersRemaining = Math.max(
    MIN_SEARCH_LENGTH - trimmedSearchValue.length,
    0
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        fallbackFocus: () => modalRef.current ?? document.body,
        initialFocus: () =>
          inputRef.current ?? modalRef.current ?? document.body,
      }}
    >
      <div className="tailwind-scope tw-relative tw-z-1000 tw-cursor-default">
        <div className="tw-fixed tw-inset-0 tw-bg-black/70 tw-backdrop-blur-sm" />
        <div className="tw-fixed tw-inset-0 tw-z-1000 tw-h-[100dvh] tw-overflow-hidden tw-overscroll-none">
          <div className="tw-flex tw-h-full tw-min-h-0 tw-items-start tw-justify-center tw-p-0 tw-text-center sm:tw-items-center sm:tw-p-5">
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={HEADER_SEARCH_DIALOG_TITLE_ID}
              className="tw-flex tw-h-[100dvh] tw-min-h-0 tw-w-full tw-max-w-[900px] tw-transform tw-flex-col tw-overflow-hidden tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-pt-[env(safe-area-inset-top)] tw-text-left tw-shadow-[0_24px_70px_rgba(0,0,0,0.6)] sm:tw-h-[min(720px,82vh)] sm:tw-rounded-2xl sm:tw-pt-0"
            >
              <div className="tw-flex tw-flex-shrink-0 tw-items-start tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 sm:tw-items-center sm:tw-px-5">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t(locale, "headerSearch.goBack")}
                  className="-tw-ml-1 tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-none tw-bg-transparent tw-text-iron-300 tw-transition hover:tw-bg-iron-900 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 sm:tw-hidden"
                >
                  <ChevronLeftIcon className="tw-size-6" />
                </button>
                <div className="tw-min-w-0 tw-flex-1">
                  <h2
                    id={HEADER_SEARCH_DIALOG_TITLE_ID}
                    className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
                  >
                    {t(locale, "headerSearch.dialogTitle.site")}
                  </h2>
                  <p className="tw-m-0 tw-mt-0.5 tw-text-xs tw-leading-4 tw-text-iron-400">
                    {t(locale, "headerSearch.dialogDescription.site")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t(locale, "headerSearch.close")}
                  className="tw-hidden tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition hover:tw-bg-iron-900 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 sm:tw-inline-flex"
                >
                  <XMarkIcon className="tw-size-5" />
                </button>
              </div>

              <div className="tw-flex-shrink-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 sm:tw-px-5">
                <div className="tw-relative">
                  <MagnifyingGlassIcon
                    className="tw-pointer-events-none tw-absolute tw-left-3.5 tw-top-1/2 tw-size-5 -tw-translate-y-1/2 tw-text-iron-400"
                    aria-hidden="true"
                  />
                  <label className="tw-sr-only" htmlFor="header-search-input">
                    {t(locale, "headerSearch.inputLabel")}
                  </label>
                  <p
                    id={HEADER_SEARCH_INPUT_DESCRIPTION_ID}
                    className="tw-sr-only"
                  >
                    {t(locale, "headerSearch.inputDescription.site", {
                      minLength: formattedInputMinLength,
                    })}
                  </p>
                  <input
                    id="header-search-input"
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    aria-controls={
                      derivedState === STATE.SUCCESS
                        ? HEADER_SEARCH_RESULTS_LISTBOX_ID
                        : undefined
                    }
                    aria-expanded={derivedState === STATE.SUCCESS}
                    aria-describedby={HEADER_SEARCH_INPUT_DESCRIPTION_ID}
                    autoComplete="off"
                    value={searchValue}
                    onChange={handleInputChange}
                    onKeyDown={(event) => inputKeyHandlerRef.current?.(event)}
                    className="sm:text-sm tw-form-input tw-block tw-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-2.5 tw-pl-10 tw-pr-16 tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-150 placeholder:tw-text-iron-500 hover:tw-ring-iron-600 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300/90"
                    placeholder={t(locale, "headerSearch.placeholder.site")}
                  />
                  {searchValue.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      aria-label={t(locale, "headerSearch.clear")}
                      className="tw-absolute tw-right-2.5 tw-top-1/2 tw-flex tw-h-7 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition hover:tw-border-iron-600 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
                    >
                      {t(locale, "headerSearch.clearShort")}
                    </button>
                  )}
                </div>
              </div>

              <HeaderSearchSiteResults
                key={`${trimmedDebouncedValue}:${selectedSearchCategory}`}
                selectedCategory={selectedSearchCategory}
                setSelectedCategory={setSelectedCategory}
                resultsByCategory={resultsByCategory}
                categoryErrors={categoryErrors}
                categoryFetching={categoryFetching}
                derivedState={derivedState}
                searchValue={trimmedDebouncedValue}
                liveSearchValue={searchValue}
                onClose={onClose}
                onRetry={handleRetry}
                onRememberSearch={rememberSearch}
                recentSearches={recentSearches}
                onRecentSearchSelect={(query) => {
                  setSearchValue(query);
                  inputRef.current?.focus();
                }}
                inputKeyHandlerRef={inputKeyHandlerRef}
                shouldShowCountdown={
                  trimmedSearchValue.length > 0 && charactersRemaining > 0
                }
                charactersRemaining={charactersRemaining}
                resultsPanelRef={resultsPanelRef}
              />
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
}
