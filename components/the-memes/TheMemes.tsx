"use client";

import { AuthContext } from "@/components/auth/Auth";
import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import CollectEntryLink from "@/components/collect/CollectEntryLink";
import DotLoader from "@/components/dotLoader/DotLoader";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import { NftBalancesProvider } from "@/components/nft-image/NftBalancesContext";
import TheMemesCard from "@/components/the-memes/TheMemesCard";
import TheMemesSortButton from "@/components/the-memes/TheMemesSortButton";
import useMemesSortVisibility from "@/components/the-memes/useMemesSortVisibility";
import {
  getAllSeasonsLabel,
  getMemeApiSeasonIds,
  getMemeSeasonsForYear,
  getMemeYears,
  normalizeMemeFilterIds,
} from "@/components/the-memes/theMemesFilters";
import { getTheMemesBrowseHref } from "@/components/the-memes/theMemesRouteParams";
import type { TheMemesInitialData } from "@/app/the-memes/theMemesInitialData";
import VolumeTypeDropdown from "@/components/the-memes/VolumeTypeDropdown";
import DropdownToolbar from "@/components/utils/select/dropdown/DropdownToolbar";
import FilterGridDropdown from "@/components/utils/select/dropdown/FilterGridDropdown";
import MemeSeasonGridDropdown from "@/components/utils/select/dropdown/MemeSeasonGridDropdown";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import { VolumeType } from "@/entities/INFT";
import type { MemeSeason } from "@/entities/ISeason";
import { SortDirection } from "@/entities/ISort";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import { MEMES_EXTENDED_SORT, MemesSort } from "@/types/enums";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface Meme {
  meme: number;
  meme_name: string;
}

type SearchParamReader = Pick<URLSearchParams, "get">;

const MEMES_SORT_TO_API: Record<MemesSort, string> = {
  [MemesSort.AGE]: MEMES_EXTENDED_SORT[0],
  [MemesSort.EDITION_SIZE]: MEMES_EXTENDED_SORT[1],
  [MemesSort.MEME]: MEMES_EXTENDED_SORT[2],
  [MemesSort.HODLERS]: MEMES_EXTENDED_SORT[3],
  [MemesSort.TDH]: MEMES_EXTENDED_SORT[4],
  [MemesSort.UNIQUE_PERCENT]: MEMES_EXTENDED_SORT[5],
  [MemesSort.UNIQUE_PERCENT_EX_MUSEUM]: MEMES_EXTENDED_SORT[6],
  [MemesSort.FLOOR_PRICE]: MEMES_EXTENDED_SORT[7],
  [MemesSort.MARKET_CAP]: MEMES_EXTENDED_SORT[8],
  [MemesSort.VOLUME]: MEMES_EXTENDED_SORT[12],
  [MemesSort.HIGHEST_OFFER]: MEMES_EXTENDED_SORT[13],
};

function getApiSort(sort: MemesSort, volumeType: VolumeType): string {
  if (sort === MemesSort.VOLUME) {
    switch (volumeType) {
      case VolumeType.HOURS_24:
        return MEMES_EXTENDED_SORT[9];
      case VolumeType.DAYS_7:
        return MEMES_EXTENDED_SORT[10];
      case VolumeType.DAYS_30:
        return MEMES_EXTENDED_SORT[11];
      case VolumeType.ALL_TIME:
        return MEMES_EXTENDED_SORT[12];
      default:
        return MEMES_EXTENDED_SORT[12];
    }
  }
  return MEMES_SORT_TO_API[sort];
}

function getInitialSortDirection(
  searchParams: SearchParamReader
): SortDirection {
  const routerSortDir = searchParams.get("sort_dir");
  if (routerSortDir === null || routerSortDir === "") {
    return SortDirection.ASC;
  }

  const resolvedRouterSortDir = Object.values(SortDirection).find(
    (sd) => sd.toLowerCase() === routerSortDir.toLowerCase()
  );

  return resolvedRouterSortDir ?? SortDirection.ASC;
}

