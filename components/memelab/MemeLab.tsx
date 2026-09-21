"use client";

import { AuthContext } from "@/components/auth/Auth";
import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import { NftBalancesProvider } from "@/components/nft-image/NftBalancesContext";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import Pagination from "@/components/pagination/Pagination";
import Button from "@/components/utils/button/Button";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import type { LabExtendedData, LabNFT } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { getValuesForVolumeType } from "@/helpers/Helpers";
import { compareLocalized, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MemeLabSort } from "@/types/enums";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { getMemeLabCollectionHref } from "./memeLabRouteParams";
import MemeLabNftCard from "./MemeLabNftCard";
import MemeLabSortControls from "./MemeLabSortControls";
import { MEME_LAB_PAGE_SIZE, useMemeLabCatalog } from "./useMemeLabCatalog";

const COLLECTION_GRID_CLASS =
  "tw-grid tw-grid-cols-2 tw-gap-3 tw-pt-2 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] xl:tw-gap-5";
const COLLECTION_GRID_LIST_CLASS = `${COLLECTION_GRID_CLASS} tw-m-0 tw-list-none tw-px-0 tw-pb-0`;
const GROUP_GRID_LIST_CLASS =
  "tw-grid tw-grid-cols-2 tw-gap-3 tw-m-0 tw-list-none tw-p-0 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] xl:tw-gap-5";

export function getInitialRouterValues(
  sortDir: string | null,
  sort: string | null
) {
  let initialSortDir = SortDirection.ASC;
  let initialSort = MemeLabSort.AGE;

  const routerSortDir = sortDir;
  if (routerSortDir) {
    const routerSortDirStr = Array.isArray(routerSortDir)
      ? routerSortDir[0]
      : routerSortDir;
    const resolvedRouterSortDir = Object.values(SortDirection).find(
      (sd) => sd.toLowerCase() === routerSortDirStr.toLowerCase()
    );
    if (resolvedRouterSortDir) {
      initialSortDir = resolvedRouterSortDir;
    }
  }

  const routerSort = sort;
  if (routerSort) {
    const routerSortStr = Array.isArray(routerSort)
      ? routerSort[0]
      : routerSort;
    const resolvedKey = Object.keys(MemeLabSort).find(
      (k) => k.toLowerCase() === routerSortStr.toLowerCase()
    );
    if (resolvedKey) {
      initialSort = MemeLabSort[resolvedKey as keyof typeof MemeLabSort];
    } else {
      const resolvedVal = Object.values(MemeLabSort).find(
        (v) => v.toLowerCase() === routerSortStr.toLowerCase()
      );
      if (resolvedVal) {
        initialSort = resolvedVal as MemeLabSort;
      }
    }
  }

  return { initialSortDir, initialSort };
}

function getMemeLabSortOptions(isCollection?: boolean) {
  let enumValues = Object.values(MemeLabSort).filter(
    (v) => v != MemeLabSort.VOLUME
  );

  if (isCollection) {
    enumValues = enumValues.filter(
      (v) => v != MemeLabSort.ARTISTS && v != MemeLabSort.COLLECTIONS
    );
  }

  return enumValues;
}

function getMemeLabSortQuery(
  sort: MemeLabSort,
  sortDir: SortDirection,
  locale: SupportedLocale
) {
  const sortKey =
    Object.keys(MemeLabSort)
      .find((k) => MemeLabSort[k as keyof typeof MemeLabSort] === sort)
      ?.toLowerCase() ?? "";
  const newQuery: Record<string, string> = {
    sort: sortKey,
    sort_dir: sortDir.toLowerCase(),
  };
  if (locale !== DEFAULT_LOCALE) {
    newQuery["locale"] = locale;
  }
  return `?${new URLSearchParams(newQuery).toString()}`;
}

function compareMetric(first: number, second: number, sortDir: SortDirection) {
  let comparison = 0;
  if (first > second) comparison = 1;
  if (first < second) comparison = -1;
  return sortDir === SortDirection.ASC ? comparison : -comparison;
}

