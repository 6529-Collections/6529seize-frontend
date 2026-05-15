"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { numberWithCommas, printMintDate } from "@/helpers/Helpers";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { getFileMimeTypeFromMetadata } from "@/helpers/nft.helpers";
import { useIdentity } from "@/hooks/useIdentity";
import useCapacitor from "@/hooks/useCapacitor";
import { FireIcon, UsersIcon } from "@heroicons/react/24/outline";
import {
  ArrowUpRightIcon,
  InformationCircleIcon as InformationCircleSolidIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { Tooltip } from "react-tooltip";

const UNIQUE_PERCENT_TOOLTIP =
  "Unique % represents collectors diversity. Higher percentage means more different collectors.";
const SECTION_HEADER_TITLE_CLASS =
  "tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400";
const TOP_LABEL_CLASS =
  "tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-500";
const CREATOR_NAME_CLASS =
  "tw-text-sm tw-font-semibold tw-leading-none tw-text-white tw-no-underline md:tw-text-lg";
const INLINE_METRIC_LABEL_CLASS =
  "tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-400";
const COLLECTOR_GROUP_TITLE_CLASS =
  "tw-mb-2 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-400";
const MARKET_METRIC_LABEL_BASE_CLASS =
  "tw-mb-1 md:tw-mb-2 tw-text-sm tw-font-semibold tw-leading-5";
const MARKET_METRIC_VALUE_CLASS =
  "tw-text-sm tw-font-semibold tw-leading-5 tw-text-white md:tw-text-lg md:tw-leading-6";
const COLLECTOR_METRIC_VALUE_CLASS =
  "tw-text-sm tw-font-semibold tw-leading-5 tw-text-white md:tw-text-lg md:tw-leading-6";

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
    <section className="tw-pt-10">
      <MemeStatsSectionHeader title="Meme Collectors" icon={UsersIcon} />
      <div className="tw-grid tw-grid-cols-1 tw-gap-y-10 tw-pt-6 md:tw-grid-cols-2 md:tw-gap-x-14">
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
                icon={<FireIcon className="tw-h-4 tw-w-4 tw-text-red" />}
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
            infoTitle={UNIQUE_PERCENT_TOOLTIP}
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
      </div>
    </section>
  );
}

