"use client";

import { AuthContext } from "@/components/auth/Auth";
import CollectionSortControls from "@/components/collection-page/CollectionSortControls";
import NFTImage from "@/components/nft-image/NFTImage";
import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import { NftBalancesProvider } from "@/components/nft-image/NftBalancesContext";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import { printVolumeTypeDropdown } from "@/components/the-memes/TheMemes";
import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import type { LabExtendedData, LabNFT } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import type { SortDirection } from "@/entities/ISort";
import { addProtocol } from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import { MemeLabSort } from "@/types/enums";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  getInitialRouterValues,
  printNftContent,
  sortChanged,
} from "./MemeLab";

const MEME_LAB_COLLECTION_SORT_OPTIONS = Object.values(MemeLabSort).filter(
  (sort) =>
    sort !== MemeLabSort.VOLUME &&
    sort !== MemeLabSort.ARTISTS &&
    sort !== MemeLabSort.COLLECTIONS
);

const COLLECTION_GRID_CLASS =
  "tw-grid tw-grid-cols-2 tw-gap-3 tw-pt-2 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-4 xl:tw-gap-5";

export default function LabCollection({
  collectionName,
}: {
  readonly collectionName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    const { initialSortDir, initialSort } = getInitialRouterValues(
      searchParams?.get("sortDir") ?? null,
      searchParams?.get("sort") ?? null
    );
    setSortDir(initialSortDir);
    setSort(initialSort);
    setVolumeType(VolumeType.HOURS_24);
  }, []);

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
      sortChanged(router, sort, sortDir, volumeType, nfts, nftMetas, setNfts);
    }
  }, [sort, sortDir, nftsLoaded]);

  function printNft(nft: LabNFT) {
    return (
      <Link
        key={`${nft.contract}-${nft.id}`}
        href={`/meme-lab/${nft.id}`}
        className="tw-group tw-block tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-border-white/20 hover:tw-bg-iron-900/50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <div className="tw-relative tw-mb-2 tw-bg-iron-900">
          <NFTImage
            nft={nft}
            animation={false}
            height={300}
            showBalance={false}
            showThumbnail={true}
          />
        </div>
        {connectedProfile !== null && (
          <div className="tw-flex tw-justify-center tw-px-4">
            <div className="tw-inline-flex tw-h-7 tw-min-w-0 tw-flex-none tw-items-center tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-transparent tw-px-3 tw-text-iron-400 [&>span]:tw-overflow-hidden [&>span]:tw-text-ellipsis [&>span]:tw-text-[0.65625rem] [&>span]:tw-font-medium [&>span]:tw-uppercase [&>span]:tw-leading-none [&>span]:tw-tracking-[0.1em]">
              <NFTImageBalance
                contract={nft.contract}
                tokenId={nft.id}
                height={300}
                inline
              />
            </div>
          </div>
        )}
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-center tw-gap-y-2 tw-px-2 tw-pb-4 tw-pt-4 tw-text-center md:tw-px-4">
          <div className="tw-w-full tw-max-w-full tw-text-center tw-text-sm tw-font-semibold tw-leading-snug tw-text-iron-100">
            #{nft.id} - {nft.name}
          </div>
          <div className="tw-min-h-5 tw-w-full tw-text-center tw-text-xs tw-leading-5 tw-text-iron-500">
            Artists: {nft.artist}
          </div>
          <div className="tw-min-h-5 tw-w-full tw-text-center tw-text-xs tw-leading-5 tw-text-iron-500">
            {printNftContent(nft, sort, nftMetas, volumeType)}
          </div>
        </div>
      </Link>
    );
  }

  function printNfts() {
    return <div className={COLLECTION_GRID_CLASS}>{nfts.map(printNft)}</div>;
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
      <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-bg-[#0A0A0B] tw-pb-5 tw-text-white">
        <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-py-6 md:tw-px-6 md:tw-py-10 lg:tw-px-8">
          <header className="tw-pb-5">
            <div className="tw-flex tw-flex-col tw-gap-3">
              <h1 className="tw-mb-0 tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl">
                Meme Lab Collections
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
          <CollectionSortControls
            ariaLabel="Meme Lab collection sorting"
            sortDirection={sortDir}
            setSortDirection={setSortDir}
            currentSort={sort}
            sortOptions={MEME_LAB_COLLECTION_SORT_OPTIONS}
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