function getSortedMemeLabNfts(
  sort: MemeLabSort,
  sortDir: SortDirection,
  volumeType: VolumeType,
  nfts: readonly LabNFT[],
  nftMetas: readonly LabExtendedData[]
) {
  if (sort === MemeLabSort.AGE) {
    return [...nfts].sort((a, b) =>
      sortDir === SortDirection.ASC ? b.id - a.id : a.id - b.id
    );
  }

  const metadataById = new Map(
    nftMetas.map((nftMeta) => [nftMeta.id, nftMeta])
  );
  const getMetric = (nft: LabNFT) => {
    const nftMeta = metadataById.get(nft.id);
    switch (sort) {
      case MemeLabSort.EDITION_SIZE:
        return nft.supply;
      case MemeLabSort.HODLERS:
        return nftMeta?.hodlers ?? 0;
      case MemeLabSort.UNIQUE_PERCENT:
        return nftMeta?.percent_unique ?? 0;
      case MemeLabSort.UNIQUE_PERCENT_EX_MUSEUM:
        return nftMeta?.percent_unique_cleaned ?? 0;
      case MemeLabSort.FLOOR_PRICE:
        return nft.floor_price;
      case MemeLabSort.MARKET_CAP:
        return nft.market_cap;
      case MemeLabSort.HIGHEST_OFFER:
        return nft.highest_offer;
      case MemeLabSort.VOLUME:
        return getValuesForVolumeType(volumeType, nft);
      case MemeLabSort.ARTISTS:
      case MemeLabSort.COLLECTIONS:
        return 0;
      default:
        return 0;
    }
  };

  return [...nfts].sort((a, b) => {
    const comparison = compareMetric(getMetric(a), getMetric(b), sortDir);
    return comparison || a.id - b.id;
  });
}

function getSortedLabels(
  labels: readonly string[],
  sortDir: SortDirection,
  locale: SupportedLocale
) {
  return [...labels].sort((a, b) =>
    sortDir === SortDirection.ASC
      ? compareLocalized(locale, a, b)
      : compareLocalized(locale, b, a)
  );
}

export function sortChanged(
  router: ReturnType<typeof useRouter>,
  sort: MemeLabSort,
  sortDir: SortDirection,
  volumeType: VolumeType,
  nfts: LabNFT[],
  nftMetas: LabExtendedData[],
  setNfts: (nfts: LabNFT[]) => void,
  labArtists?: string[],
  labCollections?: string[],
  setLabArtists?: (artists: string[]) => void,
  setLabCollections?: (collections: string[]) => void,
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  router.replace(getMemeLabSortQuery(sort, sortDir, locale));

  if (sort !== MemeLabSort.ARTISTS && sort !== MemeLabSort.COLLECTIONS) {
    setNfts(getSortedMemeLabNfts(sort, sortDir, volumeType, nfts, nftMetas));
  }

  if (sort === MemeLabSort.ARTISTS && labArtists && setLabArtists) {
    setLabArtists(getSortedLabels(labArtists, sortDir, locale));
  }
  if (sort === MemeLabSort.COLLECTIONS && labCollections && setLabCollections) {
    setLabCollections(getSortedLabels(labCollections, sortDir, locale));
  }
}

