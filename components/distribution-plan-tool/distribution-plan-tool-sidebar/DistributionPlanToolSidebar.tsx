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

export const DISTRIBUTION_PLAN_STEPS: Record<
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
  return (
    <nav
      aria-label="Progress"
      className="tw-w-80 2xl:tw-w-96 tw-px-8 tw-pt-12 tw-min-h-screen tw-border-l tw-border-solid tw-border-r-0 tw-border-t-0 tw-border-b-0 tw-border-neutral-600"
    >
      <ol role="list" className="tw-list-none tw-pl-0 tw-overflow-hidden">
        {Object.values(DISTRIBUTION_PLAN_STEPS).map((stepItem) => (
          <DistributionPlanStep
            key={stepItem.key}
            step={stepItem}
            activeStepOrder={DISTRIBUTION_PLAN_STEPS[step].order}
          />
        ))}
      </ol>
    </nav>
  );
}
