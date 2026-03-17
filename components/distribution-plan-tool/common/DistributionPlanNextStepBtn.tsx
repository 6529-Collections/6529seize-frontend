"use client";

import { useContext } from "react";
import { DistributionPlanToolContext } from "../DistributionPlanToolContext";
import DistributionPlanPrimaryBtn from "./DistributionPlanPrimaryBtn";

export default function DistributionPlanNextStepBtn({
  showRunAnalysisBtn,
  onNextStep,
  loading,
  showNextBtn,
  showSkipBtn,
  disableNextBtn = false,
}: {
  showRunAnalysisBtn: boolean;
  onNextStep: () => void;
  loading: boolean;
  showNextBtn: boolean;
  showSkipBtn: boolean;
  disableNextBtn?: boolean;
}) {
  const { runOperations } = useContext(DistributionPlanToolContext);
  return (
    <div className="tw-mt-8 tw-flex tw-justify-end tw-space-x-4">
      {showSkipBtn && (
        <button
          onClick={onNextStep}
          type="button"
          className="tw-cursor-pointer tw-rounded-lg tw-border-2 tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800/80"
        >
          Skip
        </button>
      )}
      {showRunAnalysisBtn && (
        <button
          onClick={runOperations}
          type="button"
          className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border-2 tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800/80"
        >
          Run analysis
        </button>
      )}
      {!showRunAnalysisBtn && showNextBtn && (
        <DistributionPlanPrimaryBtn
          loading={loading}
          isDisabled={disableNextBtn}
          type="button"
          onClick={onNextStep}
        >
          Next
        </DistributionPlanPrimaryBtn>
      )}
    </div>
  );
}
