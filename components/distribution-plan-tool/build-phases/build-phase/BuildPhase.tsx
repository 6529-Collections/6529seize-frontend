import { useEffect, useState } from "react";
import { BuildPhasesPhase } from "../BuildPhases";
import { DistributionPlanToolStep } from "../../DistributionPlanToolContext";
import StepHeader from "../../common/StepHeader";
import BuildPhaseForm from "./form/BuildPhaseForm";
import DistributionPlanStepWrapper from "../../common/DistributionPlanStepWrapper";
import DistributionPlanNextStepBtn from "../../common/DistributionPlanNextStepBtn";
import BuildPhaseTable from "./table/BuildPhaseTable";

export default function BuildPhase({
  selectedPhase,
  phases,
  onNextStep,
}: {
  selectedPhase: BuildPhasesPhase;
  phases: BuildPhasesPhase[];
  onNextStep: () => void;
}) {
  const [haveRan, setHaveRan] = useState(false);
  useEffect(() => {
    setHaveRan(
      !selectedPhase.components.some((component) => component.spotsNotRan)
    );
  }, [selectedPhase]);

  const [currentPhaseOrder, setCurrentPhaseOrder] = useState(
    phases.findIndex((p) => p.id === selectedPhase.id) + 1
  );

  useEffect(() => {
    setCurrentPhaseOrder(
      phases.findIndex((p) => p.id === selectedPhase.id) + 1
    );
  }, [selectedPhase, phases]);

  return (
    <div>
      <StepHeader
        step={DistributionPlanToolStep.BUILD_PHASES}
        title={`${selectedPhase.name} - ${currentPhaseOrder}/${phases.length}`}
        description={`"${selectedPhase.name}"`}
      />

      <DistributionPlanStepWrapper>
        <BuildPhaseForm selectedPhase={selectedPhase} phases={phases} />
        <BuildPhaseTable phase={selectedPhase} />
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={!haveRan}
          onNextStep={onNextStep}
          loading={false}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
