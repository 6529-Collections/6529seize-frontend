import { useState, useEffect } from "react";

type TimeUnit = "minutes" | "hours";

export interface TimeWeightedVotingConfig {
  enabled: boolean;
  averagingInterval: number;
  averagingIntervalUnit: TimeUnit;
}

interface TimeWeightedVotingProps {
  readonly config: TimeWeightedVotingConfig;
  readonly onChange: (config: TimeWeightedVotingConfig) => void;
}

export default function TimeWeightedVoting({
  config,
  onChange,
}: TimeWeightedVotingProps) {
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<{
    interval?: string;
    general?: string;
  }>({});
  
  // State for tracking input value during editing
  const [inputValue, setInputValue] = useState<string>(config.averagingInterval.toString());

  // Constants for validation
  const MIN_MINUTES = 5;
  const MAX_HOURS = 24;
  const MAX_MINUTES = MAX_HOURS * 60;
  
  // Update input value when config changes externally
  useEffect(() => {
    setInputValue(config.averagingInterval.toString());
  }, [config.averagingInterval]);

  // Validate the configuration whenever it changes
  useEffect(() => {
    if (!config.enabled) {
      setValidationErrors({});
      return;
    }

    const errors: { interval?: string; general?: string } = {};

    // Convert current setting to minutes for comparison
    const currentValueInMinutes = config.averagingIntervalUnit === "minutes" 
      ? config.averagingInterval 
      : config.averagingInterval * 60;

    // Validate minimum
    if (currentValueInMinutes < MIN_MINUTES) {
      errors.interval = `Must be at least ${MIN_MINUTES} minutes`;
    }
    
    // Validate maximum
    if (currentValueInMinutes > MAX_MINUTES) {
      errors.interval = `Must not exceed ${MAX_HOURS} hours`;
    }

    setValidationErrors(errors);
  }, [config]);

  const handleToggle = () => {
    onChange({
      ...config,
      enabled: !config.enabled,
    });
  };

  const handleAveragingIntervalChange = (value: string) => {
    // Prevent extremely large inputs by limiting length
    if (value !== "" && value.length > 5) {
      return;
    }
    
    // Update the input value to allow for empty field during editing
    setInputValue(value);
    
    // If empty string, don't update the config yet
    if (value === "") {
      return;
    }
    
    const numValue = parseInt(value, 10);
    
    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      // Apply constraints based on the current unit
      if (config.averagingIntervalUnit === "minutes") {
        // For minutes, don't apply minimum yet to allow typing, but cap at maximum
        if (numValue <= MAX_MINUTES) {
          onChange({
            ...config,
            averagingInterval: numValue,
          });
        } else {
          // If exceeds maximum, update input to maximum
          setInputValue(MAX_MINUTES.toString());
          onChange({
            ...config,
            averagingInterval: MAX_MINUTES,
          });
        }
      } else if (config.averagingIntervalUnit === "hours") {
        // For hours, don't apply minimum yet to allow typing, but cap at maximum
        if (numValue <= MAX_HOURS) {
          onChange({
            ...config,
            averagingInterval: numValue,
          });
        } else {
          // If exceeds maximum, update input to maximum
          setInputValue(MAX_HOURS.toString());
          onChange({
            ...config,
            averagingInterval: MAX_HOURS,
          });
        }
      }
    }
  };

  const handleAveragingIntervalUnitChange = (unit: TimeUnit) => {
    let newInterval = config.averagingInterval;
    
    // Handle unit conversion and enforce limits
    if (unit === "hours" && config.averagingIntervalUnit === "minutes") {
      // Converting from minutes to hours
      newInterval = Math.floor(config.averagingInterval / 60);
      // Ensure minimum 1 hour if converting from minutes
      newInterval = Math.max(1, newInterval);
      // Ensure maximum 24 hours
      newInterval = Math.min(MAX_HOURS, newInterval);
    } else if (unit === "minutes" && config.averagingIntervalUnit === "hours") {
      // Converting from hours to minutes
      newInterval = config.averagingInterval * 60;
      // Ensure maximum 24 hours worth of minutes
      newInterval = Math.min(MAX_MINUTES, newInterval);
    }
    
    onChange({
      ...config,
      averagingInterval: newInterval,
      averagingIntervalUnit: unit,
    });
  };

  // Helper component for time unit selector
  const TimeUnitSelector = ({
    value,
    onChange,
    id,
    ariaLabel,
  }: {
    value: TimeUnit;
    onChange: (unit: TimeUnit) => void;
    id: string;
    ariaLabel: string;
  }) => (
    <select
      id={id}
      aria-label={ariaLabel}
      className="tw-px-3 tw-py-2 tw-bg-iron-800 tw-text-iron-50 tw-border tw-border-iron-700 tw-rounded-md tw-ml-2"
      value={value}
      onChange={(e) => onChange(e.target.value as TimeUnit)}
    >
      <option value="minutes">Minutes</option>
      <option value="hours">Hours</option>
    </select>
  );

  // Determine if there are any validation errors
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="tw-mt-6 tw-border-t tw-border-iron-700 tw-pt-6">
      <div className="tw-flex tw-items-center tw-mb-4">
        <h3 className="tw-text-lg tw-font-semibold tw-text-iron-50 tw-mb-0 tw-mr-4">
          Time-Weighted Voting
        </h3>
        <div className="tw-relative tw-inline-block tw-w-12 tw-align-middle tw-select-none">
          <input
            type="checkbox"
            id="toggle-time-weighted"
            checked={config.enabled}
            onChange={handleToggle}
            className="tw-sr-only"
            aria-labelledby="time-weighted-label"
          />
          <label
            id="time-weighted-label"
            htmlFor="toggle-time-weighted"
            className={`tw-block tw-overflow-hidden tw-h-6 tw-rounded-full tw-cursor-pointer ${
              config.enabled ? "tw-bg-blue-600" : "tw-bg-iron-700"
            }`}
            aria-hidden="true"
          >
            <span
              className={`tw-block tw-h-6 tw-w-6 tw-rounded-full tw-bg-white tw-transform tw-transition-transform ${
                config.enabled ? "tw-translate-x-6" : "tw-translate-x-0"
              }`}
            ></span>
          </label>
        </div>
      </div>

      <p className="tw-text-iron-400 tw-mb-4">
        Protects against last-minute vote manipulation by using a time-averaged
        vote count instead of the final tally.
      </p>

      {config.enabled && (
        <>
          {hasErrors && (
            <div className="tw-mb-4 tw-text-red-400 tw-text-sm tw-font-medium">
              {validationErrors.general}
            </div>
          )}

          <div className="tw-grid md:tw-grid-cols-2 tw-gap-6">
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
                  // Don't use min/max to allow for empty field during typing
                  value={inputValue}
                  onChange={(e) =>
                    handleAveragingIntervalChange(e.target.value)
                  }
                  // Handle blur event to apply constraints when user finishes editing
                  onBlur={() => {
                    // Apply min constraints when focus is lost
                    const numValue = parseInt(inputValue, 10);
                    if (inputValue === "" || isNaN(numValue) || numValue < (config.averagingIntervalUnit === "minutes" ? MIN_MINUTES : 1)) {
                      // Set to minimum if below minimum or invalid
                      const minValue = config.averagingIntervalUnit === "minutes" ? MIN_MINUTES : 1;
                      setInputValue(minValue.toString());
                      onChange({
                        ...config,
                        averagingInterval: minValue,
                      });
                    }
                  }}
                  className={`tw-px-3 tw-py-2 tw-bg-iron-800 tw-text-iron-50 tw-border tw-rounded-md tw-w-24 ${
                    validationErrors.interval
                      ? "tw-border-red-500"
                      : "tw-border-iron-700"
                  }`}
                  aria-invalid={!!validationErrors.interval}
                  aria-describedby="averaging-interval-description averaging-interval-error"
                />
                <TimeUnitSelector
                  id="averaging-interval-unit"
                  ariaLabel="Averaging interval time unit"
                  value={config.averagingIntervalUnit}
                  onChange={handleAveragingIntervalUnitChange}
                />
              </div>
              {validationErrors.interval ? (
                <p
                  id="averaging-interval-error"
                  className="tw-text-xs tw-text-red-400 tw-mt-1"
                >
                  {validationErrors.interval}
                </p>
              ) : (
                <p
                  id="averaging-interval-description"
                  className="tw-text-xs tw-text-iron-400 tw-mt-1"
                >
                  The time period over which votes are averaged. Must be between {MIN_MINUTES} minutes 
                  and {MAX_HOURS} hours. Longer intervals are more resistant to manipulation.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
