import DistributionPlanTableWrapper from "../../../common/DistributionPlanTableWrapper";
import { BuildPhasesPhase } from "../../BuildPhases";
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
