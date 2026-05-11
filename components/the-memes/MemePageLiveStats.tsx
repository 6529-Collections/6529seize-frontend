"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { numberWithCommas, printMintDate } from "@/helpers/Helpers";
import { getFileMimeTypeFromMetadata } from "@/helpers/nft.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import ArtistProfileHandle from "./ArtistProfileHandle";

const statsTableClassName =
  "tw-w-full tw-border-collapse tw-text-base tw-text-white [&_td]:tw-border-0 [&_td]:tw-px-0.5 [&_td]:tw-py-0.5";

const overviewTableClassName =
  "tw-w-full tw-border-collapse tw-text-base tw-text-white [&_td]:tw-border-0 [&_td]:tw-px-0.5 [&_td]:tw-py-1";

const sectionHeadingClassName =
  "tw-mb-2 tw-text-lg tw-font-bold tw-leading-6 tw-text-white";

export function MemeCollectorsStats({
  nftMeta,
}: {
  readonly nftMeta: MemesExtendedData;
}) {
  return (
    <section className="tw-pt-2">
      <h3 className={sectionHeadingClassName}>Meme Collectors</h3>
      <table className={statsTableClassName}>
        <tbody>
          <tr>
            <td>Edition Size</td>
            <td className="tw-text-right tw-font-medium">
              {numberWithCommas(nftMeta.edition_size)}
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.edition_size_rank}/{nftMeta.collection_size}
            </td>
          </tr>
          {nftMeta.burnt > 0 && (
            <>
              <tr>
                <td>
                  <span className="tw-flex tw-items-center tw-gap-2">
                    <span>Burnt</span>
                    <FontAwesomeIcon
                      icon={faFire}
                      className="tw-h-[22px] tw-text-[#c51d34]"
                    />
                  </span>
                </td>
                <td className="tw-text-right tw-font-medium">
                  {numberWithCommas(nftMeta.burnt)}
                </td>
              </tr>
              <tr>
                <td>Edition Size ex. Burnt</td>
                <td className="tw-text-right tw-font-medium">
                  {numberWithCommas(nftMeta.edition_size_not_burnt)}
                </td>
                <td className="tw-text-right tw-font-medium">
                  {nftMeta.edition_size_not_burnt_rank}/
                  {nftMeta.collection_size}
                </td>
              </tr>
            </>
          )}
          <tr>
            <td>6529 Museum</td>
            <td className="tw-text-right tw-font-medium">
              {numberWithCommas(nftMeta.museum_holdings)}
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.museum_holdings_rank}/{nftMeta.collection_size}
            </td>
          </tr>
          <tr>
            <td>
              Edition Size ex.{nftMeta.burnt > 0 && " Burnt and"} 6529 Museum
            </td>
            <td className="tw-text-right tw-font-medium">
              {numberWithCommas(nftMeta.edition_size_cleaned)}
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.edition_size_cleaned_rank}/{nftMeta.collection_size}
            </td>
          </tr>
          <tr>
            <td>Collectors</td>
            <td className="tw-text-right tw-font-medium">
              {numberWithCommas(nftMeta.hodlers)}
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.hodlers_rank}/{nftMeta.collection_size}
            </td>
          </tr>
          <tr>
            <td>% Unique</td>
            <td className="tw-text-right tw-font-medium">
              {Math.round(nftMeta.percent_unique * 100 * 10) / 10}%
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.percent_unique_rank}/{nftMeta.collection_size}
            </td>
          </tr>
          {nftMeta.burnt > 0 && (
            <tr>
              <td>% Unique ex. Burnt</td>
              <td className="tw-text-right tw-font-medium">
                {Math.round(nftMeta.percent_unique_not_burnt * 100 * 10) / 10}%
              </td>
              <td className="tw-text-right tw-font-medium">
                {nftMeta.percent_unique_not_burnt_rank}/
                {nftMeta.collection_size}
              </td>
            </tr>
          )}
          <tr>
            <td>% Unique ex.{nftMeta.burnt > 0 && " Burnt and"} 6529 Museum</td>
            <td className="tw-text-right tw-font-medium">
              {Math.round(nftMeta.percent_unique_cleaned * 100 * 10) / 10}%
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.percent_unique_cleaned_rank}/{nftMeta.collection_size}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function MemeArtworkDetails({ nft }: { readonly nft: NFT }) {
  return (
    <section className="tw-py-3">
      <table className={overviewTableClassName}>
        <tbody>
          <tr>
            <td>Artist Name</td>
            <td className="tw-text-right tw-font-medium">{nft.artist}</td>
          </tr>
          <tr>
            <td>Artist Profile</td>
            <td className="tw-text-right tw-font-medium">
              <ArtistProfileHandle nft={nft} />
            </td>
          </tr>
          <tr>
            <td>Mint Date</td>
            <td className="tw-text-right tw-font-medium">
              {printMintDate(nft.mint_date)}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
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
      <div className="tw-flex tw-items-center tw-gap-3 tw-text-base tw-text-white">
        <span>File Type</span>
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
    <section className="tw-pt-4">
      <NFTMarketplaceLinks contract={nft.contract} id={nft.id} />
    </section>
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
