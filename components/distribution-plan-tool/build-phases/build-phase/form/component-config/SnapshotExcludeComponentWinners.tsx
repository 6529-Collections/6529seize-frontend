import { useEffect, useState } from "react";
import AllowlistToolSelectMenuMultiple, {
  AllowlistToolSelectMenuMultipleOption,
} from "../../../../../allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple";
import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import { BuildPhasesPhase } from "../../../BuildPhases";
import { PhaseConfigStep } from "../BuildPhaseFormConfigModal";

const SELECT_ALL_OPTION: AllowlistToolSelectMenuMultipleOption = {
  title: "Select all",
  subTitle: null,
  value: "select-all",
};

export default function SnapshotExcludeComponentWinners({
  phases,
  onNextStep,
}: {
  phases: BuildPhasesPhase[];
  onNextStep: (step: PhaseConfigStep) => void;
}) {
  const [options, setOptions] = useState<
    AllowlistToolSelectMenuMultipleOption[]
  >([
    SELECT_ALL_OPTION,
    ...phases.flatMap((p) =>
      p.components.map((c) => ({
        title: c.name,
        subTitle: p.name,
        value: c.id,
      }))
    ),
  ]);

  useEffect(() => {
    setOptions([
      SELECT_ALL_OPTION,
      ...phases.flatMap((p) =>
        p.components.map((c) => ({
          title: c.name,
          subTitle: p.name,
          value: c.id,
        }))
      ),
    ]);
  }, [phases]);

  const [selectedOptions, setSelectedOptions] = useState<
    AllowlistToolSelectMenuMultipleOption[]
  >([]);

  const toggleSelectAll = () => {
    if (selectedOptions.length === options.length) {
      setSelectedOptions([]);
    } else {
      setSelectedOptions(options);
    }
  };

  const toggleSelectedOption = (
    option: AllowlistToolSelectMenuMultipleOption
  ) => {
    if (option.value === SELECT_ALL_OPTION.value) {
      toggleSelectAll();
      return;
    }
    const isSelected = selectedOptions.find(
      (selectedOption) => selectedOption.value === option.value
    );
    if (isSelected) {
      setSelectedOptions(
        selectedOptions.filter(
          (selectedOption) =>
            selectedOption.value !== option.value &&
            selectedOption.value !== SELECT_ALL_OPTION.value
        )
      );
      return;
    }

    setSelectedOptions((prev) =>
      prev.length === options.length - 2 ? options : [...prev, option]
    );
  };
  return (
    <div>
      <DistributionPlanSecondaryText>
        You can pick other groups from which you want to remove this snapshot.
        <br />
        If you don&apos;t want anyone who has already won a spot to be included,
        you should choose all the groups.
      </DistributionPlanSecondaryText>
      <AllowlistToolSelectMenuMultiple
        label="Remove previous winners"
        placeholder="Select groups"
        options={options}
        selectedOptions={selectedOptions}
        toggleSelectedOption={toggleSelectedOption}
      />
      {!!selectedOptions.length && (
        <div className="tw-mt-8 tw-flex tw-justify-end">
          <button
            onClick={() =>
              onNextStep(PhaseConfigStep.SNAPSHOT_ASK_SELECT_TOP_HOLDERS)
            }
            type="button"
            className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
          >
            Remove winners
          </button>
        </div>
      )}
    </div>
  );
}
