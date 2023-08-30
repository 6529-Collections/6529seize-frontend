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
    <div>
      <input
        type="date"
        name="block-picker-date"
        id="block-picker-date"
        value={date}
        required
        onChange={(e) => setDate(e.target.value)}
        onClick={(e: any) => e.target.showPicker()}
        className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
      />
      <input
        type="time"
        name="block-picker-time"
        id="block-picker-time"
        value={time}
        required
        onChange={(e) => setTime(e.target.value)}
        onClick={(e: any) => e.target.showPicker()}
        className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
      />
    </div>
  );
}
