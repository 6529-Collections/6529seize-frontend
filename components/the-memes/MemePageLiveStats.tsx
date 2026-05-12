"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { numberWithCommas, printMintDate } from "@/helpers/Helpers";
import { getFileMimeTypeFromMetadata } from "@/helpers/nft.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { faFire, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import type { ReactNode } from "react";
import ArtistProfileHandle from "./ArtistProfileHandle";

const sectionHeadingClassName =
  "tw-mb-2 tw-text-lg tw-font-bold tw-leading-6 tw-text-white";

export function MemeCollectorsStats({
  nftMeta,
}: {
  readonly nftMeta: MemesExtendedData;
}) {
  const editionSizeExMuseumLabel =
    nftMeta.burnt > 0 ? "ex. burnt and 6529 museum" : "ex. 6529 museum";
  const percentUniqueExMuseumLabel =
    nftMeta.burnt > 0
      ? "% Unique ex. burnt and 6529 museum"
      : "% Unique ex. 6529 museum";

  return (
    <section className="tw-flex tw-flex-wrap tw-gap-x-14 tw-gap-y-10 tw-pt-10">
      <CollectorStatGroup
        title="Edition size"
        value={numberWithCommas(nftMeta.edition_size)}
        rank={nftMeta.edition_size_rank}
        total={nftMeta.collection_size}
      >
        {nftMeta.burnt > 0 && (
          <>
            <CollectorDetailStat
              label="burnt"
              value={numberWithCommas(nftMeta.burnt)}
              icon={
                <FontAwesomeIcon
                  icon={faFire}
                  className="tw-h-4 tw-w-4 tw-text-[#c51d34]"
                />
              }
            />
            <CollectorDetailStat
              label="ex. burnt"
              value={numberWithCommas(nftMeta.edition_size_not_burnt)}
              rank={nftMeta.edition_size_not_burnt_rank}
              total={nftMeta.collection_size}
            />
          </>
        )}
        <CollectorDetailStat
          label={editionSizeExMuseumLabel}
          value={numberWithCommas(nftMeta.edition_size_cleaned)}
          rank={nftMeta.edition_size_cleaned_rank}
          total={nftMeta.collection_size}
        />
      </CollectorStatGroup>

      <CollectorStatGroup
        title="Collectors"
        value={numberWithCommas(nftMeta.hodlers)}
        rank={nftMeta.hodlers_rank}
        total={nftMeta.collection_size}
      >
        <CollectorDetailStat
          label="6529 museum"
          value={numberWithCommas(nftMeta.museum_holdings)}
          rank={nftMeta.museum_holdings_rank}
          total={nftMeta.collection_size}
        />
        <CollectorDetailStat
          label="% Unique"
          value={formatPercent(nftMeta.percent_unique)}
          rank={nftMeta.percent_unique_rank}
          total={nftMeta.collection_size}
          infoTitle="Percentage of cards held by unique collectors."
        />
        {nftMeta.burnt > 0 && (
          <CollectorDetailStat
            label="% Unique ex. burnt"
            value={formatPercent(nftMeta.percent_unique_not_burnt)}
            rank={nftMeta.percent_unique_not_burnt_rank}
            total={nftMeta.collection_size}
          />
        )}
        <CollectorDetailStat
          label={percentUniqueExMuseumLabel}
          value={formatPercent(nftMeta.percent_unique_cleaned)}
          rank={nftMeta.percent_unique_cleaned_rank}
          total={nftMeta.collection_size}
        />
      </CollectorStatGroup>
    </section>
  );
}

