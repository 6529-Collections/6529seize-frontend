import DistributionPlanTableBodyWrapper from "../../../../../common/DistributionPlanTableBodyWrapper";
import DistributionPlanTableHeaderWrapper from "../../../../../common/DistributionPlanTableHeaderWrapper";
import DistributionPlanTableRowWrapper from "../../../../../common/DistributionPlanTableRowWrapper";
import DistributionPlanTableWrapper from "../../../../../common/DistributionPlanTableWrapper";
import { BuildPhasesPhase } from "../../../../BuildPhases";

interface ExcludedComponent {
  readonly id: string;
  readonly name: string;
  readonly phaseName: string;
}

export default function FinalizeSnapshotsTableExcludedComponentsTooltip({
  excludedComponents,
  phases,
}: {
  excludedComponents: string[];
  phases: BuildPhasesPhase[];
}) {
  const components = phases.reduce<ExcludedComponent[]>((acc, phase) => {
    const phaseName = phase.name;
    return [
      ...acc,
      ...phase.components
        .filter((component) => excludedComponents.includes(component.id))
        .map((component) => ({
          id: component.id,
          name: component.name,
          phaseName,
        })),
    ];
  }, []);

  return (
    <DistributionPlanTableWrapper>
      <DistributionPlanTableHeaderWrapper>
        <th
          scope="col"
          className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left 
  tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
        >
          Name
        </th>
        <th
          scope="col"
          className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase 
  tw-tracking-[0.25px]"
        >
          Phase
        </th>
      </DistributionPlanTableHeaderWrapper>
      <DistributionPlanTableBodyWrapper>
        {components.map((component) => (
          <DistributionPlanTableRowWrapper key={component.id}>
            <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
              {component.name}
            </td>
            <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
              {component.phaseName}
            </td>
          </DistributionPlanTableRowWrapper>
        ))}
      </DistributionPlanTableBodyWrapper>
    </DistributionPlanTableWrapper>
  );
}
