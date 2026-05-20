"use client";

import { AuthContext } from "@/components/auth/Auth";
import CollectionSortControls from "@/components/collection-page/CollectionSortControls";
import CollectionCardMetadataRow from "@/components/collection-page/CollectionCardMetadataRow";
import CollectionCardMetricLine from "@/components/collection-page/CollectionCardMetricLine";
import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import NFTImage from "@/components/nft-image/NFTImage";
import { NftBalancesProvider } from "@/components/nft-image/NftBalancesContext";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import {
  SortButton,
  printVolumeTypeDropdown,
} from "@/components/the-memes/TheMemes";
import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import type { LabExtendedData, LabNFT } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import {
  getValuesForVolumeType,
  numberWithCommas,
  printMintDate,
} from "@/helpers/Helpers";
import { getNftMimeType } from "@/helpers/nft.helpers";
import { fetchAllPages } from "@/services/6529api";
import { MemeLabSort } from "@/types/enums";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";

const COLLECTION_GRID_CLASS =
  "tw-grid tw-grid-cols-2 tw-gap-3 tw-pt-2 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-4 xl:tw-gap-5";

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

export function printSortButtons(
  sort: MemeLabSort,
  volumeType: VolumeType,
  setSort: (sort: MemeLabSort) => void,
  setVolumeType: (volumeType: VolumeType) => void,
  isCollection?: boolean
) {
  const enumValues = getMemeLabSortOptions(isCollection);

  return (
    <>
      {enumValues.map((v) => (
        <SortButton
          key={v}
          currentSort={sort}
          sort={v}
          select={() => setSort(v)}
        />
      ))}
      {printVolumeTypeDropdown(
        sort === MemeLabSort.VOLUME,
        setVolumeType,
        () => setSort(MemeLabSort.VOLUME),
        volumeType
      )}
    </>
  );
}

