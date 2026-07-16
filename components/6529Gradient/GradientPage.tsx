"use client";

import Address from "@/components/address/Address";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import NftNavigation from "@/components/nft-navigation/NftNavigation";
import { TransferSingleActions } from "@/components/nft-transfer/TransferSingle";
import ArtistProfileHandle from "@/components/the-memes/ArtistProfileHandle";
import { MemePageArtViewer } from "@/components/the-memes/MemePageArtViewer";
import {
  MemePageNavigationSkeleton,
  MemePageSkeleton,
  MemePageTitleSkeleton,
} from "@/components/the-memes/MemePageSkeleton";
import YouOwnNftBadge from "@/components/you-own-nft-badge/YouOwnNftBadge";
import { publicEnv } from "@/config/env";
import { GRADIENT_CONTRACT } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT } from "@/entities/INFT";
import { CollectedCollectionType } from "@/entities/IProfile";
import type { Transaction } from "@/entities/ITransaction";
import {
  areEqualAddresses,
  numberWithCommas,
  printMintDate,
} from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useIdentity } from "@/hooks/useIdentity";
import { fetchUrl } from "@/services/6529api";
import { ContractType } from "@/types/enums";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

interface NftWithOwner extends NFT {
  owner: string;
  owner_display: string;
}

type GradientNftsResponse = Omit<DBResponse<NftWithOwner>, "next"> & {
  readonly next: string | null | undefined;
};

type TransactionsState = {
  readonly nftId: string;
  readonly data: Transaction[];
};

const GRADIENT_COLLECTION_START_INDEX = 0;
const GRADIENT_COLLECTION_END_INDEX = 100;

function formatGradientNumber(value: number, decimals = 100) {
  return numberWithCommas(Math.round(value * decimals) / decimals);
}

function formatGradientMarketValue(value: number, decimals = 1000) {
  if (value <= 0) {
    return "N/A";
  }

  return numberWithCommas(Math.round(value * decimals) / decimals);
}

