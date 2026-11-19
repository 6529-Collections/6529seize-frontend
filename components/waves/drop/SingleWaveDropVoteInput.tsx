"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { VoteNumericInput } from "@/components/voting/VoteNumericInput";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { SingleWaveDropVoteSize } from "./SingleWaveDropVote.types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface SingleWaveDropVoteInputProps {
  readonly voteValue: number | string;
  readonly minValue: number;
  readonly maxValue: number;
  readonly label: string;
  readonly setVoteValue: React.Dispatch<React.SetStateAction<string | number>>;
  readonly onSubmit: () => void;
  readonly size?: SingleWaveDropVoteSize | undefined;
}

const MEMETIC_VALUES: number[] = [
  -69420, -42069, -6529, -420, -69, 69, 420, 6529, 42069, 69420,
];

const QUICK_PERCENTAGES: number[] = [-100, -50, 50, 100];

const getCurrentTimeMs = (): number => Date.now();

const countDigits = (text: string): number => text.replaceAll(/\D/g, "").length;

/** The vote as shown in the field, grouped the way the viewer's locale groups digits. */
const formatVoteInputValue = (
  locale: SupportedLocale,
  value: number | string
): string => {
  if (value === "" || value === "-") {
    return value;
  }
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric)
    ? formatInteger(locale, numeric)
    : String(value);
};

/**
 * Removes the locale's digit grouping (and any spaces) from typed or pasted
 * text, so "5,000,000" (en) and "5.000.000" (de) both read as 5000000. A
 * decimal mark is left in place, and parsing stops at it as before.
 */
const removeDigitGrouping = (locale: SupportedLocale, text: string): string => {
  const group =
    new Intl.NumberFormat(locale)
      .formatToParts(11111)
      .find((part) => part.type === "group")?.value ?? ",";
  return text.replaceAll(group, "").replaceAll(/\s/g, "");
};

/** The caret position just after the `digits`-th digit of `text`. */
const getCaretAfterDigits = (text: string, digits: number): number => {
  if (digits <= 0) {
    return text.startsWith("-") ? 1 : 0;
  }
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (/\d/.test(text.charAt(index))) {
      seen += 1;
      if (seen === digits) {
        return index + 1;
      }
    }
  }
  return text.length;
};

export const SingleWaveDropVoteInput: React.FC<
  SingleWaveDropVoteInputProps
