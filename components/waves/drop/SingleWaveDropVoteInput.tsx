"use client";

import React, { useEffect, useRef } from "react";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

const QUICK_PERCENTAGES: number[] = [-100, -75, -50, -25, 25, 50, 75, 100];
const MOBILE_QUICK_PERCENTAGES: number[] = [-75, -50, -25, 25, 50, 75];

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
  const allowsNegativeValues = minValue < 0;
  const quickPercentages = allowsNegativeValues
    ? QUICK_PERCENTAGES
    : QUICK_PERCENTAGES.filter((percentage) => percentage > 0);
  const mobileQuickPercentages = allowsNegativeValues
    ? MOBILE_QUICK_PERCENTAGES
    : MOBILE_QUICK_PERCENTAGES.filter((percentage) => percentage > 0);
  const inputPattern = allowsNegativeValues ? "-?[0-9]*" : "[0-9]*";

  const clampValue = (value: number) =>
    Math.min(Math.max(value, minValue), maxValue);

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
    const now = Date.now();
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
    let crossedMemetic = false;

    setVoteValue((previousValue) => {
      const { nextValue, crossedMemetic: hasCrossed } = computeNextVoteValue(
        previousValue,
        increment
      );
      crossedMemetic = hasCrossed;
      return nextValue!;
    });

    if (crossedMemetic) {
      handleMemeticPause(increment);
    }
  };

  const handleQuickPercentage = (percentage: number) => {
    const value =
      percentage < 0
        ? (Math.abs(percentage) / 100) * minValue
        : (percentage / 100) * maxValue;
    setVoteValue(Math.round(value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue === "") {
      setVoteValue(inputValue);
      return;
    }

    if (allowsNegativeValues && inputValue === "-") {
      setVoteValue(inputValue);
      return;
    }

    const value = parseInt(inputValue);
    if (isNaN(value)) return;
    setVoteValue(clampValue(value));
  };

  const startPress = (increment: boolean) => {
    clearTimers();
    isPressed.current = true;
    pressStartTime.current = Date.now();

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
    return () => {
      clearTimers();
    };
  }, []);

  const getQuickPercentageButtonClass = (
    percentage: number,
    currentVoteValue: number | string
  ) => {
    const targetValue = Math.round(
      percentage < 0
        ? (Math.abs(percentage) / 100) * minValue
        : (percentage / 100) * maxValue
    );

    const isSelected = Number(currentVoteValue) === targetValue;
    const isNegative = percentage < 0;

    if (isSelected) {
      return isNegative
        ? "tw-bg-rose-500/10 tw-text-rose-400"
        : "tw-bg-emerald-500/10 tw-text-emerald-400";
    }

    return isNegative
      ? "tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-text-rose-400 desktop-hover:hover:tw-bg-rose-500/5"
      : "tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-text-emerald-400 desktop-hover:hover:tw-bg-emerald-500/5";
  };

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
            className="tw-h-8 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-pr-12 tw-text-base tw-font-medium tw-text-iron-50 tw-placeholder-iron-400 tw-outline-none tw-transition-all tw-duration-300 tw-ease-out focus:tw-border-primary-400 focus:tw-bg-iron-950 desktop-hover:hover:tw-border-primary-400"
            value={voteValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <div className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-[11px] tw-text-iron-400">
            {label}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col">
      <div className="tw-flex tw-items-center tw-gap-2">
        <div className="tw-relative tw-w-full xl:tw-max-w-xs">
          <input
            type="text"
            pattern={inputPattern}
            inputMode="numeric"
            className="tw-h-10 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-pr-24 tw-text-base tw-font-medium tw-text-iron-50 tw-placeholder-iron-400 tw-outline-none tw-ring-1 tw-ring-iron-800 tw-transition-all focus:tw-bg-iron-950/80 focus:tw-ring-primary-400/50 desktop-hover:hover:tw-bg-iron-950/60 desktop-hover:hover:tw-ring-primary-400/30"
            value={voteValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <div className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-xs tw-text-iron-400">
            {label}
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <button
            onMouseDown={() => startPress(true)}
            onMouseUp={stopPress}
            onMouseLeave={stopPress}
            onTouchStart={() => startPress(true)}
            onTouchEnd={stopPress}
            className="tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-emerald-400 tw-ring-1 tw-ring-iron-800 tw-transition-all tw-duration-300 active:tw-scale-95 desktop-hover:hover:tw-scale-105 desktop-hover:hover:tw-bg-iron-800/90 desktop-hover:hover:tw-text-emerald-300 desktop-hover:hover:tw-ring-emerald-400/50"
          >
            <FontAwesomeIcon
              icon={faArrowUp}
              className="tw-h-4 tw-w-4 tw-flex-shrink-0"
            />
          </button>
          <button
            onMouseDown={() => startPress(false)}
            onMouseUp={stopPress}
            onMouseLeave={stopPress}
            onTouchStart={() => startPress(false)}
            onTouchEnd={stopPress}
            className="tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-rose-400 tw-ring-1 tw-ring-iron-800 tw-transition-all tw-duration-300 active:tw-scale-95 desktop-hover:hover:tw-scale-105 desktop-hover:hover:tw-bg-iron-800/90 desktop-hover:hover:tw-text-rose-300 desktop-hover:hover:tw-ring-rose-400/50"
          >
            <FontAwesomeIcon
              icon={faArrowDown}
              className="tw-h-4 tw-w-4 tw-flex-shrink-0"
            />
          </button>
        </div>
      </div>

      <div className="tw-mt-2 tw-flex tw-gap-1.5 tw-overflow-x-auto tw-scrollbar-none">
        <div className="tw-flex tw-gap-1.5 sm:tw-hidden">
          {mobileQuickPercentages.map((percentage) => (
            <button
              key={percentage}
              onClick={() => handleQuickPercentage(percentage)}
              className={`tw-flex-shrink-0 tw-rounded tw-border-0 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-transition-colors tw-duration-200 ${getQuickPercentageButtonClass(
                percentage,
                voteValue
              )}`}
            >
              {percentage > 0 ? "+" : ""}
              {percentage}%
            </button>
          ))}
        </div>

        <div className="tw-hidden tw-gap-1.5 sm:tw-flex">
          {quickPercentages.map((percentage) => (
            <button
              key={percentage}
              onClick={() => handleQuickPercentage(percentage)}
              className={`tw-flex-shrink-0 tw-rounded tw-border-0 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-transition-colors tw-duration-200 ${getQuickPercentageButtonClass(
                percentage,
                voteValue
              )}`}
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
