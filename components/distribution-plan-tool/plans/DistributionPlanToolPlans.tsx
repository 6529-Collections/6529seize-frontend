import { useEffect, useState } from "react";
import { distributionPlanApiFetch } from "../../../services/distribution-plan-api";
import { AllowlistDescription } from "../../allowlist-tool/allowlist-tool.types";
import DistributionPlanToolPlansLoading from "./DistributionPlanToolPlansLoading";
import DistributionPlanToolPlansNoPlans from "./DistributionPlanToolPlansNoPlans";
import DistributionPlanToolPlansTable from "./DistributionPlanToolPlansTable";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";

export enum State {
  LOADING = "LOADING",
  NO_PLANS = "NO_PLANS",
  HAS_PLANS = "HAS_PLANS",
}

export default function DistributionPlanToolPlans() {
  const [loading, setLoading] = useState<boolean>(true);
  const [plans, setPlans] = useState<AllowlistDescription[]>([]);
  const [state, setState] = useState<State>(State.LOADING);

  useEffect(() => {
    if (loading) {
      setState(State.LOADING);
      return;
    }
    if (!plans.length) {
      setState(State.NO_PLANS);
      return;
    }
    if (plans.length) {
      setState(State.HAS_PLANS);
      return;
    }
  }, [loading, plans]);
  useEffect(() => {
    const getPlans = async () => {
      setLoading(true);
      const data = await distributionPlanApiFetch<AllowlistDescription[]>(
        "/allowlists"
      );

      setPlans(data.data ?? []);
      setLoading(false);
    };
    getPlans();
  }, []);
  return (
    <div>
      <div className="tw-mt-6 tw-flow-root">
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
                  <tr>
                    <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-neutral-300 sm:tw-pl-6">
                      Name
                    </td>
                    <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-neutral-300">
                      Description
                    </td>
                    <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-neutral-300">
                      Date
                    </td>
                    <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-text-right tw-font-normal tw-text-neutral-300 sm:tw-pr-6">
                      <button
                        type="button"
                        title="Delete"
                        className="tw-rounded-full tw-group tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20"
                      >
                        <svg
                          className="tw-h-4 tw-w-4 group-hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-hidden">
        {(() => {
          switch (state) {
            case State.LOADING:
              return <DistributionPlanToolPlansLoading />;
            case State.NO_PLANS:
              return <DistributionPlanToolPlansNoPlans />;
            case State.HAS_PLANS:
              return <DistributionPlanToolPlansTable plans={plans} />;
            default:
              assertUnreachable(state);
              return null;
          }
        })()}
      </div>
    </div>
  );
}
