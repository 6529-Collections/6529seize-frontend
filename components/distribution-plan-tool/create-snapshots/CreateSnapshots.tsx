import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import { AllowlistOperationCode } from "../../allowlist-tool/allowlist-tool.types";
import CreateSnapshotTable from "./table/CreateSnapshotTable";
import CreateSnapshotForm from "./form/CreateSnapshotForm";
import StepHeader from "../common/StepHeader";
import DistributionPlanNextStepBtn from "../common/DistributionPlanNextStepBtn";
import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";

export default function CreateSnapshots() {
  const { setStep, distributionPlan, operations, runOperations } = useContext(
    DistributionPlanToolContext
  );

  useEffect(() => {
    if (!distributionPlan) setStep(DistributionPlanToolStep.CREATE_PLAN);
  }, [distributionPlan, setStep]);

  const [haveUnRunOperations, setHaveUnRunOperations] = useState(false);

  useEffect(() => {
    setHaveUnRunOperations(
      !!operations.filter(
        (operation) =>
          operation.code === AllowlistOperationCode.GET_COLLECTION_TRANSFERS &&
          operation.hasRan === false
      ).length
    );
  }, [operations]);

  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_SNAPSHOTS} />
      <DistributionPlanStepWrapper>
        <CreateSnapshotForm />
        <CreateSnapshotTable />
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={haveUnRunOperations}
          onNextStep={() =>
            setStep(DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT)
          }
          loading={false}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
