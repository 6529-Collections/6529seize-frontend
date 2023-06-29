import { useContext } from "react";
import { DistributionPlanToolContext } from "../DistributionPlanToolContext";

export default function ReviewDistributionPlan() {
  const { phases } = useContext(DistributionPlanToolContext);
  return (
    <div>
      <div className="tw-max-w-2xl tw-flex tw-flex-col">
        <h1 className="tw-uppercase tw-text-white">Review</h1>
        <p className="tw-mb-0 tw-mt-1 tw-block tw-font-light tw-text-base tw-text-neutral-400">
          Review and finalize your distribution plan.
        </p>
      </div>

      <div className="tw-mt-8 tw-pt-8 tw-border-t tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-t-neutral-700 tw-mx-auto">
        <div className="tw-mt-8 tw-flow-root">
          <div className="-tw-mx-4 -tw-my-2 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
            <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle sm:tw-px-6 lg:tw-px-8">
              <div className="tw-overflow-hidden tw-shadow tw-ring-1 tw-ring-neutral-700 tw-rounded-lg">
                <table className="tw-min-w-full tw-divide-y tw-divide-neutral-700">
                  <thead className="tw-bg-[#1E1E1E]">
                    <tr>
                      <th
                        scope="col"
                        className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
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
                        Wallets
                      </th>
                      <th
                        scope="col"
                        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                      >
                        Spots
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tw-bg-transparent tw-divide-y tw-divide-neutral-700/40">
                    {phases.map((phase) => (
                      <tr key={phase.id}>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="tw-mt-8 tw-flex tw-justify-end">
          <button className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-sm tw-text-white tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
