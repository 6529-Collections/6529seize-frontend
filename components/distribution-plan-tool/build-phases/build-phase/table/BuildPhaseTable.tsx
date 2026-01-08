import DistributionPlanTableWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableWrapper";
import type { BuildPhasesPhase } from "@/components/distribution-plan-tool/build-phases/BuildPhases";
import BuildPhaseTableBody from "./BuildPhaseTableBody";
import BuildPhaseTableHeader from "./BuildPhaseTableHeader";

export default function BuildPhaseTable({
  phase,
}: {
  phase: BuildPhasesPhase;
}) {
  return (
    <DistributionPlanTableWrapper>
      <BuildPhaseTableHeader />
      <BuildPhaseTableBody phase={phase} />
    </DistributionPlanTableWrapper>
  );
}
