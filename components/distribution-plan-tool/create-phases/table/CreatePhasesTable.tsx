import DistributionPlanTableWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableWrapper";
import type { CreatePhasesPhase } from "../CreatePhases";
import CreatePhasesTableBody from "./CreatePhasesTableBody";
import CreatePhasesTableHeader from "./CreatePhasesTableHeader";

export default function CreatePhasesTable({
  phases,
}: {
  phases: CreatePhasesPhase[];
}) {
  return (
    <DistributionPlanTableWrapper>
      <CreatePhasesTableHeader />
      <CreatePhasesTableBody phases={phases}/>
    </DistributionPlanTableWrapper>
  );
}
