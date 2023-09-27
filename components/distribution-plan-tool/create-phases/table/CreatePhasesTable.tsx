import DistributionPlanTableWrapper from "../../common/DistributionPlanTableWrapper";
import { CreatePhasesPhase } from "../CreatePhases";
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
