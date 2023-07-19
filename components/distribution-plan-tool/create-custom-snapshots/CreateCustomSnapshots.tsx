import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";

import CreateCustomSnapshotTable from "./table/CreateCustomSnapshotTable";
import CreateCustomSnapshotForm from "./form/CreateCustomSnapshotForm";
import StepHeader from "../common/StepHeader";
import DistributionPlanNextStepBtn from "../common/DistributionPlanNextStepBtn";
import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";
import {
  AllowlistCustomTokenPool,
  AllowlistOperationCode,
} from "../../allowlist-tool/allowlist-tool.types";
import DistributionPlanEmptyTablePlaceholder from "../common/DistributionPlanEmptyTablePlaceholder";

export default function CreateCustomSnapshots() {
  const { distributionPlan, setStep, operations } = useContext(
    DistributionPlanToolContext
  );
  useEffect(() => {
    if (!distributionPlan) setStep(DistributionPlanToolStep.CREATE_PLAN);
  }, [distributionPlan, setStep]);

  const [customSnapshots, setCustomSnapshots] = useState<
    AllowlistCustomTokenPool[]
  >([]);

  useEffect(() => {
    if (!distributionPlan) return;
    const customSnapshotOperations = operations.filter(
      (o) => o.code === AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL
    );
    setCustomSnapshots(
      customSnapshotOperations.map<AllowlistCustomTokenPool>((o) => ({
        id: o.params.id,
        allowlistId: distributionPlan.id,
        name: o.params.name,
        description: o.params.description,
        walletsCount: new Set(o.params.tokens.map((t: any) => t.owner)).size,
        tokensCount: o.params.tokens.length,
      }))
    );
  }, [operations, distributionPlan]);

  const [haveCustomSnapshots, setHaveCustomSnapshots] = useState(false);

  useEffect(() => {
    setHaveCustomSnapshots(!!customSnapshots.length);
  }, [customSnapshots]);

  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT} />
      <DistributionPlanStepWrapper>
        <CreateCustomSnapshotForm />
        <div className="tw-mt-6">
          {haveCustomSnapshots ? (
            <CreateCustomSnapshotTable customSnapshots={customSnapshots} />
          ) : (
            <DistributionPlanEmptyTablePlaceholder
              title="No Custom Snapshots Added"
              description="To proceed, please add your custom snapshots. This space will showcase your snapshots once they're added. If you prefer not to add snapshots at this time, simply select 'Skip'."
            />
          )}
        </div>
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={false}
          onNextStep={() => setStep(DistributionPlanToolStep.CREATE_PHASES)}
          loading={false}
          showNextBtn={haveCustomSnapshots}
          showSkipBtn={!haveCustomSnapshots}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
