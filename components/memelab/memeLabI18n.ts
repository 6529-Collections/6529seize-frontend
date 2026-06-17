import { type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MemeLabSort } from "@/types/enums";

function assertUnhandled(value: never, label: string): never {
  throw new Error(`Unhandled ${label}: ${String(value)}`);
}

export function getMemeLabSortLabel(
  sort: MemeLabSort,
  locale: SupportedLocale
): string {
  switch (sort) {
    case MemeLabSort.AGE:
      return t(locale, "memeLab.sort.age");
    case MemeLabSort.EDITION_SIZE:
      return t(locale, "memeLab.sort.editionSize");
    case MemeLabSort.ARTISTS:
      return t(locale, "memeLab.sort.artists");
    case MemeLabSort.COLLECTIONS:
      return t(locale, "memeLab.sort.collections");
    case MemeLabSort.HODLERS:
      return t(locale, "memeLab.sort.collectors");
    case MemeLabSort.UNIQUE_PERCENT:
      return t(locale, "memeLab.sort.uniquePercent");
    case MemeLabSort.UNIQUE_PERCENT_EX_MUSEUM:
      return t(locale, "memeLab.sort.uniquePercentExMuseum");
    case MemeLabSort.FLOOR_PRICE:
      return t(locale, "memeLab.sort.floorPrice");
    case MemeLabSort.MARKET_CAP:
      return t(locale, "memeLab.sort.marketCap");
    case MemeLabSort.VOLUME:
      return t(locale, "memeLab.sort.volume");
    case MemeLabSort.HIGHEST_OFFER:
      return t(locale, "memeLab.sort.highestOffer");
    default:
      return assertUnhandled(sort, "MemeLabSort");
  }
}
