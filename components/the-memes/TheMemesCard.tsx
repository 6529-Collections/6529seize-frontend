"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import NFTImage from "@/components/nft-image/NFTImage";
import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import { numberWithCommas, printMintDate } from "@/helpers/Helpers";
import { getNftMimeType } from "@/helpers/nft.helpers";
import { MemesSort } from "@/types/enums";
import Link from "next/link";

function getVolume(nft: NFTWithMemesExtendedData, volumeType: VolumeType) {
  let vol = 0;
  switch (volumeType) {
    case VolumeType.HOURS_24:
      vol = nft.total_volume_last_24_hours;
      break;
    case VolumeType.DAYS_7:
      vol = nft.total_volume_last_7_days;
      break;
    case VolumeType.DAYS_30:
      vol = nft.total_volume_last_1_month;
      break;
    case VolumeType.ALL_TIME:
      vol = nft.total_volume;
      break;
  }

  if (vol > 0) {
    return `${numberWithCommas(Math.round(vol * 100) / 100)} ETH`;
  }
  return "-";
}

function getNftMetricText(
  nft: NFTWithMemesExtendedData,
  sort: MemesSort,
  volumeType: VolumeType
) {
  switch (sort) {
    case MemesSort.AGE:
    case MemesSort.MEME:
      return printMintDate(nft.mint_date);
    case MemesSort.EDITION_SIZE:
      return `Edition Size: ${numberWithCommas(nft.supply)}`;
    case MemesSort.TDH:
      return `TDH: ${numberWithCommas(Math.round(nft.boosted_tdh))}`;
    case MemesSort.HODLERS:
      return `Collectors: ${numberWithCommas(nft.hodlers)}`;
    case MemesSort.UNIQUE_PERCENT:
      return `Unique: ${Math.round(nft.percent_unique * 100 * 10) / 10}%`;
    case MemesSort.UNIQUE_PERCENT_EX_MUSEUM:
      return `Unique Ex-Museum: ${
        Math.round(nft.percent_unique_cleaned * 100 * 10) / 10
      }%`;
    case MemesSort.FLOOR_PRICE:
      return nft.floor_price > 0
        ? `Floor Price: ${numberWithCommas(
            Math.round(nft.floor_price * 1000) / 1000
          )} ETH`
        : "Floor Price: N/A";
    case MemesSort.HIGHEST_OFFER:
      return nft.highest_offer > 0
        ? `Highest Offer: ${numberWithCommas(
            Math.round(nft.highest_offer * 1000) / 1000
          )} ETH`
        : "Highest Offer: N/A";
    case MemesSort.MARKET_CAP:
      return nft.market_cap > 0
        ? `Market Cap: ${numberWithCommas(
            Math.round(nft.market_cap * 100) / 100
          )} ETH`
        : "Market Cap: N/A";
    case MemesSort.VOLUME:
      return `Volume (${volumeType}): ${getVolume(nft, volumeType)}`;
  }
}

export default function TheMemesCard({
  nft,
  sort,
  volumeType,
  hasConnectedProfile,
}: {
  readonly nft: NFTWithMemesExtendedData;
  readonly sort: MemesSort;
  readonly volumeType: VolumeType;
  readonly hasConnectedProfile: boolean;
}) {
  const mediaMimeType = getNftMimeType(nft);
  const metricText = getNftMetricText(nft, sort, volumeType);

  return (
    <Link
      href={`/the-memes/${nft.id}`}
      className="tw-group tw-block tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-border-white/20 hover:tw-bg-iron-900/50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      <div className="tw-relative tw-mb-2 tw-bg-iron-900">
        <NFTImage
          nft={nft}
          animation={false}
          height={300}
          showThumbnail={true}
          showBalance={false}
        />
      </div>
      {hasConnectedProfile && (
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
          {mediaMimeType && (
            <MediaTypeBadge
              mimeType={mediaMimeType}
              dropId={`${nft.contract}-${nft.id}`}
              size="sm"
              className="tw-mr-3 tw-inline-flex tw-align-[-0.25rem]"
              iconClassName="tw-size-5 tw-inline"
            />
          )}
          <span className="tw-relative tw-top-0.5">
            #{nft.id} - {nft.name}
          </span>
        </div>
        <div className="tw-min-h-5 tw-w-full tw-text-center tw-text-xs tw-leading-5 tw-text-iron-500">
          {metricText}
        </div>
      </div>
    </Link>
  );
}
