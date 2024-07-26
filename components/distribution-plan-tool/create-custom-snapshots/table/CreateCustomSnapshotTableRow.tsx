import { AllowlistCustomTokenPool } from "../../../allowlist-tool/allowlist-tool.types";
import DistributionPlanTableRowWrapper from "../../common/DistributionPlanTableRowWrapper";

export default function CreateCustomSnapshotTableRow({
  snapshot,
}: {
  snapshot: AllowlistCustomTokenPool;
}) {
  return (
    <DistributionPlanTableRowWrapper>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {snapshot.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {snapshot.walletsCount}
      </td>
      <td className="tw-whitespace-nowrap tw-pl-3 tw-pr-4 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {snapshot.tokensCount}
      </td>
    </DistributionPlanTableRowWrapper>
  );
}
