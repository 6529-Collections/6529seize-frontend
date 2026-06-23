import { getVolumeTypeLabel } from "@/components/the-memes/theMemesI18n";
import type { LabExtendedData, LabNFT } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import {
  formatDate,
  formatInteger,
  formatNumber,
  formatPercent,
  roundTo,
} from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { MemeLabSort } from "@/types/enums";

function formatEthMetric(
  locale: SupportedLocale,
  labelKey: MessageKey,
  unavailableKey: MessageKey,
  value: number,
  precision: number
) {
  if (!Number.isFinite(value) || value <= 0) {
    return t(locale, unavailableKey);
  }

  return t(locale, labelKey, {
    value: t(locale, "memeLab.card.metric.ethValue", {
      value: formatNumber(locale, roundTo(value, precision), {
        maximumFractionDigits: precision,
      }),
    }),
  });
}

function getVolumeForType(nft: LabNFT, volumeType: VolumeType) {
  switch (volumeType) {
    case VolumeType.HOURS_24:
      return nft.total_volume_last_24_hours;
    case VolumeType.DAYS_7:
      return nft.total_volume_last_7_days;
    case VolumeType.DAYS_30:
      return nft.total_volume_last_1_month;
    default:
      return nft.total_volume;
  }
}

function formatVolumeMetric(
  nft: LabNFT,
  volumeType: VolumeType,
  locale: SupportedLocale
) {
  const volume = getVolumeForType(nft, volumeType);
  const volumeTypeLabel = getVolumeTypeLabel(volumeType, locale);

  if (!Number.isFinite(volume) || volume <= 0) {
    return t(locale, "memeLab.card.metric.volumeUnavailable", {
      volumeType: volumeTypeLabel,
    });
  }

  const value = t(locale, "memeLab.card.metric.ethValue", {
    value: formatNumber(locale, roundTo(volume, 2), {
      maximumFractionDigits: 2,
    }),
  });

  return t(locale, "memeLab.card.metric.volume", {
    volumeType: volumeTypeLabel,
    value,
  });
}

export function printNftContent(
  nft: LabNFT,
  sort: MemeLabSort,
  nftMetas: LabExtendedData[],
  volumeType: VolumeType,
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  const nftMeta = nftMetas.find((nftm) => nftm.id === nft.id);

  switch (sort) {
    case MemeLabSort.AGE:
    case MemeLabSort.ARTISTS:
      return formatDate(locale, nft.mint_date);
    case MemeLabSort.COLLECTIONS:
      return t(locale, "memeLab.card.metric.artists", {
        value: nft.artist,
      });
    case MemeLabSort.EDITION_SIZE:
      return t(locale, "memeLab.card.metric.editionSize", {
        value: formatInteger(locale, nft.supply),
      });
    case MemeLabSort.HODLERS:
      return t(locale, "memeLab.card.metric.collectors", {
        value: formatInteger(locale, nftMeta?.hodlers),
      });
    case MemeLabSort.UNIQUE_PERCENT:
      return t(locale, "memeLab.card.metric.unique", {
        value: formatPercent(locale, nftMeta?.percent_unique),
      });
    case MemeLabSort.UNIQUE_PERCENT_EX_MUSEUM:
      return t(locale, "memeLab.card.metric.uniqueExMuseum", {
        value: formatPercent(locale, nftMeta?.percent_unique_cleaned),
      });
    case MemeLabSort.FLOOR_PRICE:
      return formatEthMetric(
        locale,
        "memeLab.card.metric.floorPrice",
        "memeLab.card.metric.floorPriceUnavailable",
        nft.floor_price,
        2
      );
    case MemeLabSort.MARKET_CAP:
      return formatEthMetric(
        locale,
        "memeLab.card.metric.marketCap",
        "memeLab.card.metric.marketCapUnavailable",
        nft.market_cap,
        2
      );
    case MemeLabSort.HIGHEST_OFFER:
      return formatEthMetric(
        locale,
        "memeLab.card.metric.highestOffer",
        "memeLab.card.metric.highestOfferUnavailable",
        nft.highest_offer,
        3
      );
    case MemeLabSort.VOLUME:
      return formatVolumeMetric(nft, volumeType, locale);
  }

  return "";
}
