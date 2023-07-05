import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import { PhaseConfigStep } from "../BuildPhaseFormConfigModal";

export default function FinalizeSnapshot({
  onNextStep,
}: {
  onNextStep: (step: PhaseConfigStep) => void;
}) {
  return (
    <div>
      <DistributionPlanSecondaryText>
        Here you can see your snapshot configurations.
        <br />
        If you would like to add another snapshot, click &ldquo;Add another
        snapshot&rdquo;, otherwise click &ldquo;Configure Group&rdquo;.
      </DistributionPlanSecondaryText>
      <div className="tw-w-full tw-inline-flex tw-space-x-2 tw-justify-around">
        <button
          onClick={() => onNextStep(PhaseConfigStep.SELECT_SNAPSHOT)}
          type="button"
          className="tw-w-1/3 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Add another snapshot
        </button>
        <button
          onClick={() =>
            onNextStep(PhaseConfigStep.COMPONENT_ASK_SELECT_RANDOM_HOLDERS)
          }
          type="button"
          className="tw-w-1/3 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Configure Group
        </button>
      </div>
    </div>
  );
}
