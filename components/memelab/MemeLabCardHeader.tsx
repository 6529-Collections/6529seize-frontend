"use client";

import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import { getDistributionDetailHref } from "@/components/distribution/distributionRouteParams";
import { getMemeLabCollectionHref } from "@/components/memelab/memeLabRouteParams";
import { MemePageArtViewer } from "@/components/the-memes/MemePageArtViewer";
import { getSafeExternalUrl } from "@/components/the-memes/MemePageAdditionalDetails";
import { MemeArtworkDetails } from "@/components/the-memes/MemePageLiveStats";
import type { LabExtendedData, LabNFT } from "@/entities/INFT";
import { addProtocol, numberWithCommas } from "@/helpers/Helpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ChartBarSquareIcon, LinkIcon } from "@heroicons/react/24/outline";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

const MEME_LAB_LABEL_CLASS =
  "tw-mb-1 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400";
const MEME_LAB_VALUE_CLASS =
  "tw-text-sm tw-font-semibold tw-leading-5 tw-text-white md:tw-text-lg md:tw-leading-6";
const MEME_LAB_MARKET_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-6 sm:tw-grid-cols-2 xl:tw-grid-cols-3";
const MEME_LAB_SECTION_TITLE_CLASS =
  "tw-mb-4 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400";
export const MEME_LAB_STATS_ROW_CLASS =
  "tw-flex tw-flex-wrap tw-items-start tw-gap-x-6 tw-gap-y-6 md:tw-gap-x-10";

const trimToEmpty = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const getMemeLabWebsiteUrls = (value: unknown): string[] =>
  trimToEmpty(value)
    .split(/[\s,]+/)
    .map((website) => website.trim())
    .filter((website) => website.length > 0);

function formatMemeLabMarketValue(value: number, decimals = 1000) {
  if (value <= 0) {
    return "N/A";
  }
  return numberWithCommas(Math.round(value * decimals) / decimals);
}

function MemeLabInfoItem({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-min-w-[8.5rem]">
      <div className="tw-mb-1 md:tw-mb-2">
        <span className={MEME_LAB_LABEL_CLASS}>{label}</span>
      </div>
      <div className={MEME_LAB_VALUE_CLASS}>{children}</div>
    </div>
  );
}

export function MemeLabStatMetric({
  label,
  value,
  rank,
  total,
  icon,
}: {
  readonly label: string;
  readonly value: string;
  readonly rank?: number | undefined;
  readonly total?: number | undefined;
  readonly icon?: ReactNode;
}) {
  return (
    <div className="tw-min-w-[8.5rem]">
      <div className="tw-mb-1 tw-flex tw-items-center tw-gap-2 md:tw-mb-2">
        {icon}
        <span className={MEME_LAB_LABEL_CLASS}>{label}</span>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1.5">
        <span className={MEME_LAB_VALUE_CLASS}>{value}</span>
        {rank !== undefined && total !== undefined && (
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-px-2 tw-py-1 tw-text-[10px] tw-font-semibold tw-leading-none tw-text-iron-400 md:tw-py-0.5 md:tw-text-[11px] md:tw-leading-4">
            Rank {numberWithCommas(rank)}/{numberWithCommas(total)}
          </span>
        )}
      </div>
    </div>
  );
}

