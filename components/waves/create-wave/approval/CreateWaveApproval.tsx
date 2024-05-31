import { useEffect, useState } from "react";
import CreateWaveNextStep from "../utils/CreateWaveNextStep";
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
      <div className="tw-pt-6">
        <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
          Approval
        </p>
        <div className="tw-mt-3">
          <CreateWaveApprovalThreshold
            threshold={threshold}
            setThreshold={setThreshold}
          />
          <CreateWaveApprovalThresholdTime
            thresholdTimeMs={thresholdTimeMs}
            setThresholdTimeMs={setThresholdTimeMs}
          />
        </div>
        <div className="tw-mt-6 tw-text-right">
          <CreateWaveNextStep
            disabled={isNextStepDisabled}
            onClick={onNextStep}
            label="Finish"
          />
        </div>
      </div>
    </div>
  );
}
