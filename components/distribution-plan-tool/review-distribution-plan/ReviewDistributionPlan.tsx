import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";
import StepHeader from "../common/StepHeader";
import { DistributionPlanToolStep } from "../DistributionPlanToolContext";

import ReviewDistributionPlanTable from "./table/ReviewDistributionPlanTable";

export default function ReviewDistributionPlan() {
  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.REVIEW} />
      <DistributionPlanStepWrapper>
        <ReviewDistributionPlanTable />
      </DistributionPlanStepWrapper>
    </div>
  );
}
