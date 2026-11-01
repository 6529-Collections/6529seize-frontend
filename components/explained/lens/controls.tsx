"use client";

import { useRef, type ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { EX_FOCUS } from "../tokens";

/**
 * The model controls (EXPLAINED.md §8.3 rule 2): every input has a button,
 * every drag has keys. Segmented buttons with aria-pressed, a stepper with
 * labelled − and +, and a slider that answers the arrow keys. 44 px targets
 * on a phone.
 */

export interface SegOption<V extends string> {
  readonly value: V;
  readonly label: ReactNode;
  /** An accessible name when the label is an image. */
  readonly name?: string;
}

/** Labels this long, together, wrap into ragged rows on a phone. */
const PHONE_STACK_CHARS = 30;

/** From this many options a group may wrap on a wide screen too. */
const MANY_OPTIONS = 7;

function labelLength(option: SegOption<string>): number {
  return typeof option.label === "string" ? option.label.length : 0;
}

/**
 * Segmented buttons. On a phone, a group whose labels would wrap into
 * ragged rows becomes separate chips, each with its own edge, that wrap
 * onto as many rows as they need: every label is whole and every option is
 * in view, with nothing scrolled off-screen. `phone` forces a layout
 * ("stack" lists one option a row, "wrap" lets short labels wrap).
 */
export function Seg<V extends string>({
  label,
  options,
  value,
  onChange,
  attr,
  phone = "auto",
}: {
  /** The group's accessible name: "Boost". */
  readonly label: string;
  readonly options: readonly SegOption<V>[];
  readonly value: V | null;
  readonly onChange: (value: V) => void;
  /** A data attribute carrying each option's value: "card" gives data-card="4". */
  readonly attr?: string;
  readonly phone?: "auto" | "stack" | "row" | "wrap";
}) {
  const chars = options.reduce((sum, option) => sum + labelLength(option), 0);
  let layout = phone;
  if (layout === "auto") {
    layout = options.length > 2 && chars > PHONE_STACK_CHARS ? "row" : "wrap";
  }
  const groupRef = useRef<HTMLDivElement>(null);
  const group = {
    wrap: "tw-inline-flex tw-flex-wrap tw-rounded-2xl",
    stack:
      "max-md:tw-flex max-md:tw-w-full max-md:tw-flex-col max-md:tw-rounded-xl md:tw-inline-flex md:tw-flex-wrap",
    row: "max-md:tw-flex max-md:tw-flex-wrap md:tw-inline-flex md:tw-flex-wrap",
  }[layout];
  const button = {
    wrap: "tw-grow tw-rounded-full",
    stack:
      "max-md:tw-w-full max-md:tw-rounded-lg max-md:tw-px-3.5 max-md:tw-text-left md:tw-rounded-full",
    row: "tw-rounded-full max-md:tw-text-left",
  }[layout];
  // Seven options or more can take two rows on a wide screen, and a phone's
  // long labels always can: there they are separate chips, each with its
  // own edge, not one pill that breaks.
  const many = options.length >= MANY_OPTIONS;
  const phoneChips = layout === "row";
  let frame =
    "tw-gap-0.5 tw-border tw-border-solid tw-border-iron-700 tw-p-[3px] md:tw-rounded-full";
  if (many) {
    frame = phoneChips
      ? "tw-gap-1.5"
      : "tw-gap-0.5 tw-border tw-border-solid tw-border-iron-700 tw-p-[3px] md:tw-gap-1.5 md:tw-border-0 md:tw-p-0";
  } else if (phoneChips) {
    frame =
      "max-md:tw-gap-1.5 md:tw-gap-0.5 md:tw-rounded-full md:tw-border md:tw-border-solid md:tw-border-iron-700 md:tw-p-[3px]";
  }
  let chip = "";
  if (many) {
    chip = phoneChips
      ? "tw-border tw-border-solid tw-border-iron-700"
      : "md:tw-border md:tw-border-solid md:tw-border-iron-700";
  } else if (phoneChips) {
    chip = "max-md:tw-border max-md:tw-border-solid max-md:tw-border-iron-700";
  }
  return (
    <div
      ref={groupRef}
      className={`${group} tw-min-w-0 tw-max-w-full ${frame}`}
      role="group"
      aria-label={label}
      data-seg-layout={layout}
    >
      {/* Options keep their whole label on one line and move to the next
          row first; one wider than the whole control wraps inside it. */}
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.value)}
            {...(option.name ? { "aria-label": option.name } : {})}
            {...(attr ? { [`data-${attr}`]: option.value } : {})}
            className={`tw-min-h-10 tw-max-w-full tw-shrink-0 tw-basis-auto tw-cursor-pointer tw-border-0 ${chip} tw-px-3 tw-py-1 tw-text-[13px] tw-font-semibold tw-leading-4 tw-transition-colors tw-duration-150 motion-reduce:tw-transition-none md:tw-min-h-9 md:tw-grow-0 md:tw-px-3.5 md:tw-text-sm ${button} ${on ? "tw-bg-iron-50 tw-text-iron-950" : "tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-50"} ${EX_FOCUS}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  locale,
  attr,
}: {
  /** What is counted: "Gradients". */
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onChange: (value: number) => void;
  readonly locale: SupportedLocale;
  /** A data attribute naming the stepper, for the gates' states. */
  readonly attr?: string;
}) {
  const button = `tw-size-11 tw-cursor-pointer tw-rounded-full tw-border-0 tw-bg-transparent tw-text-lg tw-font-semibold tw-text-iron-50 disabled:tw-cursor-not-allowed disabled:tw-text-iron-400 md:tw-size-[38px] ${EX_FOCUS}`;
  return (
    <span className="tw-inline-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
      <span
        className="tw-text-sm tw-font-semibold tw-text-iron-400"
        aria-hidden="true"
      >
        {label}
      </span>
      <span
        className="tw-inline-flex tw-shrink-0 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700"
        role="group"
        aria-label={label}
        {...(attr ? { "data-stepper": attr } : {})}
      >
        <button
          type="button"
          className={button}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={kt(locale, "explained.kit.lens.fewer", { what: label })}
        >
          −
        </button>
        <output
          className="tw-min-w-[34px] tw-text-center tw-font-semibold tw-text-iron-50"
          aria-live="polite"
        >
          {value}
        </output>
        <button
          type="button"
          className={button}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={kt(locale, "explained.kit.lens.more", { what: label })}
        >
          +
        </button>
      </span>
    </span>
  );
}

/**
 * A range input in the kit's look: the filled part blue, a white thumb with
 * a blue ring. Arrow keys step it; Page Up and Down take ten steps.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  valueText,
  attr,
}: {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly onChange: (value: number) => void;
  /** How a screen reader says the value: "100 whole days". */
  readonly valueText?: string;
  readonly attr?: string;
}) {
  const share = ((value - min) / Math.max(1, max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      {...(valueText ? { "aria-valuetext": valueText } : {})}
      {...(attr ? { "data-k": attr } : {})}
      onChange={(event) => onChange(Number(event.currentTarget.value))}
      className={`tw-m-0 tw-mt-1 tw-h-7 tw-w-full tw-cursor-pointer tw-appearance-none tw-bg-transparent [&::-moz-range-thumb]:tw-size-5 [&::-moz-range-thumb]:tw-rounded-full [&::-moz-range-thumb]:tw-border-0 [&::-moz-range-thumb]:tw-bg-iron-50 [&::-webkit-slider-runnable-track]:tw-h-[3px] [&::-webkit-slider-runnable-track]:tw-rounded-[3px] [&::-webkit-slider-runnable-track]:[background:linear-gradient(90deg,#528BFF_var(--ex-p),#37373E_var(--ex-p))] [&::-webkit-slider-thumb]:-tw-mt-[8.5px] [&::-webkit-slider-thumb]:tw-size-5 [&::-webkit-slider-thumb]:tw-appearance-none [&::-webkit-slider-thumb]:tw-rounded-full [&::-webkit-slider-thumb]:tw-bg-iron-50 [&::-webkit-slider-thumb]:tw-shadow-[0_0_0_5px_rgba(82,139,255,0.3)] ${EX_FOCUS}`}
      style={{ ["--ex-p" as string]: `${share}%` }}
    />
  );
}
