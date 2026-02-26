import DistributionPlanTableWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableWrapper";

import CreatePhasesTableBody from "./CreatePhasesTableBody";
import CreatePhasesTableHeader from "./CreatePhasesTableHeader";

import type { CreatePhasesPhase } from "../CreatePhases";

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
