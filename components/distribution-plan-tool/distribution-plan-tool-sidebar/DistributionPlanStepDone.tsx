"use client";

import { useContext, useEffect, useState } from "react";
import {
    DistributionPlanToolContext,
    DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import {
    DISTRIBUTION_PLAN_STEPS,
    DistributionPlanStepDescription,
} from "./DistributionPlanToolSidebar";

export default function DistributionPlanStepDone({
  step,
}: {
  step: DistributionPlanStepDescription;
}) {
  const { setStep } = useContext(DistributionPlanToolContext);
  const isLastStep =
    step.order === Object.values(DISTRIBUTION_PLAN_STEPS).at(-1)!.order;

  const [isNotCreatePlanStep, setIsNotCreatePlanStep] = useState(false);
  useEffect(
    () =>
      setIsNotCreatePlanStep(step.key !== DistributionPlanToolStep.CREATE_PLAN),
    [step.key]
  );

  const onStep = () => {
    if (isNotCreatePlanStep) {
      setStep(step.key);
    }
  };

  return (
    <li className="tw-relative tw-pb-10">
      {!isLastStep && (
        <div
          className="tw-absolute tw-left-[13.25px] tw-top-4 -ml-tw-px tw-mt-0.5 tw-h-full tw-w-0.5 tw-bg-iron-100"
          aria-hidden="true"></div>
      )}

      <div
        onClick={onStep}
        className={`tw-group tw-relative tw-flex tw-items-start ${
          isNotCreatePlanStep ? "tw-cursor-pointer" : ""
        }`}>
        <span className="tw-flex tw-h-8 tw-items-center">
          <span className="tw-relative tw-z-0 tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-100">
            <svg
              className="tw-h-3 tw-w-auto tw-text-primary-500"
              viewBox="0 0 21 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M18.4939 1.31671L6.56059 12.8334L3.39393 9.45004C2.8106 8.90004 1.89393 8.86671 1.22726 9.33338C0.577262 9.81671 0.393928 10.6667 0.793928 11.35L4.54393 17.45C4.91059 18.0167 5.54393 18.3667 6.26059 18.3667C6.94393 18.3667 7.59393 18.0167 7.96059 17.45C8.56059 16.6667 20.0106 3.01671 20.0106 3.01671C21.5106 1.48338 19.6939 0.133375 18.4939 1.30004V1.31671Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </span>
        <span className="tw-ml-4 tw-flex tw-min-w-0 tw-flex-col">
          <span className="tw-text-sm tw-font-medium">{step.label}</span>
          <span className="tw-text-sm tw-text-iron-500">
            {step.description}
          </span>
        </span>
      </div>
    </li>
  );
}
