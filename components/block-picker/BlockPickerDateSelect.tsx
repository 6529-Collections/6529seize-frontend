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
    <div className="tw-gap-x-4 tw-flex tw-w-full">
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
            onClick={(e: any) => e.target.showPicker()}
            className="tw-cursor-pointer tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 placeholder:tw-text-iron-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-iron-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
            onClick={(e: any) => e.target.showPicker()}
            className="tw-cursor-pointer tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 placeholder:tw-text-iron-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-iron-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
      </div>
    </div>
  );
}
