"use client";

import { useState, useEffect, useCallback } from "react";
import type { TimeWeightedVotingConfig, TimeUnit } from "./types";
import {
  convertToMinutes,
  convertFromMinutes,
  ensureValueInBounds,
} from "./utils";
import { TimeWeightedToggle, AveragingIntervalInput } from "./components";

/**
 * Props for the TimeWeightedVoting component
 */
interface TimeWeightedVotingProps {
  /** Current configuration for time-weighted voting */
  readonly config: TimeWeightedVotingConfig;
  /** Handler called when configuration changes */
  readonly onChange: (config: TimeWeightedVotingConfig) => void;
}

/**
 * TimeWeightedVoting Component
 * Main component that manages the state and orchestrates child components
 * Allows configuration of time-weighted voting settings
 */
export default function TimeWeightedVoting({
  config,
  onChange,
}: TimeWeightedVotingProps) {
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<{
    interval?: string | undefined;
    general?: string | undefined;
  }>({});

  // State for tracking input value during editing
  const [inputValue, setInputValue] = useState<string>(
    config.averagingInterval.toString()
  );

  // Update input value when config changes externally
  useEffect(() => {
    setInputValue(config.averagingInterval.toString());
  }, [config.averagingInterval]);

  // Validate the configuration whenever it changes
  useEffect(() => {
    // Skip validation if feature is disabled
    if (!config.enabled) {
      setValidationErrors({});
      return;
    }

    const errors: { interval?: string | undefined; general?: string | undefined } = {};

    // Use the utility function for conversion
    const valueInMinutes = convertToMinutes(
      config.averagingInterval,
      config.averagingIntervalUnit
    );

    // Validate minimum
    if (valueInMinutes < 5) {
      errors.interval = `Must be at least 5 minutes`;
    }

    // Validate maximum
    if (valueInMinutes > 24 * 60) {
      errors.interval = `Must not exceed 24 hours`;
    }

    setValidationErrors(errors);
  }, [config]);

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
      // Always allow empty string for editing flexibility
      setInputValue(value);

      // Don't update the config for empty string or invalid input
      if (value === "") {
        return;
      }

      // Parse input to number with validation
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) {
        return;
      }

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

  // Determine if there are any validation errors
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <section
      className="tw-mt-6 tw-border-t tw-border-iron-700 tw-pt-6"
      data-testid="time-weighted-voting">
      <TimeWeightedToggle enabled={config.enabled} onToggle={handleToggle} />

      {config.enabled && (
        <>
          {/* General error display */}
          {hasErrors && validationErrors.general && (
            <div
              className="tw-mb-4 tw-text-red-400 tw-text-sm tw-font-medium"
              role="alert"
              data-testid="general-error">
              {validationErrors.general}
            </div>
          )}

          {/* Configuration form */}
          <div className="tw-grid md:tw-grid-cols-2 tw-gap-6">
            <AveragingIntervalInput
              value={inputValue}
              unit={config.averagingIntervalUnit}
              onIntervalChange={handleIntervalChange}
              onUnitChange={handleUnitChange}
              validationError={validationErrors.interval}
            />
          </div>
        </>
      )}
    </section>
  );
}
