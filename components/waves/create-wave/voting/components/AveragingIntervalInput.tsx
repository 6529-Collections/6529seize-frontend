"use client";

import { memo, useCallback } from "react";
import type { KeyboardEvent } from "react";
import type { TimeUnit } from "../types";
import { MAX_HOURS, MIN_MINUTES } from "../types";
import { parseWholeNumberInput } from "../utils";
import CreateWaveDropdown from "../../utils/CreateWaveDropdown";
import VotingSettingBox, {
  getVotingSettingInputClasses,
} from "../VotingSettingBox";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

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
  readonly validationError?: string | undefined;
}

/**
 * AveragingIntervalInput Component
 * Handles the input field for the averaging interval and associated unit selector
 */
const AveragingIntervalInput = memo(
  ({
    value,
    unit,
    onIntervalChange,
    onUnitChange,
    validationError,
  }: AveragingIntervalInputProps) => {
    const locale = useBrowserLocale();
    // Get minimum value based on current unit
    const minForCurrentUnit = unit === "minutes" ? MIN_MINUTES : 1;
    const hasError = validationError !== undefined;
    const hasValue = value !== "";
    const inputId = "averaging-interval";
    const errorId = "averaging-interval-error";
    const helpId = "averaging-interval-description";
    const timeUnitOptions: ReadonlyArray<{
      readonly value: TimeUnit;
      readonly label: string;
    }> = [
      {
        value: "minutes",
        label: t(locale, "waves.create.voting.timeUnit.minutes"),
      },
      {
        value: "hours",
        label: t(locale, "waves.create.voting.timeUnit.hours"),
      },
    ];

    /**
     * Handles the input field losing focus
     * Applies minimum constraints when the user finishes editing
     */
    const handleBlur = useCallback(() => {
      const numValue = parseWholeNumberInput(value);
      const isInvalid =
        value === "" || numValue === null || numValue < minForCurrentUnit;

      if (isInvalid) {
        // If invalid or below minimum, set to the minimum value for this unit
        onIntervalChange(minForCurrentUnit.toString());
      }
    }, [value, minForCurrentUnit, onIntervalChange]);

    /**
     * Handles keyboard events for the input field
     * Ensures proper accessibility for keyboard users
     */
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
      // Handle Enter key as blur
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    }, []);

    return (
      <VotingSettingBox
        errorId={errorId}
        errorMessage={validationError ?? ""}
        hasError={hasError}
        helpId={helpId}
        helpText={
          <>
            {t(locale, "waves.create.voting.averaging.description", {
              minMinutes: MIN_MINUTES,
              maxHours: MAX_HOURS,
            })}
          </>
        }
        inputId={inputId}
        label={t(locale, "waves.create.voting.averaging.label")}
        surface="plain"
      >
        <div className="tw-grid tw-gap-3 sm:tw-grid-cols-[minmax(0,1fr)_9rem]">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            id={inputId}
            value={value}
            onChange={(e) => onIntervalChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={getVotingSettingInputClasses({ hasError, hasValue })}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${errorId} ${helpId}` : helpId}
            data-testid="averaging-interval-input"
          />
          <CreateWaveDropdown
            value={unit}
            options={timeUnitOptions}
            ariaLabel={t(locale, "waves.create.voting.averaging.unitAriaLabel")}
            ariaDescribedBy={hasError ? `${errorId} ${helpId}` : helpId}
            ariaInvalid={hasError}
            dataTestId="time-unit-selector"
            hasError={hasError}
            accentValue={hasValue}
            onChange={onUnitChange}
          />
        </div>
      </VotingSettingBox>
    );
  }
);

AveragingIntervalInput.displayName = "AveragingIntervalInput";

export default AveragingIntervalInput;
