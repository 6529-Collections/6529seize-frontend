"use client";

import { useState, useCallback } from "react";
import type { TimeWeightedVotingConfig, TimeUnit } from "./types";
import {
  convertToMinutes,
  convertFromMinutes,
  ensureValueInBounds,
  parseWholeNumberInput,
} from "./utils";
import { TimeWeightedToggle, AveragingIntervalInput } from "./components";

/**
 * Props for the TimeWeightedVoting component
 */
interface TimeWeightedVotingProps {
  /** Current configuration for time-weighted voting */
  readonly config: TimeWeightedVotingConfig;
  /** Validation error from the parent wave flow */
  readonly errorMessage?: string | undefined;
  /** Handler called when configuration changes */
  readonly onChange: (config: TimeWeightedVotingConfig) => void;
  /** Whether to show the enable/disable toggle */
  readonly showToggle?: boolean;
}

const getIntervalValidationError = (
  config: TimeWeightedVotingConfig
): string | undefined => {
  if (!config.enabled) {
    return undefined;
  }

  const valueInMinutes = convertToMinutes(
    config.averagingInterval,
    config.averagingIntervalUnit
  );

  if (valueInMinutes < 5) {
    return "Must be at least 5 minutes";
  }

  if (valueInMinutes > 24 * 60) {
    return "Must not exceed 24 hours";
  }

  return undefined;
};

/**
 * TimeWeightedVoting Component
 * Main component that manages the state and orchestrates child components
 * Allows configuration of time-weighted voting settings
 */
export default function TimeWeightedVoting({
  config,
  errorMessage,
  onChange,
  showToggle = true,
}: TimeWeightedVotingProps) {
  // State for tracking input value during editing
  const [inputValue, setInputValue] = useState<string>(() =>
    config.averagingInterval.toString()
  );

  /**
   * Handles the toggle switch for enabling/disabling time-weighted voting
   */
  const handleToggle = useCallback(() => {
    onChange({
      ...config,
      enabled: !config.enabled,
    });
  }, [config, onChange]);

  /**
   * Handles the user changing the averaging interval input
   * Allows for temporarily empty fields during editing
   * Caps values at the maximum for the current unit
   */
  const handleIntervalChange = useCallback(
    (value: string) => {
      if (value === "") {
        setInputValue(value);
        return;
      }

      const numValue = parseWholeNumberInput(value);
      if (numValue === null) {
        return;
      }

      setInputValue(value);

      // Get maximum value for current unit
      const maxValueForUnit =
        config.averagingIntervalUnit === "minutes" ? 24 * 60 : 24;

      // Calculate an appropriate bounded value
      if (numValue <= maxValueForUnit) {
        // Within range, update normally (minimum will be enforced on blur)
        onChange({
          ...config,
          averagingInterval: numValue,
        });
      } else {
        // Exceeds maximum, cap at maximum
        const cappedValue = maxValueForUnit;
        setInputValue(cappedValue.toString());
        onChange({
          ...config,
          averagingInterval: cappedValue,
        });
      }
    },
    [config, onChange]
  );

  /**
   * Handles the user changing the time unit
   * Converts the current value to the new unit while maintaining the same time duration
   * Ensures the converted value is within the valid range for the new unit
   */
  const handleUnitChange = useCallback(
    (unit: TimeUnit) => {
      // If same unit, no conversion needed
      if (unit === config.averagingIntervalUnit) {
        return;
      }

      // First convert to minutes (as the common unit)
      const valueInMinutes = convertToMinutes(
        config.averagingInterval,
        config.averagingIntervalUnit
      );

      // Then convert to the target unit and ensure it's within bounds
      const newInterval = ensureValueInBounds(
        convertFromMinutes(valueInMinutes, unit),
        unit
      );

      // Update both the config and input value for consistency
      setInputValue(newInterval.toString());
      onChange({
        ...config,
        averagingInterval: newInterval,
        averagingIntervalUnit: unit,
      });
    },
    [config, onChange]
  );

  const intervalErrorMessage =
    errorMessage ?? getIntervalValidationError(config);
  const sectionClassName = showToggle
    ? "tw-mt-6 tw-border-t tw-border-iron-700 tw-pt-6"
    : undefined;

  return (
    <section
      className={sectionClassName}
      data-testid="time-weighted-voting"
    >
      {showToggle && (
        <TimeWeightedToggle enabled={config.enabled} onToggle={handleToggle} />
      )}

      {(config.enabled || !showToggle) && (
        <AveragingIntervalInput
          value={inputValue}
          unit={config.averagingIntervalUnit}
          onIntervalChange={handleIntervalChange}
          onUnitChange={handleUnitChange}
          validationError={intervalErrorMessage}
        />
      )}
    </section>
  );
}
