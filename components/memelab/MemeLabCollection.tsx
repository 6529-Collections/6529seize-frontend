"use client";

import { AuthContext } from "@/components/auth/Auth";
import { NftBalancesProvider } from "@/components/nft-image/NftBalancesContext";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import type { LabExtendedData, LabNFT } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import type { SortDirection } from "@/entities/ISort";
import { addProtocol } from "@/helpers/Helpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchAllPages } from "@/services/6529api";
import { MemeLabSort } from "@/types/enums";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import { getInitialRouterValues, sortChanged } from "./MemeLab";
import MemeLabNftCard from "./MemeLabNftCard";
import MemeLabSortControls from "./MemeLabSortControls";

const MEME_LAB_COLLECTION_SORT_OPTIONS = Object.values(MemeLabSort).filter(
  (sort) =>
    sort !== MemeLabSort.VOLUME &&
    sort !== MemeLabSort.ARTISTS &&
    sort !== MemeLabSort.COLLECTIONS
);

const COLLECTION_GRID_CLASS =
  "tw-grid tw-grid-cols-2 tw-gap-3 tw-pt-2 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-4 xl:tw-gap-5";
const COLLECTION_GRID_LIST_CLASS = `${COLLECTION_GRID_CLASS} tw-m-0 tw-list-none tw-px-0 tw-pb-0`;

export default function LabCollection({
  collectionName,
  initialSort = null,
  initialSortDirection = null,
  locale = DEFAULT_LOCALE,
}: {
  readonly collectionName: string;
  readonly initialSort?: string | null | undefined;
  readonly initialSortDirection?: string | null | undefined;
  readonly locale?: SupportedLocale | undefined;
}) {
  const router = useRouter();
  const { connectedProfile } = useContext(AuthContext);

  const [website, setWebsite] = useState<string>();

  const [nfts, setNfts] = useState<LabNFT[]>([]);
  const tokenIds = useMemo(() => nfts.map((nft) => nft.id), [nfts]);
  const [nftMetas, setNftMetas] = useState<LabExtendedData[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);

  const [sortDir, setSortDir] = useState<SortDirection>();
  const [sort, setSort] = useState<MemeLabSort>(MemeLabSort.AGE);
  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.HOURS_24);

  useEffect(() => {
    const { initialSortDir, initialSort: parsedInitialSort } =
      getInitialRouterValues(initialSortDirection, initialSort);
    setSortDir(initialSortDir);
    setSort(parsedInitialSort);
    setVolumeType(VolumeType.HOURS_24);
  }, [initialSort, initialSortDirection]);

  useEffect(() => {
    if (collectionName) {
      const nftsUrl = `${
        publicEnv.API_ENDPOINT
      }/api/lab_extended_data?collection=${encodeURIComponent(collectionName)}`;
      fetchAllPages<LabExtendedData>(nftsUrl).then((responseNftMetas) => {
        setNftMetas(responseNftMetas);
        if (responseNftMetas.length > 0) {
          const collectionTokenIds = responseNftMetas.map(
            (n: LabExtendedData) => n.id
          );
          fetchAllPages<LabNFT>(
            `${publicEnv.API_ENDPOINT}/api/nfts_memelab?id=${collectionTokenIds.join(
              ","
            )}`
          ).then((responseNfts) => {
            setNfts(responseNfts);
            setNftsLoaded(true);
          });
          let collectionSecondaryLink = "";
          responseNftMetas.map((nftm) => {
            if (
              nftm.website &&
              !collectionSecondaryLink.includes(nftm.website)
            ) {
              collectionSecondaryLink += nftm.website;
            }
          });
          setWebsite(collectionSecondaryLink);
        } else {
          setNfts([]);
          setNftsLoaded(true);
        }
      });
    }
  }, [collectionName]);

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
        undefined,
        undefined,
        undefined,
        undefined,
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
          hasConnectedProfile={connectedProfile !== null}
          locale={locale}
          showArtistMetric={true}
        />
      </li>
    );
  }

  function printNfts() {
    return (
      <ul
        aria-label={t(locale, "memeLab.results.collectionGridLabel", {
          collectionName,
        })}
        className={COLLECTION_GRID_LIST_CLASS}
      >
        {nfts.map(printNft)}
      </ul>
    );
  }

  function printNftsContent() {
    if (!nftsLoaded) {
      return null;
    }

    if (nfts.length === 0) {
      return (
        <div>
          <NothingHereYetSummer />
        </div>
      );
    }

    return printNfts();
  }

  return (
    <NftBalancesProvider
      consolidationKey={connectedProfile?.consolidation_key ?? null}
      contract={MEMELAB_CONTRACT}
      tokenIds={tokenIds}
      enabled={!!connectedProfile}
    >
      <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-bg-[#0D0D0F] tw-pb-5 tw-text-white">
        <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-py-6 md:tw-px-6 md:tw-py-10 lg:tw-px-8">
          <header className="tw-pb-5">
            <div className="tw-flex tw-flex-col tw-gap-3">
              <h1 className="tw-mb-0 tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl">
                {t(locale, "memeLab.collections.title")}
              </h1>
              <h2 className="tw-mb-0 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100">
                {collectionName}
              </h2>
              {website !== undefined && website.length > 0 && (
                <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-2">
                  {website
                    .split(" ")
                    .filter((w) => w.length > 0)
                    .map((w) => (
                      <a
                        key={w}
                        href={addProtocol(w)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:tw-text-primary-200 tw-text-sm tw-font-medium tw-text-primary-300 tw-no-underline tw-transition"
                      >
                        {w}
                      </a>
                    ))}
                </div>
              )}
            </div>
          </header>
          <MemeLabSortControls
            ariaLabel={t(locale, "memeLab.sorting.collectionRegionLabel")}
            sortDirection={sortDir}
            setSortDirection={setSortDir}
            currentSort={sort}
            sortOptions={MEME_LAB_COLLECTION_SORT_OPTIONS}
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
