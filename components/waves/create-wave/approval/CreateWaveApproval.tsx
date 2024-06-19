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
        <button
          onClick={onNextStep}
          className="tw-relative tw-inline-flex tw-items-center tw-gap-x-2 tw-justify-center tw-px-4 tw-py-3 tw-border-0 tw-text-base tw-font-medium tw-rounded-lg tw-text-white tw-bg-gradient-to-r tw-from-blue-500 tw-via-blue-600 tw-to-blue-700 hover:tw-bg-gradient-to-br tw-transform hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-in-out tw-shadow-lg"
        >
          <svg
            className="tw-h-5 tw-w-5 -tw-ml-1 tw-text-white tw-animate-bounce"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-11.293a1 1 0 00-1.414-1.414L9 8.586 7.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>

          <span>Complete</span>
        </button>
      </div>
    </div>
  );
}
