import {
  DISTRIBUTION_PLAN_STEPS,
  DistributionPlanStepDescription,
} from "./DistributionPlanToolSidebar";

export default function DistributionPlanStepUpcoming({
  step,
}: {
  step: DistributionPlanStepDescription;
}) {
  const isLastStep =
    step.order === Object.values(DISTRIBUTION_PLAN_STEPS).at(-1)!.order;
  return (
    <li className="tw-relative tw-pb-10">
      {!isLastStep && (
        <div
          className="tw-absolute tw-left-[13.25px] tw-top-4 -tw-ml-px tw-mt-0.5 tw-h-full tw-w-0.5 tw-bg-neutral-600"
          aria-hidden="true"></div>
      )}
      <div className="tw-group tw-relative tw-flex tw-items-start">
        <span className="tw-flex tw-h-8 tw-items-center" aria-hidden="true">
          <span className="tw-relative tw-z-0 tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-solid tw-border-2 tw-border-neutral-300 tw-bg-neutral-900">
            <span className="tw-h-2.5 tw-w-2.5 tw-rounded-full tw-bg-neutral-300"></span>
          </span>
        </span>
        <span className="tw-ml-4 tw-flex tw-min-w-0 tw-flex-col">
          <span className="tw-text-sm tw-font-medium tw-text-neutral-500">
            {step.label}
          </span>
          <span className="tw-text-sm tw-text-neutral-500">
            {step.description}
          </span>
        </span>
      </div>
    </li>
  );
}
