import { AllowlistPhaseWithComponentAndItems } from "../../../allowlist-tool/allowlist-tool.types";
import DistributionPlanTableRowWrapper from "../../common/DistributionPlanTableRowWrapper";

export default function ReviewDistributionPlanTableRow({
  phase,
}: {
  phase: AllowlistPhaseWithComponentAndItems;
}) {
  return (
    <DistributionPlanTableRowWrapper>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {phase.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {phase.description}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {phase.walletsCount}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {phase.tokensCount}
      </td>
    </DistributionPlanTableRowWrapper>
  );
}
