"use client";

import { AuthContext } from "@/components/auth/Auth";
import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import { NftBalancesProvider } from "@/components/nft-image/NftBalancesContext";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import type { LabExtendedData, LabNFT } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { getValuesForVolumeType } from "@/helpers/Helpers";
import { compareLocalized } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchAllPages } from "@/services/6529api";
import { MemeLabSort } from "@/types/enums";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import { getMemeLabCollectionHref } from "./memeLabRouteParams";
import MemeLabNftCard from "./MemeLabNftCard";
import MemeLabSortControls from "./MemeLabSortControls";

const COLLECTION_GRID_CLASS =
  "tw-grid tw-grid-cols-2 tw-gap-3 tw-pt-2 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-4 xl:tw-gap-5";
const COLLECTION_GRID_LIST_CLASS = `${COLLECTION_GRID_CLASS} tw-m-0 tw-list-none tw-px-0 tw-pb-0`;
const GROUP_GRID_LIST_CLASS =
  "tw-grid tw-grid-cols-2 tw-gap-3 tw-m-0 tw-list-none tw-p-0 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-4 xl:tw-gap-5";

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

  router.replace(`?${new URLSearchParams(newQuery).toString()}`);

  if (sort === MemeLabSort.AGE) {
    if (sortDir === SortDirection.ASC) {
      setNfts([...nfts].sort((a, b) => b.id - a.id));
    } else {
      setNfts([...nfts].sort((a, b) => a.id - b.id));
    }
  }
  if (sort === MemeLabSort.EDITION_SIZE) {
    setNfts([...nfts].sort((a, b) => a.id - b.id));
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.supply > b.supply) return 1;
          if (a.supply < b.supply) return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.supply > b.supply) return -1;
          if (a.supply < b.supply) return 1;
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.HODLERS) {
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          if (
            nftMetas.find((t1) => a.id === t1.id)!.hodlers >
            nftMetas.find((t2) => b.id === t2.id)!.hodlers
          )
            return 1;
          if (
            nftMetas.find((t1) => a.id === t1.id)!.hodlers <
            nftMetas.find((t2) => b.id === t2.id)!.hodlers
          )
            return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          if (
            nftMetas.find((t1) => a.id === t1.id)!.hodlers >
            nftMetas.find((t2) => b.id === t2.id)!.hodlers
          )
            return -1;
          if (
            nftMetas.find((t1) => a.id === t1.id)!.hodlers <
            nftMetas.find((t2) => b.id === t2.id)!.hodlers
          )
            return 1;
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.ARTISTS && labArtists && setLabArtists) {
    if (sortDir === SortDirection.ASC) {
      setLabArtists(
        [...labArtists].sort((a, b) => compareLocalized(locale, a, b))
      );
    } else {
      setLabArtists(
        [...labArtists].sort((a, b) => compareLocalized(locale, b, a))
      );
    }
  }
  if (sort === MemeLabSort.COLLECTIONS && labCollections && setLabCollections) {
    if (sortDir === SortDirection.ASC) {
      setLabCollections(
        [...labCollections].sort((a, b) => compareLocalized(locale, a, b))
      );
    } else {
      setLabCollections(
        [...labCollections].sort((a, b) => compareLocalized(locale, b, a))
      );
    }
  }
  if (sort === MemeLabSort.UNIQUE_PERCENT) {
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          if (
            nftMetas.find((t1) => a.id === t1.id)!.percent_unique >
            nftMetas.find((t2) => b.id === t2.id)!.percent_unique
          )
            return 1;
          if (
            nftMetas.find((t1) => a.id === t1.id)!.percent_unique <
            nftMetas.find((t2) => b.id === t2.id)!.percent_unique
          )
            return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          if (
            nftMetas.find((t1) => a.id === t1.id)!.percent_unique >
            nftMetas.find((t2) => b.id === t2.id)!.percent_unique
          )
            return -1;
          if (
            nftMetas.find((t1) => a.id === t1.id)!.percent_unique <
            nftMetas.find((t2) => b.id === t2.id)!.percent_unique
          )
            return 1;
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.UNIQUE_PERCENT_EX_MUSEUM) {
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          if (
            nftMetas.find((t1) => a.id === t1.id)!.percent_unique_cleaned >
            nftMetas.find((t2) => b.id === t2.id)!.percent_unique_cleaned
          )
            return 1;
          if (
            nftMetas.find((t1) => a.id === t1.id)!.percent_unique_cleaned <
            nftMetas.find((t2) => b.id === t2.id)!.percent_unique_cleaned
          )
            return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          if (
            nftMetas.find((t1) => a.id === t1.id)!.percent_unique_cleaned >
            nftMetas.find((t2) => b.id === t2.id)!.percent_unique_cleaned
          )
            return -1;
          if (
            nftMetas.find((t1) => a.id === t1.id)!.percent_unique_cleaned <
            nftMetas.find((t2) => b.id === t2.id)!.percent_unique_cleaned
          )
            return 1;
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.FLOOR_PRICE) {
    setNfts([...nfts].sort((a, b) => a.id - b.id));
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.floor_price > b.floor_price) return 1;
          if (a.floor_price < b.floor_price) return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.floor_price > b.floor_price) return -1;
          if (a.floor_price < b.floor_price) return 1;
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.MARKET_CAP) {
    setNfts([...nfts].sort((a, b) => a.id - b.id));
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.market_cap > b.market_cap) return 1;
          if (a.market_cap < b.market_cap) return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.market_cap > b.market_cap) return -1;
          if (a.market_cap < b.market_cap) return 1;
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.HIGHEST_OFFER) {
    setNfts([...nfts].sort((a, b) => a.id - b.id));
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.highest_offer > b.highest_offer) return 1;
          if (a.highest_offer < b.highest_offer) return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.highest_offer > b.highest_offer) return -1;
          if (a.highest_offer < b.highest_offer) return 1;
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.VOLUME) {
    setNfts([...nfts].sort((a, b) => a.id - b.id));
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          const aVolume = getValuesForVolumeType(volumeType, a);
          const bVolume = getValuesForVolumeType(volumeType, b);

          if (aVolume > bVolume) return 1;
          if (aVolume < bVolume) return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          const aVolume = getValuesForVolumeType(volumeType, a);
          const bVolume = getValuesForVolumeType(volumeType, b);
          if (aVolume > bVolume) return -1;
          if (aVolume < bVolume) return 1;
          return a.id - b.id;
        })
      );
    }
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

  useSetTitle(t(locale, "memeLab.documentTitle"));

  useEffect(() => {
    const { initialSortDir, initialSort: parsedInitialSort } =
      getInitialRouterValues(initialSortDirection, initialSort);
    setSortDir(initialSortDir);
    setSort(parsedInitialSort);
  }, [initialSort, initialSortDirection]);

  const [sortDir, setSortDir] = useState<SortDirection>();
  const [sort, setSort] = useState<MemeLabSort>(MemeLabSort.AGE);

  const [nfts, setNfts] = useState<LabNFT[]>([]);
  const tokenIds = useMemo(() => nfts.map((nft) => nft.id), [nfts]);
  const [nftMetas, setNftMetas] = useState<LabExtendedData[]>([]);

  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [labArtists, setLabArtists] = useState<string[]>([]);
  const [labCollections, setLabCollections] = useState<string[]>([]);

  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.HOURS_24);

  useEffect(() => {
    const loadMemeLabData = async () => {
      try {
        const nftsUrl = `${publicEnv.API_ENDPOINT}/api/lab_extended_data`;
        const responseNftMetas = await fetchAllPages<LabExtendedData>(nftsUrl);
        setNftMetas(responseNftMetas);
        const myCollections: string[] = [];
        [...responseNftMetas].map((nftMeta) => {
          if (!myCollections.includes(nftMeta.metadata_collection)) {
            myCollections.push(nftMeta.metadata_collection);
          }
        });
        setLabCollections(myCollections.sort());
        if (responseNftMetas.length > 0) {
          const tokenIds = responseNftMetas.map((n) => n.id);
          const responseNfts = await fetchAllPages<LabNFT>(
            `${publicEnv.API_ENDPOINT}/api/nfts_memelab?id=${tokenIds.join(",")}`
          );
          setNfts(responseNfts);
        } else {
          setNfts([]);
        }
      } catch (error) {
        console.error("Failed to fetch Meme Lab collections", error);
        setNftMetas([]);
        setLabCollections([]);
        setNfts([]);
      } finally {
        setNftsLoaded(true);
      }
    };

    loadMemeLabData();
  }, []);

  useEffect(() => {
    if (nfts && nfts.length > 0) {
      const myArtists: string[] = [];
      [...nfts].map((nft) => {
        if (!myArtists.includes(nft.artist)) {
          myArtists.push(nft.artist);
        }
      });
      setLabArtists(myArtists.sort());
      setNftsLoaded(true);
    }
  }, [nfts]);

  useEffect(() => {
    if (sort && sortDir && nftsLoaded) {
      sortChanged(
        router,
        sort,
        sortDir,
        volumeType,
        nfts,
        nftMetas,
        setNfts,
        labArtists,
        labCollections,
        setLabArtists,
        setLabCollections,
        locale
      );
    }
  }, [sort, sortDir, nftsLoaded, volumeType, locale]);

  function printNft(nft: LabNFT) {
    return (
      <li key={`${nft.contract}-${nft.id}`} className="tw-min-w-0">
        <MemeLabNftCard
          nft={nft}
          sort={sort}
          nftMetas={nftMetas}
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
        {nfts.map(printNft)}
      </ul>
    );
  }

  function printArtists() {
    return labArtists.map((artist) => {
      const artistNfts = [...nfts].filter((n) => n.artist === artist);
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
      const collectionNftsMetas = [...nftMetas].filter(
        (n) => n.metadata_collection === collection
      );
      const collectionNfts = [...nfts].filter((n) =>
        collectionNftsMetas.some((a) => a.id === n.id)
      );
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
    let content;

    if (nftsLoaded) {
      if (nfts.length > 0) {
        if (sort === MemeLabSort.ARTISTS) {
          content = printArtists();
        } else if (sort === MemeLabSort.COLLECTIONS) {
          content = printCollections();
        } else {
          content = printNfts();
        }
      } else {
        content = (
          <div>
            <NothingHereYetSummer />
          </div>
        );
      }
    } else {
      content = (
        <div className="tw-pb-5 tw-pt-4 tw-text-sm tw-text-iron-300">
          {t(locale, "memeLab.loading.fetching")} <DotLoader />
        </div>
      );
    }

    return content;
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
                <h1 className="tw-mb-0 tw-hidden tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl min-[1200px]:tw-block">
                  {t(locale, "memeLab.title")}
                </h1>
                <LFGButton contract={MEMELAB_CONTRACT} />
              </div>
            </div>
          </header>
          <MemeLabSortControls
            ariaLabel={t(locale, "memeLab.sorting.regionLabel")}
            sortDirection={sortDir}
            setSortDirection={setSortDir}
            currentSort={sort}
            sortOptions={getMemeLabSortOptions()}
            setSort={setSort}
            setVolumeType={setVolumeType}
            volumeType={volumeType}
            locale={locale}
          />
          {printNftsContent()}
        </div>
      </div>
    </NftBalancesProvider>
  );
}