function GradientInfoMetric({
  label,
  children,
  valueClassName = "",
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly valueClassName?: string | undefined;
}) {
  return (
    <div className="tw-min-w-[8.5rem]">
      <div className="tw-mb-1 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400 md:tw-mb-2">
        {label}
      </div>
      <div
        className={`tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1.5 tw-text-sm tw-font-semibold tw-leading-5 tw-text-white md:tw-text-lg md:tw-leading-6 ${valueClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

function GradientMarketMetric({
  label,
  value,
  decimals,
  unit,
}: {
  readonly label: string;
  readonly value: number;
  readonly decimals?: number | undefined;
  readonly unit?: string | undefined;
}) {
  const formattedValue = formatGradientMarketValue(value, decimals);

  return (
    <GradientInfoMetric label={label}>
      {formattedValue}
      {unit && formattedValue !== "N/A" && (
        <span className="tw-ml-1.5 tw-text-sm tw-font-medium tw-leading-none tw-text-iron-400">
          {unit}
        </span>
      )}
    </GradientInfoMetric>
  );
}

function GradientMarketplaceLinks({ nft }: { readonly nft: NftWithOwner }) {
  return (
    <div className="tw-flex tw-min-w-[8.5rem] tw-items-end">
      <NFTMarketplaceLinks contract={nft.contract} id={nft.id} />
    </div>
  );
}

function GradientMetadataLink({ url }: { readonly url?: string | undefined }) {
  const metadataUrl = url?.trim() ?? "";

  if (!metadataUrl) {
    return null;
  }

  return (
    <GradientInfoMetric label="Metadata">
      <Link
        href={metadataUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-white tw-no-underline hover:tw-text-iron-300"
      >
        <span>View</span>
        <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-text-iron-400" />
      </Link>
    </GradientInfoMetric>
  );
}

function GradientOwnerMetric({
  owner,
  ownerDisplay,
  isOwner,
}: {
  readonly owner: string;
  readonly ownerDisplay: string | undefined;
  readonly isOwner: boolean;
}) {
  const identity = getIdentityLookup(ownerDisplay, owner);
  const { profile } = useIdentity({
    handleOrWallet: identity,
    initialProfile: null,
  });
  const avatarLabel = ownerDisplay ?? owner;

  return (
    <GradientInfoMetric
      label="Owner"
      valueClassName="tw-min-w-0 !tw-flex-nowrap"
    >
      <ProfileAvatar
        pfpUrl={profile?.pfp}
        size={ProfileBadgeSize.SMALL}
        alt={`${avatarLabel} avatar`}
        fallbackContent={<IdentityAvatarFallback value={avatarLabel} />}
      />
      <span className="tw-min-w-0 tw-whitespace-nowrap [&_*]:tw-whitespace-nowrap">
        <Address wallets={[owner as `0x${string}`]} display={ownerDisplay} />
      </span>
      {isOwner && <YouOwnNftBadge />}
    </GradientInfoMetric>
  );
}

function GradientArtistMetric({ nft }: { readonly nft: NftWithOwner }) {
  const artistIdentity = getFirstArtistIdentity(nft);
  const { profile } = useIdentity({
    handleOrWallet: artistIdentity,
    initialProfile: null,
  });
  const avatarLabel = artistIdentity ?? nft.artist;

  return (
    <GradientInfoMetric label="Artist">
      <ProfileAvatar
        pfpUrl={profile?.pfp}
        size={ProfileBadgeSize.SMALL}
        alt={`${avatarLabel} avatar`}
        fallbackContent={<IdentityAvatarFallback value={avatarLabel} />}
      />
      <span className="[&_a:hover]:tw-text-iron-300 [&_a]:tw-text-white">
        <ArtistProfileHandle nft={nft} />
      </span>
    </GradientInfoMetric>
  );
}

function IdentityAvatarFallback({ value }: { readonly value: string }) {
  return (
    <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-text-iron-400">
      {getInitials(value)}
    </span>
  );
}

function getIdentityLookup(
  display: string | undefined,
  wallet: string
): string {
  if (display && !display.includes(" ")) {
    return display;
  }

  return wallet;
}

function getFirstArtistIdentity(nft: NftWithOwner): string | null {
  return (
    nft.artist_seize_handle
      .split(",")
      .map((handle) => handle.trim())
      .find((handle) => handle.length > 0) ?? null
  );
}

function getInitials(value: string | undefined) {
  if (!value) {
    return "?";
  }

  return value
    .split(/[,\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function GradientDetailsPanel({
  nft,
  isOwner,
  collectionRank,
  collectionCount,
  showMarketplaceLinks,
}: {
  readonly nft: NftWithOwner;
  readonly isOwner: boolean;
  readonly collectionRank: number;
  readonly collectionCount: number;
  readonly showMarketplaceLinks: boolean;
}) {
  const hasCollectionRank = collectionRank > -1 && collectionCount > -1;

  return (
    <div className="tw-w-full">
      <section
        aria-label="Card Details"
        className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-6 md:tw-pb-8"
      >
        <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-x-4 tw-gap-y-6 sm:tw-gap-x-8">
          <GradientOwnerMetric
            owner={nft.owner}
            ownerDisplay={nft.owner_display}
            isOwner={isOwner}
          />
        </div>
        <div className="tw-mt-6 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6 sm:tw-gap-x-8 md:tw-grid-cols-3 md:tw-gap-x-10">
          <GradientArtistMetric nft={nft} />
          <GradientMetadataLink url={nft.uri} />
          <GradientInfoMetric label="Mint Date">
            {printMintDate(nft.mint_date)}
          </GradientInfoMetric>
        </div>
      </section>
      <section className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-6 md:tw-py-8">
        <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-6 sm:tw-gap-x-8 md:tw-grid-cols-3 md:tw-gap-x-10">
          <GradientInfoMetric label="TDH">
            {formatGradientNumber(nft.boosted_tdh)}
          </GradientInfoMetric>
          <GradientInfoMetric label="Unweighted TDH">
            {formatGradientNumber(nft.tdh__raw)}
          </GradientInfoMetric>
          <GradientInfoMetric label="Gradient Rank">
            {hasCollectionRank ? `${collectionRank}/${collectionCount}` : "..."}
          </GradientInfoMetric>
        </div>
      </section>
      <section className="tw-pt-6 md:tw-pt-8">
        <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-6 sm:tw-gap-x-8 md:tw-grid-cols-3 md:tw-gap-x-10">
          <GradientMarketMetric
            label="Floor Price"
            value={nft.floor_price}
            unit="ETH"
          />
          <GradientMarketMetric
            label="Market Cap"
            value={nft.market_cap}
            decimals={100}
            unit="ETH"
          />
          <GradientMarketMetric
            label="TDH Rate"
            value={nft.hodl_rate}
            decimals={100}
          />
          <GradientMarketMetric
            label="Highest Offer"
            value={nft.highest_offer}
            unit="ETH"
          />
          {showMarketplaceLinks && <GradientMarketplaceLinks nft={nft} />}
        </div>
      </section>
    </div>
  );
}

function GradientTransferWidget({ nft }: { readonly nft: NftWithOwner }) {
  const { isMobileDevice } = useDeviceInfo();

  if (isMobileDevice) {
    return null;
  }

  return (
    <div className="tw-mt-3 tw-w-full sm:tw-w-fit lg:tw-mt-4 sm:[&>div]:tw-w-auto sm:[&_button]:tw-flex-none">
      <TransferSingleActions
        collectionType={CollectedCollectionType.GRADIENTS}
        contractType={ContractType.ERC721}
        contract={GRADIENT_CONTRACT}
        tokenId={nft.id}
        max={1}
        title={nft.name || `6529 Gradient #${nft.id}`}
        thumbUrl={nft.thumbnail}
      />
    </div>
  );
}

function GradientActivitySection({
  nft,
  transactions,
}: {
  readonly nft: NftWithOwner;
  readonly transactions: Transaction[];
}) {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="gradient-card-activity-heading"
      className="tw-scroll-mt-24"
    >
      <div className="tw-mb-4 tw-flex tw-flex-col tw-items-stretch tw-justify-between tw-gap-3 md:tw-flex-row md:tw-items-center">
        <h3
          id="gradient-card-activity-heading"
          className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-200"
        >
          Card Activity
        </h3>
      </div>
      <div className="tw-overflow-x-auto tw-overflow-y-hidden tw-pb-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
        <table className="tw-w-full tw-min-w-[760px] tw-border-collapse">
          <tbody>
            {transactions.map((tr) => (
              <LatestActivityRow
                nft={nft}
                tr={tr}
                variant="tailwind"
                rowStyle="striped"
                key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function GradientPageComponent({ id }: { readonly id: string }) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { address: connectedAddress } = useSeizeConnectContext();
  const { connectedProfile } = useContext(AuthContext);

  useSetTitle(`6529 Gradient #${id}`);

  const [allNfts, setAllNfts] = useState<NftWithOwner[]>([]);
  const [transactionsState, setTransactionsState] = useState<TransactionsState>(
    {
      nftId: id,
      data: [],
    }
  );

  const rankedNFTs = useMemo(
    () => [...allNfts].sort((a, b) => (a.tdh_rank > b.tdh_rank ? 1 : -1)),
    [allNfts]
  );
  const parsedId = useMemo(() => Number.parseInt(id, 10), [id]);
  const nft = useMemo(
    () => rankedNFTs.find((rankedNft) => rankedNft.id === parsedId),
    [parsedId, rankedNFTs]
  );
  const collectionCount = allNfts.length;
  const collectionRank = useMemo(() => {
    const rankIndex = rankedNFTs.findIndex(
      (rankedNft) => rankedNft.id === parsedId
    );
    return rankIndex > -1 ? rankIndex + 1 : -1;
  }, [parsedId, rankedNFTs]);
  const isOwner = useMemo(() => {
    if (!nft) {
      return false;
    }

    return (
      connectedProfile?.wallets?.some((wallet) =>
        areEqualAddresses(wallet.wallet, nft.owner)
      ) ?? false
    );
  }, [connectedProfile, nft]);
  const isConnectedAddressOwner = useMemo(() => {
    if (!nft) {
      return false;
    }

    return areEqualAddresses(connectedAddress, nft.owner);
  }, [connectedAddress, nft]);
  const transactions =
    transactionsState.nftId === id ? transactionsState.data : [];

  const fetchNfts = useCallback(
    async function fetchNftsInner(
      url: string,
      mynfts: NftWithOwner[],
      signal?: AbortSignal
    ): Promise<void> {
      if (signal?.aborted) {
        return;
      }
      try {
        const response = await fetchUrl<GradientNftsResponse>(url, {
          ...(signal !== undefined ? { signal: signal } : {}),
        });
        const combined = [...mynfts, ...response.data];
        if (response.next) {
          await fetchNftsInner(response.next, combined, signal);
        } else {
          if (signal?.aborted) {
            return;
          }
          const uniqueById = new Map<number, NftWithOwner>();
          combined.forEach((nftItem) => uniqueById.set(nftItem.id, nftItem));
          setAllNfts(Array.from(uniqueById.values()));
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch gradient NFTs", error);
        setAllNfts([]);
      }
    },
    [setAllNfts]
  );

  useEffect(() => {
    const abortController = new AbortController();
    const initialUrlNfts = `${publicEnv.API_ENDPOINT}/api/nfts/gradients?&page_size=101`;
    fetchNfts(initialUrlNfts, [], abortController.signal);
    return () => abortController.abort();
  }, [fetchNfts]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const abortController = new AbortController();

    async function fetchTransactions() {
      try {
        const response = await fetchUrl<DBResponse<Transaction>>(
          `${publicEnv.API_ENDPOINT}/api/transactions?contract=${GRADIENT_CONTRACT}&id=${id}`,
          { signal: abortController.signal }
        );
        if (abortController.signal.aborted) {
          return;
        }
        setTransactionsState({ nftId: id, data: response.data });
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error(
          `Failed to fetch gradient transactions for id ${id}`,
          error
        );
        setTransactionsState({ nftId: id, data: [] });
      }
    }

    fetchTransactions();

    return () => abortController.abort();
  }, [id]);

  return (
    <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-800 tw-bg-[#0D0D0F] tw-pb-5 tw-text-white">
      <div className="tw-px-4 tw-py-4 md:tw-px-6 md:tw-pb-10 lg:tw-px-8">
        <header className="tw-pb-8">
          <div className="tw-flex tw-flex-col tw-gap-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2 md:tw-justify-start">
              <div className="tw-mb-0 tw-flex tw-items-center">
                <Link
                  href="/6529-gradient"
                  className="tw-group -tw-ml-2 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-px-2 tw-py-2 tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                >
                  <ArrowLeftIcon
                    aria-hidden="true"
                    className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition-transform group-hover:-tw-translate-x-0.5"
                  />
                  6529 Gradient
                </Link>
              </div>
            </div>
            {nft ? (
              <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-3 md:tw-flex-wrap md:tw-justify-start">
                <div className="tw-order-2 tw-flex tw-shrink-0 tw-justify-end md:tw-order-1">
                  <NftNavigation
                    nftId={nft.id}
                    path="/6529-gradient"
                    startIndex={GRADIENT_COLLECTION_START_INDEX}
                    endIndex={GRADIENT_COLLECTION_END_INDEX}
                  />
                </div>
                <div className="tw-order-1 tw-min-w-0 tw-flex-1 md:tw-order-2">
                  <h1 className="tw-m-0 tw-min-w-0 tw-whitespace-normal tw-break-words tw-text-lg tw-font-semibold tw-leading-tight tw-text-iron-100 sm:tw-text-2xl md:tw-truncate">
                    {nft.name}
                  </h1>
                </div>
              </div>
            ) : (
              <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-3 md:tw-flex-wrap md:tw-justify-start">
                <div className="tw-order-2 tw-flex tw-shrink-0 tw-justify-end md:tw-order-1">
                  <MemePageNavigationSkeleton />
                </div>
                <div className="tw-order-1 tw-min-w-0 tw-flex-1 md:tw-order-2">
                  <MemePageTitleSkeleton />
                </div>
              </div>
            )}
          </div>
        </header>
        {nft ? (
          <>
            <div className="tw-mb-6 tw-grid tw-grid-cols-1 tw-gap-x-10 lg:tw-grid-cols-[minmax(0,11fr)_minmax(0,9fr)] xl:tw-gap-x-16">
              <div className="tw-relative lg:tw-flex lg:tw-flex-col lg:tw-self-stretch">
                <div className="tw-flex tw-min-w-0 tw-items-center tw-pb-5 tw-pt-2 lg:tw-flex-1">
                  <MemePageArtViewer
                    key={`${nft.contract}-${nft.id}`}
                    nft={nft}
                    showBalance={false}
                  />
                </div>
                {isConnectedAddressOwner && (
                  <GradientTransferWidget nft={nft} />
                )}
              </div>
              <div className="tw-pt-6 md:tw-pt-8 lg:tw-pt-2">
                <GradientDetailsPanel
                  nft={nft}
                  isOwner={isOwner}
                  collectionRank={collectionRank}
                  collectionCount={collectionCount}
                  showMarketplaceLinks={!capacitor.isIos || country === "US"}
                />
              </div>
            </div>
            <GradientActivitySection nft={nft} transactions={transactions} />
          </>
        ) : (
          <MemePageSkeleton />
        )}
      </div>
    </div>
  );
}
