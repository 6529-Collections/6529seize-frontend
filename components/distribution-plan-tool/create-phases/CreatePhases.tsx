import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import CreatePhasesTable from "./table/CreatePhasesTable";
import DistributionPlanNextStepBtn from "../common/DistributionPlanNextStepBtn";
import StepHeader from "../common/StepHeader";
import CreatePhasesForm from "./form/CreatePhasesForm";
import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";
import { AllowlistOperationCode } from "../../allowlist-tool/allowlist-tool.types";
import DistributionPlanEmptyTablePlaceholder from "../common/DistributionPlanEmptyTablePlaceholder";
export interface CreatePhasesPhase {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly hasRan: boolean;
  readonly order: number;
  readonly allowlistId: string;
}
export default function CreatePhases() {
  const { setStep, operations } = useContext(DistributionPlanToolContext);
  const [phases, setPhases] = useState<CreatePhasesPhase[]>([]);

  useEffect(() => {
    const createPhasesOperations = operations.filter(
      (operation) => operation.code === AllowlistOperationCode.ADD_PHASE
    );
    setPhases(
      createPhasesOperations.map((operation) => ({
        id: operation.params.id,
        name: operation.params.name,
        description: operation.params.description,
        hasRan: operation.hasRan,
        order: operation.order,
        allowlistId: operation.allowlistId,
      }))
    );
  }, [operations]);

  const [havePhases, setHavePhases] = useState(false);

  useEffect(() => {
    setHavePhases(!!phases.length);
  }, [phases]);
  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_PHASES} />
      <DistributionPlanStepWrapper>
        <CreatePhasesForm />
        <div className="tw-mt-6">
          {havePhases ? (
            <CreatePhasesTable phases={phases} />
          ) : (
            <DistributionPlanEmptyTablePlaceholder
              title="No Phases Added"
              description="To proceed, please add your phases. This space will showcase your phases once they're added."
            />
          )}
        </div>
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={false}
          onNextStep={() => setStep(DistributionPlanToolStep.BUILD_PHASES)}
          loading={false}
          showNextBtn={havePhases}
          showSkipBtn={false}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
