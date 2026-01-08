import DistributionPlanTableBodyWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableBodyWrapper";
import type { BuildPhasesPhase } from "@/components/distribution-plan-tool/build-phases/BuildPhases";
import BuildPhaseTableRow from "./BuildPhaseTableRow";

export default function BuildPhaseTableBody({
  phase,
}: {
  phase: BuildPhasesPhase;
}) {
  return (
    <DistributionPlanTableBodyWrapper>
      {phase.components.map((component) => (
        <BuildPhaseTableRow key={component.id} component={component} />
      ))}
    </DistributionPlanTableBodyWrapper>
  );
}
