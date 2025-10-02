import {
  AllowlistOperationCode,
  Pool,
} from "@/components/allowlist-tool/allowlist-tool.types";
import FinalizeSnapshotsTableSnapshotTooltipDefaultSnapshot from "./FinalizeSnapshotsTableSnapshotTooltipDefaultSnapshot";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import FinalizeSnapshotsTableSnapshotTooltipCustomSnapshot from "./FinalizeSnapshotsTableSnapshotTooltipCustomSnapshot";

const PoolToCodeMap: Record<Pool, AllowlistOperationCode> = {
  [Pool.TOKEN_POOL]: AllowlistOperationCode.CREATE_TOKEN_POOL,
  [Pool.CUSTOM_TOKEN_POOL]: AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL,
  [Pool.WALLET_POOL]: AllowlistOperationCode.CREATE_WALLET_POOL,
};

export default function FinalizeSnapshotsTableSnapshotTooltip({
  snapshotId,
  snapshotType,
}: {
  snapshotId: string | null;
  snapshotType: Pool | null;
}) {
  if (!snapshotId || !snapshotType) {
    return <div></div>;
  }
  switch (snapshotType) {
    case Pool.TOKEN_POOL:
      return (
        <FinalizeSnapshotsTableSnapshotTooltipDefaultSnapshot
          snapshotId={snapshotId}
        />
      );
    case Pool.CUSTOM_TOKEN_POOL:
      return (
        <FinalizeSnapshotsTableSnapshotTooltipCustomSnapshot
          snapshotId={snapshotId}
        />
      );
    case Pool.WALLET_POOL:
      return <div></div>;
    default:
      assertUnreachable(snapshotType);
      return <div></div>
  }
}
