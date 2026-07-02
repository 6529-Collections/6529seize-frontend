"use client";

import CollectionCardMetadataRow from "@/components/collection-page/CollectionCardMetadataRow";
import CollectionCardMetricLine from "@/components/collection-page/CollectionCardMetricLine";
import NFTImage from "@/components/nft-image/NFTImage";
import { getTheMemesDetailHref } from "@/components/the-memes/theMemesRouteParams";
import { getVolumeTypeLabel } from "@/components/the-memes/theMemesI18n";
import { VolumeType } from "@/entities/INFT";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { getNftMimeType } from "@/helpers/nft.helpers";
import {
  formatDate,
  formatInteger,
  formatNumber,
  formatPercent,
  roundTo,
} from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MemesSort } from "@/types/enums";
import Link from "next/link";

function getVolume(
  nft: ApiMemesExtendedData,
  volumeType: VolumeType,
  locale: SupportedLocale
) {
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
    return t(locale, "theMemes.card.metric.ethValue", {
      value: formatNumber(locale, roundTo(vol, 2), {
        maximumFractionDigits: 2,
      }),
    });
  }
  return t(locale, "theMemes.card.metric.unavailable");
}

function getNftMetricText(
  nft: ApiMemesExtendedData,
  sort: MemesSort,
  volumeType: VolumeType,
  locale: SupportedLocale
) {
  switch (sort) {
    case MemesSort.AGE:
    case MemesSort.MEME:
      return formatDate(locale, nft.mint_date);
    case MemesSort.EDITION_SIZE:
      return t(locale, "theMemes.card.metric.editionSize", {
        value: formatInteger(locale, nft.supply),
      });
    case MemesSort.TDH:
      return t(locale, "theMemes.card.metric.tdh", {
        value: formatInteger(locale, Math.round(nft.boosted_tdh)),
      });
    case MemesSort.HODLERS:
      return t(locale, "theMemes.card.metric.collectors", {
        value: formatInteger(locale, nft.hodlers),
      });
    case MemesSort.UNIQUE_PERCENT:
      return t(locale, "theMemes.card.metric.unique", {
        value: formatPercent(locale, nft.percent_unique),
      });
    case MemesSort.UNIQUE_PERCENT_EX_MUSEUM:
      return t(locale, "theMemes.card.metric.uniqueExMuseum", {
        value: formatPercent(locale, nft.percent_unique_cleaned),
      });
    case MemesSort.FLOOR_PRICE:
      return nft.floor_price > 0
        ? t(locale, "theMemes.card.metric.floorPrice", {
            value: t(locale, "theMemes.card.metric.ethValue", {
              value: formatNumber(locale, roundTo(nft.floor_price, 3), {
                maximumFractionDigits: 3,
              }),
            }),
          })
        : t(locale, "theMemes.card.metric.floorPriceUnavailable");
    case MemesSort.HIGHEST_OFFER:
      return nft.highest_offer > 0
        ? t(locale, "theMemes.card.metric.highestOffer", {
            value: t(locale, "theMemes.card.metric.ethValue", {
              value: formatNumber(locale, roundTo(nft.highest_offer, 3), {
                maximumFractionDigits: 3,
              }),
            }),
          })
        : t(locale, "theMemes.card.metric.highestOfferUnavailable");
    case MemesSort.MARKET_CAP:
      return nft.market_cap > 0
        ? t(locale, "theMemes.card.metric.marketCap", {
            value: t(locale, "theMemes.card.metric.ethValue", {
              value: formatNumber(locale, roundTo(nft.market_cap, 2), {
                maximumFractionDigits: 2,
              }),
            }),
          })
        : t(locale, "theMemes.card.metric.marketCapUnavailable");
    case MemesSort.VOLUME:
      return t(locale, "theMemes.card.metric.volume", {
        volumeType: getVolumeTypeLabel(volumeType, locale),
        value: getVolume(nft, volumeType, locale),
      });
  }
}

export default function TheMemesCard({
  nft,
  sort,
  volumeType,
  hasConnectedProfile,
  locale,
}: {
  readonly nft: ApiMemesExtendedData;
  readonly sort: MemesSort;
  readonly volumeType: VolumeType;
  readonly hasConnectedProfile: boolean;
  readonly locale?: SupportedLocale;
}) {
  const resolvedLocale = locale ?? DEFAULT_LOCALE;
  const mediaMimeType = getNftMimeType(nft);
  const metricText = getNftMetricText(nft, sort, volumeType, resolvedLocale);
  const tokenId = formatInteger(resolvedLocale, nft.id);

  return (
    <Link
      href={getTheMemesDetailHref({ id: nft.id, locale: resolvedLocale })}
      aria-label={t(resolvedLocale, "theMemes.card.linkAriaLabel", {
        name: nft.name,
        tokenId,
      })}
      className="tw-group tw-block tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-border-white/20 hover:tw-bg-iron-900/50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-[#0D0D0F]"
    >
      <div className="tw-bg-iron-900">
        <NFTImage
          nft={nft}
          animation={false}
          height={300}
          showThumbnail={true}
          showBalance={false}
        />
      </div>
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-center tw-px-2 tw-pb-4 tw-pt-4 tw-text-center md:tw-px-4">
        <div className="tw-w-full tw-max-w-full tw-text-center tw-text-sm tw-font-semibold tw-leading-snug tw-text-iron-50 md:tw-text-md">
          {nft.name}
        </div>
        <CollectionCardMetadataRow
          tokenId={nft.id}
          mediaMimeType={mediaMimeType}
          mediaBadgeId={`${nft.contract}-${nft.id}`}
          align="center"
          ownership={{
            contract: nft.contract,
            tokenId: nft.id,
            show: hasConnectedProfile,
          }}
        />
        <CollectionCardMetricLine text={metricText} align="center" />
      </div>
    </Link>
  );
}
