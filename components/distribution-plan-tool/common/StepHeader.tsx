import { useContext, useState } from "react";
import {
  AllowlistOperation,
  AllowlistOperationCode,
} from "../../allowlist-tool/allowlist-tool.types";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";

const STEP_META: Record<
  DistributionPlanToolStep,
  { title: string; description: string }
> = {
  [DistributionPlanToolStep.CREATE_PLAN]: {
    title: "Distribution Plan Tool",
    description:
      "Loading your distribution plan. This may take a few seconds. Please do not refresh the page.",
  },
  [DistributionPlanToolStep.CREATE_SNAPSHOTS]: {
    title: "Collection snapshots",
    description:
      "By taking a snapshot at a certain block, we can determine the eligible token holders and allowlist wallets accordingly. Snapshot gives us a list of wallets and their balances at a certain block. We will use this list to create airdrops and allowlists.",
  },
  [DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT]: {
    title: "Custom snapshots",
    description:
      'To add wallets manually you need to create a CSV file: In the first column of the first row, write "Owner". Under that, add wallet addresses, with each address in a separate row.',
  },
  [DistributionPlanToolStep.CREATE_PHASES]: {
    title: "Create phases",
    description:
      "Many artist like to have multiple phases for their drop. A common 2-phase pattern is to have an allowlist phase and a public mint phase. A more complicated 4-phase pattern is: airdrop, allowlist , allowlist 2, public mint. Use this page to create your phases. We will define the phases in the next steps.",
  },
  [DistributionPlanToolStep.BUILD_PHASES]: {
    title: "",
    description: "Here you can select which groups of collectors belong in",
  },
  [DistributionPlanToolStep.MAP_DELEGATIONS]: {
    title: "Map delegations",
    description:
      "Here you can map the delegations of your collectors to the wallets that will be used to mint their NFTs.",
  },
  [DistributionPlanToolStep.REVIEW]: {
    title: "Review",
    description: "Review and finalize your distribution plan.",
  },
};

export default function StepHeader({
  step,
  title = "",
  description = "",
}: {
  step: DistributionPlanToolStep;
  title?: string;
  description?: string;
}) {
  const { distributionPlan, operations, fetchOperations } = useContext(
    DistributionPlanToolContext
  );

  const [loading, setLoading] = useState(false);

  const getJson = ({
    id,
    name,
    description,
  }: {
    id: string;
    name: string;
    description: string;
  }) => {
    const data = JSON.stringify([
      {
        code: AllowlistOperationCode.CREATE_ALLOWLIST,
        params: {
          id,
          name,
          description,
        },
      },
      operations.map((operation) => ({
        code: operation.code,
        params: operation.params,
      })),
    ]);
    const blob = new Blob([data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "operations.json";
    link.click();
  };
  const downloadOperations = async () => {
    if (loading) {
      return;
    }
    if (!distributionPlan) {
      return;
    }
    setLoading(true);
    await fetchOperations(distributionPlan.id);
    const { id, name, description } = distributionPlan;
    getJson({ id, name, description });
    setLoading(false);
  };
  return (
    <div
      className={` ${
        step === DistributionPlanToolStep.CREATE_PLAN
          ? "tw-max-w-2xl tw-mx-auto"
          : ""
      } tw-flex tw-flex-col tw-w-full`}>
      <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
        <h1 className="tw-text-white">
          <span className="font-lightest">{STEP_META[step].title}</span> {title}
        </h1>
        <div>
          {step !== DistributionPlanToolStep.CREATE_PLAN && (
            <button
              type="button"
              className="tw-group tw-whitespace-nowrap hover:tw-underline tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-relative tw-bg-transparent tw-border-none tw-py-2 tw-text-xs tw-font-medium tw-text-primary-300
              tw-w-full tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
              onClick={downloadOperations}>
              <svg
                className="tw-flex-shrink-0 -tw-ml-0.5 tw-h-4 tw-w-4 group-hover:tw-translate-y-0.5 tw-transition tw-duration-300 tw-ease-out"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21 15V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V15M17 10L12 15M12 15L7 10M12 15V3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download operations
            </button>
          )}
        </div>
      </div>
      <div className="tw-max-w-3xl">
        <p className="tw-mb-0 tw-block tw-font-light tw-text-base tw-text-neutral-400">
          {STEP_META[step].description} {description}
        </p>
      </div>
    </div>
  );
}
