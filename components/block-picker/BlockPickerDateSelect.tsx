import { faCalendarDays, faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function BlockPickerDateSelect({
  date,
  setDate,
  time,
  setTime,
}: {
  date: string;
  setDate: (date: string) => void;
  time: string;
  setTime: (time: string) => void;
}) {
  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-4 sm:tw-flex-row">
      <div className="tw-w-full">
        <label
          htmlFor="block-picker-date"
          className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300"
        >
          Select date
        </label>
        <div className="tw-relative tw-mt-1.5">
          <input
            type="date"
            name="block-picker-date"
            id="block-picker-date"
            value={date}
            required
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker()}
            className="tw-form-input tw-block tw-w-full tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-3 tw-pr-11 tw-text-base tw-font-light tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out [color-scheme:dark] placeholder:tw-text-iron-500 hover:tw-ring-iron-600 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6 [&::-webkit-calendar-picker-indicator]:tw-pointer-events-none [&::-webkit-calendar-picker-indicator]:tw-opacity-0"
          />
          <FontAwesomeIcon
            icon={faCalendarDays}
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-right-3.5 tw-top-1/2 tw-size-4 tw--translate-y-1/2 tw-text-iron-300"
          />
        </div>
      </div>
      <div className="tw-w-full">
        <label
          htmlFor="block-picker-time"
          className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300"
        >
          Select time
        </label>
        <div className="tw-relative tw-mt-1.5">
          <input
            type="time"
            step="1"
            name="block-picker-time"
            id="block-picker-time"
            value={time}
            required
            disabled={!date}
            onChange={(e) => setTime(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker()}
            className="tw-peer tw-form-input tw-block tw-w-full tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-3 tw-pr-11 tw-text-base tw-font-light tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out [color-scheme:dark] placeholder:tw-text-iron-500 hover:tw-ring-iron-600 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-900/60 disabled:tw-text-iron-600 disabled:tw-ring-iron-800 sm:tw-leading-6 [&::-webkit-calendar-picker-indicator]:tw-pointer-events-none [&::-webkit-calendar-picker-indicator]:tw-opacity-0"
          />
          <FontAwesomeIcon
            icon={faClock}
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-right-3.5 tw-top-1/2 tw-size-4 tw--translate-y-1/2 tw-text-iron-300 peer-disabled:tw-text-iron-600"
          />
        </div>
      </div>
    </div>
  );
}
