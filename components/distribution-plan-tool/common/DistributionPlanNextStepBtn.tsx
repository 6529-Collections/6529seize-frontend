import { useContext } from "react";
import { DistributionPlanToolContext } from "../DistributionPlanToolContext";
import DistributionPlanPrimaryBtn from "./DistributionPlanPrimaryBtn";

export default function DistributionPlanNextStepBtn({
  showRunAnalysisBtn,
  onNextStep,
  loading,
  showNextBtn,
  showSkipBtn,
}: {
  showRunAnalysisBtn: boolean;
  onNextStep: () => void;
  loading: boolean;
  showNextBtn: boolean;
  showSkipBtn: boolean;
}) {
  const { runOperations } = useContext(DistributionPlanToolContext);
  return (
    <div className="tw-mt-8 tw-flex tw-justify-end tw-space-x-4">
      {showSkipBtn && (
        <button
          onClick={onNextStep}
          type="button"
          className="tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Skip
        </button>
      )}
      {showRunAnalysisBtn && (
        <button
          onClick={runOperations}
          type="button"
          className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Run analysis
        </button>
      )}
      {!showRunAnalysisBtn && showNextBtn && (
        <DistributionPlanPrimaryBtn
          loading={loading}
          isDisabled={false}
          type="button"
          onClick={onNextStep}
        >
          Next
        </DistributionPlanPrimaryBtn>
      )}
    </div>
  );
}
