"use client";

import { useContext } from "react";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { AllowlistOperationCode } from "@/components/allowlist-tool/allowlist-tool.types";
import FinalizeSnapshotsTableSnapshotTooltipTableRow from "./FinalizeSnapshotsTableSnapshotTooltipTableRow";

interface Row {
  name: string;
  value: string;
}

export default function FinalizeSnapshotsTableSnapshotTooltipDefaultSnapshot({
  snapshotId,
}: {
  snapshotId: string | null;
}) {
  const { tokenPools, operations } = useContext(DistributionPlanToolContext);
  const tokenPool = tokenPools.find((tokenPool) => tokenPool.id === snapshotId);
  const createTokenPoolOperation = operations.find(
    (operation) =>
      operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL &&
      operation.params.id === snapshotId
  );

  const rows: Row[] = [
    {
      name: "Name",
      value: tokenPool?.name ?? "",
    },
    {
      name: "Type",
      value: "Snapshot",
    },
    {
      name: "Contract number",
      value: createTokenPoolOperation?.params?.contract ?? "",
    },
    {
      name: "Block number",
      value: createTokenPoolOperation?.params?.blockNo ?? "",
    },
    {
      name: "Token ID(s)",
      value: tokenPool?.tokenIds ?? "",
    },
    {
      name: "Consolidation block number",
      value: createTokenPoolOperation?.params?.consolidateBlockNo ?? "",
    },
    {
      name: "Wallets count",
      value: tokenPool?.walletsCount ?? "",
    },
    {
      name: "Tokens count",
      value: tokenPool?.tokensCount ?? "",
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
