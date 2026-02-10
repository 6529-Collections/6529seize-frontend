"use client";

import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import BellIcon from "@/components/common/icons/BellIcon";
import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import DiscoverIcon from "@/components/common/icons/DiscoverIcon";
import HomeIcon from "@/components/common/icons/HomeIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getProfileTargetRoute } from "@/helpers/Helpers";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import {
  getActiveWaveIdFromUrl,
  getWaveHomeRoute,
  getWaveRoute,
} from "@/helpers/navigation.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLocalPreference from "@/hooks/useLocalPreference";
import {
  mapSidebarSectionsToPages,
  useSidebarSections,
  type SidebarPageEntry,
} from "@/hooks/useSidebarSections";
import { useWaves } from "@/hooks/useWaves";
import { useWaveDropsSearch } from "@/hooks/useWaveDropsSearch";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import { commonApiFetch } from "@/services/api/common-api";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { FocusTrap } from "focus-trap-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import type {
  HeaderSearchModalItemType,
  NFTSearchResult,
  PageSearchResult,
} from "./HeaderSearchModalItem";
import HeaderSearchModalItem, {
  getNftCollectionMap,
} from "./HeaderSearchModalItem";
import { HeaderSearchTabToggle } from "./HeaderSearchTabToggle";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";

enum STATE {
  INITIAL = "INITIAL",
  LOADING = "LOADING",
  ERROR = "ERROR",
  NO_RESULTS = "NO_RESULTS",
  SUCCESS = "SUCCESS",
}

enum SEARCH_MODE {
  WAVE = "WAVE",
  SITE = "SITE",
}

enum CATEGORY {
  ALL = "ALL",
  PROFILES = "PROFILES",
  NFTS = "NFTS",
  WAVES = "WAVES",
  PAGES = "PAGES",
}

type FilterableCategory = Exclude<CATEGORY, CATEGORY.ALL>;

const FILTERABLE_CATEGORIES: FilterableCategory[] = [
  CATEGORY.PAGES,
  CATEGORY.NFTS,
  CATEGORY.PROFILES,
  CATEGORY.WAVES,
];

const isFilterableCategory = (
  category: CATEGORY
): category is FilterableCategory => category !== CATEGORY.ALL;

const CATEGORY_LABELS: Record<FilterableCategory, string> = {
  [CATEGORY.PAGES]: "Pages",
  [CATEGORY.PROFILES]: "Profiles",
  [CATEGORY.NFTS]: "NFTs",
  [CATEGORY.WAVES]: "Waves",
};

const CATEGORY_PREVIEW_LIMIT = 3;

const PRIMARY_NAVIGATION_PAGES: SidebarPageEntry[] = [
  { name: "Home", href: "/", section: "Main", icon: HomeIcon },
  { name: "Waves", href: "/waves", section: "Main", icon: WavesIcon },
  {
    name: "Messages",
    href: "/messages",
    section: "Main",
    icon: ChatBubbleIcon,
  },
  { name: "Discover", href: "/discover", section: "Main", icon: DiscoverIcon },
  {
    name: "Notifications",
    href: "/notifications",
    section: "Main",
    icon: BellIcon,
  },
];

const MIN_SEARCH_LENGTH = 3;
const NFT_SEARCH_MIN_LENGTH = 3;
const HEADER_SEARCH_RESULTS_PANEL_ID = "header-search-results-panel";

interface PreviewGroupItem {
  readonly item: HeaderSearchModalItemType;
  readonly index: number;
}

interface PreviewGroup {
  readonly category: FilterableCategory;
  readonly items: PreviewGroupItem[];
  readonly total: number;
}

interface RankedPageMatch {
  readonly page: PageSearchResult;
  readonly normalizedTitle: string;
  readonly priority: number;
}

