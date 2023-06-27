import { AllowlistTokenPool } from "../../allowlist-tool/allowlist-tool.types";

export default function CreateSnapshotRow({
  tokenPool,
}: {
  tokenPool: AllowlistTokenPool;
}) {
  return (
    <div className="tw-w-full tw-inline-flex tw-justify-between">
      <div>{tokenPool.name}</div>
      <div>{tokenPool.description}</div>
      <div>{tokenPool.tokenIds}</div>
      <div>{tokenPool.walletsCount}</div>
      <div>{tokenPool.tokensCount}</div>
    </div>
  );
}