export function printNftContent(
  nft: LabNFT,
  sort: MemeLabSort,
  nftMetas: LabExtendedData[],
  volumeType: VolumeType
) {
  const nftMeta = nftMetas.find((nftm) => nftm.id === nft.id);

  switch (sort) {
    case MemeLabSort.AGE:
    case MemeLabSort.ARTISTS:
      return printMintDate(nft.mint_date);
    case MemeLabSort.COLLECTIONS:
      return `Artists: ${nft.artist}`;
    case MemeLabSort.EDITION_SIZE:
      return `Edition Size: ${numberWithCommas(nft.supply)}`;
    case MemeLabSort.HODLERS:
      return `Collectors: ${numberWithCommas(nftMeta!.hodlers)}`;
    case MemeLabSort.UNIQUE_PERCENT:
      return `Unique: ${Math.round(nftMeta?.percent_unique! * 100 * 10) / 10}%`;
    case MemeLabSort.UNIQUE_PERCENT_EX_MUSEUM:
      return `Unique Ex-Museum: ${
        Math.round(nftMeta?.percent_unique_cleaned! * 100 * 10) / 10
      }%`;
    case MemeLabSort.FLOOR_PRICE:
      return nft.floor_price > 0
        ? `Floor Price: ${numberWithCommas(
            Math.round(nft.floor_price * 100) / 100
          )} ETH`
        : "Floor Price: N/A";
    case MemeLabSort.MARKET_CAP:
      return nft.market_cap > 0
        ? `Market Cap: ${numberWithCommas(
            Math.round(nft.market_cap * 100) / 100
          )} ETH`
        : "Market Cap: N/A";
    case MemeLabSort.HIGHEST_OFFER:
      return nft.highest_offer > 0
        ? `Highest Offer: ${numberWithCommas(
            Math.round(nft.highest_offer * 1000) / 1000
          )} ETH`
        : "Highest Offer: N/A";
    case MemeLabSort.VOLUME:
      return `Volume (${volumeType}): ${numberWithCommas(
        Math.round(
          (volumeType === VolumeType.HOURS_24
            ? nft.total_volume_last_24_hours
            : volumeType === VolumeType.DAYS_7
              ? nft.total_volume_last_7_days
              : volumeType === VolumeType.DAYS_30
                ? nft.total_volume_last_1_month
                : nft.total_volume) * 100
        ) / 100
      )} ETH`;
  }

  return "";
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
  setLabCollections?: (collections: string[]) => void
) {
  const sortKey =
    Object.keys(MemeLabSort)
      .find((k) => MemeLabSort[k as keyof typeof MemeLabSort] === sort)
      ?.toLowerCase() ?? "";
  const newQuery: any = {
    sort: sortKey,
    sort_dir: sortDir.toLowerCase(),
  };

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
      setLabArtists([...labArtists].sort());
    } else {
      setLabArtists([...labArtists].reverse());
    }
  }
  if (sort === MemeLabSort.COLLECTIONS && labCollections && setLabCollections) {
    if (sortDir === SortDirection.ASC) {
      setLabCollections([...labCollections].sort());
    } else {
      setLabCollections([...labCollections].reverse());
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

export default function MemeLabComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connectedProfile } = useContext(AuthContext);
  const isConnected = !!connectedProfile;

  useSetTitle("Meme Lab | Collections");

  useEffect(() => {
    const { initialSortDir, initialSort } = getInitialRouterValues(
      searchParams?.get("sort_dir") ?? null,
      searchParams?.get("sort") ?? null
    );
    setSortDir(initialSortDir);
    setSort(initialSort);
  }, []);

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
        setLabCollections
      );
    }
  }, [sort, sortDir, nftsLoaded, volumeType]);

  function printNft(nft: LabNFT) {
    const mediaMimeType = getNftMimeType(nft);

    return (
      <Link
        key={`${nft.contract}-${nft.id}`}
        href={`/meme-lab/${nft.id}`}
        className="tw-group tw-block tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-border-white/20 hover:tw-bg-iron-900/50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <div className="tw-bg-iron-900">
          <NFTImage
            nft={nft}
            animation={false}
            height={300}
            showBalance={false}
            showThumbnail={true}
          />
        </div>
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-center tw-px-2 tw-pb-4 tw-pt-4 tw-text-center md:tw-px-4">
          <div className="tw-w-full tw-max-w-full tw-text-center tw-text-md tw-font-semibold tw-leading-snug tw-text-iron-50">
            {nft.name}
          </div>
          <CollectionCardMetadataRow
            tokenId={nft.id}
            mediaMimeType={mediaMimeType}
            mediaBadgeId={`${nft.contract}-${nft.id}`}
            align="center"
            ownership={{
              contract: nft.contract,
              tokenId: nft.id,
              show: isConnected,
            }}
          />
          <CollectionCardMetricLine
            text={printNftContent(nft, sort, nftMetas, volumeType)}
            align="center"
          />
        </div>
      </Link>
    );
  }

  function printNfts() {
    return <div className={COLLECTION_GRID_CLASS}>{nfts.map(printNft)}</div>;
  }

  function printArtists() {
    return labArtists.map((artist) => {
      const artistNfts = [...nfts].filter((n) => n.artist === artist);
      return (
        <section key={`${artist}-row`} className="tw-pt-6">
          <h2 className="tw-mb-4 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100">
            {artist}
          </h2>
          <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-4 xl:tw-gap-5">
            {[...artistNfts]
              .sort((a, b) => a.id - b.id)
              .map((nft: LabNFT) => printNft(nft))}
          </div>
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
              href={`/meme-lab/collection/${encodeURIComponent(
                collection.replace(" ", "-")
              )}`}
            >
              view
            </Link>
          </div>
          <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-4 xl:tw-gap-5">
            {[...collectionNfts]
              .sort((a, b) => a.id - b.id)
              .map((nft: LabNFT) => printNft(nft))}
          </div>
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
          Fetching <DotLoader />
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
      <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-800 tw-bg-[#0A0A0B] tw-pb-5 tw-text-white">
        <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-py-6 md:tw-px-6 md:tw-py-10 lg:tw-px-8">
          <header className="tw-pb-5">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
              <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2 sm:tw-w-auto sm:tw-justify-start">
                <div className="tw-min-w-0 min-[1200px]:tw-hidden">
                  <CollectionsDropdown activePage="memelab" variant="title" />
                </div>
                <h1 className="tw-mb-0 tw-hidden tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl min-[1200px]:tw-block">
                  Meme Lab
                </h1>
                <LFGButton contract={MEMELAB_CONTRACT} />
              </div>
            </div>
          </header>
          <CollectionSortControls
            ariaLabel="Meme Lab sorting"
            sortDirection={sortDir}
            setSortDirection={setSortDir}
            currentSort={sort}
            sortOptions={getMemeLabSortOptions()}
            setSort={setSort}
          >
            {printVolumeTypeDropdown(
              sort === MemeLabSort.VOLUME,
              setVolumeType,
              () => setSort(MemeLabSort.VOLUME),
              volumeType
            )}
          </CollectionSortControls>
          {printNftsContent()}
        </div>
      </div>
    </NftBalancesProvider>
  );
}
