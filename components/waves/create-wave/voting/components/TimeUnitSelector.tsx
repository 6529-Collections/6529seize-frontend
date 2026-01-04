import { memo } from "react";
import type { TimeUnit } from "../types";

interface TimeUnitSelectorProps {
  /** Currently selected time unit */
  readonly value: TimeUnit;
  /** Handler called when user selects a new unit */
  readonly onUnitChange: (unit: TimeUnit) => void;
  /** ID for the select element */
  readonly id: string;
  /** Accessible label for screen readers */
  readonly ariaLabel: string;
}

/**
 * TimeUnitSelector Component
 * Shows a dropdown with available time units (minutes/hours)
 */
const TimeUnitSelector = memo(
  ({ value, onUnitChange, id, ariaLabel }: TimeUnitSelectorProps) => {
    // Options for the time unit dropdown
    const timeUnitOptions: { value: TimeUnit; label: string }[] = [
      { value: "minutes", label: "Minutes" },
      { value: "hours", label: "Hours" },
    ];

    return (
      <select
        id={id}
        aria-label={ariaLabel}
        className="tw-px-3 tw-py-2 tw-bg-iron-800 tw-text-iron-50 tw-border tw-border-iron-700 tw-rounded-md tw-ml-2"
        value={value}
        onChange={(e) => {
          // Type assertion needed here as TypeScript can't infer the value is TimeUnit
          const selectedUnit = e.target.value as TimeUnit;
          onUnitChange(selectedUnit);
        }}
        data-testid="time-unit-selector"
      >
        {timeUnitOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

TimeUnitSelector.displayName = "TimeUnitSelector";

export default TimeUnitSelector;