function MemeLabMarketMetric({
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
  const formattedValue = formatMemeLabMarketValue(value, decimals);

  return (
    <div className="tw-min-w-[8.5rem]">
      <div className={MEME_LAB_LABEL_CLASS}>{label}</div>
      <div className="tw-flex tw-items-baseline">
        <span className={MEME_LAB_VALUE_CLASS}>{formattedValue}</span>
        {unit && formattedValue !== "N/A" && (
          <span className="tw-ml-1.5 tw-text-sm tw-font-medium tw-leading-none tw-text-iron-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function MemeLabMetadataLink({ url }: { readonly url: unknown }) {
  const metadataUrl = trimToEmpty(url);
  const safeMetadataUrl = getSafeExternalUrl(metadataUrl);

  if (!safeMetadataUrl) {
    return null;
  }

  return (
    <div className="tw-min-w-[8.5rem]">
      <div className={MEME_LAB_LABEL_CLASS}>Metadata</div>
      <Link
        href={safeMetadataUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="tw-text-sm tw-font-semibold tw-leading-5 tw-text-white tw-no-underline hover:tw-text-iron-300 md:tw-text-lg md:tw-leading-6"
      >
        View
      </Link>
    </div>
  );
}

function MemeLabDistributionPlanLink({
  nft,
  locale,
}: {
  readonly nft: LabNFT;
  readonly locale: SupportedLocale;
}) {
  if (!nft.has_distribution) {
    return null;
  }

  return (
    <section className="tw-pt-6">
      <Link
        href={getDistributionDetailHref({
          basePath: "/meme-lab",
          id: nft.id,
          locale,
        })}
        className="tw-inline-flex tw-items-center tw-rounded-md tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-white"
      >
        {t(locale, "distribution.planLink")}
      </Link>
    </section>
  );
}

export function MemeLabStaticCardHeader({
  nft,
  nftMeta,
  showMarketplaceLinks,
  artworkFooter,
  locale = DEFAULT_LOCALE,
}: {
  readonly nft: LabNFT;
  readonly nftMeta: LabExtendedData;
  readonly showMarketplaceLinks: boolean;
  readonly artworkFooter?: ReactNode | undefined;
  readonly locale?: SupportedLocale;
}) {
  return (
    <div className="tw-mb-6 tw-grid tw-grid-cols-1 tw-gap-x-10 lg:tw-grid-cols-[minmax(0,11fr)_minmax(0,9fr)] xl:tw-gap-x-16">
      <div className="tw-relative lg:tw-flex lg:tw-flex-col lg:tw-self-stretch">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-pb-5 tw-pt-2 lg:tw-flex-1">
          <MemePageArtViewer
            key={`${nft.contract}-${nft.id}`}
            nft={nft}
            showBalance={true}
          />
        </div>
        {artworkFooter}
      </div>
      <div className="tw-pt-6 md:tw-pt-8 lg:tw-pt-2">
        <MemeLabLiveDetails
          nft={nft}
          nftMeta={nftMeta}
          showMarketplaceLinks={showMarketplaceLinks}
          locale={locale}
        />
      </div>
    </div>
  );
}

function MemeLabLiveDetails({
  nft,
  nftMeta,
  showMarketplaceLinks,
  locale,
}: {
  readonly nft: LabNFT;
  readonly nftMeta: LabExtendedData;
  readonly showMarketplaceLinks: boolean;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-w-full">
      <MemeArtworkDetails nft={nft} layout="aligned" locale={locale} />
      <section
        aria-label="Card details"
        className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-6 md:tw-py-8"
      >
        <MemeLabCardDetailsStats nftMeta={nftMeta} locale={locale} />
      </section>
      <section className="tw-pt-6 md:tw-pt-8">
        <div className={MEME_LAB_MARKET_GRID_CLASS}>
          <MemeLabMarketMetric
            label="Mint Price"
            value={nft.mint_price}
            decimals={100000}
            unit="ETH"
          />
          <MemeLabMetadataLink url={nft.uri} />
          <MemeLabMarketMetric
            label="Floor Price"
            value={nft.floor_price}
            unit="ETH"
          />
          <MemeLabMarketMetric
            label="Market Cap"
            value={nft.market_cap}
            decimals={100}
            unit="ETH"
          />
          <MemeLabMarketMetric
            label="Highest Offer"
            value={nft.highest_offer}
            unit="ETH"
          />
          {showMarketplaceLinks && (
            <div className="tw-flex tw-min-w-[8.5rem] tw-items-end">
              <NFTMarketplaceLinks contract={nft.contract} id={nft.id} />
            </div>
          )}
        </div>
        <MemeLabDistributionPlanLink nft={nft} locale={locale} />
      </section>
    </div>
  );
}

function MemeLabCardDetailsStats({
  nftMeta,
  locale,
}: {
  readonly nftMeta: LabExtendedData;
  readonly locale: SupportedLocale;
}) {
  const websiteUrls = getMemeLabWebsiteUrls(nftMeta.website);

  return (
    <div className={MEME_LAB_MARKET_GRID_CLASS}>
      <MemeLabStatMetric
        label="Edition Size"
        value={numberWithCommas(nftMeta.edition_size)}
        rank={nftMeta.edition_size_rank}
        total={nftMeta.collection_size}
      />
      {nftMeta.burnt > 0 && (
        <>
          <MemeLabStatMetric
            label="Burnt"
            value={numberWithCommas(nftMeta.burnt)}
            icon={
              <FontAwesomeIcon
                icon={faFire}
                className="tw-h-4 tw-w-4 tw-text-red"
              />
            }
          />
          <MemeLabStatMetric
            label="Edition Size ex. Burnt"
            value={numberWithCommas(nftMeta.edition_size_not_burnt)}
            rank={nftMeta.edition_size_not_burnt_rank}
            total={nftMeta.collection_size}
          />
        </>
      )}
      <MemeLabStatMetric
        label={`ex.${nftMeta.burnt > 0 ? " Burnt and" : ""} 6529 Museum`}
        value={numberWithCommas(nftMeta.edition_size_cleaned)}
        rank={nftMeta.edition_size_cleaned_rank}
        total={nftMeta.collection_size}
      />
      <MemeLabInfoItem label="Collection">
        <Link
          href={getMemeLabCollectionHref({
            collectionName: nftMeta.metadata_collection,
            locale,
          })}
          className="tw-text-white tw-no-underline hover:tw-text-iron-300"
        >
          {nftMeta.metadata_collection}
        </Link>
      </MemeLabInfoItem>
      {websiteUrls.length > 0 && (
        <div className="tw-min-w-0 sm:tw-col-span-2 xl:tw-col-span-3">
          <MemeLabInfoItem label="Website">
            <span className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-2">
              {websiteUrls.map((website) => (
                <Link
                  key={`meta-website-${website}`}
                  href={addProtocol(website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-inline-flex tw-w-fit tw-max-w-full tw-items-start tw-gap-2 tw-text-white tw-no-underline hover:tw-text-iron-300"
                >
                  <LinkIcon className="tw-mt-1 tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500" />
                  <span className="tw-min-w-0 tw-break-words">{website}</span>
                </Link>
              ))}
            </span>
          </MemeLabInfoItem>
        </div>
      )}
    </div>
  );
}

export function MemeLabCardVolumes({ nft }: { readonly nft: LabNFT }) {
  return (
    <section aria-labelledby="meme-lab-card-volumes-heading">
      <div className="tw-flex tw-items-center tw-gap-3">
        <ChartBarSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500" />
        <h3
          id="meme-lab-card-volumes-heading"
          className={clsx(MEME_LAB_SECTION_TITLE_CLASS, "tw-mb-0")}
        >
          Card Volumes
        </h3>
        <div className="tw-h-px tw-min-w-10 tw-flex-grow tw-bg-gradient-to-r tw-from-iron-700 tw-to-transparent" />
      </div>
      <div className={clsx("tw-mt-6", MEME_LAB_STATS_ROW_CLASS)}>
        <MemeLabMarketMetric
          label="24 Hours"
          value={nft.total_volume_last_24_hours}
          decimals={100}
          unit="ETH"
        />
        <MemeLabMarketMetric
          label="7 Days"
          value={nft.total_volume_last_7_days}
          decimals={100}
          unit="ETH"
        />
        <MemeLabMarketMetric
          label="30 Days"
          value={nft.total_volume_last_1_month}
          decimals={100}
          unit="ETH"
        />
        <MemeLabMarketMetric
          label="All Time"
          value={nft.total_volume}
          decimals={100}
          unit="ETH"
        />
      </div>
    </section>
  );
}
