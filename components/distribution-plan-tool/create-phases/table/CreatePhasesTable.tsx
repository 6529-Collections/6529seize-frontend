import DistributionPlanTableWrapper from "../../common/DistributionPlanTableWrapper";
import CreatePhasesTableBody from "./CreatePhasesTableBody";
import CreatePhasesTableHeader from "./CreatePhasesTableHeader";

export default function CreatePhasesTable() {
  return (
    <DistributionPlanTableWrapper>
      <CreatePhasesTableHeader />
      <CreatePhasesTableBody />
    </DistributionPlanTableWrapper>
  );
}
