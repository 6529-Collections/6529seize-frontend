import { DistributionPlanToolStep } from "../DistributionPlanToolContext";
import DistributionPlanStepDone from "./DistributionPlanStepDone";
import { DistributionPlanStepDescription } from "./DistributionPlanToolSidebar";

interface DistributionPlanStepProps {
  step: DistributionPlanStepDescription;
  activeStepOrder: number;
}

export default function DistributionPlanStep({step, activeStepOrder}: DistributionPlanStepProps) {
  return (
    <DistributionPlanStepDone step={step} />
    //   <li className="tw-relative tw-pb-10">
    //     <div
    //       className="tw-absolute tw-left-[13.25px] tw-top-4 -tw-ml-px tw-mt-0.5 tw-h-full tw-w-0.5 tw-bg-neutral-600"
    //       aria-hidden="true"
    //     ></div>
    //     {/* Current Step */}
    //     <div
    //       className="tw-group tw-relative tw-flex tw-items-start"
    //       aria-current="step"
    //     >
    //       <span className="tw-flex tw-h-8 tw-items-center" aria-hidden="true">
    //         <span className="tw-relative tw-z-10 tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-primary-500 tw-bg-white">
    //           <span className="tw-h-2.5 tw-w-2.5 tw-rounded-full tw-bg-primary-500"></span>
    //         </span>
    //       </span>
    //       <span className="tw-ml-4 tw-flex tw-min-w-0 tw-flex-col">
    //         <span className="tw-text-sm tw-font-medium tw-text-white">
    //           Collection snapshots
    //         </span>
    //         <span className="tw-text-sm tw-text-neutral-500">
    //           Cursus semper viverra.
    //         </span>
    //       </span>
    //     </div>
    //   </li>
    //   <li className="tw-relative tw-pb-10">
    //     <div
    //       className="tw-absolute tw-left-[13.25px] tw-top-4 -tw-ml-px tw-mt-0.5 tw-h-full tw-w-0.5 tw-bg-neutral-600"
    //       aria-hidden="true"
    //     ></div>
    //     {/*  Upcoming Step  */}
    //     <div className="tw-group tw-relative tw-flex tw-items-start">
    //       <span className="tw-flex tw-h-8 tw-items-center" aria-hidden="true">
    //         <span className="tw-relative tw-z-10 tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-solid tw-border-2 tw-border-neutral-300 tw-bg-neutral-900">
    //           <span className="tw-h-2.5 tw-w-2.5 tw-rounded-full tw-bg-transparent tw-bg-neutral-300"></span>
    //         </span>
    //       </span>
    //       <span className="tw-ml-4 tw-flex tw-min-w-0 tw-flex-col">
    //         <span className="tw-text-sm tw-font-medium tw-text-neutral-500">
    //           Step
    //         </span>
    //         <span className="tw-text-sm tw-text-neutral-500">
    //           Penatibus eu quis ante.
    //         </span>
    //       </span>
    //     </div>
    //   </li>
  );
}
