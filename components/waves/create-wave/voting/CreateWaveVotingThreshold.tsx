import type { ChangeEvent } from "react";
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { parsePositiveWholeNumberInput } from "../utils/positiveWholeNumberInput";
import VotingSettingBox, {
  getVotingSettingInputClasses,
} from "./VotingSettingBox";

function ApprovalThresholdPreview() {
  return (
    <div
      aria-hidden="true"
      className="tw-mb-3 tw-flex tw-h-12 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/70 tw-p-2.5 sm:tw-gap-3"
    >
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-2">
        <div className="tw-flex tw-items-center tw-gap-1.5">
          <span className="tw-size-2.5 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-650" />
          <span className="tw-h-1 tw-w-16 tw-max-w-[50%] tw-rounded-full tw-bg-iron-700" />
        </div>
        <div className="tw-relative tw-h-1.5 tw-w-full tw-rounded-full tw-bg-iron-800">
          <span className="tw-block tw-h-full tw-w-3/4 tw-rounded-full tw-bg-primary-500/50" />
          <span className="tw-absolute tw-right-[18%] tw-top-1/2 tw-h-3 tw-w-px -tw-translate-y-1/2 tw-bg-primary-300" />
        </div>
      </div>
      <ChevronRightIcon className="tw-size-4 tw-flex-shrink-0 tw-text-iron-600" />
      <span className="tw-flex tw-size-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/15 tw-text-primary-300">
        <CheckIcon className="tw-size-4" />
      </span>
    </div>
  );
}

export default function CreateWaveVotingThreshold({
  threshold,
  error,
  setThreshold,
}: {
  readonly threshold: number | null;
  readonly error: boolean;
  readonly setThreshold: (threshold: number | null) => void;
}) {
  const onThresholdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setThreshold(parsePositiveWholeNumberInput(e.target.value));
  };
  const hasThreshold =
    threshold !== null && Number.isInteger(threshold) && threshold > 0;
  const inputId = "approval-threshold";
  const errorId = "approval-threshold-error";
  const helpId = "approval-threshold-help";

  return (
    <VotingSettingBox
      errorId={errorId}
      errorMessage="Enter an approval threshold greater than 0."
      hasError={error}
      helpId={helpId}
      helpText={
        <>
          A drop is approved when its vote score reaches this number. Example:
          50 means the drop needs a score of 50 to win.
        </>
      }
      inputId={inputId}
      label="Approval threshold"
    >
      <ApprovalThresholdPreview />
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={hasThreshold ? threshold.toString() : ""}
        onChange={onThresholdChange}
        id={inputId}
        className={getVotingSettingInputClasses({
          hasError: error,
          hasValue: hasThreshold,
        })}
        aria-invalid={error}
        aria-describedby={error ? `${errorId} ${helpId}` : helpId}
      />
    </VotingSettingBox>
  );
}
