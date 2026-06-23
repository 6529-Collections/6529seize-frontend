import { formatRelativeTime } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { DistributionCollection } from "./distributions.types";

type DistributionsMessageKey = `user.collected.stats.distributions.${string}`;

const COLLECTION_LABEL_KEYS: Record<DistributionCollection, MessageKey> = {
  [DistributionCollection.MEMES]:
    "user.collected.stats.distributions.collections.memes",
  [DistributionCollection.GRADIENTS]:
    "user.collected.stats.distributions.collections.gradients",
  [DistributionCollection.MEMELAB]:
    "user.collected.stats.distributions.collections.memeLab",
};

const RELATIVE_TIME_UNITS = [
  { unit: "year", milliseconds: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", milliseconds: 30 * 24 * 60 * 60 * 1000 },
  { unit: "week", milliseconds: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", milliseconds: 24 * 60 * 60 * 1000 },
  { unit: "hour", milliseconds: 60 * 60 * 1000 },
  { unit: "minute", milliseconds: 60 * 1000 },
] as const;

export function getDistributionsMessage(
  key: DistributionsMessageKey,
  params?: Record<string, string | number>,
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  return t(locale, key as MessageKey, params);
}

export function getDistributionCollectionLabel(
  collection: DistributionCollection,
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  return t(locale, COLLECTION_LABEL_KEYS[collection]);
}

export function getDistributionTokenLinkLabel({
  collection,
  tokenId,
  locale = DEFAULT_LOCALE,
}: {
  readonly collection: DistributionCollection;
  readonly tokenId: number;
  readonly locale?: SupportedLocale | undefined;
}) {
  return getDistributionsMessage(
    "user.collected.stats.distributions.tokenLinkAriaLabel",
    {
      collection: getDistributionCollectionLabel(collection, locale),
      tokenId,
    },
    locale
  );
}

export function getDistributionPhaseLabel(
  phase: string,
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  if (phase.toUpperCase() === "AIRDROP") {
    return getDistributionsMessage(
      "user.collected.stats.distributions.phases.airdrop",
      undefined,
      locale
    );
  }

  return phase
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDistributionRelativeTime(
  date: string,
  now = Date.now(),
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) {
    return "-";
  }

  const elapsed = timestamp - now;
  const absoluteElapsed = Math.abs(elapsed);

  for (const { unit, milliseconds } of RELATIVE_TIME_UNITS) {
    if (absoluteElapsed >= milliseconds) {
      return formatRelativeTime(
        locale,
        Math.round(elapsed / milliseconds),
        unit
      );
    }
  }

  return formatRelativeTime(locale, 0, "second");
}
