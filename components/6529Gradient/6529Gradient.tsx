"use client";

import Address from "@/components/address/Address";
import { useAuth } from "@/components/auth/Auth";
import CollectionSortControls from "@/components/collection-page/CollectionSortControls";
import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import NFTImage from "@/components/nft-image/NFTImage";
import { publicEnv } from "@/config/env";
import { GRADIENT_CONTRACT } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import type { NFT } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { areEqualAddresses, numberWithCommas } from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import YouOwnNftBadge from "../you-own-nft-badge/YouOwnNftBadge";

enum Sort {
  ID = "id",
  TDH = "tdh",
}

const GRADIENT_SORT_OPTIONS = [Sort.ID, Sort.TDH] as const;
const GRADIENT_SORT_LABELS: Record<Sort, string> = {
  [Sort.ID]: "ID",
  [Sort.TDH]: "TDH",
};

interface GradientNFT extends NFT {
  owner: `0x${string}`;
  owner_display: string;
  tdh_rank: number;
}

export default function GradientsComponent() {
  useSetTitle("6529 Gradient | Collections");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { connectedProfile } = useAuth();
  const wallets = connectedProfile?.wallets?.map((w) => w.wallet) ?? [];

  const [nftsRaw, setNftsRaw] = useState<GradientNFT[]>([]);
  const [nfts, setNfts] = useState<GradientNFT[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<Sort>(Sort.ID);

  useEffect(() => {
    const rawSort = searchParams.get("sort")?.toLowerCase() as Sort | undefined;
    const nextSort = rawSort === Sort.TDH ? Sort.TDH : Sort.ID;

    const rawSortDir = searchParams.get("sort_dir")?.toUpperCase() as
      | SortDirection
      | undefined;
    const nextSortDir =
      rawSortDir === SortDirection.DESC
        ? SortDirection.DESC
        : SortDirection.ASC;

    setSort((current) => (current === nextSort ? current : nextSort));
    setSortDir((current) => (current === nextSortDir ? current : nextSortDir));
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    const url = `${publicEnv.API_ENDPOINT}/api/nfts/gradients?page_size=101`;
    fetchAllPages<GradientNFT>(url)
      .then((raw) => {
        if (!isMounted) {
          return;
        }
        setNftsRaw(raw);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setNftsRaw([]);
      })
      .finally(() => {
        if (isMounted) {
          setNftsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("sort", sort.toLowerCase());
    params.set("sort_dir", sortDir.toLowerCase());

    router.replace(`/6529-gradient?${params.toString()}`, {
      scroll: false,
    });
  }, [router, sort, sortDir]);

  useEffect(() => {
    if (!nftsLoaded) return;

    const sorted = [...nftsRaw];

    if (sort === Sort.ID) {
      sorted.sort((a, b) =>
        sortDir === SortDirection.ASC ? a.id - b.id : b.id - a.id
      );
    } else if (sort === Sort.TDH) {
      sorted.sort((a, b) =>
        sortDir === SortDirection.ASC
          ? b.boosted_tdh - a.boosted_tdh
          : a.boosted_tdh - b.boosted_tdh
      );
    }

    setNfts(sorted);
  }, [nftsLoaded, nftsRaw, sort, sortDir]);

  function printNft(nft: GradientNFT) {
    const owner = nft.owner;
    const ownsNft =
      owner !== undefined &&
      owner !== null &&
      wallets.some((wallet) => areEqualAddresses(wallet, owner));

    return (
      <Link
        key={`${nft.contract}-${nft.id}`}
        href={`/6529-gradient/${nft.id}`}
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
          <div className="tw-mt-2 tw-flex tw-w-full tw-min-w-0 tw-items-center tw-justify-center tw-gap-2 tw-text-center tw-text-xs tw-leading-5 tw-text-iron-500">
            {owner !== undefined && owner !== null && owner.length > 0 && (
              <Address
                wallets={[owner]}
                display={nft.owner_display}
                hideCopy={true}
                disableLink={true}
              />
            )}
            {ownsNft && <YouOwnNftBadge />}
          </div>
          <div className="tw-mt-2 tw-min-h-5 tw-w-full tw-text-center tw-text-xs tw-leading-5">
            <span className="tw-text-iron-500">TDH: </span>
            <span className="tw-font-semibold tw-text-iron-200">
              {numberWithCommas(Math.round(nft.boosted_tdh))}
            </span>
            <span className="tw-text-iron-600"> | </span>
            <span className="tw-text-iron-500">Rank: </span>
            <span className="tw-font-semibold tw-text-iron-200">
              {nft.tdh_rank}/{nfts.length}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  function printNfts() {
    return (
      <div className="tw-grid tw-grid-cols-2 tw-gap-3 tw-pt-2 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-4 xl:tw-gap-5">
        {nfts.map((nft) => printNft(nft))}
      </div>
    );
  }

  return (
    <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-800 tw-bg-[#0D0D0F] tw-pb-5 tw-text-white">
      <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-py-6 md:tw-px-6 md:tw-py-10 lg:tw-px-8">
        <header className="tw-pb-5">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
            <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2 sm:tw-w-auto sm:tw-justify-start">
              <div className="tw-min-w-0 min-[1200px]:tw-hidden">
                <CollectionsDropdown activePage="gradient" variant="title" />
              </div>
              <h1 className="tw-mb-0 tw-hidden tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl min-[1200px]:tw-block">
                6529 Gradient
              </h1>
              <LFGButton contract={GRADIENT_CONTRACT} />
            </div>
          </div>
        </header>
        <CollectionSortControls
          ariaLabel="Gradient sorting"
          sortDirection={sortDir}
          setSortDirection={setSortDir}
          currentSort={sort}
          sortOptions={GRADIENT_SORT_OPTIONS}
          setSort={setSort}
          getSortLabel={(sortOption) => GRADIENT_SORT_LABELS[sortOption]}
        />
        {nftsLoaded ? (
          printNfts()
        ) : (
          <div className="tw-pb-5 tw-pt-4 tw-text-sm tw-text-iron-300">
            Fetching <DotLoader />
          </div>
        )}
      </div>
    </div>
  );
}
