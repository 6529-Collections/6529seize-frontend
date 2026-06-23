"use client";

import { CollectedCollectionType, CollectionSeized } from "@/entities/IProfile";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import type { ProfileCollectedFilters } from "../UserPageCollected";

const getNoCardsMessage = (
  filters: ProfileCollectedFilters,
  locale: SupportedLocale
): string => {
  if (filters.seized !== CollectionSeized.NOT_SEIZED) {
    return translate(locale, "user.collected.empty.noCards");
  }
  switch (filters.collection) {
    case null:
      return translate(locale, "user.collected.empty.fullSetter");
    case CollectedCollectionType.MEMES:
      if (filters.szn === null) {
        return translate(locale, "user.collected.empty.memesFullSetter");
      }
      return translate(locale, "user.collected.empty.seasonFullSetter", {
        season: filters.szn.display,
      });
    case CollectedCollectionType.GRADIENTS:
      return translate(locale, "user.collected.empty.gradientFullSetter");
    case CollectedCollectionType.MEMELAB:
      return translate(locale, "user.collected.empty.memeLabFullSetter");
    case CollectedCollectionType.NEXTGEN:
      return translate(locale, "user.collected.empty.nextGenFullSetter");
    case CollectedCollectionType.NETWORK:
      return translate(locale, "user.collected.networkCards.empty");
    default:
      assertUnreachable(filters.collection);
      return "";
  }
};

export default function UserPageCollectedCardsNoCards({
  filters,
  locale = DEFAULT_LOCALE,
}: {
  readonly filters: ProfileCollectedFilters;
  readonly locale?: SupportedLocale | undefined;
}) {
  const msg = getNoCardsMessage(filters, locale);

  return (
    <output className="tw-block tw-py-4 tw-text-sm tw-italic tw-text-iron-500">
      {msg}
    </output>
  );
}
