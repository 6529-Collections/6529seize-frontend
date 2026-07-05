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
    <div className="tw-flex tw-w-full tw-gap-x-4">
      <div className="tw-w-full">
        <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100">
          Select date
        </label>
        <div className="tw-mt-1.5">
          <input
            type="date"
            name="block-picker-date"
            id="block-picker-date"
            value={date}
            required
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker()}
            className="tw-form-input tw-block tw-w-full tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-iron-700/40 tw-px-3 tw-py-3 tw-text-base tw-font-light tw-text-white tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6"
          />
        </div>
      </div>
      <div className="tw-w-full">
        <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100">
          Select time
        </label>
        <div className="tw-mt-1.5">
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
            className="tw-form-input tw-block tw-w-full tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-iron-700/40 tw-px-3 tw-py-3 tw-text-base tw-font-light tw-text-white tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6"
          />
        </div>
      </div>
    </div>
  );
}
