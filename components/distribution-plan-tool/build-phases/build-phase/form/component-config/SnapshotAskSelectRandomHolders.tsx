import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import { PhaseConfigStep } from "../BuildPhaseFormConfigModal";

export default function SnapshotAskSelectRandomHolders({
    onNextStep,
  }: {
    onNextStep: (step: PhaseConfigStep) => void;
  }) {
  return     <div>
  <DistributionPlanSecondaryText>
    Do you want to choose some random wallets from the snapshot?
    <br />
    PS! If you plan to add multiple snapshots to group, you can later select random holders from the whole group.
  </DistributionPlanSecondaryText>
  <div className="tw-w-full tw-inline-flex tw-space-x-2 tw-justify-around">
    <button
      onClick={() =>
        onNextStep(PhaseConfigStep.FINALIZE_SNAPSHOT)
      }
      type="button"
      className="tw-w-1/3 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
    >
      No
    </button>
    <button
      onClick={() =>
        onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_RANDOM_HOLDERS)
      }
      type="button"
      className="tw-w-1/3 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
    >
      Yes
    </button>
  </div>
</div>;
}
