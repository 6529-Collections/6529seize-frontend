import DistributionPlanTableBodyWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableBodyWrapper";
import CreateTablePhasesRow from "./CreateTablePhasesRow";
import { CreatePhasesPhase } from "../CreatePhases";

export default function CreatePhasesTableBody({
  phases,
}: {
  phases: CreatePhasesPhase[];
}) {
  return (
    <DistributionPlanTableBodyWrapper>
      {phases.map((phase) => (
        <CreateTablePhasesRow key={phase.id} phase={phase} />
      ))}
    </DistributionPlanTableBodyWrapper>
  );
}
