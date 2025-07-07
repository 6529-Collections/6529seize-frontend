"use client";

import { useContext, useEffect } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "./DistributionPlanToolContext";
import { assertUnreachable } from "../../helpers/AllowlistToolHelpers";
import CreatePlan from "./create-plan/CreatePlan";
import CreateSnapshots from "./create-snapshots/CreateSnapshots";
import CreatePhases from "./create-phases/CreatePhases";
import BuildPhases from "./build-phases/BuildPhases";
import CreateCustomSnapshots from "./create-custom-snapshots/CreateCustomSnapshots";
import ReviewDistributionPlan from "./review-distribution-plan/ReviewDistributionPlan";
import AllowlistToolAnimationWrapper from "../allowlist-tool/common/animation/AllowlistToolAnimationWrapper";
import AllowlistToolAnimationOpacity from "../allowlist-tool/common/animation/AllowlistToolAnimationOpacity";
import MapDelegations from "./map-delegations/MapDelegations";

export default function DistributionPlanToolPage() {
  const { step } = useContext(DistributionPlanToolContext);
  return (
    <AllowlistToolAnimationWrapper mode="wait" initial={true}>
      {(() => {
        switch (step) {
          case DistributionPlanToolStep.CREATE_PLAN:
            return (
              <AllowlistToolAnimationOpacity key="CreatePlan">
                <CreatePlan />
              </AllowlistToolAnimationOpacity>
            );
          case DistributionPlanToolStep.CREATE_SNAPSHOTS:
            return (
              <AllowlistToolAnimationOpacity key="CreateSnapshots">
                <CreateSnapshots />
              </AllowlistToolAnimationOpacity>
            );
          case DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT:
            return (
              <AllowlistToolAnimationOpacity key="CreateCustomSnapshots">
                <CreateCustomSnapshots />
              </AllowlistToolAnimationOpacity>
            );
          case DistributionPlanToolStep.CREATE_PHASES:
            return (
              <AllowlistToolAnimationOpacity key="CreatePhases">
                <CreatePhases />
              </AllowlistToolAnimationOpacity>
            );
          case DistributionPlanToolStep.BUILD_PHASES:
            return (
              <AllowlistToolAnimationOpacity key="BuildPhases">
                <BuildPhases />
              </AllowlistToolAnimationOpacity>
            );
          case DistributionPlanToolStep.MAP_DELEGATIONS:
            return (
              <AllowlistToolAnimationOpacity key="MapDelegations">
                <MapDelegations />
              </AllowlistToolAnimationOpacity>
            );
          case DistributionPlanToolStep.REVIEW:
            return (
              <AllowlistToolAnimationOpacity key="ReviewDistributionPlan">
                <ReviewDistributionPlan />
              </AllowlistToolAnimationOpacity>
            );
          default:
            assertUnreachable(step);
            return <div></div>;
        }
      })()}
    </AllowlistToolAnimationWrapper>
  );
}
