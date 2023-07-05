import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import { PhaseConfigStep } from "../BuildPhaseFormConfigModal";

export default function SnapshotSelectTopHoldersByUniqueTokensCount({
  onNextStep,
}: {
  onNextStep: (step: PhaseConfigStep) => void;
}) {
  return (
    <div>
      <DistributionPlanSecondaryText>
        For including holders based on a unique tokens count, please select the
        minimum and maximum positions.
      </DistributionPlanSecondaryText>
      <div className="col-span-1">
        <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
          From
        </label>
        <div className="tw-mt-2">
          <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
            <input
              type="text"
              className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
              placeholder="From"
            />
          </div>
        </div>
      </div>
      <div className="col-span-1">
        <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
          To
        </label>
        <div className="tw-mt-2">
          <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
            <input
              type="text"
              className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
              placeholder="To"
            />
          </div>
        </div>
      </div>
      <div className="tw-mt-8 tw-flex tw-justify-end">
        <button
          onClick={() =>
            onNextStep(PhaseConfigStep.SNAPSHOT_ASK_SELECT_RANDOM_HOLDERS)
          }
          type="button"
          className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Select Holders
        </button>
      </div>
    </div>
  );
}
