import { DistributionPlanToolStep } from "../DistributionPlanToolContext";
import StepHeader from "../common/StepHeader";
import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";
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
