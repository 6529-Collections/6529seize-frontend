"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import type {
  AllowlistToolSelectMenuMultipleOption,
} from "@/components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple";
import AllowlistToolSelectMenuMultiple from "@/components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple";
import DistributionPlanSecondaryText from "@/components/distribution-plan-tool/common/DistributionPlanSecondaryText";
import type { BuildPhasesPhase } from "@/components/distribution-plan-tool/build-phases/BuildPhases";
import type {
  PhaseGroupSnapshotConfig} from "../BuildPhaseFormConfigModal";
import {
  PhaseConfigStep
} from "../BuildPhaseFormConfigModal";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import BuildPhaseFormConfigModalTitle from "./BuildPhaseFormConfigModalTitle";
import ComponentConfigMeta from "./ComponentConfigMeta";

const SELECT_ALL_OPTION: AllowlistToolSelectMenuMultipleOption = {
  title: "Exclude All Prior Groups",
  subTitle: null,
  value: "select-all",
};

type SnapshotExcludeComponentWinnersProps = {
  readonly config: PhaseGroupSnapshotConfig;
  readonly phases: ReadonlyArray<BuildPhasesPhase>;
  readonly onNextStep: (step: PhaseConfigStep) => void;
  readonly onSelectExcludeComponentWinners: (param: {
    excludeComponentWinners: string[];
    uniqueWalletsCount: number | null;
  }) => void;
  readonly title: string;
  readonly onClose: () => void;
};

export default function SnapshotExcludeComponentWinners({
  config,
  phases,
  onNextStep,
  onSelectExcludeComponentWinners,
  title,
  onClose,
}: SnapshotExcludeComponentWinnersProps) {
  const { setToasts } = useContext(DistributionPlanToolContext);
  const options = useMemo<AllowlistToolSelectMenuMultipleOption[]>(
    () => [
      SELECT_ALL_OPTION,
      ...phases.flatMap((p) =>
        p.components.map((c) => ({
          title: c.name,
          subTitle: p.name,
          value: c.id,
        }))
      ),
    ],
    [phases]
  );

  const [selectedOptions, setSelectedOptions] = useState<
    AllowlistToolSelectMenuMultipleOption[]
  >([]);

  useEffect(() => {
    if (!config.excludeComponentWinners.length) {
      setSelectedOptions([]);
      return;
    }

    const componentOptions = options.filter(
      (option) => option.value !== SELECT_ALL_OPTION.value
    );

    const selected = componentOptions.filter((option) =>
      config.excludeComponentWinners.includes(option.value)
    );

    if (selected.length === componentOptions.length && componentOptions.length) {
      setSelectedOptions(options);
      return;
    }

    setSelectedOptions(selected);
  }, [config.excludeComponentWinners, options]);

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

  const excludeComponentWinners = useMemo(
    () =>
      selectedOptions
        .filter((o) => o.value !== SELECT_ALL_OPTION.value)
        .map((o) => o.value),
    [selectedOptions]
  );

  const onExcludePreviousWinners = () => {
    if (selectedOptions.length === 0) {
      setToasts({
        messages: ["Please select at least one component."],
        type: "error",
      });
      return;
    }
    onSelectExcludeComponentWinners({
      excludeComponentWinners,
      uniqueWalletsCount: config.uniqueWalletsCount,
    });
  };

  return (
    <div className="tw-relative tw-p-6">
      <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
      <DistributionPlanSecondaryText>
        Exclude Allowlist Members From Prior Groups.
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
        onSkip={() => onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_TOKEN_IDS)}
        onNext={() => onExcludePreviousWinners()}>
        <ComponentConfigMeta
          tags={[]}
          walletsCount={config.uniqueWalletsCount}
          isLoading={false}
        />
      </ComponentConfigNextBtn>
    </div>
  );
}
