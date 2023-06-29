import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import { AllowlistOperationCode } from "../../allowlist-tool/allowlist-tool.types";
import CreateSnapshotTable from "./table/CreateSnapshotTable";
import CreateSnapshotForm from "./form/CreateSnapshotForm";
import StepHeader from "../utils/StepHeader";
import DistributionPlanNextStepBtn from "../common/DistributionPlanNextStepBtn";

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
      <div className="tw-mt-8 tw-pt-8 tw-border-t tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-t-neutral-700 tw-mx-auto">
        <CreateSnapshotForm />
        <CreateSnapshotTable />
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={haveUnRunOperations}
          nextStep={DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT}
          loading={false}
        />
      </div>
    </div>
  );
}
