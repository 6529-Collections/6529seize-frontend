import CreateSnapshotTableHeader from "./CreateSnapshotTableHeader";
import CreateSnapshotTableBody from "./CreateSnapshotTableBody";
import DistributionPlanTableWrapper from "../../common/DistributionPlanTableWrapper";
import { CreateSnapshotSnapshot } from "../CreateSnapshots";

export default function CreateSnapshotTable({
  snapshots,
}: {
  snapshots: CreateSnapshotSnapshot[];
}) {
  return (
    <DistributionPlanTableWrapper>
      <CreateSnapshotTableHeader />
      <CreateSnapshotTableBody snapshots={snapshots}/>
    </DistributionPlanTableWrapper>
  );
}
