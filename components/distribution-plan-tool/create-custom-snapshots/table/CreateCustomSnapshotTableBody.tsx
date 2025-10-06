import { AllowlistCustomTokenPool } from "@/components/allowlist-tool/allowlist-tool.types";
import DistributionPlanTableBodyWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableBodyWrapper";
import CreateCustomSnapshotTableRow from "./CreateCustomSnapshotTableRow";

export default function CreateCustomSnapshotTableBody({
  customSnapshots,
}: {
  customSnapshots: AllowlistCustomTokenPool[];
}) {
  return (
    <DistributionPlanTableBodyWrapper>
      {customSnapshots.map((snapshot) => (
        <CreateCustomSnapshotTableRow key={snapshot.id} snapshot={snapshot} />
      ))}
    </DistributionPlanTableBodyWrapper>
  );
}