function getInitialSortAndVolume(searchParams: SearchParamReader): {
  readonly sort: MemesSort;
  readonly volumeType: VolumeType;
} {
  const routerSort = searchParams.get("sort");
  if (routerSort === null || routerSort === "") {
    return { sort: MemesSort.AGE, volumeType: VolumeType.ALL_TIME };
  }

  const sortLower = routerSort.toLowerCase();

  if (sortLower.startsWith("volume_")) {
    const volKey = sortLower.replace("volume_", "").toUpperCase();
    const volMatch = Object.keys(VolumeType).find(
      (k) => k.toLowerCase() === volKey.toLowerCase()
    );
    return {
      sort: MemesSort.VOLUME,
      volumeType:
        volMatch === undefined
          ? VolumeType.ALL_TIME
          : VolumeType[volMatch as keyof typeof VolumeType],
    };
  }

  const resolvedKey = Object.keys(MemesSort).find(
    (k) => k.toLowerCase() === sortLower
  );

  return {
    sort:
      resolvedKey === undefined
        ? MemesSort.AGE
        : MemesSort[resolvedKey as keyof typeof MemesSort],
    volumeType: VolumeType.ALL_TIME,
  };
}

function getInitialSeasonId(searchParams: SearchParamReader): number | null {
  const routerSzn = searchParams.get("szn");
  if (routerSzn === null || routerSzn === "") {
    return null;
  }

  const parsed = Number.parseInt(routerSzn, 10);
  return !Number.isNaN(parsed) && parsed > 0 ? parsed : null;
}

function getInitialYearId(searchParams: SearchParamReader): number | null {
  const routerYear = searchParams.get("year");
  if (routerYear === null || routerYear === "") {
    return null;
  }

  const parsed = Number.parseInt(routerYear, 10);
  return !Number.isNaN(parsed) && parsed >= 0 ? parsed : null;
}

function getSortQueryParam(sort: MemesSort, volumeType: VolumeType): string {
  if (sort === MemesSort.VOLUME) {
    const volKey = Object.entries(VolumeType).find(
      ([_, value]) => value === volumeType
    )?.[0];

    return volKey === undefined
      ? "volume_all_time"
      : `volume_${volKey.toLowerCase()}`;
  }

  const found = Object.entries(MemesSort).find(([_, value]) => value === sort);
  return found === undefined ? sort.toLowerCase() : found[0].toLowerCase();
}

