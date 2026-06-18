"use client";

import React, { useEffect, useRef } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { SingleWaveDropVoteSize } from "./SingleWaveDropVote.types";

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

const getInputShellClasses = (
  isPositiveVote: boolean,
  isNegativeVote: boolean
): string => {
  if (isPositiveVote) {
    return "tw-border-emerald-500/40 focus:tw-border-emerald-500/70 focus:tw-ring-1 focus:tw-ring-emerald-500/35 focus-within:tw-border-emerald-500/70 focus-within:tw-ring-1 focus-within:tw-ring-emerald-500/35";
  }

  if (isNegativeVote) {
    return "tw-border-rose-500/40 focus:tw-border-rose-500/70 focus:tw-ring-1 focus:tw-ring-rose-500/35 focus-within:tw-border-rose-500/70 focus-within:tw-ring-1 focus-within:tw-ring-rose-500/35";
  }

  return "tw-border-[#26272B] focus:tw-border-primary-400/60 focus:tw-ring-1 focus:tw-ring-primary-400/40 focus-within:tw-border-primary-400/60 focus-within:tw-ring-1 focus-within:tw-ring-primary-400/40";
};

const getInputTextClasses = (
  isPositiveVote: boolean,
  isNegativeVote: boolean
): string => {
  if (isPositiveVote) {
    return "tw-text-emerald-400";
  }

  if (isNegativeVote) {
    return "tw-text-rose-400";
  }

  return "tw-text-iron-50";
};

const getInputCaretClasses = (
  isPositiveVote: boolean,
  isNegativeVote: boolean
): string => {
  if (isPositiveVote) {
    return "tw-caret-emerald-400";
  }

  if (isNegativeVote) {
    return "tw-caret-rose-400";
  }

  return "tw-caret-primary-400";
};

