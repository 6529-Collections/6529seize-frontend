import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt, type KitKey } from "../i18n";

/**
 * Data provenance on figures (EXPLAINED.md §3): Real, with its source;
 * Example, dotted; What if, dashed; Simulated, rose, only on a failing day
 * or state. The tag is a small-caps word with its line under it, never a
 * bordered pill (SCORECARD §4).
 */
export type TagKind = "real" | "example" | "whatIf" | "simulated";

const WORD: Record<TagKind, KitKey> = {
  real: "explained.kit.tag.real",
  example: "explained.kit.tag.example",
  whatIf: "explained.kit.tag.whatIf",
  simulated: "explained.kit.tag.simulated",
};

const TONE: Record<TagKind, string> = {
  real: "tw-border-solid tw-border-iron-700 tw-text-iron-400",
  example: "tw-border-dotted tw-border-iron-700 tw-text-iron-400",
  whatIf: "tw-border-dashed tw-border-iron-700 tw-text-iron-400",
  simulated: "tw-border-solid tw-border-error/60 tw-text-error",
};

export default function Tag({
  kind,
  locale,
  children,
}: {
  readonly kind: TagKind;
  readonly locale: SupportedLocale;
  /** The tag's text, such as "Example records"; the kind's word by default. */
  readonly children?: ReactNode;
}) {
  return (
    <span
      className={`tw-inline-flex tw-items-center tw-border-0 tw-border-b tw-pb-px tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.1em] max-md:tw-whitespace-normal md:tw-whitespace-nowrap ${TONE[kind]}`}
      data-tag={kind}
    >
      {children ?? kt(locale, WORD[kind])}
    </span>
  );
}
