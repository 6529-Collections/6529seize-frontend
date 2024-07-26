import { useContext } from "react";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  Pool,
} from "../../../../../../allowlist-tool/allowlist-tool.types";
import { DistributionPlanToolContext } from "../../../../../DistributionPlanToolContext";
import { assertUnreachable } from "../../../../../../../helpers/AllowlistToolHelpers";
import DistributionPlanTableWrapper from "../../../../../common/DistributionPlanTableWrapper";
import DistributionPlanTableHeaderWrapper from "../../../../../common/DistributionPlanTableHeaderWrapper";
import DistributionPlanTableBodyWrapper from "../../../../../common/DistributionPlanTableBodyWrapper";
import DistributionPlanTableRowWrapper from "../../../../../common/DistributionPlanTableRowWrapper";

interface ExcludedSnapshot {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly walletsCount: number | null;
  readonly tokensCount: number | null;
}

export default function FinalizeSnapshotsTableExcludedSnapshotsTooltip({
  excludedSnapshots,
}: {
  excludedSnapshots: { snapshotId: string; snapshotType: Pool }[];
}) {
  const { operations, tokenPools } = useContext(DistributionPlanToolContext);

  const tokenPoolOperations = operations.filter((operation) =>
    [
      AllowlistOperationCode.CREATE_TOKEN_POOL,
      AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL,
    ].includes(operation.code)
  );

  const convertTokenPoolOperationToExcludedSnapshot = (
    operation: AllowlistOperation
  ): ExcludedSnapshot => {
    const tokenPool = tokenPools.find(
      (tokenPool) => tokenPool.id === operation.params.id
    );
    return {
      id: operation.params.id,
      name: tokenPool?.name || "",
      type: "Snapshot",
      walletsCount: tokenPool?.walletsCount ?? null,
      tokensCount: tokenPool?.tokensCount ?? null,
    };
  };

  const convertCustomTokenPoolOperationToExcludedSnapshot = (
    operation: AllowlistOperation
  ): ExcludedSnapshot => ({
    id: operation.params.id,
    name: operation.params.name,
    type: "Custom Snapshot",
    walletsCount: new Set(operation.params.tokens.map((t: any) => t.owner))
      .size,
    tokensCount: operation.params.tokens.length,
  });

  const excludedSnapshotsData: ExcludedSnapshot[] = excludedSnapshots.map(
    (excludedSnapshot) => {
      const operation = tokenPoolOperations.find(
        (operation) => operation.params.id === excludedSnapshot.snapshotId
      );
      if (!operation) {
        throw new Error("Operation not found");
      }
      switch (excludedSnapshot.snapshotType) {
        case Pool.TOKEN_POOL:
          return convertTokenPoolOperationToExcludedSnapshot(operation);
        case Pool.CUSTOM_TOKEN_POOL:
          return convertCustomTokenPoolOperationToExcludedSnapshot(operation);
        case Pool.WALLET_POOL:
          throw new Error("Wallet pool is not supported");
        default:
          assertUnreachable(excludedSnapshot.snapshotType);
          throw new Error("Unreachable");
      }
    }
  );

  return (
    <DistributionPlanTableWrapper>
      <DistributionPlanTableHeaderWrapper>
        <th
          scope="col"
          className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left 
      tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
        >
          Name
        </th>
        <th
          scope="col"
          className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase 
      tw-tracking-[0.25px]"
        >
          Type
        </th>
        <th
          scope="col"
          className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase 
      tw-tracking-[0.25px]"
        >
          Wallets
        </th>
        <th
          scope="col"
          className="tw-pl-3 tw-pr-4 tw-py-3 tw-whitespace-nowrap tw-text-left 
      tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
        >
          Tokens
        </th>
      </DistributionPlanTableHeaderWrapper>
      <DistributionPlanTableBodyWrapper>
        {excludedSnapshotsData.map((excludedSnapshot) => (
          <DistributionPlanTableRowWrapper key={excludedSnapshot.id}>
            <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
              {excludedSnapshot.name}
            </td>
            <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
              {excludedSnapshot.type ?? "N/A"}
            </td>
            <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
              {excludedSnapshot.walletsCount ?? "N/A"}
            </td>
            <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
              {excludedSnapshot.tokensCount ?? "N/A"}
            </td>
          </DistributionPlanTableRowWrapper>
        ))}
      </DistributionPlanTableBodyWrapper>
    </DistributionPlanTableWrapper>
  );
}
