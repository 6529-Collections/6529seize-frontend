"use client";

import { CollectedCollectionType, CollectionSeized } from "@/entities/IProfile";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import type { ProfileCollectedFilters } from "../UserPageCollected";

const getNoCardsMessage = (filters: ProfileCollectedFilters): string => {
  if (filters.seized !== CollectionSeized.NOT_SEIZED) {
    return translate(DEFAULT_LOCALE, "user.collected.empty.noCards");
  }
  switch (filters.collection) {
    case null:
      return translate(DEFAULT_LOCALE, "user.collected.empty.fullSetter");
    case CollectedCollectionType.MEMES:
      if (filters.szn === null) {
        return translate(
          DEFAULT_LOCALE,
          "user.collected.empty.memesFullSetter"
        );
      }
      return translate(
        DEFAULT_LOCALE,
        "user.collected.empty.seasonFullSetter",
        { season: filters.szn.display }
      );
    case CollectedCollectionType.GRADIENTS:
      return translate(
        DEFAULT_LOCALE,
        "user.collected.empty.gradientFullSetter"
      );
    case CollectedCollectionType.MEMELAB:
      return translate(
        DEFAULT_LOCALE,
        "user.collected.empty.memeLabFullSetter"
      );
    case CollectedCollectionType.NEXTGEN:
      return translate(
        DEFAULT_LOCALE,
        "user.collected.empty.nextGenFullSetter"
      );
    case CollectedCollectionType.NETWORK:
      return translate(DEFAULT_LOCALE, "user.collected.networkCards.empty");
    default:
      assertUnreachable(filters.collection);
      return "";
  }
};

export default function UserPageCollectedCardsNoCards({
  filters,
}: {
  readonly filters: ProfileCollectedFilters;
}) {
  const msg = getNoCardsMessage(filters);

  return (
    <div
      role="status"
      className="tw-py-4 tw-text-sm tw-italic tw-text-iron-500"
    >
      {msg}
    </div>
  );
}
