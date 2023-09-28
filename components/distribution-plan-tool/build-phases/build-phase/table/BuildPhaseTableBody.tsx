import DistributionPlanTableBodyWrapper from "../../../common/DistributionPlanTableBodyWrapper";
import { BuildPhasesPhase } from "../../BuildPhases";
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
