import {  useEffect, useState } from "react";
import { BuildPhasesPhase } from "../BuildPhases";
import {
  DistributionPlanToolStep,
} from "../../DistributionPlanToolContext";
import StepHeader from "../../common/StepHeader";
import BuildPhaseForm from "./form/BuildPhaseForm";
import DistributionPlanStepWrapper from "../../common/DistributionPlanStepWrapper";
import DistributionPlanNextStepBtn from "../../common/DistributionPlanNextStepBtn";
import BuildPhaseTable from "./table/BuildPhaseTable";

export default function BuildPhase({
  phase,
  totalPhases,
  currentPhase,
  onNextStep,
}: {
  phase: BuildPhasesPhase;
  totalPhases: number;
  currentPhase: number;
  onNextStep: () => void;
}) {
  const [haveRan, setHaveRan] = useState(false);
  useEffect(() => {
    setHaveRan(!phase.components.some((component) => component.spotsNotRan));
  }, [phase]);

  return (
    <div>
      <StepHeader
        step={DistributionPlanToolStep.BUILD_PHASES}
        title={`${phase.name} - ${currentPhase}/${totalPhases}`}
        description={`"${phase.name}"`}
      />

      <DistributionPlanStepWrapper>
        <BuildPhaseForm phase={phase} />
        <BuildPhaseTable phase={phase} />
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={!haveRan}
          onNextStep={onNextStep}
          loading={false}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
