import { VolumeType } from "@/entities/INFT";
import { type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MemesSort } from "@/types/enums";

function assertUnhandled(value: never, label: string): never {
  throw new Error(`Unhandled ${label}: ${String(value)}`);
}

export function getMemesSortLabel(
  sort: MemesSort,
  locale: SupportedLocale
): string {
  switch (sort) {
    case MemesSort.AGE:
      return t(locale, "theMemes.sort.age");
    case MemesSort.EDITION_SIZE:
      return t(locale, "theMemes.sort.editionSize");
    case MemesSort.MEME:
      return t(locale, "theMemes.sort.meme");
    case MemesSort.HODLERS:
      return t(locale, "theMemes.sort.collectors");
    case MemesSort.TDH:
      return t(locale, "theMemes.sort.tdh");
    case MemesSort.UNIQUE_PERCENT:
      return t(locale, "theMemes.sort.uniquePercent");
    case MemesSort.UNIQUE_PERCENT_EX_MUSEUM:
      return t(locale, "theMemes.sort.uniquePercentExMuseum");
    case MemesSort.FLOOR_PRICE:
      return t(locale, "theMemes.sort.floorPrice");
    case MemesSort.MARKET_CAP:
      return t(locale, "theMemes.sort.marketCap");
    case MemesSort.VOLUME:
      return t(locale, "theMemes.sort.volume");
    case MemesSort.HIGHEST_OFFER:
      return t(locale, "theMemes.sort.highestOffer");
    default:
      return assertUnhandled(sort, "MemesSort");
  }
}

export function getVolumeTypeLabel(
  volumeType: VolumeType,
  locale: SupportedLocale
): string {
  switch (volumeType) {
    case VolumeType.HOURS_24:
      return t(locale, "theMemes.volume.24Hours");
    case VolumeType.DAYS_7:
      return t(locale, "theMemes.volume.7Days");
    case VolumeType.DAYS_30:
      return t(locale, "theMemes.volume.30Days");
    case VolumeType.ALL_TIME:
      return t(locale, "theMemes.volume.allTime");
    default:
      return assertUnhandled(volumeType, "VolumeType");
  }
}
