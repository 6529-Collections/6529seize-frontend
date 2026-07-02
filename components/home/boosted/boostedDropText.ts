import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const getBoostedDropBoostLabel = (boosts: number): string =>
  t(
    DEFAULT_LOCALE,
    boosts === 1
      ? "home.boostedDrop.boostCount.one"
      : "home.boostedDrop.boostCount.many",
    { count: formatInteger(DEFAULT_LOCALE, boosts) }
  );

export const getBoostedDropAuthorLabel = (
  handle: string | null | undefined
): string => {
  const trimmedHandle = handle?.trim() ?? "";

  if (trimmedHandle.length > 0) {
    return trimmedHandle;
  }

  return t(DEFAULT_LOCALE, "home.boostedDrop.anonymousAuthor");
};

export const getBoostedDropOpenLabel = (
  authorHandle: string | null | undefined
): string =>
  t(DEFAULT_LOCALE, "home.boostedDrop.openDrop", {
    author: getBoostedDropAuthorLabel(authorHandle),
  });

export const getBoostedDropCompactAuthorLabel = (
  authorHandle: string | null | undefined
): string =>
  t(DEFAULT_LOCALE, "home.boostedDrop.compactAuthor", {
    author: getBoostedDropAuthorLabel(authorHandle),
  });
