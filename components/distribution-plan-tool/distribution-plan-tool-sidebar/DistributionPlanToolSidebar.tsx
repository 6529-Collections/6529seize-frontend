"use client";

import { useContext } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import DistributionPlanStep from "./DistributionPlanStep";

export interface DistributionPlanStepDescription {
  label: string;
  description: string;
  key: DistributionPlanToolStep;
  order: number;
}

const DISTRIBUTION_PLAN_STEPS: Record<
  DistributionPlanToolStep,
  DistributionPlanStepDescription
> = {
  [DistributionPlanToolStep.CREATE_PLAN]: {
    label: "Create Plan",
    description: "Create a new distribution plan",
    key: DistributionPlanToolStep.CREATE_PLAN,
    order: 0,
  },
  [DistributionPlanToolStep.CREATE_SNAPSHOTS]: {
    label: "Create Snapshots",
    description: "Create snapshots of the token pools",
    key: DistributionPlanToolStep.CREATE_SNAPSHOTS,
    order: 1,
  },
  [DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT]: {
    label: "Create Custom Snapshot",
    description: "Create a custom snapshot of the token pools",
    key: DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT,
    order: 2,
  },
  [DistributionPlanToolStep.CREATE_PHASES]: {
    label: "Create Phases",
    description: "Create phases for the distribution plan",
    key: DistributionPlanToolStep.CREATE_PHASES,
    order: 3,
  },
  [DistributionPlanToolStep.BUILD_PHASES]: {
    label: "Build Phases",
    description: "Build the distribution plan",
    key: DistributionPlanToolStep.BUILD_PHASES,
    order: 4,
  },
  [DistributionPlanToolStep.MAP_DELEGATIONS]: {
    label: "Map Delegations",
    description: "Map delegations to the distribution plan",
    key: DistributionPlanToolStep.MAP_DELEGATIONS,
    order: 5,
  },
  [DistributionPlanToolStep.REVIEW]: {
    label: "Review",
    description: "Review the distribution plan",
    key: DistributionPlanToolStep.REVIEW,
    order: 6,
  },
};

export default function DistributionPlanToolSidebar() {
  const { step } = useContext(DistributionPlanToolContext);
  const steps = Object.values(DISTRIBUTION_PLAN_STEPS).sort(
    (firstStep, secondStep) => firstStep.order - secondStep.order
  );
  const activeStep = DISTRIBUTION_PLAN_STEPS[step];

  return (
    <>
      <nav
        aria-label="Progress"
        className="tw-w-full tw-border-0 tw-border-b tw-border-solid tw-border-iron-700 tw-px-4 tw-py-4 sm:tw-px-6 xl:tw-hidden"
      >
        <details className="tw-group">
          <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-bg-iron-800 tw-px-4 tw-py-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
            <span className="tw-flex tw-min-w-0 tw-flex-col">
              <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
                Step {activeStep.order + 1} of {steps.length}
              </span>
              <span className="tw-truncate tw-text-sm tw-font-medium tw-text-white">
                {activeStep.label}
              </span>
            </span>
            <svg
              aria-hidden="true"
              className="tw-h-5 tw-w-5 tw-shrink-0 tw-text-iron-300 tw-transition-transform tw-duration-200 group-open:tw-rotate-180 motion-reduce:tw-transition-none"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>
          <ol className="tw-mb-0 tw-mt-4 tw-list-none tw-overflow-hidden tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-px-2 tw-pb-0 tw-pt-5">
            {steps.map((stepItem) => (
              <DistributionPlanStep
                key={stepItem.key}
                step={stepItem}
                activeStepOrder={activeStep.order}
              />
            ))}
          </ol>
        </details>
      </nav>

      <nav
        aria-label="Progress"
        className="tw-hidden tw-min-h-screen tw-w-80 tw-shrink-0 tw-border-0 tw-border-l tw-border-solid tw-border-iron-600 tw-px-8 tw-pt-12 xl:tw-block 2xl:tw-w-96"
      >
        <ol className="tw-mb-0 tw-list-none tw-overflow-hidden tw-p-0">
          {steps.map((stepItem) => (
            <DistributionPlanStep
              key={stepItem.key}
              step={stepItem}
              activeStepOrder={activeStep.order}
            />
          ))}
        </ol>
      </nav>
    </>
  );
}
