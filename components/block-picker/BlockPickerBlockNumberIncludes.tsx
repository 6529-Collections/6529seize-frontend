"use client";

export default function BlockPickerBlockNumberIncludes({
  disabled,
  blockNumberIncludes,
  setBlockNumberIncludes,
}: {
  disabled: boolean;
  blockNumberIncludes: string;
  setBlockNumberIncludes: (blockNumberIncludes: string) => void;
}) {
  return (
    <div className="tw-w-full">
      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300">
        Block number includes
      </label>
      <div className="tw-relative tw-mt-1.5">
        <input
          disabled={disabled}
          type="text"
          name="block-number-includes"
          id="block-number-includes"
          value={blockNumberIncludes}
          required
          placeholder={
            disabled ? "Select a time window" : "e.g. 42, 69, 42069, 6529"
          }
          autoComplete="off"
          onChange={(e) => setBlockNumberIncludes(e.target.value)}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-3 tw-text-base tw-font-light tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-600 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-900/60 disabled:tw-text-iron-600 disabled:tw-ring-iron-800 sm:tw-leading-6"
        />
      </div>
    </div>
  );
}
