import { DistributionPlanToolStep } from "../DistributionPlanToolContext";

const STEP_META: Record<
  DistributionPlanToolStep,
  { title: string; description: string }
> = {
  [DistributionPlanToolStep.CREATE_PLAN]: {
    title: "Distribution Plan Tool",
    description:
      "The Seize distribution plan tool allows you to build a distribution plan for your mint that includes airdrops, allowlists and public minting in one more phases.",
  },
  [DistributionPlanToolStep.CREATE_SNAPSHOTS]: {
    title: "Collection snapshots",
    description:
      " Lorem ipsum dolor sit amet consectetur. Nisi scelerisque dolor quis sed tellus.",
  },
  [DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT]: {
    title: "Create a distribution plan",
    description:
      "Create a distribution plan to distribute your allowlist to your endpoints.",
  },
  [DistributionPlanToolStep.CREATE_PHASES]: {
    title: "Create phases",
    description:
      "Create phases to distribute your allowlist to your endpoints.",
  },
  [DistributionPlanToolStep.BUILD_PHASES]: {
    title: "Build phases",
    description: "Build phases to distribute your allowlist to your endpoints.",
  },
  [DistributionPlanToolStep.REVIEW]: {
    title: "Review",
    description:
      "Review your distribution plan before you distribute your allowlist to your endpoints.",
  },
};

export default function StepHeader({
  step,
}: {
  step: DistributionPlanToolStep;
}) {
  return (
    <div
      className={`tw-max-w-2xl ${
        step === DistributionPlanToolStep.CREATE_PLAN ? "tw-mx-auto" : ""
      } tw-flex tw-flex-col`}
    >
      <h1 className="tw-uppercase tw-text-white">{STEP_META[step].title}</h1>
      <p className="tw-mt-1 tw-mb-0 tw-block tw-font-light tw-text-base tw-text-neutral-400">
        {STEP_META[step].description}
      </p>
    </div>
  );
}