const getInputLabelClasses = (
  isPositiveVote: boolean,
  isNegativeVote: boolean
): string => {
  if (isPositiveVote) {
    return "tw-text-emerald-500/70";
  }

  if (isNegativeVote) {
    return "tw-text-rose-500/70";
  }

  return "tw-text-iron-500";
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartTime = useRef<number | null>(null);
  const isPressed = useRef<boolean>(false);
  const voteValueRef = useRef<number | string>(voteValue);
  const allowsNegativeValues = minValue < 0;
  const quickPercentages = allowsNegativeValues
    ? QUICK_PERCENTAGES
    : QUICK_PERCENTAGES.filter((percentage) => percentage > 0);
  const mobileQuickPercentages = quickPercentages;
  const inputPattern = allowsNegativeValues ? "-?[0-9]*" : "[0-9]*";
  const numericVoteValue =
    typeof voteValue === "number" && Number.isFinite(voteValue)
      ? voteValue
      : Number(voteValue);
  const isPositiveVote =
    Number.isFinite(numericVoteValue) && numericVoteValue > 0;
  const isNegativeVote =
    Number.isFinite(numericVoteValue) && numericVoteValue < 0;
  const inputShellClasses = getInputShellClasses(
    isPositiveVote,
    isNegativeVote
  );
  const inputTextClasses = getInputTextClasses(isPositiveVote, isNegativeVote);
  const inputCaretClasses = getInputCaretClasses(
    isPositiveVote,
    isNegativeVote
  );
  const inputLabelClasses = getInputLabelClasses(
    isPositiveVote,
    isNegativeVote
  );

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
    const inputValue = e.target.value;

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

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const quickPercentageButtonClasses =
    "tw-text-[#93939F] desktop-hover:hover:tw-text-[#EFEFF1]";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  if (size === SingleWaveDropVoteSize.MINI) {
    return (
      <div className="tw-flex tw-items-center">
        <div className="tw-relative tw-h-full tw-w-full">
          <input
            type="text"
            pattern={inputPattern}
            inputMode="numeric"
            className={`tw-h-8 tw-w-full tw-rounded-md tw-border tw-border-solid tw-bg-[#0d0d10] tw-px-3 tw-pr-12 tw-text-base tw-font-semibold tw-placeholder-iron-500 tw-shadow-inner tw-outline-none tw-transition-all tw-duration-300 tw-ease-out ${inputShellClasses} ${inputTextClasses} ${inputCaretClasses}`}
            value={voteValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <div
            className={`tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-[11px] tw-transition-colors ${inputLabelClasses}`}
          >
            {label}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col">
      <div
        className={`tw-flex tw-h-11 tw-items-center tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-bg-[#0d0d10] tw-transition-colors ${inputShellClasses}`}
      >
        <button
          onMouseDown={() => startPress(false)}
          onMouseUp={stopPress}
          onMouseLeave={stopPress}
          onTouchStart={() => startPress(false)}
          onTouchEnd={stopPress}
          aria-label="Decrease vote"
          className="tw-flex tw-h-full tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-[#26272B] tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-colors active:tw-bg-rose-500/10 active:tw-text-rose-300 desktop-hover:hover:tw-bg-rose-500/5 desktop-hover:hover:tw-text-rose-300"
        >
          <ArrowDownIcon className="tw-size-[15px] tw-flex-shrink-0" />
        </button>

        <div className="tw-relative tw-flex tw-h-full tw-min-w-0 tw-flex-1 tw-items-center">
          <input
            type="text"
            pattern={inputPattern}
            inputMode="numeric"
            className={`tw-h-full tw-w-full tw-border-0 tw-bg-transparent tw-px-3 tw-py-0 tw-pr-14 tw-text-center tw-text-base tw-font-bold tw-placeholder-iron-500 tw-outline-none tw-transition-colors ${inputTextClasses} ${inputCaretClasses}`}
            value={voteValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <div
            className={`tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-[11px] tw-transition-colors ${inputLabelClasses}`}
          >
            {label}
          </div>
        </div>

        <button
          onMouseDown={() => startPress(true)}
          onMouseUp={stopPress}
          onMouseLeave={stopPress}
          onTouchStart={() => startPress(true)}
          onTouchEnd={stopPress}
          aria-label="Increase vote"
          className="tw-flex tw-h-full tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-border-y-0 tw-border-l tw-border-r-0 tw-border-solid tw-border-[#26272B] tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-colors active:tw-bg-emerald-500/10 active:tw-text-emerald-300 desktop-hover:hover:tw-bg-emerald-500/5 desktop-hover:hover:tw-text-emerald-300"
        >
          <ArrowUpIcon className="tw-size-[15px] tw-flex-shrink-0" />
        </button>
      </div>

      <div className="tw-mt-2 tw-w-full">
        <div className="tw-flex tw-w-full tw-gap-1.5 sm:tw-hidden">
          {mobileQuickPercentages.map((percentage) => (
            <button
              key={percentage}
              onClick={() => handleQuickPercentage(percentage)}
              className={`tw-min-w-0 tw-flex-1 tw-rounded tw-border-0 tw-bg-[#26272B] tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-medium tw-transition-all active:tw-scale-[0.98] active:tw-bg-[#4C4C55] desktop-hover:hover:tw-bg-[#37373E] ${quickPercentageButtonClasses}`}
            >
              {percentage > 0 ? "+" : ""}
              {percentage}%
            </button>
          ))}
        </div>

        <div className="tw-hidden tw-w-full tw-gap-1.5 sm:tw-flex">
          {quickPercentages.map((percentage) => (
            <button
              key={percentage}
              onClick={() => handleQuickPercentage(percentage)}
              className={`tw-min-w-0 tw-flex-1 tw-rounded tw-border-0 tw-bg-[#26272B] tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-medium tw-transition-all active:tw-scale-[0.98] active:tw-bg-[#4C4C55] desktop-hover:hover:tw-bg-[#37373E] ${quickPercentageButtonClasses}`}
            >
              {percentage > 0 ? "+" : ""}
              {percentage}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
