import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { PillTone } from "@/lib/tdh/verification/states";

export type TdhPill =
  | "equal"
  | "explained"
  | "investigating"
  | "mismatch"
  | "liveUnavailable"
  | "pending"
  | "unknown"
  | "decided"
  | "inSpec"
  | "proved"
  | "byDefinition"
  | "proposal"
  | "checkedBuild"
  | "checkedVectors"
  | "shownFalse"
  | "deferred"
  | "unverified"
  | "bundled"
  | "sample"
  | "unchecked"
  | "checked"
  | "openQuestion"
  | "netting";

const PILL_TONE: Record<TdhPill, PillTone> = {
  equal: "success",
  explained: "primary",
  investigating: "warning",
  mismatch: "error",
  liveUnavailable: "warning",
  pending: "neutral",
  unknown: "neutral",
  decided: "primary",
  inSpec: "success",
  proved: "success",
  byDefinition: "neutral",
  proposal: "warning",
  checkedBuild: "primary",
  checkedVectors: "neutral",
  shownFalse: "warning",
  deferred: "neutral",
  unverified: "warning",
  bundled: "neutral",
  sample: "warning",
  unchecked: "warning",
  checked: "success",
  openQuestion: "warning",
  netting: "warning",
};

const DOT: Record<PillTone, string> = {
  success: "tw-bg-success",
  primary: "tw-bg-primary-400",
  warning: "tw-bg-amber-400",
  error: "tw-bg-error",
  neutral: "tw-bg-iron-400",
};

export function tdhPillLabel(locale: SupportedLocale, pill: TdhPill): string {
  return t(locale, `network.tdh.shared.pill.${pill}` as MessageKey);
}

/**
 * A status pill (plan §4.5): a neutral chip with a coloured dot and a word, so
 * colour is never the only signal.
 */
export default function TdhStatusPill({
  pill,
  locale,
  size = "md",
}: {
  readonly pill: TdhPill;
  readonly locale: SupportedLocale;
  readonly size?: "sm" | "md";
}) {
  const tone = PILL_TONE[pill];
  return (
    <span
      className={`tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-font-medium tw-text-iron-100 ${
        size === "sm"
          ? "tw-px-2 tw-py-0.5 tw-text-xs"
          : "tw-px-2.5 tw-py-1 tw-text-xs sm:tw-text-sm"
      }`}
      data-tdh-pill={pill}
    >
      <span
        aria-hidden="true"
        className={`tw-size-2 tw-shrink-0 tw-rounded-full ${DOT[tone]}`}
      />
      {tdhPillLabel(locale, pill)}
    </span>
  );
}
