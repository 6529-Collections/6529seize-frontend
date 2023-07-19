import DistributionPlanTableRowWrapper from "../../common/DistributionPlanTableRowWrapper";
import { CreatePhasesPhase } from "../CreatePhases";

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
    </DistributionPlanTableRowWrapper>
  );
}
