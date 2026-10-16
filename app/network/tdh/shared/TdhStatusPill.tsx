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
  | "shownFalseEval"
  | "deferred"
  | "unverified"
  | "bundled"
  | "toBePublished"
  | "notPublished"
  | "unchecked"
  | "checked"
  | "openQuestion"
  | "netting"
  | "inDailyRun"
  | "followsLatest"
  | "builtNotInValidator"
  | "underTest";

/** A status tone: the pill's dot, and its row in the legend. */
export type TdhTone = PillTone | "refuted";

/**
 * One palette for every TDH status (plan §4.5), so a colour means the same
 * thing on every page:
 * - success: holds, is equal, or is in use now;
 * - primary: decided or machine-checked, not yet in use;
 * - warning: provisional, a proposal, not yet fully checked or published;
 * - refuted: a claim shown false;
 * - error: two independent computations disagree;
 * - neutral: for information.
 */
const PILL_TONE: Record<TdhPill, TdhTone> = {
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
  byDefinition: "success",
  proposal: "warning",
  checkedBuild: "success",
  checkedVectors: "neutral",
  shownFalse: "refuted",
  shownFalseEval: "refuted",
  deferred: "neutral",
  unverified: "warning",
  bundled: "neutral",
  toBePublished: "neutral",
  notPublished: "warning",
  unchecked: "warning",
  checked: "success",
  openQuestion: "warning",
  netting: "neutral",
  inDailyRun: "success",
  followsLatest: "success",
  builtNotInValidator: "primary",
  underTest: "warning",
};

export const TDH_TONE_DOT: Record<TdhTone, string> = {
  success: "tw-bg-success",
  primary: "tw-bg-primary-400",
  warning: "tw-bg-amber-400",
  refuted: "tw-bg-rose-400",
  error: "tw-bg-error",
  neutral: "tw-bg-iron-400",
};

/**
 * A pill's mark: a filled dot by default. The formal model's statuses come in
 * three colours, what holds, what was shown false and what is not covered,
 * and each method has a shape of its own, so they are told apart without
 * colour too: "by definition" a square, "checked at build" a diamond, "not
 * proved here" a hollow ring, and a claim shown false only by evaluation a
 * hollow ring in the refuted tone.
 */
type TdhMark = "dot" | "square" | "diamond" | "ring";

const PILL_MARK: Partial<Record<TdhPill, TdhMark>> = {
  byDefinition: "square",
  checkedBuild: "diamond",
  deferred: "ring",
  shownFalseEval: "ring",
};

const TONE_RING: Record<TdhTone, string> = {
  success: "tw-border-success",
  primary: "tw-border-primary-400",
  warning: "tw-border-amber-400",
  refuted: "tw-border-rose-400",
  error: "tw-border-error",
  neutral: "tw-border-iron-400",
};

function markClass(mark: TdhMark, tone: TdhTone): string {
  switch (mark) {
    case "square":
      return `tw-size-2 tw-rounded-[1px] ${TDH_TONE_DOT[tone]}`;
    case "diamond":
      return `tw-size-[7px] tw-rotate-45 tw-rounded-[1px] ${TDH_TONE_DOT[tone]}`;
    case "ring":
      return `tw-size-2 tw-rounded-full tw-border-[1.5px] tw-border-solid tw-bg-transparent ${TONE_RING[tone]}`;
    case "dot":
      return `tw-size-2 tw-rounded-full ${TDH_TONE_DOT[tone]}`;
  }
}

function tdhPillLabel(locale: SupportedLocale, pill: TdhPill): string {
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
  wrap = false,
}: {
  readonly pill: TdhPill;
  readonly locale: SupportedLocale;
  readonly size?: "sm" | "md";
  /** Let the label wrap in a narrow cell, instead of below 360 px only. */
  readonly wrap?: boolean;
}) {
  const tone = PILL_TONE[pill];
  return (
    <span
      className={`tw-inline-flex tw-max-w-full tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-font-medium tw-text-iron-100 ${
        size === "sm"
          ? "tw-px-2 tw-py-0.5 tw-text-xs"
          : "tw-px-2.5 tw-py-1 tw-text-xs sm:tw-text-sm"
      }`}
      data-tdh-pill={pill}
    >
      <span
        aria-hidden="true"
        className={`tw-shrink-0 ${markClass(PILL_MARK[pill] ?? "dot", tone)}`}
        data-tdh-mark={PILL_MARK[pill] ?? "dot"}
      />
      {/* One line; it wraps only in a window under 360 px. */}
      <span
        className={`tw-min-w-0 ${wrap ? "tw-whitespace-normal" : "tw-whitespace-nowrap max-[359px]:tw-whitespace-normal"}`}
      >
        {tdhPillLabel(locale, pill)}
      </span>
    </span>
  );
}

const LEGEND_TONES = [
  "success",
  "primary",
  "warning",
  "refuted",
  "neutral",
] as const;

/**
 * The status palette, in one line: what each dot colour means on every TDH
 * page. Pass the tones a section uses.
 */
export function TdhStatusLegend({
  locale,
  tones = LEGEND_TONES,
}: {
  readonly locale: SupportedLocale;
  readonly tones?: readonly TdhTone[];
}) {
  return (
    <ul
      className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-4 tw-gap-y-1.5 tw-p-0 tw-text-xs tw-leading-5 tw-text-iron-400"
      aria-label={t(locale, "network.tdh.shared.legend.label")}
    >
      {tones.map((tone) => (
        <li key={tone} className="tw-inline-flex tw-items-center tw-gap-1.5">
          <span
            aria-hidden="true"
            className={`tw-size-2 tw-shrink-0 tw-rounded-full ${TDH_TONE_DOT[tone]}`}
          />
          {t(locale, `network.tdh.shared.legend.${tone}` as MessageKey)}
        </li>
      ))}
    </ul>
  );
}
