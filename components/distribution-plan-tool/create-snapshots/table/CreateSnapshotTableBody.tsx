import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import CreateSnapshotTableRow from "./CreateSnapshotTableRow";
import { AllowlistOperationCode } from "../../../allowlist-tool/allowlist-tool.types";
import DistributionPlanTableBodyWrapper from "../../common/DistributionPlanTableBodyWrapper";

export interface CreateSnapshotSnapshot {
  id: string;
  name: string;
  description: string;
  transferPoolId: string;
  tokenIds: string | null;
  walletsCount: number | null;
  tokensCount: number | null;
  contract: string | null;
  blockNo: number | null;
}

export default function CreateSnapshotTableBody() {
  const { tokenPools, operations } = useContext(DistributionPlanToolContext);
  const [snapshots, setSnapshots] = useState<CreateSnapshotSnapshot[]>([]);

  useEffect(() => {
    const createTokenPoolOperations = operations.filter(
      (operation) => operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL
    );

    setSnapshots(
      createTokenPoolOperations.map((createTokenPoolOperation) => {
        const tokenPool =
          tokenPools.find(
            (tokenPool) => tokenPool.id === createTokenPoolOperation.params.id
          ) ?? null;
        const transferPoolOp = operations.find(
          (op) =>
            op.code === AllowlistOperationCode.GET_COLLECTION_TRANSFERS &&
            op.params.id === createTokenPoolOperation.params.transferPoolId
        );

        return {
          id: createTokenPoolOperation.params.id,
          name: createTokenPoolOperation.params.name,
          description: createTokenPoolOperation.params.description,
          transferPoolId: createTokenPoolOperation.params.transferPoolId,
          tokenIds: createTokenPoolOperation.params.tokenIds,
          walletsCount: tokenPool?.walletsCount ?? null,
          tokensCount: tokenPool?.tokensCount ?? null,
          contract: transferPoolOp?.params.contract ?? null,
          blockNo: transferPoolOp?.params.blockNo ?? null,
        };
      })
    );
  }, [operations, tokenPools]);
  return (
    <DistributionPlanTableBodyWrapper>
      {snapshots.map((snapshot) => (
        <CreateSnapshotTableRow key={snapshot.id} snapshot={snapshot} />
      ))}
    </DistributionPlanTableBodyWrapper>
  );
}
