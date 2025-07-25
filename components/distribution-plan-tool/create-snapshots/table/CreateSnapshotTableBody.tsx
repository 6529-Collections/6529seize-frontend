"use client";

import CreateSnapshotTableRow from "./CreateSnapshotTableRow";
import DistributionPlanTableBodyWrapper from "../../common/DistributionPlanTableBodyWrapper";
import { CreateSnapshotSnapshot } from "../CreateSnapshots";

export default function CreateSnapshotTableBody({
  snapshots,
}: {
  snapshots: CreateSnapshotSnapshot[];
}) {
  return (
    <DistributionPlanTableBodyWrapper>
      {snapshots.map((snapshot) => (
        <CreateSnapshotTableRow key={snapshot.id} snapshot={snapshot} />
      ))}
    </DistributionPlanTableBodyWrapper>
  );
}
