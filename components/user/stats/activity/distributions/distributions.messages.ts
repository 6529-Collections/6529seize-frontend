import { formatRelativeTime } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
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
  params?: Record<string, string | number>
) {
  return t(DEFAULT_LOCALE, key as MessageKey, params);
}

export function getDistributionCollectionLabel(
  collection: DistributionCollection
) {
  return t(DEFAULT_LOCALE, COLLECTION_LABEL_KEYS[collection]);
}

export function getDistributionTokenLinkLabel({
  collection,
  tokenId,
}: {
  readonly collection: DistributionCollection;
  readonly tokenId: number;
}) {
  return getDistributionsMessage(
    "user.collected.stats.distributions.tokenLinkAriaLabel",
    {
      collection: getDistributionCollectionLabel(collection),
      tokenId,
    }
  );
}

export function getDistributionPhaseLabel(phase: string) {
  if (phase.toUpperCase() === "AIRDROP") {
    return getDistributionsMessage(
      "user.collected.stats.distributions.phases.airdrop"
    );
  }

  return phase
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDistributionRelativeTime(date: string, now = Date.now()) {
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) {
    return "-";
  }

  const elapsed = timestamp - now;
  const absoluteElapsed = Math.abs(elapsed);

  for (const { unit, milliseconds } of RELATIVE_TIME_UNITS) {
    if (absoluteElapsed >= milliseconds) {
      return formatRelativeTime(
        DEFAULT_LOCALE,
        Math.round(elapsed / milliseconds),
        unit
      );
    }
  }

  return formatRelativeTime(DEFAULT_LOCALE, 0, "second");
}
