"use client";

import { CollectedCollectionType, CollectionSeized } from "@/entities/IProfile";
import Button from "@/components/utils/button/Button";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import type { ProfileCollectedFilters } from "../UserPageCollected";

const getNoCardsMessage = (
  filters: ProfileCollectedFilters,
  locale: SupportedLocale
): string => {
  if (filters.collection === CollectedCollectionType.NETWORK) {
    return translate(locale, "user.collected.networkCards.empty");
  }
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
    default:
      assertUnreachable(filters.collection);
      return "";
  }
};

export default function UserPageCollectedCardsNoCards({
  filters,
  locale = DEFAULT_LOCALE,
  onClearFilters,
  isLoading = false,
}: {
  readonly filters: ProfileCollectedFilters;
  readonly locale?: SupportedLocale | undefined;
  readonly onClearFilters?: (() => void) | undefined;
  readonly isLoading?: boolean | undefined;
}) {
  const isNetwork = filters.collection === CollectedCollectionType.NETWORK;
  const hasActiveFilters =
    !filters.accountForConsolidations ||
    (isNetwork ? filters.subcollection !== null : filters.collection !== null);
  const clearActiveFilters = hasActiveFilters ? onClearFilters : undefined;
  const msg =
    clearActiveFilters && filters.seized !== CollectionSeized.NOT_SEIZED
      ? translate(locale, "user.collected.empty.filtered")
      : getNoCardsMessage(filters, locale);

  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-4 tw-py-4">
      <output
        tabIndex={-1}
        className="tw-block tw-text-meta/5 tw-font-normal tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        {msg}
      </output>
      {clearActiveFilters && (
        <Button
          variant="secondary"
          size="lg"
          loading={isLoading}
          onClick={clearActiveFilters}
        >
          {translate(locale, "user.collected.empty.clearFilters")}
        </Button>
      )}
    </div>
  );
}
