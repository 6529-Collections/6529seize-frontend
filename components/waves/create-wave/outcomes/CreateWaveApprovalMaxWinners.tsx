"use client";

import type { ChangeEvent } from "react";
import { parsePositiveWholeNumberInput } from "../utils/positiveWholeNumberInput";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

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
      <label
        htmlFor="approval-max-winners"
        className={`tw-mb-2 tw-block ${CREATE_WAVE_FORM_STYLES.fieldLabel}`}
      >
        Max Winners (optional)
      </label>
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
        } tw-form-input tw-block tw-h-11 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-white/5 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-base tw-font-medium tw-caret-primary-400 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-white/5 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-white/10 focus:tw-border-primary-500/50 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-text-sm`}
      />
      <p className={`tw-mt-2 ${CREATE_WAVE_FORM_STYLES.supportingText}`}>
        Leave blank for unlimited winners.
      </p>
    </div>
  );
}
