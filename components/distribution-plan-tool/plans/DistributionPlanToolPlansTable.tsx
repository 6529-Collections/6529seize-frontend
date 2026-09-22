"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
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
        <div className="tw-w-full">
          <div className="tw-py-2">
            <div className="tw-overflow-hidden tw-rounded-lg tw-shadow tw-ring-1 tw-ring-white/10">
              {/* Global pseudo-elements create anonymous cells in fixed tables. */}
              <table
                role="table"
                className="tw-block tw-w-full tw-table-fixed tw-divide-y tw-divide-iron-700/60 before:tw-content-none after:tw-content-none sm:tw-table [&_:is(thead,tbody,tr)]:before:tw-content-none [&_:is(thead,tbody,tr)]:after:tw-content-none"
              >
                <thead
                  role="rowgroup"
                  className="tw-sr-only tw-bg-iron-800/60 sm:tw-not-sr-only"
                >
                  <tr role="row">
                    <th
                      role="columnheader"
                      scope="col"
                      className="tw-w-1/4 tw-px-2 tw-py-3 tw-text-left tw-text-[0.6875rem] tw-font-medium tw-uppercase tw-leading-[1.125rem] tw-tracking-[0.25px] tw-text-iron-400 sm:tw-px-3 sm:tw-pl-6"
                    >
                      Name
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      className="tw-break-words tw-px-2 tw-py-3 tw-text-left tw-text-[0.6875rem] tw-font-medium tw-uppercase tw-leading-[1.125rem] tw-tracking-[0.25px] tw-text-iron-400 sm:tw-px-3"
                    >
                      Description
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      className="tw-w-20 tw-whitespace-nowrap tw-px-2 tw-py-3 tw-text-left tw-text-[0.6875rem] tw-font-medium tw-uppercase tw-leading-[1.125rem] tw-tracking-[0.25px] tw-text-iron-400 sm:tw-w-24 sm:tw-px-3"
                    >
                      Date
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      className="tw-w-14 tw-px-2 tw-py-3 sm:tw-w-20 sm:tw-px-3 sm:tw-pr-6"
                    >
                      <span className="tw-sr-only">Delete</span>
                    </th>
                  </tr>
                </thead>
                <tbody
                  role="rowgroup"
                  className="tw-block tw-divide-y tw-divide-iron-700/40 tw-bg-iron-900 sm:tw-table-row-group"
                >
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
