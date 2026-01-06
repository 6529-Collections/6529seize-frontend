"use client";

import { useEffect, useState } from "react";
import type { BuildPhasesPhase } from "../BuildPhases";
import {
  DistributionPlanToolStep,
} from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import StepHeader from "@/components/distribution-plan-tool/common/StepHeader";
import BuildPhaseForm from "./form/BuildPhaseForm";
import DistributionPlanStepWrapper from "@/components/distribution-plan-tool/common/DistributionPlanStepWrapper";
import DistributionPlanNextStepBtn from "@/components/distribution-plan-tool/common/DistributionPlanNextStepBtn";
import BuildPhaseTable from "./table/BuildPhaseTable";
import DistributionPlanEmptyTablePlaceholder from "@/components/distribution-plan-tool/common/DistributionPlanEmptyTablePlaceholder";

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

  const [haveComponents, setHaveComponents] = useState(false);

  useEffect(() => {
    setHaveComponents(!!selectedPhase.components.length);
  }, [selectedPhase]);

  return (
    <div>
      <StepHeader
        step={DistributionPlanToolStep.BUILD_PHASES}
        title={`${selectedPhase.name} - ${currentPhaseOrder}/${phases.length}`}
        description={`"${selectedPhase.name}"`}
      />

      <DistributionPlanStepWrapper>
        <BuildPhaseForm selectedPhase={selectedPhase} phases={phases} />
        <div className="tw-mt-6">
          {haveComponents ? (
            <BuildPhaseTable phase={selectedPhase} />
          ) : (
            <DistributionPlanEmptyTablePlaceholder
              title="No Collection Groups Added"
              description="To proceed, please add your collection groups. This space will showcase your collection groups once they're added."
            />
          )}
        </div>
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={!haveRan}
          onNextStep={onNextStep}
          loading={false}
          showNextBtn={haveComponents}
          showSkipBtn={false}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
