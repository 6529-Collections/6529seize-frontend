"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import { getDistributionDetailHref } from "@/components/distribution/distributionRouteParams";
import type { BaseNFT, NFT } from "@/entities/INFT";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { getFileMimeTypeFromMetadata } from "@/helpers/nft.helpers";
import { useIdentity } from "@/hooks/useIdentity";
import useCapacitor from "@/hooks/useCapacitor";
import {
  formatDate,
  formatInteger,
  formatNumber,
  formatPercent as formatLocalePercent,
  roundTo,
} from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { FireIcon } from "@heroicons/react/24/outline";
import {
  ArrowUpRightIcon,
  InformationCircleIcon as InformationCircleSolidIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import type { ReactNode } from "react";
import { Tooltip } from "react-tooltip";
import MemePageMainStageSubmissionLink from "./MemePageMainStageSubmissionLink";

const SECTION_HEADER_TITLE_CLASS =
  "tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400";
const TOP_LABEL_CLASS =
  "tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-500";
const CREATOR_NAME_CLASS =
  "tw-text-sm tw-font-semibold tw-leading-none tw-text-white tw-no-underline md:tw-text-lg";
const INLINE_METRIC_LABEL_CLASS =
  "tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400";
const MARKET_METRIC_LABEL_BASE_CLASS =
  "tw-mb-1 md:tw-mb-2 tw-text-sm tw-font-medium tw-leading-5";
const MARKET_METRIC_VALUE_CLASS =
  "tw-text-sm tw-font-semibold tw-leading-5 tw-text-white md:tw-text-lg md:tw-leading-6";
const COLLECTOR_METRIC_VALUE_CLASS =
  "tw-text-sm tw-font-semibold tw-leading-5 tw-text-white md:tw-text-lg md:tw-leading-6";
const RANK_BADGE_CLASS =
  "tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-px-2 tw-py-1 tw-text-[10px] tw-font-semibold tw-leading-none tw-text-iron-400 md:tw-py-0.5 md:tw-text-[11px] md:tw-leading-4";
const INLINE_STATS_ROW_CLASS =
  "tw-flex tw-flex-wrap tw-gap-x-10 tw-gap-y-6 sm:tw-gap-x-14";
const EDITION_STATS_ROW_CLASS =
  "tw-flex tw-flex-wrap tw-items-start tw-gap-x-6 tw-gap-y-6 md:tw-gap-x-10";
const MARKET_OVERVIEW_ROW_CLASS =
  "tw-flex tw-flex-wrap tw-items-start tw-gap-x-6 tw-gap-y-6 md:tw-gap-x-10";
const MEME_MINT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
};

export function MemeCollectorsStats({
  nftMeta,
  locale = DEFAULT_LOCALE,
}: {
  readonly nftMeta: ApiMemesExtendedData;
  readonly locale?: SupportedLocale | undefined;
}) {
  const percentUniqueExMuseumLabel = getPercentUniqueExMuseumLabel(
    nftMeta,
    locale
  );
  const rankTotal = getMemeRankTotal(nftMeta);
  const unranked = isMemeUnranked(nftMeta);

  return (
    <section>
      <div className={INLINE_STATS_ROW_CLASS}>
        <InlineStatsMetric
          label={t(locale, "theMemes.detail.live.collectors.collectors")}
          value={formatInteger(locale, nftMeta.hodlers)}
          rank={nftMeta.hodlers_rank}
          total={rankTotal}
          unranked={unranked}
          locale={locale}
        />
        <InlineStatsMetric
          label={t(locale, "theMemes.detail.live.collectors.museum")}
          value={formatInteger(locale, nftMeta.museum_holdings)}
          rank={nftMeta.museum_holdings_rank}
          total={rankTotal}
          unranked={unranked}
          locale={locale}
        />
        <InlineStatsMetric
          label={t(locale, "theMemes.detail.live.collectors.unique")}
          value={formatLivePercent(locale, nftMeta.percent_unique)}
          rank={nftMeta.percent_unique_rank}
          total={rankTotal}
          unranked={unranked}
          locale={locale}
          infoTitle={t(locale, "theMemes.detail.live.collectors.uniqueTooltip")}
        />
        {nftMeta.burnt > 0 && (
          <InlineStatsMetric
            label={t(locale, "theMemes.detail.live.collectors.uniqueExBurnt")}
            value={formatLivePercent(locale, nftMeta.percent_unique_not_burnt)}
            rank={nftMeta.percent_unique_not_burnt_rank}
            total={rankTotal}
            unranked={unranked}
            locale={locale}
          />
        )}
        <InlineStatsMetric
          label={percentUniqueExMuseumLabel}
          value={formatLivePercent(locale, nftMeta.percent_unique_cleaned)}
          rank={nftMeta.percent_unique_cleaned_rank}
          total={rankTotal}
          unranked={unranked}
          locale={locale}
        />
      </div>
    </section>
  );
}

