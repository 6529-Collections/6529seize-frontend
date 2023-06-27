import { useContext } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "./DistributionPlanToolContext";
import { assertUnreachable } from "../../helpers/AllowlistToolHelpers";
import CreatePlan from "./create-plan/CreatePlan";
import CreateSnapshots from "./create-snapshots/CreateSnapshots";
import CreatePhases from "./create-phases/CreatePhases";
import BuildPhases from "./build-phases/BuildPhases";

export default function DistributionPlanToolPage() {
  const { step } = useContext(DistributionPlanToolContext);

  switch (step) {
    case DistributionPlanToolStep.CREATE_PLAN:
      return <CreatePlan />;
    case DistributionPlanToolStep.CREATE_SNAPSHOTS:
      return <CreateSnapshots />;
    case DistributionPlanToolStep.CREATE_PHASES:
      return <CreatePhases />;
    case DistributionPlanToolStep.BUILD_PHASES:
      return <BuildPhases />;
    default:
      assertUnreachable(step);
      return null;
  }
}
