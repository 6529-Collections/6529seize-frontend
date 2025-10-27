"use client";

import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import BellIcon from "@/components/common/icons/BellIcon";
import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import DiscoverIcon from "@/components/common/icons/DiscoverIcon";
import HomeIcon from "@/components/common/icons/HomeIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { UserPageTabType } from "@/components/user/layout/UserPageTabs";
import { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getProfileTargetRoute } from "@/helpers/Helpers";
import { getWaveHomeRoute, getWaveRoute } from "@/helpers/navigation.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLocalPreference from "@/hooks/useLocalPreference";
import {
  mapSidebarSectionsToPages,
  useSidebarSections,
  type SidebarPageEntry,
} from "@/hooks/useSidebarSections";
import { useWaves } from "@/hooks/useWaves";
import { commonApiFetch } from "@/services/api/common-api";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { FocusTrap } from "focus-trap-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import HeaderSearchModalItem, {
  getNftCollectionMap,
  HeaderSearchModalItemType,
  NFTSearchResult,
  PageSearchResult,
} from "./HeaderSearchModalItem";
import { HeaderSearchTabToggle } from "./HeaderSearchTabToggle";

enum STATE {
  INITIAL = "INITIAL",
  LOADING = "LOADING",
  ERROR = "ERROR",
  NO_RESULTS = "NO_RESULTS",
  SUCCESS = "SUCCESS",
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
}: {
  readonly onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isApp } = useDeviceInfo();
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useLocalPreference<CATEGORY>(
    "headerSearchCategoryFilter",
    CATEGORY.ALL,
    (value) => Object.values(CATEGORY).includes(value)
  );

  const [debouncedValue, setDebouncedValue] = useState<string>("");
  const [allowProfileFetch, setAllowProfileFetch] = useState<boolean>(false);
  const [allowWaveFetch, setAllowWaveFetch] = useState<boolean>(false);
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
    keepPreviousData: false,
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
    enabled:
      shouldSearchDefault &&
      (selectedCategory === CATEGORY.PROFILES || allowProfileFetch),
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
    waveName:
      shouldSearchDefault &&
      (selectedCategory === CATEGORY.WAVES || allowWaveFetch)
        ? trimmedDebouncedValue
        : null,
    limit: 20,
    enabled:
      shouldSearchDefault &&
      (selectedCategory === CATEGORY.WAVES || allowWaveFetch),
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
    () =>
      shouldSearchDefault &&
      (selectedCategory === CATEGORY.PROFILES || allowProfileFetch)
        ? profiles ?? []
        : [],
    [shouldSearchDefault, selectedCategory, allowProfileFetch, profiles]
  );

  const nftResults: NFTSearchResult[] = useMemo(
    () => (shouldSearchNfts ? nfts ?? [] : []),
    [shouldSearchNfts, nfts]
  );

  const waveResults: ApiWave[] = useMemo(
    () =>
      shouldSearchDefault &&
      (selectedCategory === CATEGORY.WAVES || allowWaveFetch)
        ? waves ?? []
        : [],
    [shouldSearchDefault, selectedCategory, allowWaveFetch, waves]
  );

  const nftsSettled =
    shouldSearchNfts &&
    !isFetchingNfts &&
    (nfts !== undefined || Boolean(nftsError));

  const profilesSettled =
    shouldSearchDefault &&
    (selectedCategory === CATEGORY.PROFILES || allowProfileFetch) &&
    !isFetchingProfiles &&
    (profiles !== undefined || Boolean(profilesError));

  useEffect(() => {
    setAllowProfileFetch(false);
    setAllowWaveFetch(false);
  }, [debouncedValue, shouldSearchDefault]);

  useEffect(() => {
    if (selectedCategory === CATEGORY.PROFILES) {
      setAllowProfileFetch(true);
    }
    if (selectedCategory === CATEGORY.WAVES) {
      setAllowWaveFetch(true);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!shouldSearchDefault) {
      return;
    }

    if (allowProfileFetch) {
      return;
    }

    if (!shouldSearchNfts) {
      setAllowProfileFetch(true);
      return;
    }

    if (nftsSettled) {
      setAllowProfileFetch(true);
    }
  }, [shouldSearchDefault, shouldSearchNfts, nftsSettled, allowProfileFetch]);

  useEffect(() => {
    if (!shouldSearchDefault) {
      return;
    }

    if (allowWaveFetch) {
      return;
    }

    if (!allowProfileFetch && selectedCategory !== CATEGORY.WAVES) {
      return;
    }

    if (profilesSettled) {
      setAllowWaveFetch(true);
    }
  }, [
    shouldSearchDefault,
    allowProfileFetch,
    profilesSettled,
    allowWaveFetch,
    selectedCategory,
  ]);

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
    setSelectedCategory(CATEGORY.ALL);
    setSelectedItemIndex(0);
    setAllowProfileFetch(false);
    setAllowWaveFetch(false);
    setState(STATE.INITIAL);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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
      defaultPath: UserPageTabType.IDENTITY,
    });
    router.push(path);
    onClose();
  };

  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [state, setState] = useState<STATE>(STATE.INITIAL);

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
    if (state !== STATE.SUCCESS) return;
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
      router.push(`${collectionMap[key].path}/${item.id}`);
      onClose();
      return;
    }

    if (isProfileResult(item)) {
      goToProfile(item);
      return;
    }

    if (isWaveResult(item)) {
      const currentWaveId = searchParams?.get("wave") ?? undefined;
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

  useEffect(() => {
    setSelectedItemIndex(0);

    if (!isSearching) {
      setState(STATE.INITIAL);
      return;
    }

    const hasResults = categoriesWithResults.length > 0;
    const anyFetching =
      (shouldSearchDefault && (isFetchingProfiles || isFetchingWaves)) ||
      (shouldSearchNfts && isFetchingNfts);
    const anyError =
      (shouldSearchDefault &&
        (Boolean(profilesError) || Boolean(wavesError))) ||
      (shouldSearchNfts && Boolean(nftsError));

    if (!hasResults) {
      if (isAwaitingDebouncedSearch) {
        setState(STATE.LOADING);
        return;
      }

      if (anyError) {
        setState(STATE.ERROR);
        return;
      }

      if (anyFetching) {
        setState(STATE.LOADING);
        return;
      }

      setState(STATE.NO_RESULTS);
      return;
    }

    setState(STATE.SUCCESS);
  }, [
    categoriesWithResults,
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
    setState(STATE.LOADING);

    const refetchPromises: Promise<unknown>[] = [];

    const queueRefetch = (callback: () => Promise<unknown>) => {
      refetchPromises.push(callback());
    };

    if (selectedCategory === CATEGORY.ALL) {
      if (shouldSearchDefault) {
        queueRefetch(refetchProfiles);
        queueRefetch(refetchWaves);
      }
      if (shouldSearchNfts) {
        queueRefetch(refetchNfts);
      }
    } else if (selectedCategory === CATEGORY.PAGES) {
      setState(pageResults.length > 0 ? STATE.SUCCESS : STATE.NO_RESULTS);
      return;
    } else if (selectedCategory === CATEGORY.PROFILES) {
      if (shouldSearchDefault) {
        queueRefetch(refetchProfiles);
      }
    } else if (selectedCategory === CATEGORY.NFTS) {
      if (shouldSearchNfts) {
        queueRefetch(refetchNfts);
      }
    } else if (selectedCategory === CATEGORY.WAVES) {
      if (shouldSearchDefault) {
        queueRefetch(refetchWaves);
      }
    }

    if (refetchPromises.length === 0) {
      setState(STATE.NO_RESULTS);
      return;
    }

    Promise.all(refetchPromises).catch(() => {
      setState(STATE.ERROR);
    });
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
      const base = (item.profile_id ?? item.wallet ?? "profile").toLowerCase();
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
      key={getItemKey(item)}>
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
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
            <h3 className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              {CATEGORY_LABELS[group.category]}
            </h3>
            {group.total > group.items.length && (
              <button
                type="button"
                onClick={() => handleViewAll(group.category)}
                className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-200 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white tw-transition tw-duration-150">
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
      }}>
      <div className="tailwind-scope tw-cursor-default tw-relative tw-z-1000">
        <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px]"></div>
        <div className="tw-fixed tw-inset-0 tw-z-1000 tw-overflow-y-auto">
          <div className="tw-flex tw-min-h-full tw-items-start tw-justify-center tw-p-4 tw-text-center lg:tw-items-center sm:tw-p-6">
            <div
              ref={modalRef}
              aria-modal="true"
              aria-labelledby="header-search-input"
              className="tw-w-full tw-max-w-[min(100vw-3rem,900px)] sm:tw-max-w-3xl tw-relative tw-h-[520px] tw-max-h-[70vh] tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 tw-overflow-hidden inset-safe-area tw-flex tw-flex-col tw-min-h-0">
              <div className="tw-border-b tw-border-x-0 tw-border-t-0 tw-border-solid tw-border-white/10 tw-pb-4 tw-px-4 tw-mt-4 tw-flex tw-items-center tw-gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Go back"
                  className="tw-flex sm:tw-hidden tw-size-6 tw-bg-transparent -tw-ml-1 tw-mr-1 tw-border-none tw-rounded-full tw-items-center tw-justify-center tw-text-iron-300 hover:tw-text-white tw-transition tw-duration-150">
                  <ChevronLeftIcon className="tw-size-6 tw-flex-shrink-0" />
                </button>

                <div className="tw-relative tw-flex-1">
                  <svg
                    className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true">
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
                    className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-11 tw-pr-16 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset  focus:tw-ring-primary-300 tw-text-base sm:text-sm tw-transition tw-duration-300 tw-ease-out"
                    placeholder="Search 6529.io"
                  />
                  {searchValue.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      aria-label="Clear search"
                      className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-transparent tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300 hover:tw-text-white">
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="tw-hidden sm:tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white tw-transition tw-duration-150">
                  <XMarkIcon className="tw-size-5" />
                </button>
              </div>
              {shouldRenderCategoryToggle && (
                <div className="tw-py-3 tw-px-4 md:tw-hidden">
                  <HeaderSearchTabToggle
                    options={tabOptions}
                    activeKey={selectedCategory}
                    onSelect={(k) => setSelectedCategory(k as CATEGORY)}
                    fullWidth
                  />
                </div>
              )}

              <div
                className={`tw-flex tw-flex-1 tw-min-h-0 tw-flex-col md:tw-gap-4 md:tw-px-5 md:tw-pb-5 ${
                  shouldRenderCategoryToggle
                    ? "md:tw-grid md:tw-grid-cols-[12rem_minmax(0,1fr)]"
                    : "md:tw-flex-row"
                }`}>
                {shouldRenderCategoryToggle && (
                  <aside className="tw-hidden md:tw-flex md:tw-flex-col md:tw-gap-2 md:tw-pt-5">
                    <div className="tw-rounded-2xl tw-border tw-border-iron-900/60 tw-bg-iron-950/80 tw-flex tw-flex-col tw-gap-2">
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
                <div className="tw-flex-1 tw-min-h-0 tw-flex tw-flex-col md:tw-min-w-0">
                  {state === STATE.SUCCESS && (
                    <div
                      ref={resultsPanelRef}
                      id={HEADER_SEARCH_RESULTS_PANEL_ID}
                      role="tabpanel"
                      className="tw-flex-1 tw-h-0 tw-min-h-0 tw-scroll-py-2 tw-px-4 md:tw-pl-0 md:tw-pr-4 tw-pt-5 tw-pb-3 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-text-sm tw-text-iron-200">
                      {renderSuccessContent()}
                    </div>
                  )}
                  {(state === STATE.LOADING ||
                    (state === STATE.INITIAL && isSearching)) && (
                    <div
                      ref={resultsPanelRef}
                      id={HEADER_SEARCH_RESULTS_PANEL_ID}
                      role="tabpanel"
                      className="tw-flex-1 tw-h-0 tw-min-h-0 tw-flex tw-items-center tw-justify-center tw-px-4 md:tw-px-0">
                      <p className="tw-text-iron-300 tw-font-normal tw-text-sm">
                        Loading...
                      </p>
                    </div>
                  )}
                  {state === STATE.NO_RESULTS && (
                    <div
                      ref={resultsPanelRef}
                      id={HEADER_SEARCH_RESULTS_PANEL_ID}
                      role="tabpanel"
                      className="tw-flex-1 tw-h-0 tw-min-h-0 tw-flex tw-items-center tw-justify-center tw-px-4 md:tw-px-0">
                      <p className="tw-text-iron-300 tw-text-sm">
                        No results found
                      </p>
                    </div>
                  )}
                  {state === STATE.ERROR && (
                    <div
                      ref={resultsPanelRef}
                      id={HEADER_SEARCH_RESULTS_PANEL_ID}
                      role="tabpanel"
                      className="tw-flex-1 tw-h-0 tw-min-h-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-4 md:tw-px-0 tw-text-center">
                      <p
                        className="tw-text-iron-300 tw-font-normal tw-text-sm"
                        aria-live="polite">
                        Something went wrong while searching. Please try again.
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
                        className="tw-items-center tw-rounded-full tw-border tw-border-iron-300 tw-bg-iron-100 tw-px-3 tw-py-1.5 tw-font-medium tw-text-iron-800 hover:tw-border-iron-500 hover:tw-bg-iron-200 tw-transition tw-duration-150">
                        Try Again
                      </button>
                    </div>
                  )}
                  {state === STATE.INITIAL && !isSearching && (
                    <div
                      ref={resultsPanelRef}
                      id={HEADER_SEARCH_RESULTS_PANEL_ID}
                      role="tabpanel"
                      className="tw-flex-1 tw-h-0 tw-min-h-0 tw-flex tw-items-center tw-justify-center tw-px-4 md:tw-px-0">
                      <p className="tw-text-iron-300 tw-font-normal tw-text-sm tw-text-center">
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
