import CreateSnapshotTableHeader from "./CreateSnapshotTableHeader";
import CreateSnapshotTableBody from "./CreateSnapshotTableBody";
import DistributionPlanTableWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableWrapper";
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
