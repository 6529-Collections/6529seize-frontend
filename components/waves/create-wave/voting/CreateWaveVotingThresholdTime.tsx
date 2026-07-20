"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { parsePositiveWholeNumberInput } from "../utils/positiveWholeNumberInput";
import VotingSettingBox, {
  getVotingSettingInputClasses,
} from "./VotingSettingBox";

type ThresholdTimeUnit = "minutes" | "hours";

const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;

const getUnitMs = (unit: ThresholdTimeUnit): number =>
  unit === "hours" ? HOUR_IN_MS : MINUTE_IN_MS;

const getPreferredUnit = (
  thresholdTimeMs: number | null
): ThresholdTimeUnit => {
  if (
    thresholdTimeMs !== null &&
    Number.isInteger(thresholdTimeMs) &&
    thresholdTimeMs > 0 &&
    thresholdTimeMs % HOUR_IN_MS === 0
  ) {
    return "hours";
  }

  return "minutes";
};

const getDisplayValue = ({
  thresholdTimeMs,
  unit,
}: {
  readonly thresholdTimeMs: number | null;
  readonly unit: ThresholdTimeUnit;
}): string => {
  if (
    thresholdTimeMs === null ||
    !Number.isFinite(thresholdTimeMs) ||
    thresholdTimeMs <= 0
  ) {
    return "";
  }

  return (thresholdTimeMs / getUnitMs(unit)).toString();
};

export default function CreateWaveVotingThresholdTime({
  thresholdTimeMs,
  errorMessage,
  usesTimeWeightedScore = false,
  setThresholdTimeMs,
}: {
  readonly thresholdTimeMs: number | null;
  readonly errorMessage?: string | undefined;
  readonly usesTimeWeightedScore?: boolean | undefined;
  readonly setThresholdTimeMs: (thresholdTimeMs: number | null) => void;
}) {
  const [unit, setUnit] = useState<ThresholdTimeUnit>(() =>
    getPreferredUnit(thresholdTimeMs)
  );
  const [inputValue, setInputValue] = useState<string>(() =>
    getDisplayValue({
      thresholdTimeMs,
      unit: getPreferredUnit(thresholdTimeMs),
    })
  );
  const previousThresholdTimeMsRef = useRef(thresholdTimeMs);
  const pendingThresholdTimeMsRef = useRef<number | null | undefined>(
    undefined
  );
  const hasError = errorMessage !== undefined;
  const hasThresholdTime = inputValue !== "";
  const inputId = "approval-threshold-time";
  const errorId = "approval-threshold-time-error";
  const helpId = "approval-threshold-time-help";

  useEffect(() => {
    if (previousThresholdTimeMsRef.current === thresholdTimeMs) {
      return;
    }

    previousThresholdTimeMsRef.current = thresholdTimeMs;

    if (pendingThresholdTimeMsRef.current === thresholdTimeMs) {
      pendingThresholdTimeMsRef.current = undefined;
      return;
    }

    pendingThresholdTimeMsRef.current = undefined;
    setInputValue(getDisplayValue({ thresholdTimeMs, unit }));
  }, [thresholdTimeMs, unit]);

  const updateThresholdTimeMs = (value: string, nextUnit: ThresholdTimeUnit) => {
    const parsedValue = parsePositiveWholeNumberInput(value);
    const nextThresholdTimeMs =
      value.trim() === ""
        ? null
        : parsedValue !== null
          ? parsedValue * getUnitMs(nextUnit)
          : 0;

    pendingThresholdTimeMsRef.current =
      nextThresholdTimeMs === thresholdTimeMs ? undefined : nextThresholdTimeMs;
    setThresholdTimeMs(nextThresholdTimeMs);
  };

  const onThresholdTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;

    setInputValue(nextValue);
    updateThresholdTimeMs(nextValue, unit);
  };

  const onUnitChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextUnit = e.target.value as ThresholdTimeUnit;

    setUnit(nextUnit);
    updateThresholdTimeMs(inputValue, nextUnit);
  };

  return (
    <VotingSettingBox
      errorId={errorId}
      errorMessage={errorMessage ?? ""}
      hasError={hasError}
      helpId={helpId}
      helpText={
        <>
          Optional. Leave blank to approve as soon as the threshold is reached.
          Set a time to require the score to stay at or above the threshold.
          {usesTimeWeightedScore
            ? " This hold checks the time-weighted score."
            : null}
        </>
      }
      inputId={inputId}
      label="Minimum time above threshold"
    >
      <div className="tw-grid tw-gap-3 sm:tw-grid-cols-[minmax(0,1fr)_9rem]">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={inputValue}
          onChange={onThresholdTimeChange}
          id={inputId}
          className={getVotingSettingInputClasses({
            hasError,
            hasValue: hasThresholdTime,
          })}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${errorId} ${helpId}` : helpId}
        />
        <select
          value={unit}
          onChange={onUnitChange}
          aria-label="Minimum time above threshold unit"
          className={getVotingSettingInputClasses({
            hasError,
            hasValue: hasThresholdTime,
          })}
        >
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
        </select>
      </div>
    </VotingSettingBox>
  );
}
