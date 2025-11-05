import { Pool } from "@/components/allowlist-tool/allowlist-tool.types";
import FinalizeSnapshotsTableSnapshotTooltipDefaultSnapshot from "./FinalizeSnapshotsTableSnapshotTooltipDefaultSnapshot";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import FinalizeSnapshotsTableSnapshotTooltipCustomSnapshot from "./FinalizeSnapshotsTableSnapshotTooltipCustomSnapshot";

export default function FinalizeSnapshotsTableSnapshotTooltip({
  snapshotId,
  snapshotType,
}: {
  readonly snapshotId: string | null;
  readonly snapshotType: Pool | null;
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
      return <div></div>;
  }
}
