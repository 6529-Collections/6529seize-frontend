import { AllowlistDescription } from "../../allowlist-tool/allowlist-tool.types";
import DistributionPlanToolPlansTableItem from "./DistributionPlanToolPlansTableItem";

export default function DistributionPlanToolPlansTable({
  plans,
  onDeleted,
}: {
  plans: AllowlistDescription[];
  onDeleted: (id: string) => void;
}) {

  return (
    <div>
      <div className="tw-mt-8 tw-flow-root">
        <div className="-tw-mx-4 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
          <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle sm:tw-px-6 lg:tw-px-8">
            <div className="tw-overflow-hidden tw-shadow tw-ring-1 tw-ring-white/10 tw-rounded-lg">
              <table className="tw-min-w-full tw-divide-y tw-divide-neutral-700/60">
                <thead className="tw-bg-neutral-800/60">
                  <tr>
                    <th
                      scope="col"
                      className="tw-py-3 tw-px-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="tw-sr-only tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pr-6"
                    >
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody className="tw-bg-neutral-900 tw-divide-y tw-divide-neutral-700/40">
                  {plans.map((plan) => (
                    <DistributionPlanToolPlansTableItem
                      plan={plan}
                      key={plan.id}
                      onDeleted={onDeleted}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
