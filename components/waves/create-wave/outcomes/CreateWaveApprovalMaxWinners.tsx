"use client";

import type { ChangeEvent } from "react";
import { parsePositiveWholeNumberInput } from "../utils/positiveWholeNumberInput";

export default function CreateWaveApprovalMaxWinners({
  maxWinners,
  setMaxWinners,
}: {
  readonly maxWinners: number | null;
  readonly setMaxWinners: (maxWinners: number | null) => void;
}) {
  const onMaxWinnersChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMaxWinners(parsePositiveWholeNumberInput(e.target.value));
  };

  const hasMaxWinners =
    maxWinners !== null && Number.isInteger(maxWinners) && maxWinners > 0;

  return (
    <div className="tw-w-full">
      <div className="tw-group tw-relative tw-w-full">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={hasMaxWinners ? maxWinners.toString() : ""}
          onChange={onMaxWinnersChange}
          id="approval-max-winners"
          autoComplete="off"
          className={`${
            hasMaxWinners
              ? "tw-text-primary-400 focus:tw-text-white"
              : "tw-text-white"
          } tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-pb-3 tw-pt-4 tw-text-base tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-border-blue-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-text-sm`}
          placeholder=" "
        />
        <label
          htmlFor="approval-max-winners"
          className="tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-bg-iron-900 tw-px-2 tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4"
        >
          Max Winners (optional)
        </label>
      </div>
      <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-iron-400">
        Leave blank for unlimited winners.
      </p>
    </div>
  );
}
