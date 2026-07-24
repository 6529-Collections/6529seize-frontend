import type { ChangeEvent } from "react";
import { parsePositiveWholeNumberInput } from "../utils/positiveWholeNumberInput";
import VotingSettingBox, {
  getVotingSettingInputClasses,
} from "./VotingSettingBox";

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
