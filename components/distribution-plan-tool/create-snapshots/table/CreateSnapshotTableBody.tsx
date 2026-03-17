"use client";

import CreateSnapshotTableRow from "./CreateSnapshotTableRow";
import DistributionPlanTableBodyWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableBodyWrapper";
import type { CreateSnapshotSnapshot } from "../CreateSnapshots";

export default function CreateSnapshotTableBody({
  snapshots,
  refreshDownloads,
}: {
  snapshots: CreateSnapshotSnapshot[];
  refreshDownloads: () => Promise<void>;
}) {
  return (
    <DistributionPlanTableBodyWrapper>
      {snapshots.map((snapshot) => (
        <CreateSnapshotTableRow
          key={snapshot.id}
          snapshot={snapshot}
          refreshDownloads={refreshDownloads}
        />
      ))}
    </DistributionPlanTableBodyWrapper>
  );
}
