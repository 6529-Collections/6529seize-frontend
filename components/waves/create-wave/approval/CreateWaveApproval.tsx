import { useEffect, useState } from "react";
import CreateWaveNextStep, {
  CreateWaveNextStepType,
} from "../utils/CreateWaveNextStep";
import CreateWaveApprovalThreshold from "./CreateWaveApprovalThreshold";
import CreateWaveApprovalThresholdTime from "./CreateWaveApprovalThresholdTime";

export default function CreateWaveApproval({
  threshold,
  thresholdTimeMs,
  setThreshold,
  setThresholdTimeMs,
  onNextStep,
}: {
  readonly threshold: number | null;
  readonly thresholdTimeMs: number | null;
  readonly setThreshold: (threshold: number | null) => void;
  readonly setThresholdTimeMs: (thresholdTimeMs: number | null) => void;
  readonly onNextStep: () => void;
}) {
  const getIsNextStepDisabled = () => {
    if (!threshold) {
      return true;
    }
    if (!thresholdTimeMs) {
      return true;
    }
    return false;
  };

  const [isNextStepDisabled, setIsNextStepDisabled] = useState<boolean>(
    getIsNextStepDisabled()
  );

  useEffect(() => {
    setIsNextStepDisabled(getIsNextStepDisabled());
  }, [threshold, thresholdTimeMs]);

  return (
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <p className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
        Approval
      </p>
      <div className="tw-mt-4">
        <CreateWaveApprovalThreshold
          threshold={threshold}
          setThreshold={setThreshold}
        />
        <CreateWaveApprovalThresholdTime
          thresholdTimeMs={thresholdTimeMs}
          setThresholdTimeMs={setThresholdTimeMs}
        />
      </div>
      <div className="tw-mt-8 tw-text-right">
        <CreateWaveNextStep
          disabled={isNextStepDisabled}
          stepType={CreateWaveNextStepType.SAVE}
          onClick={onNextStep}
        />
      </div>
    </div>
  );
}