const getPageMatchPriority = (
  normalizedTitle: string,
  hrefSegments: string[],
  normalizedBreadcrumbs: string[],
  normalizedQuery: string
): number => {
  if (normalizedTitle === normalizedQuery) return 0;
  if (hrefSegments.includes(normalizedQuery)) return 1;
  if (normalizedTitle.startsWith(normalizedQuery)) return 2;
  if (normalizedBreadcrumbs.includes(normalizedQuery)) return 3;
  if (normalizedTitle.includes(normalizedQuery)) return 4;
  if (hrefSegments.some((segment) => segment.includes(normalizedQuery))) {
    return 5;
  }
  return 6;
};

const pageMatchesQuery = (
  normalizedTitle: string,
  normalizedHref: string,
  normalizedBreadcrumbs: string[],
  normalizedQuery: string
) => {
  if (normalizedTitle.includes(normalizedQuery)) return true;
  if (normalizedHref.includes(normalizedQuery)) return true;
  return normalizedBreadcrumbs.some((breadcrumb) =>
    breadcrumb.includes(normalizedQuery)
  );
};

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
  const { isApp } = useDeviceInfo();
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
    (value) => Object.values(CATEGORY).includes(value)
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
  const allPageEntries = useMemo(() => {
    const seen = new Set<string>();
    return [...PRIMARY_NAVIGATION_PAGES, ...sidebarPages].filter((entry) => {
      if (seen.has(entry.href)) return false;
      seen.add(entry.href);
      return true;
    });
  }, [sidebarPages]);

  const pageCatalog = useMemo<PageSearchResult[]>(
    () =>
      allPageEntries.map((entry) => ({
        type: "PAGE",
        title: entry.name,
        href: entry.href,
        icon: entry.icon,
        breadcrumbs: [entry.section, entry.subsection]
          .filter((value): value is string => !!value)
          .map((value) => value),
      })),
    [allPageEntries]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    data: profiles,
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
    data: nfts,
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

        if (
          !pageMatchesQuery(
            normalizedTitle,
            normalizedHref,
            normalizedBreadcrumbs,
            normalizedQuery
          )
        ) {
          return accumulator;
        }

        const hrefSegments = normalizedHref.split("/").filter(Boolean);

        accumulator.push({
          page,
          normalizedTitle,
          priority: getPageMatchPriority(
            normalizedTitle,
            hrefSegments,
            normalizedBreadcrumbs,
            normalizedQuery
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
    () => (shouldSearchDefault ? (profiles ?? []) : []),
    [shouldSearchDefault, profiles]
  );

  const nftResults: NFTSearchResult[] = useMemo(
    () => (shouldSearchNfts ? (nfts ?? []) : []),
    [shouldSearchNfts, nfts]
  );

  const waveResults: ApiWave[] = useMemo(
    () => (shouldSearchDefault ? (waves ?? []) : []),
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

  useEffect(() => {
    if (
      selectedCategory !== CATEGORY.ALL &&
      (!isFilterableCategory(selectedCategory) ||
        !categoriesWithResults.includes(selectedCategory))
    ) {
      setSelectedCategory(CATEGORY.ALL);
    }
  }, [categoriesWithResults, selectedCategory, setSelectedCategory]);

  const tabOptions = useMemo(
    () =>
      [CATEGORY.ALL, ...categoriesWithResults].map((category) => ({
        key: category,
        label:
          category === CATEGORY.ALL
            ? "All"
            : CATEGORY_LABELS[category as FilterableCategory],
        panelId: HEADER_SEARCH_RESULTS_PANEL_ID,
      })),
    [categoriesWithResults]
  );

  const shouldRenderCategoryToggle =
    categoriesWithResults.length > 0 || selectedCategory !== CATEGORY.ALL;

  const previewGroups = useMemo<PreviewGroup[]>(() => {
    if (selectedCategory !== CATEGORY.ALL) {
      return [];
    }

    let runningIndex = 0;
    return categoriesWithResults.map<PreviewGroup>((category) => {
      const items = resultsByCategory[category];
      const previewItems = items
        .slice(0, CATEGORY_PREVIEW_LIMIT)
        .map((item) => ({ item, index: runningIndex++ }));

      return {
        category,
        items: previewItems,
        total: items.length,
      };
    });
  }, [categoriesWithResults, resultsByCategory, selectedCategory]);

  const flattenedItems = useMemo(() => {
    if (selectedCategory === CATEGORY.ALL) {
      return previewGroups.flatMap((group) =>
        group.items.map((entry) => entry.item)
      );
    }

    if (isFilterableCategory(selectedCategory)) {
      return resultsByCategory[selectedCategory];
    }

    return [];
  }, [previewGroups, resultsByCategory, selectedCategory]);

  const handleClearSearch = () => {
    setSearchValue("");
    setDebouncedValue("");
    setWaveSearchDebouncedValue("");
    setSelectedCategory(CATEGORY.ALL);
    setSelectedItemIndex(0);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleWaveDropSelect = (serialNo: number) => {
    if (!wave) return;
    if (waveChatScroll) {
      waveChatScroll.requestScrollToSerialNo({ waveId: wave.id, serialNo });
    } else {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("serialNo", String(serialNo));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    onClose();
  };

  const onHover = (index: number, state: boolean) => {
    if (!state) return;
    setSelectedItemIndex(index);
  };

  const goToProfile = async (profile: CommunityMemberMinimal) => {
    const handleOrWallet = profile.handle ?? profile.wallet.toLowerCase();
    const path = getProfileTargetRoute({
      handleOrWallet,
      pathname: pathname ?? "",
      defaultPath: USER_PAGE_TAB_IDS.IDENTITY,
    });
    router.push(path);
    onClose();
  };

  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

  const getCurrentItems = (): HeaderSearchModalItemType[] => flattenedItems;

  useKeyPressEvent("ArrowDown", () =>
    setSelectedItemIndex((index) =>
      index + 1 < flattenedItems.length ? index + 1 : index
    )
  );

  useKeyPressEvent("ArrowUp", () =>
    setSelectedItemIndex((i) => (i > 0 ? i - 1 : i))
  );

  const isPageResult = (
    item: HeaderSearchModalItemType
  ): item is PageSearchResult => (item as PageSearchResult).type === "PAGE";

  const isNftResult = (
    item: HeaderSearchModalItemType
  ): item is NFTSearchResult => Object.hasOwn(item, "contract");

  const isProfileResult = (
    item: HeaderSearchModalItemType
  ): item is CommunityMemberMinimal => Object.hasOwn(item, "wallet");

  const isWaveResult = (item: HeaderSearchModalItemType): item is ApiWave =>
    Object.hasOwn(item, "serial_no");

  useKeyPressEvent("Enter", () => {
    if (derivedState !== STATE.SUCCESS) return;
    const items = getCurrentItems();
    if (!items || items.length === 0) return;
    const item = items[selectedItemIndex];
    if (!item) return;

    if (isPageResult(item)) {
      router.push(item.href);
      onClose();
      return;
    }

    if (isNftResult(item)) {
      const collectionMap = getNftCollectionMap();
      const key = item.contract.toLowerCase();
      router.push(`${collectionMap[key]?.path}/${item.id}`);
      onClose();
      return;
    }

    if (isProfileResult(item)) {
      goToProfile(item);
      return;
    }

    if (isWaveResult(item)) {
      const currentWaveId =
        getActiveWaveIdFromUrl({ pathname, searchParams }) ?? undefined;
      const isDirectMessage =
        item.chat?.scope?.group?.is_direct_message ?? false;
      const target =
        currentWaveId === item.id
          ? getWaveHomeRoute({ isDirectMessage, isApp })
          : getWaveRoute({
              waveId: item.id,
              isDirectMessage,
              isApp,
            });
      router.push(target);
      onClose();
    }
  });

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

  useEffect(() => {
    setSelectedItemIndex(0);
  }, [trimmedDebouncedValue]);

  const handleRetry = () => {
    if (selectedCategory === CATEGORY.PAGES) {
      return;
    }

    if (selectedCategory === CATEGORY.ALL) {
      if (shouldSearchDefault) {
        refetchProfiles();
        refetchWaves();
      }
      if (shouldSearchNfts) {
        refetchNfts();
      }
    } else if (selectedCategory === CATEGORY.PROFILES) {
      if (shouldSearchDefault) {
        refetchProfiles();
      }
    } else if (selectedCategory === CATEGORY.NFTS) {
      if (shouldSearchNfts) {
        refetchNfts();
      }
    } else if (selectedCategory === CATEGORY.WAVES) {
      if (shouldSearchDefault) {
        refetchWaves();
      }
    }
  };

  const activeElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeElementRef.current) {
      activeElementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, [selectedItemIndex]);

  const getItemKey = (item: HeaderSearchModalItemType): string => {
    if (isPageResult(item)) {
      return `page:${item.href}`;
    }
    if (isNftResult(item)) {
      return `nft:${item.contract}:${item.id}`;
    }
    if (isProfileResult(item)) {
      const base = (item.profile_id ?? item.wallet).toLowerCase();
      return `profile:${base}`;
    }
    if (isWaveResult(item)) {
      return `wave:${item.id}`;
    }
    return JSON.stringify(item);
  };

  const renderItem = (item: HeaderSearchModalItemType, index: number) => (
    <div
      ref={index === selectedItemIndex ? activeElementRef : null}
      key={getItemKey(item)}
    >
      <HeaderSearchModalItem
        content={item}
        searchValue={debouncedValue}
        isSelected={index === selectedItemIndex}
        onHover={(state) => onHover(index, state)}
        onClose={onClose}
      />
    </div>
  );

  const renderItems = (items: HeaderSearchModalItemType[], offset = 0) =>
    items.map((item, index) => renderItem(item, offset + index));

  const handleViewAll = (category: FilterableCategory) => {
    setSelectedCategory(category);
    setSelectedItemIndex(0);
  };

  const renderSuccessContent = () => {
    if (selectedCategory === CATEGORY.ALL) {
      return previewGroups.map((group) => (
        <section key={group.category} className="tw-mb-4 last:tw-mb-0">
          <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
            <h3 className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              {CATEGORY_LABELS[group.category]}
            </h3>
            {group.total > group.items.length && (
              <button
                type="button"
                onClick={() => handleViewAll(group.category)}
                className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white"
              >
                View all {CATEGORY_LABELS[group.category]}
              </button>
            )}
          </div>
          <div className="tw-space-y-1.5">
            {group.items.map(({ item, index }) => renderItem(item, index))}
          </div>
        </section>
      ));
    }

    if (isFilterableCategory(selectedCategory)) {
      return renderItems(resultsByCategory[selectedCategory]);
    }

    return null;
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
              aria-modal="true"
              aria-labelledby="header-search-input"
              className="inset-safe-area tw-relative tw-flex tw-h-[520px] tw-max-h-[70vh] tw-min-h-0 tw-w-full tw-max-w-[min(100vw-3rem,900px)] tw-transform tw-flex-col tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-max-w-3xl"
            >
              <div className="tw-mt-4 tw-flex tw-items-center tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-4 tw-pb-4">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Go back"
                  className="-tw-ml-1 tw-mr-1 tw-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-150 hover:tw-text-white sm:tw-hidden"
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
                    Search
                  </label>
                  <input
                    id="header-search-input"
                    ref={inputRef}
                    type="text"
                    required
                    autoComplete="off"
                    value={searchValue}
                    onChange={handleInputChange}
                    className="sm:text-sm tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-3 tw-pl-11 tw-pr-16 tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-600 focus:tw-bg-transparent focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300"
                    placeholder={
                      searchMode === SEARCH_MODE.WAVE
                        ? "Search messages"
                        : "Search 6529.io"
                    }
                  />
                  {searchValue.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      aria-label="Clear search"
                      className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-transparent tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300 hover:tw-text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="tw-hidden tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white sm:tw-inline-flex"
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
                      In this Wave
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
                      Site-wide
                    </button>
                  </div>
                </div>
              )}
              {searchMode === SEARCH_MODE.SITE &&
                shouldRenderCategoryToggle && (
                  <div className="tw-px-4 tw-py-3 md:tw-hidden">
                    <HeaderSearchTabToggle
                      options={tabOptions}
                      activeKey={selectedCategory}
                      onSelect={(k) => setSelectedCategory(k as CATEGORY)}
                      fullWidth
                    />
                  </div>
                )}

              <div
                className={`tw-flex tw-min-h-0 tw-flex-1 tw-flex-col md:tw-gap-4 md:tw-px-5 md:tw-pb-5 ${
                  searchMode === SEARCH_MODE.SITE && shouldRenderCategoryToggle
                    ? "md:tw-grid md:tw-grid-cols-[12rem_minmax(0,1fr)]"
                    : "md:tw-flex-row"
                }`}
              >
                {searchMode === SEARCH_MODE.SITE &&
                  shouldRenderCategoryToggle && (
                    <aside className="tw-hidden md:tw-flex md:tw-flex-col md:tw-gap-2 md:tw-pt-5">
                      <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-2xl tw-border tw-border-iron-900/60 tw-bg-iron-950/80">
                        <HeaderSearchTabToggle
                          options={tabOptions}
                          activeKey={selectedCategory}
                          onSelect={(k) => setSelectedCategory(k as CATEGORY)}
                          fullWidth
                          orientation="vertical"
                        />
                      </div>
                    </aside>
                  )}
                <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col md:tw-min-w-0">
                  {/* Wave search results */}
                  {searchMode === SEARCH_MODE.WAVE && wave && (
                    <div
                      ref={resultsPanelRef}
                      className="tw-h-0 tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 tw-pb-6 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
                    >
                      {isLoadingWaveDrops && (
                        <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-iron-300">
                          Loading…
                        </div>
                      )}

                      {!isLoadingWaveDrops && isWaveDropsError && (
                        <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-iron-300">
                          Couldn't load search results.
                        </div>
                      )}

                      {!isLoadingWaveDrops &&
                        !isWaveDropsError &&
                        !shouldSearchWave && (
                          <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-sm tw-text-iron-400">
                            Type at least 2 characters to search in {wave.name}.
                          </div>
                        )}

                      {!isLoadingWaveDrops &&
                        !isWaveDropsError &&
                        shouldSearchWave &&
                        waveDropResults.length === 0 && (
                          <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-sm tw-text-iron-400">
                            No matches found.
                          </div>
                        )}

                      {!isLoadingWaveDrops &&
                        !isWaveDropsError &&
                        shouldSearchWave &&
                        waveDropResults.length > 0 && (
                          <div className="tw-space-y-2">
                            <div className="tw-text-xs tw-text-iron-400">
                              {waveDropResults.length} result
                              {waveDropResults.length === 1 ? "" : "s"}
                            </div>
                            <div className="tw-space-y-2">
                              {waveDropResults.map((drop, index) => {
                                const previousDrop =
                                  waveDropResults[index - 1] ?? null;
                                const nextDrop =
                                  waveDropResults[index + 1] ?? null;
                                const serialNo = drop.serial_no;
                                const canSelect = typeof serialNo === "number";
                                return (
                                  <button
                                    type="button"
                                    key={drop.stableKey}
                                    disabled={!canSelect}
                                    onClick={() => {
                                      if (!canSelect) return;
                                      handleWaveDropSelect(serialNo);
                                    }}
                                    className="tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/50 tw-text-left tw-transition tw-duration-150 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-900/40"
                                  >
                                    <div className="tw-pointer-events-none">
                                      <Drop
                                        drop={drop}
                                        previousDrop={previousDrop}
                                        nextDrop={nextDrop}
                                        showWaveInfo={false}
                                        activeDrop={null}
                                        showReplyAndQuote={false}
                                        location={DropLocation.WAVE}
                                        dropViewDropId={null}
                                        onReply={() => {}}
                                        onReplyClick={() => {}}
                                        onQuoteClick={() => {}}
                                      />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {waveDropsHasNextPage && (
                              <div className="tw-flex tw-justify-center tw-pt-2">
                                <button
                                  type="button"
                                  onClick={() => fetchNextWaveDropsPage()}
                                  disabled={isFetchingNextWaveDropsPage}
                                  className="tw-inline-flex tw-items-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                                >
                                  {isFetchingNextWaveDropsPage
                                    ? "Loading…"
                                    : "Load more"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                  {/* Site-wide search results */}
                  {searchMode === SEARCH_MODE.SITE &&
                    derivedState === STATE.SUCCESS && (
                      <div
                        ref={resultsPanelRef}
                        id={HEADER_SEARCH_RESULTS_PANEL_ID}
                        role="tabpanel"
                        className="tw-h-0 tw-min-h-0 tw-flex-1 tw-scroll-py-2 tw-overflow-y-auto tw-px-4 tw-pb-3 tw-pt-5 tw-text-sm tw-text-iron-200 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 md:tw-pl-0 md:tw-pr-4"
                      >
                        {renderSuccessContent()}
                      </div>
                    )}
                  {searchMode === SEARCH_MODE.SITE &&
                    derivedState === STATE.LOADING && (
                      <div
                        ref={resultsPanelRef}
                        id={HEADER_SEARCH_RESULTS_PANEL_ID}
                        role="tabpanel"
                        className="tw-flex tw-h-0 tw-min-h-0 tw-flex-1 tw-items-center tw-justify-center tw-px-4 md:tw-px-0"
                      >
                        <p className="tw-text-sm tw-font-normal tw-text-iron-300">
                          Loading...
                        </p>
                      </div>
                    )}
                  {searchMode === SEARCH_MODE.SITE &&
                    derivedState === STATE.NO_RESULTS && (
                      <div
                        ref={resultsPanelRef}
                        id={HEADER_SEARCH_RESULTS_PANEL_ID}
                        role="tabpanel"
                        className="tw-flex tw-h-0 tw-min-h-0 tw-flex-1 tw-items-center tw-justify-center tw-px-4 md:tw-px-0"
                      >
                        <p className="tw-text-sm tw-text-iron-300">
                          No results found
                        </p>
                      </div>
                    )}
                  {searchMode === SEARCH_MODE.SITE &&
                    derivedState === STATE.ERROR && (
                      <div
                        ref={resultsPanelRef}
                        id={HEADER_SEARCH_RESULTS_PANEL_ID}
                        role="tabpanel"
                        className="tw-flex tw-h-0 tw-min-h-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-4 tw-text-center md:tw-px-0"
                      >
                        <p
                          className="tw-text-sm tw-font-normal tw-text-iron-300"
                          aria-live="polite"
                        >
                          Something went wrong while searching. Please try
                          again.
                        </p>
                        <button
                          type="button"
                          onClick={handleRetry}
                          disabled={
                            (selectedCategory === CATEGORY.NFTS &&
                              isFetchingNfts) ||
                            (selectedCategory === CATEGORY.PROFILES &&
                              isFetchingProfiles) ||
                            (selectedCategory === CATEGORY.WAVES &&
                              isFetchingWaves)
                          }
                          aria-busy={
                            (selectedCategory === CATEGORY.NFTS &&
                              isFetchingNfts) ||
                            (selectedCategory === CATEGORY.PROFILES &&
                              isFetchingProfiles) ||
                            (selectedCategory === CATEGORY.WAVES &&
                              isFetchingWaves)
                              ? true
                              : undefined
                          }
                          className="tw-items-center tw-rounded-full tw-border tw-border-iron-300 tw-bg-iron-100 tw-px-3 tw-py-1.5 tw-font-medium tw-text-iron-800 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-200"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  {searchMode === SEARCH_MODE.SITE &&
                    derivedState === STATE.INITIAL && (
                      <div
                        ref={resultsPanelRef}
                        id={HEADER_SEARCH_RESULTS_PANEL_ID}
                        role="tabpanel"
                        className="tw-flex tw-h-0 tw-min-h-0 tw-flex-1 tw-items-center tw-justify-center tw-px-4 md:tw-px-0"
                      >
                        <p className="tw-text-center tw-text-sm tw-font-normal tw-text-iron-300">
                          Start typing to search 6529.io
                          {shouldShowCountdown &&
                            ` (${charactersRemaining} more character${
                              charactersRemaining === 1 ? "" : "s"
                            })`}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
}
