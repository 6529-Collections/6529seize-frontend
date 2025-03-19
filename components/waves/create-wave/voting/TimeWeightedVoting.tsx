import { useState, useEffect } from "react";

type TimeUnit = "minutes" | "hours" | "days";

export interface TimeWeightedVotingConfig {
  enabled: boolean;
  snapshotGranularity: number;
  snapshotGranularityUnit: TimeUnit;
  averagingInterval: number;
  averagingIntervalUnit: TimeUnit;
}

interface TimeWeightedVotingProps {
  readonly config: TimeWeightedVotingConfig;
  readonly onChange: (config: TimeWeightedVotingConfig) => void;
}

// Constants for validation
const MAX_GRANULARITY = 24;
const MAX_INTERVAL = 72;

export default function TimeWeightedVoting({
  config,
  onChange,
}: TimeWeightedVotingProps) {
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<{
    granularity?: string;
    interval?: string;
    general?: string;
  }>({});

  // Validate the configuration whenever it changes
  useEffect(() => {
    if (!config.enabled) {
      setValidationErrors({});
      return;
    }

    const errors: { granularity?: string; interval?: string; general?: string } = {};

    // Validate granularity
    if (config.snapshotGranularity <= 0) {
      errors.granularity = "Must be greater than 0";
    } else if (config.snapshotGranularity > MAX_GRANULARITY && config.snapshotGranularityUnit === "hours") {
      errors.granularity = `Should not exceed ${MAX_GRANULARITY} hours`;
    }

    // Validate interval
    if (config.averagingInterval <= 0) {
      errors.interval = "Must be greater than 0";
    } else if (config.averagingInterval > MAX_INTERVAL && config.averagingIntervalUnit === "hours") {
      errors.interval = `Should not exceed ${MAX_INTERVAL} hours`;
    }

    // Calculate durations in minutes for comparison
    const getMinutes = (value: number, unit: TimeUnit): number => {
      switch (unit) {
        case "minutes": return value;
        case "hours": return value * 60;
        case "days": return value * 24 * 60;
      }
    };

    const granularityMinutes = getMinutes(config.snapshotGranularity, config.snapshotGranularityUnit);
    const intervalMinutes = getMinutes(config.averagingInterval, config.averagingIntervalUnit);

    // Validate the relationship between granularity and interval
    if (granularityMinutes >= intervalMinutes) {
      errors.general = "Averaging interval must be larger than snapshot granularity";
    }

    setValidationErrors(errors);
  }, [config]);

  const handleToggle = () => {
    onChange({
      ...config,
      enabled: !config.enabled,
    });
  };

  const handleSnapshotGranularityChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      onChange({
        ...config,
        snapshotGranularity: numValue,
      });
    }
  };

  const handleSnapshotGranularityUnitChange = (unit: TimeUnit) => {
    onChange({
      ...config,
      snapshotGranularityUnit: unit,
    });
  };

  const handleAveragingIntervalChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      onChange({
        ...config,
        averagingInterval: numValue,
      });
    }
  };

  const handleAveragingIntervalUnitChange = (unit: TimeUnit) => {
    onChange({
      ...config,
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
      <option value="days">Days</option>
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
        Protects against last-minute vote manipulation by using a time-averaged vote count instead of the final tally.
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
                htmlFor="snapshot-granularity"
                className="tw-block tw-text-sm tw-font-medium tw-text-iron-300 tw-mb-2"
              >
                Snapshot Granularity
              </label>
              <div className="tw-flex tw-items-center">
                <input
                  type="number"
                  id="snapshot-granularity"
                  min="1"
                  max={MAX_GRANULARITY}
                  value={config.snapshotGranularity}
                  onChange={(e) => handleSnapshotGranularityChange(e.target.value)}
                  className={`tw-px-3 tw-py-2 tw-bg-iron-800 tw-text-iron-50 tw-border tw-rounded-md tw-w-24 ${
                    validationErrors.granularity ? "tw-border-red-500" : "tw-border-iron-700"
                  }`}
                  aria-invalid={!!validationErrors.granularity}
                  aria-describedby="snapshot-granularity-description snapshot-granularity-error"
                />
                <TimeUnitSelector
                  id="snapshot-granularity-unit"
                  ariaLabel="Snapshot granularity time unit"
                  value={config.snapshotGranularityUnit}
                  onChange={handleSnapshotGranularityUnitChange}
                />
              </div>
              {validationErrors.granularity ? (
                <p id="snapshot-granularity-error" className="tw-text-xs tw-text-red-400 tw-mt-1">
                  {validationErrors.granularity}
                </p>
              ) : (
                <p id="snapshot-granularity-description" className="tw-text-xs tw-text-iron-400 tw-mt-1">
                  How often vote counts are recorded. Smaller values provide more precision but require more computation.
                </p>
              )}
            </div>

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
                  min="1"
                  max={MAX_INTERVAL}
                  value={config.averagingInterval}
                  onChange={(e) => handleAveragingIntervalChange(e.target.value)}
                  className={`tw-px-3 tw-py-2 tw-bg-iron-800 tw-text-iron-50 tw-border tw-rounded-md tw-w-24 ${
                    validationErrors.interval ? "tw-border-red-500" : "tw-border-iron-700"
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
                <p id="averaging-interval-error" className="tw-text-xs tw-text-red-400 tw-mt-1">
                  {validationErrors.interval}
                </p>
              ) : (
                <p id="averaging-interval-description" className="tw-text-xs tw-text-iron-400 tw-mt-1">
                  The time period over which votes are averaged. Longer intervals are more resistant to manipulation.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}