import { useContext, useEffect } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";

import CreateCustomSnapshotTable from "./table/CreateCustomSnapshotTable";
import CreateCustomSnapshotForm from "./form/CreateCustomSnapshotForm";
import StepHeader from "../common/StepHeader";
import DistributionPlanNextStepBtn from "../common/DistributionPlanNextStepBtn";
import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";

export default function CreateCustomSnapshots() {
  const { distributionPlan, setStep } = useContext(DistributionPlanToolContext);
  useEffect(() => {
    if (!distributionPlan) setStep(DistributionPlanToolStep.CREATE_PLAN);
  }, [distributionPlan, setStep]);

  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT} />
      <DistributionPlanStepWrapper>
        <CreateCustomSnapshotForm />
        <CreateCustomSnapshotTable />
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={false}
          onNextStep={() => setStep(DistributionPlanToolStep.CREATE_PHASES)}
          loading={false}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
