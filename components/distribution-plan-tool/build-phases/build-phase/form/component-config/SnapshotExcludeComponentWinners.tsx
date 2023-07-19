import { useContext, useEffect, useState } from "react";
import AllowlistToolSelectMenuMultiple, {
  AllowlistToolSelectMenuMultipleOption,
} from "../../../../../allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple";
import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import { BuildPhasesPhase } from "../../../BuildPhases";
import { PhaseConfigStep } from "../BuildPhaseFormConfigModal";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";
import { DistributionPlanToolContext } from "../../../../DistributionPlanToolContext";
import BuildPhaseFormConfigModalTitle from "./BuildPhaseFormConfigModalTitle";

const SELECT_ALL_OPTION: AllowlistToolSelectMenuMultipleOption = {
  title: "Exclude All Prior Groups",
  subTitle: null,
  value: "select-all",
};

export default function SnapshotExcludeComponentWinners({
  phases,
  onNextStep,
  onSelectExcludeComponentWinners,
  title,
  onClose,
}: {
  phases: BuildPhasesPhase[];
  onNextStep: (step: PhaseConfigStep) => void;
  onSelectExcludeComponentWinners: (componentIds: string[]) => void;
  title: string;
  onClose: () => void;
}) {
  const { setToasts } = useContext(DistributionPlanToolContext);
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

  const onExcludePreviousWinners = () => {
    if (selectedOptions.length === 0) {
      setToasts({
        messages: ["Please select at least one component."],
        type: "error",
      });
      return;
    }
    onSelectExcludeComponentWinners(
      selectedOptions
        .filter((o) => o.value !== SELECT_ALL_OPTION.value)
        .map((o) => o.value)
    );
  };

  return (
    <div>
      <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
      <DistributionPlanSecondaryText>
        Exclude Allowlist Members From Prior Groups
      </DistributionPlanSecondaryText>
      <div className="tw-mt-6">
        <AllowlistToolSelectMenuMultiple
          label="Select Groups To Exclude"
          placeholder="No groups excluded"
          allSelectedTitle="All Groups Excluded"
          someSelectedTitleSuffix="Groups Excluded"
          options={options}
          selectedOptions={selectedOptions}
          toggleSelectedOption={toggleSelectedOption}
        />
      </div>
      <ComponentConfigNextBtn
        showSkipBtn={true}
        showNextBtn={!!selectedOptions.length}
        isDisabled={!selectedOptions.length}
        onSkip={() => onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS)}
        onNext={onExcludePreviousWinners}
      />
    </div>
  );
}