function MemeStatsSectionHeader({
  title,
  icon,
}: {
  readonly title: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  const Icon = icon;

  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <Icon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500" />
      <h3 className={SECTION_HEADER_TITLE_CLASS}>{title}</h3>
      <div className="tw-h-px tw-min-w-10 tw-flex-grow tw-bg-gradient-to-r tw-from-iron-700 tw-to-transparent" />
    </div>
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
    <div className={`tw-min-w-0 ${className}`}>
      <h3 className={COLLECTOR_GROUP_TITLE_CLASS}>{title}</h3>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
        <span className={COLLECTOR_METRIC_VALUE_CLASS}>{value}</span>
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
  const tooltipId = infoTitle
    ? buildTooltipId("meme-collector-stat", label, infoTitle)
    : undefined;

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1.5">
      <span className={INLINE_METRIC_LABEL_CLASS}>{label}</span>
      {icon}
      <span className={COLLECTOR_METRIC_VALUE_CLASS}>{value}</span>
      {rank !== undefined && total !== undefined && (
        <CollectorRankBadge rank={rank} total={total} />
      )}
      {tooltipId && infoTitle && (
        <>
          <span
            aria-label={infoTitle}
            className="tw-inline-flex tw-cursor-help tw-items-center"
            data-tooltip-id={tooltipId}
            role="img"
          >
            <InformationCircleSolidIcon className="tw-h-3.5 tw-w-3.5 tw-text-iron-400" />
          </span>
          <Tooltip
            id={tooltipId}
            content={infoTitle}
            place="top"
            style={TOOLTIP_STYLES}
          />
        </>
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
  const artistHandles = getArtistHandles(nft.artist_seize_handle);
  const artistNames = getArtistNames(nft.artist);
  const creatorNames = artistNames.length > 0 ? artistNames : artistHandles;
  const creators =
    creatorNames.length > 0
      ? creatorNames.map((display, index) => ({
          handle: artistHandles[index] ?? null,
          display,
        }))
      : [{ handle: null, display: "not available" }];

  return (
    <section className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-6 md:tw-pb-8">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-8 tw-gap-y-6">
        <div className="tw-min-w-0">
          <div className={TOP_LABEL_CLASS}>Created by</div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-y-2">
            {creators.map((creator, index) => {
              const nextCreator = creators[index + 1];
              const hasNextCreator = nextCreator !== undefined;
              const showComma =
                hasNextCreator &&
                (creator.handle === null || nextCreator.handle === null);

              return (
                <div
                  key={`${creator.display}-${creator.handle ?? "plain"}-${index}`}
                  className={`tw-flex tw-items-center ${
                    hasNextCreator && !showComma ? "tw-mr-4" : ""
                  }`}
                >
                  {creator.handle !== null ? (
                    <CreatorProfileIdentity
                      handle={creator.handle}
                      display={creator.display}
                    />
                  ) : (
                    <span className={CREATOR_NAME_CLASS}>
                      {creator.display}
                    </span>
                  )}
                  {showComma && (
                    <span className="tw-whitespace-pre tw-text-sm tw-font-semibold tw-leading-none tw-text-iron-500 md:tw-text-lg">
                      {" , "}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="tw-min-w-fit">
          <div className={TOP_LABEL_CLASS}>Mint date</div>
          <div className="tw-flex tw-h-7 tw-flex-wrap tw-items-center sm:tw-justify-end">
            <span className="tw-text-sm tw-font-semibold tw-leading-none tw-text-white md:tw-text-lg">
              {mintDate.date}
            </span>
            {mintDate.relative && (
              <span className="tw-ml-1.5 tw-text-xs tw-font-medium tw-leading-none tw-text-iron-500">
                {mintDate.relative}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CreatorProfileIdentity({
  handle,
  display,
}: {
  readonly handle: string;
  readonly display: string;
}) {
  const { profile } = useIdentity({
    handleOrWallet: handle,
    initialProfile: null,
  });
  const avatarLabel = profile?.handle ?? handle;
  const avatarFallback = (
    <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-text-iron-400">
      {getInitials(avatarLabel)}
    </span>
  );

  return (
    <div className="tw-flex tw-items-center tw-gap-2.5">
      <ProfileAvatar
        pfpUrl={profile?.pfp}
        size={ProfileBadgeSize.SMALL}
        alt={`${avatarLabel} avatar`}
        fallbackContent={avatarFallback}
      />
      <Link
        href={`/${handle}`}
        className={`${CREATOR_NAME_CLASS} hover:tw-text-iron-300`}
      >
        {display}
      </Link>
    </div>
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

function getArtistHandles(value: string | undefined) {
  return (
    value
      ?.split(",")
      .map((handle) => handle.trim())
      .filter((handle) => handle.length > 0) ?? []
  );
}

function getArtistNames(value: string | undefined) {
  return (
    value
      ?.split(" / ")
      .join(",")
      .split(", ")
      .join(",")
      .split(" and ")
      .join(",")
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0) ?? []
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

function MemeDistributionPlanLink({ nft }: { readonly nft: NFT }) {
  const distributionPlanLink = getDistributionPlanLink(nft);

  return (
    <section className="tw-pt-6">
      <Link
        href={distributionPlanLink}
        target={nft.has_distribution ? "_self" : "_blank"}
        rel={nft.has_distribution ? undefined : "noopener noreferrer"}
        className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-white"
      >
        <span>Distribution Plan</span>
        <ArrowUpRightIcon className="-tw-mr-1 tw-h-4 tw-w-4 tw-text-iron-500" />
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

function MemeMarketplaceLinks({ nft }: { readonly nft: NFT }) {
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

export function MemeNftLivePanel({ nft }: { readonly nft: NFT }) {
  return (
    <section className="tw-pt-6 md:tw-pt-8">
      <h3 className={`${SECTION_HEADER_TITLE_CLASS} tw-mb-4`}>
        Market Overview
      </h3>
      <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-5 sm:tw-gap-x-8">
        <MarketMetric
          label="Mint price"
          value={nft.mint_price}
          decimals={100000}
          unit="ETH"
        />
        <MarketMetric label="Floor price" value={nft.floor_price} unit="ETH" />
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
      <MemeDistributionPlanLink nft={nft} />
    </section>
  );
}

function MarketMetric({
  label,
  value,
  decimals = 1000,
  unit,
}: {
  readonly label: string;
  readonly value: number;
  readonly decimals?: number | undefined;
  readonly unit?: string | undefined;
}) {
  const formattedValue =
    value > 0
      ? numberWithCommas(Math.round(value * decimals) / decimals)
      : "N/A";

  return (
    <div>
      <div className={`${MARKET_METRIC_LABEL_BASE_CLASS} tw-text-iron-400`}>
        {label}
      </div>
      <div className="tw-flex tw-items-baseline">
        <span className={MARKET_METRIC_VALUE_CLASS}>{formattedValue}</span>
        {unit && formattedValue !== "N/A" && (
          <span className="tw-ml-1.5 tw-text-sm tw-font-medium tw-leading-none tw-text-iron-400">
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
