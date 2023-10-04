import { useEffect, useState } from "react";

export default function BlockPickerBlockNumberIncludes({
  blockNumberIncludes,
  setBlockNumberIncludes,
}: {
  blockNumberIncludes: string;
  setBlockNumberIncludes: (blockNumberIncludes: string) => void;
}) {
  return (
    <div className="tw-w-full">
      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
        Block no includes 
      </label>
      <div className="tw-mt-1 5">
        <input
          type="text"
          name="block-number-includes"
          id="block-number-includes"
          value={blockNumberIncludes}
          required
          placeholder="e.g. 42, 69, 42069, 6529"
          autoComplete="off"
          onChange={(e) => setBlockNumberIncludes(e.target.value)}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
      </div>
    </div>
  );
}
