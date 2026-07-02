"use client";

import { AuthContext } from "@/components/auth/Auth";
import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import { NftBalancesProvider } from "@/components/nft-image/NftBalancesContext";
import TheMemesCard from "@/components/the-memes/TheMemesCard";
import { getMemesSortLabel } from "@/components/the-memes/theMemesI18n";
import { getTheMemesBrowseHref } from "@/components/the-memes/theMemesRouteParams";
import VolumeTypeDropdown from "@/components/the-memes/VolumeTypeDropdown";
import SeasonsGridDropdown from "@/components/utils/select/dropdown/SeasonsGridDropdown";
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
import { MEMES_EXTENDED_SORT, MemesSort } from "@/types/enums";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faChevronCircleDown,
  faChevronCircleUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

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
  locale = DEFAULT_LOCALE,
}: Readonly<{
  locale?: SupportedLocale;
}> = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { connectedProfile } = useContext(AuthContext);

  const [selectedSeason, setSelectedSeason] = useState<MemeSeason | null>(null);
  const [seasonId, setSeasonId] = useState<number | null>(null);

  const handleSeasonChange = (season: MemeSeason | null) => {
    setSelectedSeason(season);
    setSeasonId(season?.id ?? null);
  };

  const [routerLoaded, setRouterLoaded] = useState(false);
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<MemesSort>(MemesSort.AGE);
  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.ALL_TIME);

  useSetTitle(t(locale, "theMemes.documentTitle"));

  useEffect(() => {
    const initialSortDir = getInitialSortDirection(searchParams);
    const { sort: initialSort, volumeType: initialVolume } =
      getInitialSortAndVolume(searchParams);
    const initialSznId = getInitialSeasonId(searchParams);

    setSort(initialSort);
    setSortDir(initialSortDir);
    setSeasonId(initialSznId);
    setVolumeType(initialVolume);
    setRouterLoaded(true);
  }, [searchParams]);

  const getNftsNextPage = useCallback(() => {
    const mySort = getApiSort(sort, volumeType);
    let seasonFilter = "";
    if (seasonId !== null) {
      seasonFilter = `&season=${seasonId}`;
    }
    return `${publicEnv.API_ENDPOINT}/api/memes_extended_data?page_size=48&sort_direction=${sortDir}&sort=${mySort}${seasonFilter}`;
  }, [seasonId, sort, sortDir, volumeType]);

  const [fetching, setFetching] = useState(true);

  const [nfts, setNfts] = useState<ApiMemesExtendedData[]>([]);
  const tokenIds = useMemo(() => nfts.map((nft) => nft.id), [nfts]);
  const [nftsNextPage, setNftsNextPage] = useState<string>();

  const [nftMemes, setNftMemes] = useState<Meme[]>([]);
  const [nftsByMeme, setNftsByMeme] = useState<
    Map<number, ApiMemesExtendedData[]>
  >(new Map());

  useEffect(() => {
    if (!routerLoaded) return;

    router.push(
      getTheMemesBrowseHref({
        locale,
        seasonId,
        sort: getSortQueryParam(sort, volumeType),
        sortDir: sortDir.toLowerCase(),
      })
    );
  }, [locale, sort, sortDir, seasonId, volumeType, router, routerLoaded]);

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

  const fetchNfts = useCallback(() => {
    if (nftsNextPage === undefined) {
      setFetching(false);
      return;
    }
    fetchUrl(nftsNextPage)
      .then((responseNfts: Partial<DBResponse<ApiMemesExtendedData>>) => {
        setNfts((prev) => [...prev, ...(responseNfts.data ?? [])]);
        setNftsNextPage(
          typeof responseNfts.next === "string" ? responseNfts.next : undefined
        );
      })
      .catch(() => {
        // optionally surface a toast/log here
      })
      .finally(() => setFetching(false));
  }, [nftsNextPage]);

  useEffect(() => {
    if (routerLoaded) {
      setNfts([]);
      setNftsNextPage(getNftsNextPage());
      setFetching(true);
    }
  }, [getNftsNextPage, sort, sortDir, volumeType, seasonId, routerLoaded]);

  useEffect(() => {
    if (fetching && routerLoaded && nftsNextPage !== undefined) {
      fetchNfts();
    }
  }, [fetching, fetchNfts, routerLoaded, nftsNextPage]);

  useEffect(() => {
    if (nftsNextPage === undefined) {
      return;
    }

    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (throttleTimeout !== null) {
        return;
      }

      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;

        const distanceFromBottom =
          document.documentElement.scrollHeight -
          window.innerHeight -
          window.scrollY;

        if (distanceFromBottom <= 400 && routerLoaded) {
          setFetching(true);
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
  }, [routerLoaded, nftsNextPage]);

  function printSortDirectionButton(
    direction: SortDirection,
    icon: IconDefinition,
    label: string
  ) {
    const isActive = sortDir === direction;

    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={isActive}
        onClick={() => setSortDir(direction)}
        className={`tw-m-0 tw-inline-flex tw-h-7 tw-w-6 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${
          isActive
            ? "tw-bg-white/[0.06] tw-text-white"
            : "tw-text-iron-500 hover:tw-bg-white/[0.04] hover:tw-text-iron-200"
        }`}
      >
        <FontAwesomeIcon aria-hidden="true" icon={icon} className="tw-size-4" />
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
      <div className="tw-grid tw-grid-cols-2 tw-gap-3 tw-pt-2 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-4 xl:tw-gap-5">
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
          <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-4 xl:tw-gap-5">
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
        <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-py-6 md:tw-px-6 md:tw-py-10 lg:tw-px-8">
          <header className="tw-pb-5">
            <div className="tw-flex tw-flex-col tw-gap-4">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2 sm:tw-w-auto sm:tw-justify-start">
                  <div className="tw-min-w-0 min-[1200px]:tw-hidden">
                    <CollectionsDropdown activePage="memes" variant="title" />
                  </div>
                  <h1 className="tw-mb-0 tw-hidden tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl min-[1200px]:tw-block">
                    {t(locale, "theMemes.title")}
                  </h1>
                  <LFGButton contract={MEMES_CONTRACT} />
                </div>
                <div className="tw-w-full tw-shrink-0 sm:tw-w-40">
                  <SeasonsGridDropdown
                    selected={selectedSeason}
                    setSelected={handleSeasonChange}
                    initialSeasonId={seasonId}
                  />
                </div>
              </div>
            </div>
          </header>
          <section
            aria-label={t(locale, "theMemes.sorting.regionLabel")}
            className="tw-mb-5 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/80 tw-pb-4"
          >
            <div className="tw-flex tw-flex-col tw-gap-x-6 tw-gap-y-2 md:tw-flex-row md:tw-items-start">
              <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-1">
                <span className="tw-shrink-0 tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-500">
                  {t(locale, "theMemes.sorting.sortBy")}
                </span>
                <fieldset className="tw-m-0 tw-flex tw-shrink-0 tw-items-center tw-border-0 tw-p-0">
                  <legend className="tw-sr-only">
                    {t(locale, "theMemes.sorting.directionLegend")}
                  </legend>
                  {printSortDirectionButton(
                    SortDirection.ASC,
                    faChevronCircleUp,
                    t(locale, "theMemes.sorting.ascendingLabel")
                  )}
                  {printSortDirectionButton(
                    SortDirection.DESC,
                    faChevronCircleDown,
                    t(locale, "theMemes.sorting.descendingLabel")
                  )}
                </fieldset>
              </div>
              <div className="tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-overflow-x-auto tw-overflow-y-hidden tw-pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:tw-flex-wrap sm:tw-overflow-visible sm:tw-pb-0 [&::-webkit-scrollbar]:tw-hidden">
                {Object.values(MemesSort)
                  .filter((v) => v !== MemesSort.VOLUME)
                  .map((v) => (
                    <SortButton
                      key={v}
                      currentSort={sort}
                      sort={v}
                      locale={locale}
                      select={() => setSort(v)}
                    />
                  ))}
                <div className="tw-shrink-0">
                  <VolumeTypeDropdown
                    isVolumeSort={sort === MemesSort.VOLUME}
                    selectedVolumeSort={volumeType}
                    setVolumeType={setVolumeType}
                    setVolumeSort={() => setSort(MemesSort.VOLUME)}
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

function SortButton(
  props: Readonly<{
    currentSort: MemesSort;
    sort: MemesSort;
    locale: SupportedLocale;
    select: () => void;
  }>
) {
  const isActive = props.currentSort === props.sort;
  const label = getMemesSortLabel(props.sort, props.locale);

  return (
    <button
      type="button"
      aria-pressed={isActive}
      aria-label={t(props.locale, "theMemes.sorting.sortButtonLabel", {
        sort: label,
      })}
      onClick={() => props.select()}
      className={`tw-relative tw-m-0 tw-shrink-0 tw-cursor-pointer tw-whitespace-nowrap tw-border-0 tw-bg-transparent tw-px-0.5 tw-py-1 tw-text-sm tw-font-medium tw-leading-5 tw-no-underline tw-transition-colors tw-duration-200 after:tw-absolute after:-tw-bottom-0.5 after:tw-left-0 after:tw-h-px after:tw-w-full after:tw-origin-left after:tw-transition-transform after:tw-duration-200 after:tw-content-[''] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 sm:tw-shrink ${
        isActive
          ? "tw-text-white after:tw-scale-x-100 after:tw-bg-primary-400"
          : "tw-text-iron-500 after:tw-scale-x-0 after:tw-bg-iron-700 hover:tw-text-iron-200 hover:after:tw-scale-x-100"
      }`}
    >
      {label}
    </button>
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
