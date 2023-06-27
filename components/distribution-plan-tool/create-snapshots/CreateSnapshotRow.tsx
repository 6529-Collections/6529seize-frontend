import { useContext, useEffect, useState } from "react";
import {
  AllowlistTokenPool,
  AllowlistTransferPool,
} from "../../allowlist-tool/allowlist-tool.types";
import { DistributionPlanToolContext } from "../DistributionPlanToolContext";

export default function CreateSnapshotRow({
  tokenPool,
}: {
  tokenPool: AllowlistTokenPool;
}) {
  const { transferPools } = useContext(DistributionPlanToolContext);
  const [transferPool, setTransferPool] =
    useState<AllowlistTransferPool | null>(null);
  useEffect(() => {
    setTransferPool(
      transferPools.find((pool) => pool.id === tokenPool.transferPoolId) ?? null
    );
  }, [transferPools, tokenPool]);
  return (
    <tr>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {tokenPool.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {transferPool?.contract}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {transferPool?.blockNo}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {tokenPool.tokenIds ?? "All"}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {tokenPool.walletsCount}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {tokenPool.tokensCount}
      </td>
    </tr>
  );
}
