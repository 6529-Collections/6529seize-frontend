"use client";

import { useContext } from "react";
import FinalizeSnapshotsTableSnapshotTooltipTableRow from "./FinalizeSnapshotsTableSnapshotTooltipTableRow";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { AllowlistOperationCode } from "@/components/allowlist-tool/allowlist-tool.types";

interface Row {
  name: string;
  value: string;
}

export default function FinalizeSnapshotsTableSnapshotTooltipCustomSnapshot({
  snapshotId,
}: {
  snapshotId: string;
}) {
  const { operations } = useContext(DistributionPlanToolContext);
  const customPool = operations.find(
    (o) =>
      o.code === AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL &&
      o.params?.id === snapshotId
  );

  const rows: Row[] = [
    {
      name: "Name",
      value: customPool?.params?.name ?? "",
    },
    {
      name: "Type",
      value: "Custom snapshot",
    },

    {
      name: "Wallets count",
      value:
        new Set(customPool?.params.tokens.map((t: any) => t.owner)).size ?? "",
    },
    {
      name: "Tokens count",
      value: customPool?.params.tokens.length ?? "",
    },
  ];

  return (
    <div>
      {rows.map((row, i) => (
        <FinalizeSnapshotsTableSnapshotTooltipTableRow
          key={`row-${i}`}
          name={row.name}
          value={row.value}
        />
      ))}
    </div>
  );
}