function CollectorStatGroup({
  title,
  value,
  rank,
  total,
  className = "",
  children,
}: {
  readonly title: string;
  readonly value: string;
  readonly rank: number;
  readonly total: number;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}) {
  return (
    <div className={`tw-min-w-[17rem] tw-flex-1 ${className}`}>
      <h3 className="tw-mb-4 tw-text-lg tw-font-semibold tw-text-iron-100">
        {title}
      </h3>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
        <span className="tw-text-xl tw-font-semibold tw-leading-none tw-text-white">
          {value}
        </span>
        <CollectorRankBadge rank={rank} total={total} />
      </div>
      <div className="tw-ml-1.5 tw-mt-6 tw-space-y-3 tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-800 tw-pl-5">
        {children}
      </div>
    </div>
  );
}

function CollectorDetailStat({
  label,
  value,
  rank,
  total,
  icon,
  infoTitle,
}: {
  readonly label: string;
  readonly value: string;
  readonly rank?: number | undefined;
  readonly total?: number | undefined;
  readonly icon?: ReactNode;
  readonly infoTitle?: string | undefined;
}) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1.5">
      <span className="tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-500">
        {label}
      </span>
      {icon}
      <span className="tw-text-xl tw-font-semibold tw-leading-none tw-text-white">
        {value}
      </span>
      {rank !== undefined && total !== undefined && (
        <CollectorRankBadge rank={rank} total={total} />
      )}
      {infoTitle && (
        <span title={infoTitle} aria-label={infoTitle} role="img">
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="tw-h-3.5 tw-w-3.5 tw-text-iron-400"
          />
        </span>
      )}
    </div>
  );
}

