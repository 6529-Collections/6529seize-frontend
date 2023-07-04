import { useContext } from "react";
import { DistributionPlanToolContext } from "../DistributionPlanToolContext";

export default function DistributionPlanErrorWarning() {
  const { distributionPlan, runOperations } = useContext(
    DistributionPlanToolContext
  );
  return (
    <div className="tw-relative tw-rounded-lg tw-bg-[#282026]/80 tw-ring-1 tw-ring-[#632c28] tw-p-4">
      <div className="tw-flex">
        <div className="tw-flex-shrink-0">
          <svg
            className="tw-h-5 tw-w-5 tw-text-error -tw-mt-2"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.9998 8.99999V13M11.9998 17H12.0098M10.6151 3.89171L2.39019 18.0983C1.93398 18.8863 1.70588 19.2803 1.73959 19.6037C1.769 19.8857 1.91677 20.142 2.14613 20.3088C2.40908 20.5 2.86435 20.5 3.77487 20.5H20.2246C21.1352 20.5 21.5904 20.5 21.8534 20.3088C22.0827 20.142 22.2305 19.8857 22.2599 19.6037C22.2936 19.2803 22.0655 18.8863 21.6093 18.0983L13.3844 3.89171C12.9299 3.10654 12.7026 2.71396 12.4061 2.58211C12.1474 2.4671 11.8521 2.4671 11.5935 2.58211C11.2969 2.71396 11.0696 3.10655 10.6151 3.89171Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="tw-ml-3 tw-pr-10">
          <p className="tw-m-0 tw-p-0 tw-text-sm tw-font-medium tw-text-error">
            Distribution plan building failed
          </p>
          <div className="tw-mt-2">
            <p className="tw-m-0 tw-p-0 tw-text-sm tw-font-light tw-text-[#fcc5c1]">
              {distributionPlan?.activeRun?.errorReason}
            </p>
          </div>
        </div>
      </div>
      <div className="tw-absolute tw-right-4 tw-top-2">
        <button
          onClick={runOperations}
          type="button"
          className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-transparent tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out tw-text-error"
        >
          Run Analysis
        </button>
      </div>
    </div>
  );
}