export default function TheMemesComponent({
  initialData,
  locale = DEFAULT_LOCALE,
}: Readonly<{
  initialData?: TheMemesInitialData | undefined;
  locale?: SupportedLocale;
}> = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { connectedProfile } = useContext(AuthContext);
  const initialDataRef = useRef(initialData);

  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [yearId, setYearId] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<MemeSeason[]>([]);
  const [seasonsLoaded, setSeasonsLoaded] = useState(false);

  const handleSeasonChange = (season: MemeSeason | null) => {
    initialDataRef.current = undefined;
    setSeasonId(season?.id ?? null);
  };

  const handleYearChange = (nextYearId: number | null) => {
    initialDataRef.current = undefined;
    setYearId(nextYearId);
    setSeasonId(null);
  };

  const [routerLoaded, setRouterLoaded] = useState(false);
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<MemesSort>(MemesSort.AGE);
  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.ALL_TIME);
  const sortOptionsRef = useMemesSortVisibility(sort, volumeType);

  useSetTitle(t(locale, "theMemes.documentTitle"));

  useEffect(() => {
    const initialSortDir = getInitialSortDirection(searchParams);
    const { sort: initialSort, volumeType: initialVolume } =
      getInitialSortAndVolume(searchParams);
    const initialSznId = getInitialSeasonId(searchParams);
    const initialYearId = getInitialYearId(searchParams);

    // The server seed belongs only to the unfiltered, oldest-first view.
    // URL navigation can change that view before the season request finishes.
    if (
      initialSort !== MemesSort.AGE ||
      initialSortDir !== SortDirection.ASC ||
      initialSznId !== null ||
      initialYearId !== null
    ) {
      initialDataRef.current = undefined;
    }

    setSort(initialSort);
    setSortDir(initialSortDir);
    setSeasonId(initialSznId);
    setYearId(initialYearId);
    setVolumeType(initialVolume);
    setRouterLoaded(true);
  }, [searchParams]);

  useEffect(() => {
    const abortController = new AbortController();

    commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
      signal: abortController.signal,
    })
      .then((response) => {
        setSeasons(response);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch meme seasons:", error);
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setSeasonsLoaded(true);
        }
      });

    return () => {
      abortController.abort();
    };
  }, []);

  const normalizedFilters = useMemo(
    () =>
      normalizeMemeFilterIds({
        seasonId,
        seasons,
        yearId,
      }),
    [seasonId, seasons, yearId]
  );

  useEffect(() => {
    if (!routerLoaded || !seasonsLoaded || seasons.length === 0) {
      return;
    }

    if (
      normalizedFilters.seasonId !== seasonId ||
      normalizedFilters.yearId !== yearId
    ) {
      setSeasonId(normalizedFilters.seasonId);
      setYearId(normalizedFilters.yearId);
    }
  }, [
    normalizedFilters.seasonId,
    normalizedFilters.yearId,
    routerLoaded,
    seasonId,
    seasons.length,
    seasonsLoaded,
    yearId,
  ]);

  const activeSeasonId = normalizedFilters.seasonId;
  const activeYearId = normalizedFilters.yearId;
  const yearOptions = useMemo(
    () => getMemeYears(seasons, locale),
    [locale, seasons]
  );
  const filteredSeasons = useMemo(
    () => getMemeSeasonsForYear({ seasons, yearId: activeYearId }),
    [activeYearId, seasons]
  );
  const activeSeason =
    filteredSeasons.find((season) => season.id === activeSeasonId) ?? null;
  const yearFilterLabel = t(locale, "theMemes.filters.year.label");
  const allYearsLabel = t(locale, "theMemes.filters.year.all");
  const activeYearLabel =
    yearOptions.find((year) => year.id === activeYearId)?.display ??
    allYearsLabel;
  const allSeasonsLabel = getAllSeasonsLabel(activeYearId, locale);
  const filtersReady = routerLoaded && seasonsLoaded;

  const getNftsNextPage = useCallback(() => {
    const mySort = getApiSort(sort, volumeType);
    const apiSeasonIds = getMemeApiSeasonIds({
      seasonId: activeSeasonId,
      seasons,
      yearId: activeYearId,
    });
    const query = new URLSearchParams({
      page_size: "48",
      sort_direction: sortDir,
      sort: mySort,
    });

    if (apiSeasonIds.length > 0) {
      query.set("season", apiSeasonIds.join(","));
    }

    return `${publicEnv.API_ENDPOINT}/api/memes_extended_data?${query.toString()}`;
  }, [activeSeasonId, activeYearId, seasons, sort, sortDir, volumeType]);

  const [fetching, setFetching] = useState(initialData === undefined);

  const [nfts, setNfts] = useState<ApiMemesExtendedData[]>(
    () => initialData?.nfts ?? []
  );
  const tokenIds = useMemo(() => nfts.map((nft) => nft.id), [nfts]);
  const nftsNextPage = useRef(initialData?.nextPage);

  const [nftMemes, setNftMemes] = useState<Meme[]>([]);
  const [nftsByMeme, setNftsByMeme] = useState<
    Map<number, ApiMemesExtendedData[]>
  >(new Map());

  useEffect(() => {
    if (!filtersReady) return;

    router.push(
      getTheMemesBrowseHref({
        locale,
        seasonId: activeSeasonId,
        sort: getSortQueryParam(sort, volumeType),
        sortDir: sortDir.toLowerCase(),
        yearId: activeYearId,
      })
    );
  }, [
    activeSeasonId,
    activeYearId,
    filtersReady,
    locale,
    router,
    sort,
    sortDir,
    volumeType,
  ]);

  useEffect(() => {
    const memesMap = new Map<
      number,
      { meme: Meme; items: ApiMemesExtendedData[] }
    >();

    for (const nft of nfts) {
      const existing = memesMap.get(nft.meme);
      if (existing === undefined) {
        memesMap.set(nft.meme, {
          meme: { meme: nft.meme, meme_name: nft.meme_name },
          items: [nft],
        });
      } else {
        existing.items.push(nft);
      }
    }

    const sortedMemes = Array.from(memesMap.values()).map(
      (value) => value.meme
    );

    if (sortDir === SortDirection.DESC) {
      sortedMemes.sort((a, b) => b.meme - a.meme);
    } else {
      sortedMemes.sort((a, b) => a.meme - b.meme);
    }

    setNftMemes(sortedMemes);

    const nextNftsByMeme = new Map<number, ApiMemesExtendedData[]>();

    for (const [key, { items }] of Array.from(memesMap.entries())) {
      nextNftsByMeme.set(
        key,
        items.toSorted((a, b) => a.id - b.id)
      );
    }

    setNftsByMeme(nextNftsByMeme);
  }, [nfts, sortDir]);

  const activeRequest = useRef<AbortController | undefined>(undefined);

  const fetchNfts = useCallback(() => {
    const url = nftsNextPage.current;
    if (activeRequest.current !== undefined || url === undefined) {
      return;
    }
    const controller = new AbortController();
    activeRequest.current = controller;
    setFetching(true);

    fetchUrl(url, { signal: controller.signal })
      .then((responseNfts: Partial<DBResponse<ApiMemesExtendedData>>) => {
        // Aborting alone is insufficient if a response has already settled.
        if (controller.signal.aborted) return;

        // Once finally releases the lock, a scroll may run before React
        // commits. Read the next cursor from this ref, not the previous render.
        nftsNextPage.current =
          typeof responseNfts.next === "string" ? responseNfts.next : undefined;
        setNfts((prev) => [...prev, ...(responseNfts.data ?? [])]);
      })
      .catch(() => {
        // optionally surface a toast/log here
      })
      .finally(() => {
        if (controller.signal.aborted) return;

        activeRequest.current = undefined;
        setFetching(false);
      });
  }, []);

  useEffect(() => {
    if (!filtersReady) return;

    if (initialDataRef.current !== undefined) {
      initialDataRef.current = undefined;
    } else {
      nftsNextPage.current = getNftsNextPage();
      setNfts([]);
      fetchNfts();
    }

    // This also owns pagination requests started by scrolling in this view.
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = undefined;
    };
  }, [
    activeSeasonId,
    activeYearId,
    filtersReady,
    fetchNfts,
    getNftsNextPage,
    sort,
    sortDir,
    volumeType,
  ]);

  useEffect(() => {
    if (!filtersReady) {
      return;
    }

    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (throttleTimeout !== null || nftsNextPage.current === undefined) {
        return;
      }

      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;

        const distanceFromBottom =
          document.documentElement.scrollHeight -
          window.innerHeight -
          window.scrollY;

        if (distanceFromBottom <= 400) {
          fetchNfts();
        }
      }, 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (throttleTimeout !== null) {
        clearTimeout(throttleTimeout);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [fetchNfts, filtersReady]);

  function printSortDirectionButton(
    direction: SortDirection,
    Icon: typeof ArrowUpIcon,
    label: string
  ) {
    const isActive = sortDir === direction;

    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={isActive}
        onClick={() => {
          initialDataRef.current = undefined;
          setSortDir(direction);
        }}
        className={`tw-m-0 tw-inline-flex tw-size-7 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-p-0 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none lg:[body:not(.capacitor-native)_&]:tw-w-6 lg:[body:not(.capacitor-native)_&]:tw-rounded-lg lg:[body:not(.capacitor-native)_&]:tw-duration-300 ${
          isActive
            ? "tw-bg-iron-700 tw-text-white lg:[body:not(.capacitor-native)_&]:tw-bg-transparent"
            : "tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-text-iron-200 lg:[body:not(.capacitor-native)_&]:tw-text-iron-600 lg:[body:not(.capacitor-native)_&]:desktop-hover:hover:tw-text-iron-300"
        }`}
      >
        <Icon
          aria-hidden="true"
          className="tw-size-[13px] lg:[body:not(.capacitor-native)_&]:tw-size-3.5 lg:[body:not(.capacitor-native)_&]:tw-stroke-[1.25]"
        />
      </button>
    );
  }

  function printNft(nft: ApiMemesExtendedData) {
    return (
      <TheMemesCard
        key={`${nft.contract}-${nft.id}`}
        nft={nft}
        sort={sort}
        volumeType={volumeType}
        hasConnectedProfile={connectedProfile !== null}
        locale={locale}
      />
    );
  }

  function printNfts() {
    if (nfts.length === 0) {
      return null;
    }

    return (
      <div className="tw-grid tw-grid-cols-2 tw-gap-2.5 sm:tw-grid-cols-3 sm:tw-gap-4 sm:tw-pt-2 lg:tw-grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] xl:tw-gap-5">
        {nfts.map((nft) => printNft(nft))}
      </div>
    );
  }

  function printEmptyState() {
    if (fetching || nfts.length > 0) {
      return null;
    }

    return (
      <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-5 tw-text-center">
        <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-iron-100">
          {t(locale, "theMemes.empty.title")}
        </p>
        <p className="tw-mb-0 tw-text-sm tw-leading-5 tw-text-iron-400">
          {t(locale, "theMemes.empty.description")}
        </p>
      </div>
    );
  }

  function getNftsForMeme(meme: Meme) {
    return nftsByMeme.get(meme.meme) ?? [];
  }

  function printMemes() {
    return nftMemes.map((meme) => {
      const memeNfts = getNftsForMeme(meme);
      return (
        <section key={`${meme.meme}-${meme.meme_name}`} className="tw-pt-6">
          <h2 className="tw-mb-4 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100">
            {formatInteger(locale, meme.meme)} - {meme.meme_name}
          </h2>
          <div className="tw-grid tw-grid-cols-2 tw-gap-2.5 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] xl:tw-gap-5">
            {memeNfts.map((nft) => printNft(nft))}
          </div>
        </section>
      );
    });
  }

  return (
    <NftBalancesProvider
      consolidationKey={connectedProfile?.consolidation_key ?? null}
      contract={MEMES_CONTRACT}
      tokenIds={tokenIds}
      enabled={connectedProfile !== null}
    >
      <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-800 tw-bg-[#0D0D0F] tw-pb-5 tw-text-white">
        <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pb-8 tw-pt-4 sm:tw-py-6 md:tw-px-6 md:tw-py-10 lg:tw-px-8">
          <header className="tw-pb-5 max-sm:tw-pb-2">
            <div className="tw-flex tw-flex-col tw-gap-4">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2 max-sm:tw-gap-x-2 max-sm:tw-gap-y-1 sm:tw-w-auto sm:tw-justify-start">
                  <div className="tw-min-w-0 max-sm:tw-flex max-sm:tw-max-w-full max-sm:tw-flex-col max-sm:tw-items-start sm:tw-contents">
                    <div className="tw-min-w-0 min-[1200px]:tw-hidden">
                      <CollectionsDropdown activePage="memes" variant="title" />
                    </div>
                    <h1 className="tw-m-0 tw-hidden tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl min-[1200px]:tw-block">
                      {t(locale, "theMemes.title")}
                    </h1>
                    <CollectEntryLink
                      collection="memes"
                      intent={activeSeason ? "season" : "full_set"}
                      definitionId={
                        activeSeason ? String(activeSeason.id) : "memes"
                      }
                      locale={locale}
                      complete
                      className="max-sm:tw-min-h-10 max-sm:tw-px-0 max-sm:tw-text-[13px] max-sm:tw-text-iron-400 sm:tw-order-2 max-sm:[&>svg]:tw-size-3"
                    />
                  </div>
                  <LFGButton
                    contract={MEMES_CONTRACT}
                    className="max-sm:tw-h-9 max-sm:tw-text-[13px] sm:tw-order-1"
                  />
                </div>
                <DropdownToolbar
                  className="tw-grid tw-w-fit tw-max-w-full tw-shrink-0 tw-grid-cols-2 tw-gap-2 max-sm:tw-mt-1"
                  data-dropdown-menu-align="end"
                >
                  <FilterGridDropdown
                    filterLabel={yearFilterLabel}
                    items={yearOptions.map((year) => ({
                      value: year.id,
                      label: year.display,
                    }))}
                    onSelect={handleYearChange}
                    selectedValue={activeYearId}
                    allItemLabel={allYearsLabel}
                    triggerAriaLabel={t(
                      locale,
                      "theMemes.filters.triggerAriaLabel",
                      {
                        filter: yearFilterLabel,
                        value: activeYearLabel,
                      }
                    )}
                  />
                  <MemeSeasonGridDropdown
                    selected={activeSeason}
                    setSelected={handleSeasonChange}
                    initialSeasonId={activeSeasonId}
                    seasons={filteredSeasons}
                    allSeasonsLabel={allSeasonsLabel}
                    locale={locale}
                  />
                </DropdownToolbar>
              </div>
            </div>
          </header>
          <section
            aria-label={t(locale, "theMemes.sorting.regionLabel")}
            className="tw-mb-5 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/80 tw-pb-4 max-sm:tw-sticky max-sm:tw-top-0 max-sm:tw-z-30 max-sm:-tw-mx-4 max-sm:tw-mb-3.5 max-sm:tw-border-iron-800/90 max-sm:tw-bg-[#0D0D0F] max-sm:tw-py-2.5 max-sm:tw-pl-4"
          >
            <div className="tw-flex tw-items-center tw-gap-5">
              <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2.5 lg:[body:not(.capacitor-native)_&]:tw-gap-1">
                <span className="tw-shrink-0 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
                  {t(locale, "theMemes.sorting.sortBy")}
                </span>
                <fieldset className="tw-m-0 tw-flex tw-h-8 tw-shrink-0 tw-items-center tw-gap-0.5 tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-p-0.5 lg:[body:not(.capacitor-native)_&]:tw-h-7 lg:[body:not(.capacitor-native)_&]:tw-gap-0 lg:[body:not(.capacitor-native)_&]:tw-bg-transparent lg:[body:not(.capacitor-native)_&]:tw-p-0">
                  <legend className="tw-sr-only">
                    {t(locale, "theMemes.sorting.directionLegend")}
                  </legend>
                  {printSortDirectionButton(
                    SortDirection.ASC,
                    ArrowUpIcon,
                    t(locale, "theMemes.sorting.ascendingLabel")
                  )}
                  {printSortDirectionButton(
                    SortDirection.DESC,
                    ArrowDownIcon,
                    t(locale, "theMemes.sorting.descendingLabel")
                  )}
                </fieldset>
              </div>
              {/* A 1px timeline extension lets Chromium clear the fade when overflow disappears. */}
              <div
                ref={sortOptionsRef}
                className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-nowrap tw-items-center tw-gap-1.5 tw-overflow-x-auto tw-overflow-y-hidden tw-py-1 tw-pl-3 tw-pr-4 [-ms-overflow-style:none] [scrollbar-width:none] max-sm:[mask-image:linear-gradient(to_right,transparent,#000_12px,#000_calc(100%-28px),transparent)] sm:tw-pr-0 sm:[animation-fill-mode:both] sm:[animation-name:scroll-edge-fade] sm:[animation-range-end:calc(100%_+_1px)] sm:[animation-timeline:scroll(self_inline)] sm:[animation-timing-function:linear] sm:[mask-image:linear-gradient(to_right,transparent,#000_var(--fade-l),#000_calc(100%_-_var(--fade-r)),transparent)] [&::-webkit-scrollbar]:tw-hidden lg:[body:not(.capacitor-native)_&]:tw-justify-between lg:[body:not(.capacitor-native)_&]:tw-gap-4 lg:[body:not(.capacitor-native)_&]:tw-pl-0"
              >
                {Object.values(MemesSort)
                  .filter((v) => v !== MemesSort.VOLUME)
                  .map((v) => (
                    <TheMemesSortButton
                      key={v}
                      currentSort={sort}
                      sort={v}
                      locale={locale}
                      select={() => {
                        initialDataRef.current = undefined;
                        setSort(v);
                      }}
                    />
                  ))}
                <div className="tw-shrink-0">
                  <VolumeTypeDropdown
                    isVolumeSort={sort === MemesSort.VOLUME}
                    selectedVolumeSort={volumeType}
                    setVolumeType={(nextVolumeType) => {
                      initialDataRef.current = undefined;
                      setVolumeType(nextVolumeType);
                    }}
                    setVolumeSort={() => {
                      initialDataRef.current = undefined;
                      setSort(MemesSort.VOLUME);
                    }}
                    locale={locale}
                  />
                </div>
              </div>
            </div>
          </section>
          {nfts.length > 0 && sort === MemesSort.MEME
            ? printMemes()
            : printNfts()}
          {printEmptyState()}
          {fetching && nftsNextPage && (
            <div
              role="status"
              aria-live="polite"
              className="tw-pb-5 tw-pt-4 tw-text-sm tw-text-iron-300"
            >
              {t(locale, "theMemes.loading.fetching")} <DotLoader />
            </div>
          )}
        </div>
      </div>
    </NftBalancesProvider>
  );
}

export function printVolumeTypeDropdown(
  isVolumeSort: boolean,
  setVolumeType: (volumeType: VolumeType) => void,
  setVolumeSort: () => void,
  selectedVolumeSort: VolumeType = VolumeType.ALL_TIME,
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  return (
    <VolumeTypeDropdown
      isVolumeSort={isVolumeSort}
      selectedVolumeSort={selectedVolumeSort}
      setVolumeType={setVolumeType}
      setVolumeSort={setVolumeSort}
      locale={locale}
    />
  );
}