export function MemeEditionSizeStats({
  nftMeta,
  locale = DEFAULT_LOCALE,
}: {
  readonly nftMeta: ApiMemesExtendedData;
  readonly locale?: SupportedLocale | undefined;
}) {
  const editionSizeExMuseumLabel = getEditionSizeExMuseumLabel(nftMeta, locale);
  const rankTotal = getMemeRankTotal(nftMeta);
  const unranked = isMemeUnranked(nftMeta);

  return (
    <section className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-6 md:tw-py-8">
      <div className={EDITION_STATS_ROW_CLASS}>
        <InlineStatsMetric
          label={t(locale, "theMemes.detail.live.edition.editionSize")}
          value={formatInteger(locale, nftMeta.edition_size)}
          rank={nftMeta.edition_size_rank}
          total={rankTotal}
          unranked={unranked}
          locale={locale}
        />
        {nftMeta.burnt > 0 && (
          <>
            <InlineStatsMetric
              label={t(locale, "theMemes.detail.live.edition.burnt")}
              value={formatInteger(locale, nftMeta.burnt)}
              icon={<FireIcon className="tw-h-4 tw-w-4 tw-text-red" />}
              locale={locale}
            />
            <InlineStatsMetric
              label={t(locale, "theMemes.detail.live.edition.exBurnt")}
              value={formatInteger(locale, nftMeta.edition_size_not_burnt)}
              rank={nftMeta.edition_size_not_burnt_rank}
              total={rankTotal}
              unranked={unranked}
              locale={locale}
            />
          </>
        )}
        <InlineStatsMetric
          label={editionSizeExMuseumLabel}
          value={formatInteger(locale, nftMeta.edition_size_cleaned)}
          rank={nftMeta.edition_size_cleaned_rank}
          total={rankTotal}
          unranked={unranked}
          locale={locale}
        />
        <InlineStatsMetric
          label={t(locale, "theMemes.detail.live.collectors.collectors")}
          value={formatInteger(locale, nftMeta.hodlers)}
          rank={nftMeta.hodlers_rank}
          total={rankTotal}
          unranked={unranked}
          locale={locale}
        />
      </div>
    </section>
  );
}

