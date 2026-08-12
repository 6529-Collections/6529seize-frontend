import { memo } from "react";
import { CREATE_WAVE_FORM_STYLES } from "../../utils/createWaveFormStyles";

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
const TimeWeightedToggle = memo(
  ({ enabled, onToggle }: TimeWeightedToggleProps) => (
    <>
      <div className="tw-flex tw-items-center tw-gap-3">
        <h3
          id="time-weighted-title"
          className={CREATE_WAVE_FORM_STYLES.sectionTitle}
        >
          Time-Weighted Voting
        </h3>
        <label
          htmlFor="toggle-time-weighted"
          className="tw-flex tw-min-h-6 tw-cursor-pointer tw-items-center"
        >
          <input
            type="checkbox"
            id="toggle-time-weighted"
            checked={enabled}
            onChange={onToggle}
            className="tw-peer tw-sr-only"
            aria-labelledby="time-weighted-title"
            aria-describedby="time-weighted-description"
            data-testid="time-weighted-toggle"
          />
          <span
            aria-hidden="true"
            className={`tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-500 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 ${
              enabled ? "tw-from-primary-300" : "tw-from-iron-600"
            }`}
          >
            <span
              className={`tw-relative tw-flex tw-h-5 tw-w-9 tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border-2 tw-border-transparent tw-p-0 tw-transition-colors tw-duration-200 tw-ease-in-out motion-reduce:tw-transition-none ${
                enabled ? "tw-bg-primary-500" : "tw-bg-iron-700"
              }`}
            >
              <span
                className={`tw-pointer-events-none tw-inline-block tw-size-4 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out motion-reduce:tw-transition-none ${
                  enabled ? "tw-translate-x-[18px]" : "tw-translate-x-0"
                }`}
              />
            </span>
          </span>
        </label>
      </div>

      <p
        id="time-weighted-description"
        className={`tw-mt-1 tw-text-pretty ${CREATE_WAVE_FORM_STYLES.supportingText}`}
      >
        Protects against last-minute vote manipulation by using a time-averaged
        vote count instead of the final tally. When enabled, votes are weighted
        based on when they were cast, making it harder to manipulate results at
        the end of voting.
      </p>
    </>
  )
);

TimeWeightedToggle.displayName = "TimeWeightedToggle";

export default TimeWeightedToggle;
