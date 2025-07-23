"use client"

import { memo, useCallback } from 'react';
import { TimeUnit, MIN_MINUTES } from '../types';
import TimeUnitSelector from './TimeUnitSelector';
import ValidationFeedback from './ValidationFeedback';

interface AveragingIntervalInputProps {
  /** Current value of the averaging interval */
  readonly value: string;
  /** Current time unit */
  readonly unit: TimeUnit;
  /** Handler called when the interval value changes */
  readonly onIntervalChange: (value: string) => void;
  /** Handler called when the unit changes */
  readonly onUnitChange: (unit: TimeUnit) => void;
  /** Validation error message, if any */
  readonly validationError?: string;
}

/**
 * AveragingIntervalInput Component
 * Handles the input field for the averaging interval and associated unit selector
 */
const AveragingIntervalInput = memo(({
  value,
  unit,
  onIntervalChange,
  onUnitChange,
  validationError,
}: AveragingIntervalInputProps) => {
  // Get minimum value based on current unit
  const minForCurrentUnit = unit === "minutes" ? MIN_MINUTES : 1;
  
  /**
   * Handles the input field losing focus
   * Applies minimum constraints when the user finishes editing
   */
  const handleBlur = useCallback(() => {
    // Parse and validate the input
    const numValue = parseInt(value, 10);
    const isInvalid = value === "" || isNaN(numValue) || numValue < minForCurrentUnit;
    
    if (isInvalid) {
      // If invalid or below minimum, set to the minimum value for this unit
      onIntervalChange(minForCurrentUnit.toString());
    }
  }, [value, minForCurrentUnit, onIntervalChange]);
  
  /**
   * Handles keyboard events for the input field
   * Ensures proper accessibility for keyboard users
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle Enter key as blur
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }, []);
  
  return (
    <div>
      <label
        htmlFor="averaging-interval"
        className="tw-block tw-text-sm tw-font-medium tw-text-iron-300 tw-mb-2"
      >
        Averaging Interval
      </label>
      <div className="tw-flex tw-items-center">
        <input
          type="number"
          id="averaging-interval"
          value={value}
          onChange={(e) => onIntervalChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`tw-px-3 tw-py-2 tw-bg-iron-800 tw-text-iron-50 tw-border tw-rounded-md tw-w-24 ${
            validationError
              ? "tw-border-red-500"
              : "tw-border-iron-700"
          }`}
          aria-invalid={!!validationError}
          aria-describedby="averaging-interval-description averaging-interval-error"
          data-testid="averaging-interval-input"
        />
        <TimeUnitSelector
          id="averaging-interval-unit"
          ariaLabel="Averaging interval time unit"
          value={unit}
          onUnitChange={onUnitChange}
        />
      </div>
      <ValidationFeedback error={validationError} />
    </div>
  );
});

AveragingIntervalInput.displayName = "AveragingIntervalInput";

export default AveragingIntervalInput;