function InlineStatsMetric({
  label,
  value,
  rank,
  total,
  unranked = false,
  icon,
  infoTitle,
  locale,
}: {
  readonly label: string;
  readonly value: string;
  readonly rank?: number | undefined;
  readonly total?: number | undefined;
  readonly unranked?: boolean | undefined;
  readonly icon?: ReactNode;
  readonly infoTitle?: string | undefined;
  readonly locale: SupportedLocale;
}) {
  const tooltipId = infoTitle
    ? buildTooltipId("meme-collector-stat", label, infoTitle)
    : undefined;
  const displayableRank = getDisplayableRank(rank, total);

  return (
    <div className="tw-min-w-[8.5rem]">
      <div className="tw-mb-1 tw-flex tw-items-center tw-gap-2 md:tw-mb-2">
        {icon}
        <span className={INLINE_METRIC_LABEL_CLASS}>{label}</span>
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
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1.5">
        <span className={COLLECTOR_METRIC_VALUE_CLASS}>{value}</span>
        {unranked && <UnrankedBadge label={label} locale={locale} />}
        {!unranked && displayableRank && (
          <CollectorRankBadge
            label={label}
            rank={displayableRank.rank}
            total={displayableRank.total}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}

function CollectorRankBadge({
  label,
  rank,
  total,
  locale,
}: {
  readonly label: string;
  readonly rank: number;
  readonly total: number;
  readonly locale: SupportedLocale;
}) {
  const rankText = t(locale, "theMemes.detail.live.rank", {
    rank: formatInteger(locale, rank),
    total: formatInteger(locale, total),
  });

  return (
    <span className={RANK_BADGE_CLASS} aria-label={`${label}: ${rankText}`}>
      {rankText}
    </span>
  );
}

function UnrankedBadge({
  label,
  locale,
}: {
  readonly label: string;
  readonly locale: SupportedLocale;
}) {
  const unrankedText = t(locale, "theMemes.detail.live.rankUnranked");

  return (
    <span className={RANK_BADGE_CLASS} aria-label={`${label}: ${unrankedText}`}>
      {unrankedText}
    </span>
  );
}

function getDisplayableRank(
  rank: number | undefined,
  total: number | undefined
): { readonly rank: number; readonly total: number } | undefined {
  if (rank === undefined || rank <= 0 || total === undefined || total <= 0) {
    return undefined;
  }

  return { rank, total };
}

function isMemeUnranked(nftMeta: ApiMemesExtendedData) {
  return nftMeta.recorded_in_tdh === false;
}

function getMemeRankTotal(nftMeta: ApiMemesExtendedData) {
  if (isMemeUnranked(nftMeta)) {
    return undefined;
  }

  return nftMeta.ranked_collection_size ?? nftMeta.collection_size;
}

function getPercentUniqueExMuseumLabel(
  nftMeta: ApiMemesExtendedData,
  locale: SupportedLocale
) {
  return nftMeta.burnt > 0
    ? t(locale, "theMemes.detail.live.collectors.uniqueExBurntAndMuseum")
    : t(locale, "theMemes.detail.live.collectors.uniqueExMuseum");
}

function getEditionSizeExMuseumLabel(
  nftMeta: ApiMemesExtendedData,
  locale: SupportedLocale
) {
  return nftMeta.burnt > 0
    ? t(locale, "theMemes.detail.live.edition.exBurntAndMuseum")
    : t(locale, "theMemes.detail.live.edition.exMuseum");
}

function formatLivePercent(locale: SupportedLocale, value: number) {
  return formatLocalePercent(locale, value, 1);
}

export function MemeArtworkDetails({
  nft,
  layout = "default",
  locale = DEFAULT_LOCALE,
}: {
  readonly nft: BaseNFT;
  readonly layout?: "default" | "aligned";
  readonly locale?: SupportedLocale | undefined;
}) {
  const mintDate = getMintDateParts(nft.mint_date, locale);
  const artistHandles = getArtistHandles(nft.artist_seize_handle);
  const artistNames = getArtistNames(nft.artist);
  const unavailableLabel = t(
    locale,
    "theMemes.detail.live.artwork.notAvailable"
  );
  const creatorCount = Math.max(artistNames.length, artistHandles.length);
  const creators =
    creatorCount > 0
      ? Array.from({ length: creatorCount }, (_, index) => {
          const handle = artistHandles[index] ?? null;
          return {
            handle,
            display: artistNames[index] ?? handle ?? unavailableLabel,
          };
        })
      : [{ handle: null, display: unavailableLabel }];
  const isAligned = layout === "aligned";
  const rowClassName = isAligned
    ? "tw-grid tw-grid-cols-1 tw-items-start tw-gap-x-8 tw-gap-y-6 sm:tw-grid-cols-2"
    : "tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-6 tw-gap-y-6";
  const itemClassName = isAligned
    ? "tw-min-w-[8.5rem] sm:tw-justify-self-end sm:tw-text-right"
    : "tw-min-w-fit";
  const mintDateClassName =
    "tw-flex tw-h-7 tw-flex-wrap tw-items-center sm:tw-justify-end";

  return (
    <section className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-6 tw-pt-8 md:tw-pb-8 lg:tw-pt-0">
      <div className={rowClassName}>
        <div className="tw-min-w-0">
          <div className={TOP_LABEL_CLASS}>
            {t(locale, "theMemes.detail.live.artwork.createdBy")}
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-y-2">
            {creators.map((creator, index) => {
              const nextCreator = creators[index + 1];
              const hasNextCreator = nextCreator !== undefined;
              const showComma =
                hasNextCreator &&
                (creator.handle === null || nextCreator.handle === null);

              return (
                <div
                  key={
                    creator.handle
                      ? `handle:${creator.handle}`
                      : `plain:${creator.display}`
                  }
                  className={`tw-flex tw-items-center ${
                    hasNextCreator && !showComma ? "tw-mr-4" : ""
                  }`}
                >
                  {creator.handle !== null ? (
                    <CreatorProfileIdentity
                      handle={creator.handle}
                      display={creator.display}
                      locale={locale}
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
        <div className={itemClassName}>
          <div className={TOP_LABEL_CLASS}>
            {t(locale, "theMemes.detail.live.artwork.mintDate")}
          </div>
          <div className={mintDateClassName}>
            <span className="tw-text-sm tw-font-semibold tw-leading-none tw-text-white md:tw-text-lg">
              {mintDate.date}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CreatorProfileIdentity({
  handle,
  display,
  locale,
}: {
  readonly handle: string;
  readonly display: string;
  readonly locale: SupportedLocale;
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
        alt={t(locale, "theMemes.detail.live.artwork.artistAvatarAlt", {
          artist: avatarLabel,
        })}
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

function getMintDateParts(
  date: Date | string | number | null | undefined,
  locale: SupportedLocale
) {
  return {
    date: formatDate(locale, date, MEME_MINT_DATE_FORMAT),
  };
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
      .split(" & ")
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

function MemeDistributionPlanLink({
  nft,
  locale,
}: {
  readonly nft: NFT;
  readonly locale: SupportedLocale;
}) {
  const distributionPlanLink = getDistributionPlanLink(nft, locale);

  return (
    <Link
      href={distributionPlanLink}
      target={nft.has_distribution ? "_self" : "_blank"}
      rel={nft.has_distribution ? undefined : "noopener noreferrer"}
      className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 hover:tw-bg-iron-800 hover:tw-text-white"
    >
      <span>{t(locale, "distribution.planLink")}</span>
      <ArrowUpRightIcon className="-tw-mr-1 tw-h-4 tw-w-4 tw-text-iron-500" />
    </Link>
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
    <div className="tw-flex tw-min-w-[8.5rem] tw-items-end">
      <NFTMarketplaceLinks contract={nft.contract} id={nft.id} />
    </div>
  );
}

export function MemeNftLivePanel({
  nft,
  recordedInTdh,
  locale = DEFAULT_LOCALE,
}: {
  readonly nft: NFT;
  readonly recordedInTdh?: boolean | null | undefined;
  readonly locale?: SupportedLocale | undefined;
}) {
  const pendingTdhLabel =
    recordedInTdh === false
      ? t(locale, "theMemes.detail.live.market.pending")
      : undefined;

  return (
    <section className="tw-pt-6 md:tw-pt-8">
      <h3 className={`${SECTION_HEADER_TITLE_CLASS} tw-mb-4`}>
        {t(locale, "theMemes.detail.live.market.title")}
      </h3>
      <div className={MARKET_OVERVIEW_ROW_CLASS}>
        <MarketMetric
          label={t(locale, "theMemes.detail.live.market.mintPrice")}
          value={nft.mint_price}
          decimals={100000}
          unit={t(locale, "theMemes.detail.live.market.ethUnit")}
          locale={locale}
        />
        <MarketMetric
          label={t(locale, "theMemes.detail.live.market.floorPrice")}
          value={nft.floor_price}
          unit={t(locale, "theMemes.detail.live.market.ethUnit")}
          locale={locale}
        />
        <MarketMetric
          label={t(locale, "theMemes.detail.live.market.marketCap")}
          value={nft.market_cap}
          decimals={100}
          unit={t(locale, "theMemes.detail.live.market.ethUnit")}
          locale={locale}
        />
        <MarketMetric
          label={t(locale, "theMemes.detail.live.market.tdhRate")}
          value={nft.hodl_rate}
          decimals={100}
          displayValue={pendingTdhLabel}
          locale={locale}
        />
        <MarketMetric
          label={t(locale, "theMemes.detail.live.market.highestOffer")}
          value={nft.highest_offer}
          unit={t(locale, "theMemes.detail.live.market.ethUnit")}
          locale={locale}
        />
        <MemeMarketplaceLinks nft={nft} />
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-pt-6">
        <MemeDistributionPlanLink nft={nft} locale={locale} />
        <MemePageMainStageSubmissionLink
          memeCardId={nft.id}
          locale={locale}
        />
      </div>
    </section>
  );
}

function MarketMetric({
  label,
  value,
  decimals = 1000,
  unit,
  displayValue,
  locale,
}: {
  readonly label: string;
  readonly value: number;
  readonly decimals?: number | undefined;
  readonly unit?: string | undefined;
  readonly displayValue?: string | undefined;
  readonly locale: SupportedLocale;
}) {
  const unavailableLabel = t(locale, "theMemes.detail.live.market.unavailable");
  const fractionDigits = getFractionDigits(decimals);
  const formattedValue =
    displayValue ??
    (value > 0
      ? formatNumber(locale, roundTo(value, fractionDigits), {
          maximumFractionDigits: fractionDigits,
        })
      : unavailableLabel);

  return (
    <div className="tw-min-w-[8.5rem]">
      <div className={`${MARKET_METRIC_LABEL_BASE_CLASS} tw-text-iron-400`}>
        {label}
      </div>
      <div className="tw-flex tw-items-baseline">
        <span className={MARKET_METRIC_VALUE_CLASS}>{formattedValue}</span>
        {unit && !displayValue && formattedValue !== unavailableLabel && (
          <span className="tw-ml-1.5 tw-text-sm tw-font-medium tw-leading-none tw-text-iron-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function getFractionDigits(decimals: number) {
  if (!Number.isFinite(decimals) || decimals <= 1) {
    return 0;
  }

  return Math.max(0, Math.round(Math.log10(decimals)));
}

function getDistributionPlanLink(nft: NFT, locale: SupportedLocale) {
  if (nft.has_distribution) {
    return getDistributionDetailHref({
      basePath: "/the-memes",
      id: nft.id,
      locale,
    });
  }
  if (nft.id > 3) {
    return `https://github.com/6529-Collections/thememecards/tree/main/card${nft.id}`;
  }
  return "https://github.com/6529-Collections/thememecards/tree/main/card1-3";
}
