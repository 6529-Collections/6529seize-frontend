export default function GroupCreateNumericValue({
  value,
  minValue,
  maxValue,
  label,
  labelId,
  setValue,
}: {
  readonly value: number | null;
  readonly minValue?: number | undefined;
  readonly maxValue?: number | undefined;
  readonly label: string;
  readonly labelId: string;
  readonly setValue: (value: number | null) => void;
}) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === "") {
      setValue(null);
    } else {
      setValue(parseInt(newValue));
    }
  };
  return (
    <div className="tw-group tw-w-full tw-relative">
      <input
        type="number"
        min={minValue}
        max={maxValue}
        value={value ?? ""}
        onChange={onChange}
        id={labelId}
        autoComplete="off"
        className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-3 tw-w-full tw-text-md tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-700 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
        placeholder=" "
      />
      <label
        htmlFor={labelId}
        className="tw-absolute tw-rounded-lg tw-cursor-text tw-text-md tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-[1] tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
      >
        {label}
      </label>
    </div>
  );
}
