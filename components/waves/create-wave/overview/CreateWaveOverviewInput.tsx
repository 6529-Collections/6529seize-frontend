export default function CreateWaveOverviewInput({
  valueKey,
  onValueChange,
}: {
  readonly valueKey: "name" | "description";
  readonly onValueChange: (param: {
    readonly key: "name" | "description";
    readonly value: string;
  }) => void;
}) {
  const LABELS: Record<"name" | "description", string> = {
    name: "Name*",
    description: "Description*",
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange({ key: valueKey, value: event.target.value });
  };

  return (
    <>
      <input
        type="text"
        onChange={onChange}
        id={valueKey}
        autoComplete="off"
        className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
        placeholder=" "
      />
      <label
        htmlFor={valueKey}
        className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
      >
        {LABELS[valueKey]}
      </label>
    </>
  );
}
