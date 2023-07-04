import DistributionPlanTableRowWrapper from "../../../common/DistributionPlanTableRowWrapper";
import { BuildPhasesPhaseComponent } from "../../BuildPhases";

export default function BuildPhaseTableRow({
  component,
}: {
  component: BuildPhasesPhaseComponent;
}) {
  return (
    <DistributionPlanTableRowWrapper>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {component.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {component.description}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {component.spotsNotRan ? "N/A" : component.spots}
      </td>
    </DistributionPlanTableRowWrapper>
  );
}
