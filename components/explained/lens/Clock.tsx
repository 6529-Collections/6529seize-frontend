"use client";

import type { KeyboardEvent } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCount, formatUtcLongDay } from "@/lib/explained/format";
import { kt } from "../i18n";
import { EX_FOCUS } from "../tokens";
import { useWorld } from "./World";

/**
 * The clock (EXPLAINED.md §8.1): one time control per chapter, snapping to
 * cycles, that moves every model in its World. Cycle N is the result dated
 * N days after 1970-01-01, whose snapshot is the last block before 00:00 UTC
 * that day. Arrow keys move a day, Page Up and Down a week, Home and End to
 * the ends.
 */
const DAY_MS = 86_400_000;

export function dateOfCycle(cycle: number): string {
  return new Date(cycle * DAY_MS).toISOString().slice(0, 10);
}

export default function Clock({
  id,
  min,
  max,
  locale,
}: {
  /** `data-clock`, for the gates' states. */
  readonly id: string;
  readonly min: number;
  readonly max: number;
  readonly locale: SupportedLocale;
}) {
  const { state, set } = useWorld();
  const cycle = Math.min(max, Math.max(min, state.cycle));
  const move = (next: number) =>
    set({ cycle: Math.min(max, Math.max(min, next)) });
  const date = formatUtcLongDay(locale, dateOfCycle(cycle));
  const valueText = kt(locale, "explained.kit.clock.value", {
    date,
    cycle: formatCount(locale, cycle),
  });
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      PageDown: -7,
      PageUp: 7,
    };
    if (event.key in steps) {
      event.preventDefault();
      move(cycle + (steps[event.key] ?? 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      move(min);
    } else if (event.key === "End") {
      event.preventDefault();
      move(max);
    }
  };
  const share = (cycle - min) / Math.max(1, max - min);
  const stepButton = `tw-size-11 tw-flex-none tw-cursor-pointer tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-text-lg tw-font-semibold tw-text-iron-50 disabled:tw-cursor-not-allowed disabled:tw-text-iron-400 md:tw-size-[38px] ${EX_FOCUS}`;
  return (
    <div className="tw-flex tw-items-center tw-gap-3" data-clock={id}>
      <button
        type="button"
        className={stepButton}
        disabled={cycle <= min}
        onClick={() => move(cycle - 1)}
        aria-label={kt(locale, "explained.kit.clock.earlier")}
        data-clock-step="-1"
      >
        −
      </button>
      <div
        role="slider"
        tabIndex={0}
        aria-label={kt(locale, "explained.kit.clock.label")}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={cycle}
        aria-valuetext={valueText}
        onKeyDown={onKey}
        className={`tw-relative tw-h-11 tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-rounded-lg ${EX_FOCUS}`}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          move(
            Math.round(
              min + ((event.clientX - box.left) / box.width) * (max - min)
            )
          );
        }}
      >
        <span
          className="tw-absolute tw-inset-x-0 tw-top-1/2 tw-h-[3px] -tw-translate-y-1/2 tw-rounded-[3px] tw-bg-iron-700"
          aria-hidden="true"
        />
        <span
          className="tw-absolute tw-left-0 tw-top-1/2 tw-h-[3px] -tw-translate-y-1/2 tw-rounded-[3px] tw-bg-primary-400"
          style={{ width: `${share * 100}%` }}
          aria-hidden="true"
        />
        <span
          className="tw-absolute tw-top-1/2 tw-size-5 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-iron-50 tw-shadow-[0_0_0_5px_rgba(82,139,255,0.3)]"
          style={{ left: `${share * 100}%` }}
          aria-hidden="true"
        />
      </div>
      <button
        type="button"
        className={stepButton}
        disabled={cycle >= max}
        onClick={() => move(cycle + 1)}
        aria-label={kt(locale, "explained.kit.clock.later")}
        data-clock-step="1"
      >
        +
      </button>
      <output
        className="tw-min-w-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-50 max-md:tw-hidden md:tw-w-[200px]"
        aria-live="polite"
      >
        {valueText}
      </output>
    </div>
  );
}
