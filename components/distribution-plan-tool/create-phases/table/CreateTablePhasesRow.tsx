import DistributionPlanTableRowWrapper from "../../common/DistributionPlanTableRowWrapper";
import { CreatePhasesPhase } from "../CreatePhases";
import DistributionPlanDeleteOperationButton from "../../common/DistributionPlanDeleteOperationButton";

export default function CreateTablePhasesRow({
  phase,
}: {
  phase: CreatePhasesPhase;
}) {
  return (
    <DistributionPlanTableRowWrapper>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {phase.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-text-right tw-font-normal tw-text-neutral-300 sm:tw-pr-6">
        <DistributionPlanDeleteOperationButton
          allowlistId={phase.allowlistId}
          order={phase.order}
        />
      </td>
    </DistributionPlanTableRowWrapper>
  );
}
