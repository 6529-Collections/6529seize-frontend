import CreateCustomSnapshotTableHeader from "./CreateCustomSnapshotTableHeader";
import CreateCustomSnapshotTableBody from "./CreateCustomSnapshotTableBody";
import DistributionPlanTableWrapper from "../../common/DistributionPlanTableWrapper";
import { AllowlistCustomTokenPool } from "../../../allowlist-tool/allowlist-tool.types";

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