function CollectorRankBadge({
  rank,
  total,
}: {
  readonly rank: number;
  readonly total: number;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-leading-none tw-text-iron-400">
      Rank {numberWithCommas(rank)}/{numberWithCommas(total)}
    </span>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100 * 10) / 10}%`;
}

export function MemeArtworkDetails({ nft }: { readonly nft: NFT }) {
  const mintDate = getMintDateParts(printMintDate(nft.mint_date));

  return (
    <section className="tw-py-4">
      <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <div>
          <div className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
            Created by
          </div>
          <div className="tw-flex tw-items-center tw-gap-2.5">
            <span className="tw-flex tw-h-7 tw-w-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-[10px] tw-font-semibold tw-text-iron-400">
              {getInitials(nft.artist_seize_handle)}
            </span>
            <div>
              {/* <div className="tw-text-xl tw-font-semibold tw-leading-none tw-text-white">
                {nft.artist}
              </div> */}
              <div className="tw-text-lg tw-font-semibold tw-leading-none tw-text-white [&_a]:tw-text-white [&_a]:tw-no-underline hover:[&_a]:tw-text-iron-300">
                <ArtistProfileHandle nft={nft} />
              </div>
              {/* <div className="tw-mt-1.5 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-500 [&_a]:tw-text-iron-400 [&_a]:tw-no-underline hover:[&_a]:tw-text-white">
                <ArtistProfileHandle nft={nft} />
              </div> */}
            </div>
          </div>
        </div>
        <div className="sm:tw-text-right">
          <div className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
            Mint date
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-baseline sm:tw-justify-end">
            <span className="tw-text-lg tw-font-semibold tw-leading-none tw-text-white">
              {mintDate.date}
            </span>
            {mintDate.relative && (
              <span className="tw-ml-1.5 tw-text-xs tw-font-medium tw-leading-none tw-text-iron-600">
                {mintDate.relative}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function getMintDateParts(value: string) {
  const normalizedValue = value.replace(/\s+/g, " ").trim();
  const match = normalizedValue.match(/^(.*?)\s*(\(.+\))$/);

  if (!match) {
    return { date: normalizedValue };
  }

  return { date: match[1], relative: match[2] };
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

export function MemeDistributionPlanLink({ nft }: { readonly nft: NFT }) {
  const distributionPlanLink = getDistributionPlanLink(nft);

  return (
    <section className="tw-pt-3">
      <Link
        href={distributionPlanLink}
        target={nft.has_distribution ? "_self" : "_blank"}
        rel={nft.has_distribution ? undefined : "noopener noreferrer"}
        className="tw-text-white tw-underline hover:tw-text-iron-300"
      >
        Distribution Plan
      </Link>
    </section>
  );
}

export function MemeCardFileType({ nft }: { readonly nft: NFT }) {
  const metadata = nft.metadata as unknown;
  const fileMimeType = getFileMimeTypeFromMetadata(
    typeof metadata === "string" ||
      (metadata !== null && typeof metadata === "object")
      ? (metadata as Parameters<typeof getFileMimeTypeFromMetadata>[0])
      : undefined
  );

  if (!fileMimeType) {
    return null;
  }

  return (
    <section className="tw-pb-4">
      <div className="tw-flex tw-items-center tw-gap-3 tw-text-sm tw-text-iron-300">
        <MediaTypeBadge
          mimeType={fileMimeType}
          size="sm"
          showTooltip={false}
          showLabel={true}
          tone="color"
          labelClassName="tw-text-inherit tw-font-medium"
        />
      </div>
    </section>
  );
}

export function MemeMarketplaceLinks({ nft }: { readonly nft: NFT }) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const showMarketplaceLinks = !capacitor.isIos || country === "US";

  if (!showMarketplaceLinks) {
    return null;
  }

  return (
    <div className="tw-flex tw-items-end">
      <NFTMarketplaceLinks contract={nft.contract} id={nft.id} />
    </div>
  );
}

export function MemeNftLivePanel({
  nft,
  nftBalance,
}: {
  readonly nft: NFT;
  readonly nftBalance: number;
}) {
  return (
    <section className="tw-pt-5">
      <h3 className="tw-mb-5 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
        Market Overview
      </h3>
      <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-5 sm:tw-grid-cols-2">
        <MarketMetric
          label="Mint price"
          value={nft.mint_price}
          decimals={100000}
          unit="ETH"
        />
        <MarketMetric
          label="Floor price"
          value={nft.floor_price}
          unit="ETH"
          highlight={true}
        />
        <MarketMetric
          label="Market cap"
          value={nft.market_cap}
          decimals={100}
          unit="ETH"
        />
        <MarketMetric label="TDH rate" value={nft.hodl_rate} decimals={100} />
        <MarketMetric
          label="Highest offer"
          value={nft.highest_offer}
          unit="ETH"
        />
        <MemeMarketplaceLinks nft={nft} />
      </div>
      {nftBalance > 0 && (
        <h3 className={`${sectionHeadingClassName} tw-pt-4`}>
          You Own {nftBalance} edition{nftBalance > 1 && "s"}
        </h3>
      )}
    </section>
  );
}

function MarketMetric({
  label,
  value,
  decimals = 1000,
  unit,
  highlight = false,
}: {
  readonly label: string;
  readonly value: number;
  readonly decimals?: number | undefined;
  readonly unit?: string | undefined;
  readonly highlight?: boolean | undefined;
}) {
  const formattedValue =
    value > 0
      ? numberWithCommas(Math.round(value * decimals) / decimals)
      : "N/A";

  return (
    <div>
      <div
        className={`tw-mb-1.5 tw-text-xs tw-font-semibold tw-leading-4 ${
          highlight ? "tw-text-primary-400" : "tw-text-iron-500"
        }`}
      >
        {label}
      </div>
      <div className="tw-flex tw-items-baseline">
        <span className="tw-text-xl tw-font-semibold tw-leading-none tw-text-white">
          {formattedValue}
        </span>
        {unit && formattedValue !== "N/A" && (
          <span className="tw-ml-1.5 tw-text-sm tw-font-medium tw-leading-none tw-text-iron-500">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function getDistributionPlanLink(nft: NFT) {
  if (nft.has_distribution) {
    return `/the-memes/${nft.id}/distribution`;
  }
  if (nft.id > 3) {
    return `https://github.com/6529-Collections/thememecards/tree/main/card${nft.id}`;
  }
  return "https://github.com/6529-Collections/thememecards/tree/main/card1-3";
}
