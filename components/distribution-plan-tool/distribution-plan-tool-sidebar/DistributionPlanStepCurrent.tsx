import {
    DISTRIBUTION_PLAN_STEPS,
    DistributionPlanStepDescription,
} from "./DistributionPlanToolSidebar";

export default function DistributionPlanStepCurrent({
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
          className="tw-absolute tw-left-[13.25px] tw-top-4 -tw-ml-px tw-mt-0.5 tw-h-full tw-w-0.5 tw-bg-iron-600"
          aria-hidden="true"></div>
      )}
      <div
        className="tw-group tw-relative tw-flex tw-items-start"
        aria-current="step">
        <span className="tw-flex tw-h-8 tw-items-center" aria-hidden="true">
          <span className="tw-relative tw-z-0 tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-primary-500 tw-bg-white">
            <span className="tw-h-2.5 tw-w-2.5 tw-rounded-full tw-bg-primary-500"></span>
          </span>
        </span>
        <span className="tw-ml-4 tw-flex tw-min-w-0 tw-flex-col">
          <span className="tw-text-sm tw-font-medium tw-text-white">
            {step.label}
          </span>
          <span className="tw-text-sm tw-text-iron-500">
            {step.description}
          </span>
        </span>
      </div>
    </li>
  );
}
