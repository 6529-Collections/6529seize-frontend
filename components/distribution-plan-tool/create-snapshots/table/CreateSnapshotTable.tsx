import CreateSnapshotTableHeader from "./CreateSnapshotTableHeader";
import CreateSnapshotTableBody from "./CreateSnapshotTableBody";
import DistributionPlanTableWrapper from "../../common/DistributionPlanTableWrapper";

export default function CreateSnapshotTable() {
  return (
    <DistributionPlanTableWrapper>
      <CreateSnapshotTableHeader />
      <CreateSnapshotTableBody />
    </DistributionPlanTableWrapper>
  );
}
