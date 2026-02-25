import DistributionPlanTableWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableWrapper";

import CreateSnapshotTableBody from "./CreateSnapshotTableBody";
import CreateSnapshotTableHeader from "./CreateSnapshotTableHeader";

import type { CreateSnapshotSnapshot } from "../CreateSnapshots";

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
