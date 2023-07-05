import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import { PhaseConfigStep } from "../BuildPhaseFormConfigModal";

export default function SnapshotAskSelectTopHolders({
  onNextStep,
}: {
  onNextStep: (step: PhaseConfigStep) => void;
}) {
  return (
    <div>
      <DistributionPlanSecondaryText>
        Do you want to choose wallets from the snapshot based on a top count,
        such as the top holders by total cards held or total unique cards held?
      </DistributionPlanSecondaryText>
      <div className="tw-w-full tw-inline-flex tw-space-x-2 tw-justify-around">
        <button
          onClick={() =>
            onNextStep(PhaseConfigStep.SNAPSHOT_ASK_SELECT_RANDOM_HOLDERS)
          }
          type="button"
          className="tw-w-1/3 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          No
        </button>
        <button
          onClick={() =>
            onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS)
          }
          type="button"
          className="tw-w-1/3 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Yes
        </button>
      </div>
    </div>
  );
}
