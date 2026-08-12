import { memo } from 'react';

interface TimeWeightedToggleProps {
  /** Whether time-weighted voting is enabled */
  readonly enabled: boolean;
  /** Handler called when the toggle is clicked */
  readonly onToggle: () => void;
}

/**
 * TimeWeightedToggle Component
 * Displays the title, toggle switch, and description for time-weighted voting
 */
const TimeWeightedToggle = memo(({
  enabled,
  onToggle,
}: TimeWeightedToggleProps) => (
  <>
    <div className="tw-flex tw-items-center tw-mb-4">
      <h3 className="tw-text-lg tw-font-semibold tw-text-iron-50 tw-mb-0 tw-mr-4" id="time-weighted-title">
        Time-Weighted Voting
      </h3>
      <div className="tw-relative tw-inline-block tw-w-12 tw-align-middle tw-select-none">
        <input
          type="checkbox"
          id="toggle-time-weighted"
          checked={enabled}
          onChange={onToggle}
          className="tw-sr-only"
          aria-labelledby="time-weighted-title"
          aria-describedby="time-weighted-description"
          data-testid="time-weighted-toggle"
        />
        <label
          htmlFor="toggle-time-weighted"
          className={`tw-block tw-overflow-hidden tw-h-6 tw-rounded-full tw-cursor-pointer ${
            enabled ? "tw-bg-blue-600" : "tw-bg-iron-700"
          }`}
          aria-hidden="true"
        >
          <span
            className={`tw-block tw-h-6 tw-w-6 tw-rounded-full tw-bg-white tw-transform tw-transition-transform ${
              enabled ? "tw-translate-x-6" : "tw-translate-x-0"
            }`}
          ></span>
        </label>
      </div>
    </div>

    <p id="time-weighted-description" className="tw-text-iron-400 tw-mb-4">
      Protects against last-minute vote manipulation by using a time-averaged
      vote count instead of the final tally. When enabled, votes are weighted based on 
      when they were cast, making it harder to manipulate results at the end of voting.
    </p>
  </>
));

TimeWeightedToggle.displayName = "TimeWeightedToggle";

export default TimeWeightedToggle;