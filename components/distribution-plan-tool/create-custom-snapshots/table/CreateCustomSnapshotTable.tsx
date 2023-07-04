import CreateCustomSnapshotTableHeader from "./CreateCustomSnapshotTableHeader";
import CreateCustomSnapshotTableBody from "./CreateCustomSnapshotTableBody";
import DistributionPlanTableWrapper from "../../common/DistributionPlanTableWrapper";

export default function CreateCustomSnapshotTable() {
  return (
    <DistributionPlanTableWrapper>
      <CreateCustomSnapshotTableHeader />
      <CreateCustomSnapshotTableBody />
    </DistributionPlanTableWrapper>
  );
}
