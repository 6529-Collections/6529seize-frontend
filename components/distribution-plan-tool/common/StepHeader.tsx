import { useContext } from "react";
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
      "The Seize distribution plan tool allows you to build a distribution plan for your mint that includes airdrops, allowlists and public minting in one or more phases.",
  },
  [DistributionPlanToolStep.CREATE_SNAPSHOTS]: {
    title: "Collection snapshots",
    description:
      "By taking a snapshot at a certain block, we can determine the eligible token holders and allowlist wallets accordingly. Snapshot gives us a list of wallets and their balances at a certain block. We will use this list to create airdrops and allowlists.",
  },
  [DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT]: {
    title: "Custom snapshots",
    description:
      'To add wallets manually you need to create a CSV file: In the first column of the first row, write "Owner". Under that, add wallet numbers with each number in a separate row.',
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
  const { distributionPlan, operations } = useContext(
    DistributionPlanToolContext
  );
  const downloadOperations = () => {
    if (!distributionPlan) {
      return;
    }
    const data = JSON.stringify([
      {
        code: AllowlistOperationCode.CREATE_ALLOWLIST,
        params: {
          id: distributionPlan.id,
          name: distributionPlan.name,
          description: distributionPlan.description,
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
  return (
    <div
      className={` ${
        step === DistributionPlanToolStep.CREATE_PLAN
          ? "tw-max-w-2xl tw-mx-auto"
          : "tw-max-w-[57rem]"
      } tw-flex tw-flex-col `}
    >
      <h1 className="tw-uppercase tw-text-white">
        {STEP_META[step].title} {title}
      </h1>
      <p className="tw-mb-0 tw-block tw-font-light tw-text-base tw-text-neutral-400">
        {STEP_META[step].description} {description}
      </p>
      {step !== DistributionPlanToolStep.CREATE_PLAN && (
        <button onClick={downloadOperations}>Download operations</button>
      )}
    </div>
  );
}
