import CreateSnapshotTableHeader from "./CreateSnapshotTableHeader";
import CreateSnapshotTableBody from "./CreateSnapshotTableBody";
import DistributionPlanTableWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableWrapper";
import type { CreateSnapshotSnapshot } from "../CreateSnapshots";

export default function CreateSnapshotTable({
  snapshots,
  refreshDownloads,
}: {
  snapshots: CreateSnapshotSnapshot[];
  refreshDownloads: () => Promise<void>;
}) {
  return (
    <DistributionPlanTableWrapper>
      <CreateSnapshotTableHeader />
      <CreateSnapshotTableBody
        snapshots={snapshots}
        refreshDownloads={refreshDownloads}
      />
    </DistributionPlanTableWrapper>
  );
}
