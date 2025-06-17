"use client";

import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import CreateSnapshotTableRow from "./CreateSnapshotTableRow";
import { AllowlistOperationCode } from "../../../allowlist-tool/allowlist-tool.types";
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
