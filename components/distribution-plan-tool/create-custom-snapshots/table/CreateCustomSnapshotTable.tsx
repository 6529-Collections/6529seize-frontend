import type { AllowlistCustomTokenPool } from "@/components/allowlist-tool/allowlist-tool.types";
import DistributionPlanTableWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableWrapper";

import CreateCustomSnapshotTableBody from "./CreateCustomSnapshotTableBody";
import CreateCustomSnapshotTableHeader from "./CreateCustomSnapshotTableHeader";

export default function CreateCustomSnapshotTable({
  customSnapshots,
}: {
  customSnapshots: AllowlistCustomTokenPool[];
}) {
  return (
    <DistributionPlanTableWrapper>
      <CreateCustomSnapshotTableHeader />
      <CreateCustomSnapshotTableBody customSnapshots={customSnapshots}/>
    </DistributionPlanTableWrapper>
  );
}
