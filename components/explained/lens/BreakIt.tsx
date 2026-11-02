"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { Icon } from "../marks/glyphs";
import { EX_FOCUS } from "../tokens";

/**
 * Break it (EXPLAINED.md §8.1): one dashed button per model, named for its
 * edge case. Pressed, it drives the model to where the rule bites and the
 * lens turns rose-edged; pressed again, the model is restored.
 */
export function breakItLabel(locale: SupportedLocale, edge: string): string {
  return kt(locale, "explained.kit.lens.breakIt", { edge });
}

export default function BreakIt({
  id,
  pressed,
  onToggle,
  label,
  plain = false,
}: {
  /** `data-break`: the edge's id, for the gates' states. */
  readonly id: string;
  readonly pressed: boolean;
  readonly onToggle: () => void;
  /** The whole visible text: "Break it: sell it" (see breakItLabel). */
  readonly label: string;
  /** A switch that is not a Break it of the model itself ("Show a day that fails"). */
  readonly plain?: boolean;
}) {
  return (
    <button
      type="button"
      className={`tw-inline-flex tw-min-h-[38px] tw-cursor-pointer tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded-full tw-border-[1.5px] tw-border-dashed tw-px-4 tw-text-sm tw-font-semibold max-md:tw-min-h-11 max-md:tw-whitespace-normal ${pressed ? "tw-border-error tw-bg-error/[0.09] tw-text-error" : "tw-border-iron-400 tw-bg-transparent tw-text-iron-50 hover:tw-border-iron-300"} ${EX_FOCUS}`}
      aria-pressed={pressed}
      onClick={onToggle}
      data-break={id}
      data-break-kind={plain ? "switch" : "model"}
    >
      <Icon kind="break" className="tw-size-3.5" />
      <span>{label}</span>
    </button>
  );
}
