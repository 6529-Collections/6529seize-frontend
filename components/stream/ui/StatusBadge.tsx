import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type {
  EditionAuctionPhase,
  EnglishAuctionState,
  FederatedStatus,
  StorageStatus,
  WorkVariant,
} from "@/lib/stream/types";

export type BadgeTone =
  | "live"
  | "warning"
  | "neutral"
  | "success"
  | "danger"
  | "info"
  | "muted";

/** The dot's color per tone; the text stays plain. */
const DOT_CLASSES: Readonly<Record<BadgeTone, string>> = {
  live: "tw-bg-success",
  warning: "tw-bg-amber-400",
  neutral: "tw-bg-iron-400",
  success: "tw-bg-primary-400",
  danger: "tw-bg-error",
  info: "tw-bg-iron-300",
  muted: "tw-bg-iron-600",
};

/**
 * A status in plain text with a small colored dot: no background, border or
 * pill shape (owner direction). The text carries the meaning; the dot is
 * decorative. Pass the label translated.
 */
export default function StatusBadge({
  tone,
  label,
  className = "",
}: {
  readonly tone: BadgeTone;
  readonly label: string;
  readonly className?: string;
}) {
  return (
    <span
      className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-200 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`tw-size-1.5 tw-flex-none tw-rounded-full ${DOT_CLASSES[tone]}`}
      />
      {label}
    </span>
  );
}

interface BadgeSpec {
  readonly tone: BadgeTone;
  readonly label: MessageKey;
}

const AUCTION_STATE: Readonly<Record<EnglishAuctionState, BadgeSpec>> = {
  NONE: { tone: "muted", label: "stream.badge.auction.none" },
  ACTIVE: { tone: "live", label: "stream.badge.auction.active" },
  PAUSED: { tone: "warning", label: "stream.badge.auction.paused" },
  ENDED: { tone: "neutral", label: "stream.badge.auction.ended" },
  SETTLED: { tone: "success", label: "stream.badge.auction.settled" },
  CANCELLED: { tone: "danger", label: "stream.badge.auction.cancelled" },
};

const EDITION_PHASE: Readonly<Record<EditionAuctionPhase, BadgeSpec>> = {
  opening: { tone: "muted", label: "stream.badge.edition.opening" },
  open: { tone: "live", label: "stream.badge.edition.open" },
  oneOfOneEnded: { tone: "live", label: "stream.badge.edition.oneOfOneEnded" },
  extended: { tone: "warning", label: "stream.badge.edition.extended" },
  disputed: { tone: "warning", label: "stream.badge.edition.disputed" },
  closed: { tone: "neutral", label: "stream.badge.edition.closed" },
  settling: { tone: "neutral", label: "stream.badge.edition.settling" },
  settled: { tone: "success", label: "stream.badge.edition.settled" },
  void: { tone: "danger", label: "stream.badge.edition.void" },
  noBids: { tone: "muted", label: "stream.badge.edition.noBids" },
};

const STORAGE: Readonly<Record<StorageStatus, BadgeSpec>> = {
  "on-chain": { tone: "success", label: "stream.badge.storage.onChain" },
  "partly-on-chain": { tone: "info", label: "stream.badge.storage.partly" },
  "off-chain": { tone: "neutral", label: "stream.badge.storage.offChain" },
};

const FEDERATED: Readonly<Record<FederatedStatus, BadgeSpec>> = {
  ACTIVE: { tone: "info", label: "stream.badge.federated.active" },
  DELISTED: { tone: "danger", label: "stream.badge.federated.delisted" },
};

const VARIANT: Readonly<Record<WorkVariant, BadgeSpec>> = {
  "stream-1of1": { tone: "neutral", label: "stream.variant.stream1of1" },
  "stream-edition": { tone: "neutral", label: "stream.variant.streamEdition" },
  "federated-721": { tone: "info", label: "stream.variant.federated721" },
  "federated-1155": { tone: "info", label: "stream.variant.federated1155" },
  "federated-pair-master": {
    tone: "info",
    label: "stream.variant.federatedPairMaster",
  },
  "federated-pair-edition": {
    tone: "info",
    label: "stream.variant.federatedPairEdition",
  },
};

export const auctionStateBadge = (state: EnglishAuctionState) =>
  AUCTION_STATE[state];
export const editionPhaseBadge = (phase: EditionAuctionPhase) =>
  EDITION_PHASE[phase];
export const storageBadge = (storage: StorageStatus) => STORAGE[storage];
export const federatedStatusBadge = (status: FederatedStatus) =>
  FEDERATED[status];
export const variantBadge = (variant: WorkVariant) => VARIANT[variant];

/** Renders a badge spec in a locale. */
export function SpecBadge({
  spec,
  locale,
}: {
  readonly spec: BadgeSpec;
  readonly locale: SupportedLocale;
}) {
  return <StatusBadge tone={spec.tone} label={t(locale, spec.label)} />;
}
