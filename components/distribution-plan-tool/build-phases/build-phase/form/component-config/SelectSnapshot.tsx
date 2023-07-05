import { useState } from "react";
import AllowlistToolSelectMenu, {
  AllowlistToolSelectMenuOption,
} from "../../../../../allowlist-tool/common/select-menu/AllowlistToolSelectMenu";
import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import { PhaseConfigStep } from "../BuildPhaseFormConfigModal";

export default function SelectSnapshot({
  snapshots,
  onNextStep,
}: {
  snapshots: AllowlistToolSelectMenuOption[];
  onNextStep: (step: PhaseConfigStep) => void;
}) {
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<AllowlistToolSelectMenuOption | null>(null);

  const onAddSnapshot = () => {
    console.log(selectedSnapshot);
    onNextStep(PhaseConfigStep.SNAPSHOT_ASK_EXCLUDE_COMPONENT_WINNERS);
  };
  return (
    <div>
      <DistributionPlanSecondaryText>
        First, select a snapshot to include in this group.
        <br />
        Once selected, you can further customize this snapshot by adding more
        configurations in the next steps.
        <br />
        After you&apos;ve finished configuring your selected snapshot, you can
        add more snapshots to this group as needed.
      </DistributionPlanSecondaryText>

      <div className="tw-mt-4">
        <AllowlistToolSelectMenu
          label="Snapshot"
          options={snapshots}
          selectedOption={selectedSnapshot}
          setSelectedOption={setSelectedSnapshot}
          placeholder="Select snapshot"
        />
      </div>

      <div className="tw-mt-8 tw-flex tw-justify-end">
        <button
          onClick={onAddSnapshot}
          type="button"
          className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Add snapshot
        </button>
      </div>
    </div>
  );
}
