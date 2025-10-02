import CreateCustomSnapshotTableHeader from "./CreateCustomSnapshotTableHeader";
import CreateCustomSnapshotTableBody from "./CreateCustomSnapshotTableBody";
import DistributionPlanTableWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableWrapper";
import { AllowlistCustomTokenPool } from "@/components/allowlist-tool/allowlist-tool.types";

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
