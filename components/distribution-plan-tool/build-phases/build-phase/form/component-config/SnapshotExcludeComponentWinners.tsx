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
import ComponentConfigMeta from "./ComponentConfigMeta";
import { AllowlistToolResponse } from "../../../../../allowlist-tool/allowlist-tool.types";

const SELECT_ALL_OPTION: AllowlistToolSelectMenuMultipleOption = {
  title: "Exclude All Prior Groups",
  subTitle: null,
  value: "select-all",
};

export default function SnapshotExcludeComponentWinners({
  snapshotId,
  phases,
  onNextStep,
  onSelectExcludeComponentWinners,
  title,
  onClose,
  setUniqueWalletsCount,
}: {
  snapshotId: string;
  phases: BuildPhasesPhase[];
  onNextStep: (step: PhaseConfigStep) => void;
  onSelectExcludeComponentWinners: (componentIds: string[]) => void;
  title: string;
  onClose: () => void;
  setUniqueWalletsCount: (count: number | null) => void;
}) {
  const { setToasts, distributionPlan } = useContext(
    DistributionPlanToolContext
  );
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

  const [excludeComponentWinners, setExcludeComponentWinners] = useState<
    string[]
  >([]);

  useEffect(() => {
    setExcludeComponentWinners(
      selectedOptions
        .filter((o) => o.value !== SELECT_ALL_OPTION.value)
        .map((o) => o.value)
    );
  }, [selectedOptions]);

  const onExcludePreviousWinners = () => {
    if (selectedOptions.length === 0) {
      setToasts({
        messages: ["Please select at least one component."],
        type: "error",
      });
      return;
    }
    onSelectExcludeComponentWinners(excludeComponentWinners);
  };
  const [loading, setLoading] = useState<boolean>(false);

  const [localUniqueWalletsCount, setLocalUniqueWalletsCount] = useState<
    number | null
  >(null);

  useEffect(() => {
    const fetchUniqueWalletsCount = async () => {
      if (!distributionPlan) return;
      setLoading(true);
      const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${
        distributionPlan.id
      }/token-pool-downloads/${snapshotId}/unique-wallets-count${
        !!excludeComponentWinners.length
          ? `?exclude-component-winners=${excludeComponentWinners.join(",")}`
          : ""
      }`;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data: AllowlistToolResponse<number> = await response.json();
        if (typeof data !== "number" && "error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
          return { success: false };
        }
        setLocalUniqueWalletsCount(data);
        return { success: true };
      } catch (error) {
        setToasts({
          messages: ["Something went wrong. Please try again."],
          type: "error",
        });
        return;
      } finally {
        setLoading(false);
      }
    };
    fetchUniqueWalletsCount();
  }, [
    excludeComponentWinners,
    distributionPlan,
    snapshotId,
    setToasts,
    setUniqueWalletsCount,
  ]);

  return (
    <div className="tw-relative">
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
        onSkip={() => onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS)}
        onNext={() => {
          setUniqueWalletsCount(localUniqueWalletsCount);
          onExcludePreviousWinners();
        }}
      >
        <ComponentConfigMeta tags={[]} walletsCount={localUniqueWalletsCount} />
      </ComponentConfigNextBtn>
    </div>
  );
}