> = ({
  voteValue,
  setVoteValue,
  minValue,
  maxValue,
  label,
  onSubmit,
  size = SingleWaveDropVoteSize.NORMAL,
}) => {
  const locale = useBrowserLocale();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartTime = useRef<number | null>(null);
  const isPressed = useRef<boolean>(false);
  const voteValueRef = useRef<number | string>(voteValue);
  // Separators move as digits are typed, so remember how many digits sat
  // before the caret and restore that position after the reformat.
  const pendingCaretRef = useRef<{
    readonly input: HTMLInputElement;
    readonly digits: number;
  } | null>(null);
  // Counts edits, so the caret is restored even when an edit (deleting a
  // separator, say) leaves the value and its display unchanged.
  const [caretEdit, setCaretEdit] = useState(0);
  const displayValue = formatVoteInputValue(locale, voteValue);
  const allowsNegativeValues = minValue < 0;
  const quickPercentages = allowsNegativeValues
    ? QUICK_PERCENTAGES
    : QUICK_PERCENTAGES.filter((percentage) => percentage > 0);
  // Digits plus the grouping marks locales use (comma, period, spaces).
  const inputPattern = allowsNegativeValues
    ? String.raw`-?[0-9.,\s]*`
    : String.raw`[0-9.,\s]*`;
  const clampValue = (value: number) =>
    Math.min(Math.max(value, minValue), maxValue);

  const commitVoteValue = (nextValue: number | string) => {
    voteValueRef.current = nextValue;
    setVoteValue(nextValue);
  };

  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  };

  const calculateDelta = (elapsedSeconds: number) => {
    if (elapsedSeconds < 2) return 1;
    if (elapsedSeconds < 4) return 10;
    if (elapsedSeconds < 6) return 100;
    return 1000;
  };

  const findCrossingMemeticValue = (
    increment: boolean,
    currentValue: number,
    newValue: number
  ): number | null => {
    const possibleValues = MEMETIC_VALUES.filter((mv) =>
      increment
        ? mv > currentValue && mv <= newValue
        : mv < currentValue && mv >= newValue
    );
    if (possibleValues.length === 0) return null;
    return increment
      ? (possibleValues[0] ?? null)
      : (possibleValues.at(-1) ?? null);
  };

  const computeNextVoteValue = (
    previousValue: number | string,
    increment: boolean
  ) => {
    const currentValue = typeof previousValue === "string" ? 0 : previousValue;
    const now = getCurrentTimeMs();
    const elapsedSeconds = (now - (pressStartTime.current ?? now)) / 1000;
    const delta = calculateDelta(elapsedSeconds);
    const newValue = increment ? currentValue + delta : currentValue - delta;

    const crossingMemeticValue = findCrossingMemeticValue(
      increment,
      currentValue,
      newValue
    );

    if (crossingMemeticValue !== null) {
      return {
        nextValue: clampValue(crossingMemeticValue),
        crossedMemetic: true,
      };
    }

    const roundedValue = Math.round(newValue / delta) * delta;
    return { nextValue: clampValue(roundedValue), crossedMemetic: false };
  };

  const handleMemeticPause = (increment: boolean) => {
    clearTimers();
    pauseTimeoutRef.current = setTimeout(() => {
      if (isPressed.current) {
        intervalRef.current = setInterval(() => {
          updateValue(increment);
        }, 100);
      }
    }, 1000);
  };

  const updateValue = (increment: boolean) => {
    const { nextValue, crossedMemetic } = computeNextVoteValue(
      voteValueRef.current,
      increment
    );

    commitVoteValue(nextValue);

    if (crossedMemetic) {
      handleMemeticPause(increment);
    }
  };

  const handleQuickPercentage = (percentage: number) => {
    const value =
      percentage < 0
        ? (Math.abs(percentage) / 100) * minValue
        : (percentage / 100) * maxValue;
    commitVoteValue(Math.round(value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const caret = input.selectionStart ?? input.value.length;
    pendingCaretRef.current = {
      input,
      digits: countDigits(input.value.slice(0, caret)),
    };
    setCaretEdit((edit) => edit + 1);
    const inputValue = removeDigitGrouping(locale, input.value);

    if (inputValue === "") {
      commitVoteValue(inputValue);
      return;
    }

    if (inputValue === "-") {
      commitVoteValue(inputValue);
      return;
    }

    const value = parseInt(inputValue);
    if (isNaN(value)) return;
    commitVoteValue(clampValue(value));
  };

  const startPress = (increment: boolean) => {
    clearTimers();
    isPressed.current = true;
    pressStartTime.current = getCurrentTimeMs();

    updateValue(increment);

    intervalRef.current = setInterval(() => {
      updateValue(increment);
    }, 100);
  };

  const stopPress = () => {
    isPressed.current = false;
    clearTimers();
    pressStartTime.current = null;
  };

  useEffect(() => {
    voteValueRef.current = voteValue;
  }, [voteValue]);

  useLayoutEffect(() => {
    const pending = pendingCaretRef.current;
    pendingCaretRef.current = null;
    if (pending?.input !== document.activeElement) {
      return;
    }
    const position = getCaretAfterDigits(pending.input.value, pending.digits);
    pending.input.setSelectionRange(position, position);
  }, [caretEdit, displayValue]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const quickPercentageButtonClasses =
    "tw-text-iron-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-50";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  const isCompact = size === SingleWaveDropVoteSize.MINI;
  const stepControls = isCompact
    ? undefined
    : {
        decrease: (
          <button
            type="button"
            onPointerDown={() => startPress(false)}
            onPointerUp={stopPress}
            onPointerLeave={stopPress}
            onPointerCancel={stopPress}
            onLostPointerCapture={stopPress}
            onClick={(event) => {
              if (event.detail === 0) updateValue(false);
            }}
            aria-label={t(locale, "waves.vote.decreaseLabel")}
            className="tw-flex tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-self-stretch tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-rose-400/70 active:tw-bg-rose-500/15 active:tw-text-rose-300 desktop-hover:hover:tw-bg-rose-500/10 desktop-hover:hover:tw-text-rose-300"
          >
            <ArrowDownIcon
              aria-hidden="true"
              className="tw-size-[15px] tw-flex-shrink-0"
            />
          </button>
        ),
        increase: (
          <button
            type="button"
            onPointerDown={() => startPress(true)}
            onPointerUp={stopPress}
            onPointerLeave={stopPress}
            onPointerCancel={stopPress}
            onLostPointerCapture={stopPress}
            onClick={(event) => {
              if (event.detail === 0) updateValue(true);
            }}
            aria-label={t(locale, "waves.vote.increaseLabel")}
            className="tw-flex tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-self-stretch tw-border-y-0 tw-border-l tw-border-r-0 tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-emerald-400/70 active:tw-bg-emerald-500/15 active:tw-text-emerald-300 desktop-hover:hover:tw-bg-emerald-500/10 desktop-hover:hover:tw-text-emerald-300"
          >
            <ArrowUpIcon
              aria-hidden="true"
              className="tw-size-[15px] tw-flex-shrink-0"
            />
          </button>
        ),
      };

  return (
    <VoteNumericInput
      type="text"
      aria-label={t(locale, "competitions.voteValue")}
      pattern={inputPattern}
      inputMode="numeric"
      value={displayValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      unit={label}
      variant={isCompact ? "compact" : "default"}
      stepControls={stepControls}
      shortcuts={
        !isCompact && (
          <div className="tw-flex tw-w-full tw-gap-1.5">
            {quickPercentages.map((percentage) => (
              <button
                type="button"
                key={percentage}
                onClick={() => handleQuickPercentage(percentage)}
                className={`tw-min-w-0 tw-flex-1 tw-rounded tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-medium tw-transition-all active:tw-scale-[0.98] active:tw-bg-iron-650 desktop-hover:hover:tw-border-iron-650 desktop-hover:hover:tw-bg-iron-700 ${quickPercentageButtonClasses}`}
              >
                {percentage > 0 ? "+" : ""}
                {percentage}%
              </button>
            ))}
          </div>
        )
      }
    />
  );
};