export default function MemeLabComponent({
  initialSort = null,
  initialSortDirection = null,
  locale = DEFAULT_LOCALE,
}: {
  readonly initialSort?: string | null | undefined;
  readonly initialSortDirection?: string | null | undefined;
  readonly locale?: SupportedLocale | undefined;
}) {
  const router = useRouter();
  const { connectedProfile } = useContext(AuthContext);
  const isConnected = !!connectedProfile;
  const initialRouterValues = getInitialRouterValues(
    initialSortDirection,
    initialSort
  );

  useSetTitle(t(locale, "memeLab.documentTitle"));

  const [sortDir, setSortDir] = useState<SortDirection>(
    initialRouterValues.initialSortDir
  );
  const [sort, setSort] = useState<MemeLabSort>(
    initialRouterValues.initialSort
  );
  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.HOURS_24);
  const pageViewKey = `${sort}-${sortDir}-${volumeType}`;
  const [pageState, setPageState] = useState({ viewKey: "", page: 1 });
  const resultsRef = useRef<HTMLElement>(null);
  const page = pageState.viewKey === pageViewKey ? pageState.page : 1;
  const catalog = useMemeLabCatalog(sort, sortDir, page);

  useEffect(() => {
    const { initialSortDir, initialSort: parsedInitialSort } =
      getInitialRouterValues(initialSortDirection, initialSort);
    setSortDir(initialSortDir);
    setSort(parsedInitialSort);
  }, [initialSort, initialSortDirection]);

  const selectSort = (nextSort: MemeLabSort) => {
    setSort(nextSort);
    router.replace(getMemeLabSortQuery(nextSort, sortDir, locale));
  };

  const selectSortDirection = (nextSortDir: SortDirection) => {
    setSortDir(nextSortDir);
    router.replace(getMemeLabSortQuery(sort, nextSortDir, locale));
  };

  const selectVolumeType = (nextVolumeType: VolumeType) => {
    setVolumeType(nextVolumeType);
  };

  const sortedNfts = useMemo(
    () =>
      getSortedMemeLabNfts(
        sort,
        sortDir,
        volumeType,
        catalog.nfts,
        catalog.nftMetas
      ),
    [catalog.nftMetas, catalog.nfts, sort, sortDir, volumeType]
  );
  const labArtists = useMemo(
    () =>
      getSortedLabels(
        Array.from(new Set(catalog.nfts.map((nft) => nft.artist))),
        sortDir,
        locale
      ),
    [catalog.nfts, locale, sortDir]
  );
  const labCollections = useMemo(
    () =>
      getSortedLabels(
        Array.from(
          new Set(
            catalog.nftMetas.map((nftMeta) => nftMeta.metadata_collection)
          )
        ),
        sortDir,
        locale
      ),
    [catalog.nftMetas, locale, sortDir]
  );

  const orderedNfts = useMemo(() => {
    if (sort === MemeLabSort.ARTISTS) {
      return labArtists.flatMap((artist) =>
        sortedNfts
          .filter((nft) => nft.artist === artist)
          .sort((a, b) => a.id - b.id)
      );
    }
    if (sort === MemeLabSort.COLLECTIONS) {
      return labCollections.flatMap((collection) => {
        const collectionIds = new Set(
          catalog.nftMetas
            .filter((nftMeta) => nftMeta.metadata_collection === collection)
            .map((nftMeta) => nftMeta.id)
        );
        return sortedNfts
          .filter((nft) => collectionIds.has(nft.id))
          .sort((a, b) => a.id - b.id);
      });
    }
    return sortedNfts;
  }, [catalog.nftMetas, labArtists, labCollections, sort, sortedNfts]);
  const totalResults =
    sort === MemeLabSort.AGE ? catalog.totalResults : orderedNfts.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / MEME_LAB_PAGE_SIZE));
  const visiblePage =
    sort === MemeLabSort.AGE ? page : Math.min(page, totalPages);
  const firstResultIndex = (visiblePage - 1) * MEME_LAB_PAGE_SIZE;
  const visibleNfts = useMemo(
    () =>
      sort === MemeLabSort.AGE
        ? orderedNfts
        : orderedNfts.slice(
            firstResultIndex,
            firstResultIndex + MEME_LAB_PAGE_SIZE
          ),
    [firstResultIndex, orderedNfts, sort]
  );
  const visibleNftIds = useMemo(
    () => new Set(visibleNfts.map((nft) => nft.id)),
    [visibleNfts]
  );
  const tokenIds = useMemo(
    () => visibleNfts.map((nft) => nft.id),
    [visibleNfts]
  );

  const selectPage = (nextPage: number) => {
    resultsRef.current?.focus({ preventScroll: true });
    setPageState({ viewKey: pageViewKey, page: nextPage });
    if (typeof globalThis.scrollTo === "function") {
      globalThis.scrollTo(0, 0);
    }
  };

  let resultsStatus = "";
  if (catalog.isLoading) {
    resultsStatus = t(locale, "memeLab.loading.fetching");
  } else if (!catalog.isInitialError) {
    resultsStatus = t(locale, "common.pagination.pageOf", {
      current: formatInteger(locale, visiblePage),
      total: formatInteger(locale, totalPages),
    });
  }

  function printNft(nft: LabNFT) {
    return (
      <li key={`${nft.contract}-${nft.id}`} className="tw-min-w-0">
        <MemeLabNftCard
          nft={nft}
          sort={sort}
          nftMetas={catalog.nftMetas}
          volumeType={volumeType}
          hasConnectedProfile={isConnected}
          locale={locale}
        />
      </li>
    );
  }

  function printNfts() {
    return (
      <ul
        aria-label={t(locale, "memeLab.results.gridLabel")}
        className={COLLECTION_GRID_LIST_CLASS}
      >
        {visibleNfts.map(printNft)}
      </ul>
    );
  }

  function printArtists() {
    return labArtists.map((artist) => {
      const artistNfts = sortedNfts.filter(
        (nft) => nft.artist === artist && visibleNftIds.has(nft.id)
      );
      if (artistNfts.length === 0) {
        return null;
      }
      return (
        <section key={`${artist}-row`} className="tw-pt-6">
          <h2 className="tw-mb-4 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100">
            {artist}
          </h2>
          <ul
            aria-label={t(locale, "memeLab.results.artistGridLabel", {
              artistName: artist,
            })}
            className={GROUP_GRID_LIST_CLASS}
          >
            {[...artistNfts]
              .sort((a, b) => a.id - b.id)
              .map((nft: LabNFT) => printNft(nft))}
          </ul>
        </section>
      );
    });
  }

  function printCollections() {
    return labCollections.map((collection) => {
      const collectionNftsMetas = catalog.nftMetas.filter(
        (n) => n.metadata_collection === collection
      );
      const collectionNfts = sortedNfts.filter(
        (nft) =>
          visibleNftIds.has(nft.id) &&
          collectionNftsMetas.some((nftMeta) => nftMeta.id === nft.id)
      );
      if (collectionNfts.length === 0) {
        return null;
      }
      return (
        <section key={`${collection}-row`} className="tw-pt-6">
          <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
            <h2 className="tw-mb-0 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100">
              {collection}
            </h2>
            <Link
              className="hover:tw-text-primary-200 tw-text-sm tw-font-medium tw-text-primary-300 tw-no-underline tw-transition"
              href={getMemeLabCollectionHref({
                collectionName: collection,
                locale,
              })}
              aria-label={t(locale, "memeLab.collection.viewAriaLabel", {
                collectionName: collection,
              })}
            >
              {t(locale, "memeLab.collection.view")}
            </Link>
          </div>
          <ul
            aria-label={t(locale, "memeLab.results.collectionGridLabel", {
              collectionName: collection,
            })}
            className={GROUP_GRID_LIST_CLASS}
          >
            {[...collectionNfts]
              .sort((a, b) => a.id - b.id)
              .map((nft: LabNFT) => printNft(nft))}
          </ul>
        </section>
      );
    });
  }

  function printNftsContent() {
    if (catalog.isLoading) {
      return (
        <div className="tw-pb-5 tw-pt-4 tw-text-sm tw-text-iron-300">
          {t(locale, "memeLab.loading.fetching")} <DotLoader />
        </div>
      );
    }

    if (catalog.isInitialError) {
      return (
        <div
          role="alert"
          className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-6"
        >
          <p className="tw-mt-0 tw-text-sm tw-text-iron-300">
            {t(locale, "collect.error.catalog")}
          </p>
          <Button
            onClick={() => {
              resultsRef.current?.focus({ preventScroll: true });
              void catalog.retry();
            }}
            variant="secondary"
            loading={catalog.isRetrying}
          >
            {t(locale, "collect.retry")}
          </Button>
        </div>
      );
    }

    if (sortedNfts.length === 0) {
      return (
        <div>
          <NothingHereYetSummer />
        </div>
      );
    }

    let results;
    if (sort === MemeLabSort.ARTISTS) {
      results = printArtists();
    } else if (sort === MemeLabSort.COLLECTIONS) {
      results = printCollections();
    } else {
      results = printNfts();
    }

    return (
      <>
        {results}
        {totalResults > MEME_LAB_PAGE_SIZE && (
          <div className="tw-py-4 tw-text-center">
            <Pagination
              page={visiblePage}
              pageSize={MEME_LAB_PAGE_SIZE}
              totalResults={totalResults}
              setPage={selectPage}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <NftBalancesProvider
      consolidationKey={connectedProfile?.consolidation_key ?? null}
      contract={MEMELAB_CONTRACT}
      tokenIds={tokenIds}
      enabled={isConnected}
    >
      <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-800 tw-bg-[#0D0D0F] tw-pb-5 tw-text-white">
        <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-py-6 md:tw-px-6 md:tw-py-10 lg:tw-px-8">
          <header className="tw-pb-5">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
              <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2 sm:tw-w-auto sm:tw-justify-start">
                <div className="tw-min-w-0 min-[1200px]:tw-hidden">
                  <CollectionsDropdown activePage="memelab" variant="title" />
                </div>
                <h1 className="tw-m-0 tw-hidden tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl min-[1200px]:tw-block">
                  {t(locale, "memeLab.title")}
                </h1>
                <LFGButton contract={MEMELAB_CONTRACT} />
              </div>
            </div>
          </header>
          <MemeLabSortControls
            ariaLabel={t(locale, "memeLab.sorting.regionLabel")}
            sortDirection={sortDir}
            setSortDirection={selectSortDirection}
            currentSort={sort}
            sortOptions={getMemeLabSortOptions()}
            setSort={selectSort}
            setVolumeType={selectVolumeType}
            volumeType={volumeType}
            locale={locale}
          />
          <p role="status" className="tw-sr-only">
            {resultsStatus}
          </p>
          <section
            ref={resultsRef}
            aria-label={t(locale, "memeLab.results.gridLabel")}
            aria-busy={catalog.isLoading}
            tabIndex={-1}
            className="focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {printNftsContent()}
          </section>
        </div>
      </div>
    </NftBalancesProvider>
  );
}
