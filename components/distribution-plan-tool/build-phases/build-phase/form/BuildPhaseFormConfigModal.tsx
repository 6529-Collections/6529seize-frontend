import { useContext, useEffect, useState } from "react";
import {
  assertUnreachable,
  getRandomObjectId,
} from "../../../../../helpers/AllowlistToolHelpers";
import SelectSnapshot from "./component-config/SelectSnapshot";
import { DistributionPlanToolContext } from "../../../DistributionPlanToolContext";
import { AllowlistToolSelectMenuOption } from "../../../../allowlist-tool/common/select-menu/AllowlistToolSelectMenu";
import {
  AllowlistOperationCode,
  Pool,
} from "../../../../allowlist-tool/allowlist-tool.types";
import SnapshotExcludeComponentWinners from "./component-config/SnapshotExcludeComponentWinners";
import { BuildPhasesPhase } from "../../BuildPhases";
import SnapshotSelectTopHolders from "./component-config/SnapshotSelectTopHolders";
import FinalizeSnapshot from "./component-config/FinalizeSnapshot";
import ComponentSelectRandomHolders from "./component-config/ComponentSelectRandomHolders";
import ComponentAddSpots from "./component-config/ComponentAddSpots";
import FinalizeComponent from "./component-config/FinalizeComponent";
import AllowlistToolAnimationWrapper from "../../../../allowlist-tool/common/animation/AllowlistToolAnimationWrapper";
import AllowlistToolAnimationHeightOpacity from "../../../../allowlist-tool/common/animation/AllowlistToolAnimationHeightOpacity";

export enum PhaseConfigStep {
  SELECT_SNAPSHOT = "SELECT_SNAPSHOT",
  SNAPSHOT_EXCLUDE_COMPONENT_WINNERS = "SNAPSHOT_EXCLUDE_COMPONENT_WINNERS",
  SNAPSHOT_SELECT_TOP_HOLDERS = "SNAPSHOT_SELECT_TOP_HOLDERS",
  FINALIZE_SNAPSHOT = "FINALIZE_SNAPSHOT",
  COMPONENT_SELECT_RANDOM_HOLDERS = "COMPONENT_SELECT_RANDOM_HOLDERS",
  COMPONENT_ADD_SPOTS = "COMPONENT_ADD_SPOTS",
  FINALIZE_COMPONENTS = "FINALIZE_COMPONENTS",
}

export enum TopHolderType {
  TOTAL_TOKENS_COUNT = "TOTAL_TOKENS_COUNT",
  UNIQUE_TOKENS_COUNT = "UNIQUE_TOKENS_COUNT",
}

export interface PhaseGroupSnapshotConfig {
  groupSnapshotId: string | null;
  snapshotId: string | null;
  snapshotType: Pool.TOKEN_POOL | Pool.CUSTOM_TOKEN_POOL | null;
  excludeComponentWinners: string[];
  topHoldersFilter: {
    type: TopHolderType;
    from: number | null;
    to: number | null;
  } | null;
}

export interface PhaseGroupConfig {
  snapshots: PhaseGroupSnapshotConfig[];
  randomHoldersCount: number | null;
  maxMintCount: number | null;
}

export default function BuildPhaseFormConfigModal({
  name,
  description,
  selectedPhase,
  phases,
}: {
  name: string;
  description: string;
  selectedPhase: BuildPhasesPhase;
  phases: BuildPhasesPhase[];
}) {
  const [configStep, setConfigStep] = useState<PhaseConfigStep>(
    PhaseConfigStep.SELECT_SNAPSHOT
  );
  const { operations } = useContext(DistributionPlanToolContext);
  const [targetPhases, setTargetPhases] = useState<BuildPhasesPhase[]>([]);

  useEffect(() => {
    const currentPhaseIndex = phases.findIndex(
      (p) => p.id === selectedPhase.id
    );
    setTargetPhases(phases.slice(0, currentPhaseIndex + 1));
  }, [selectedPhase, phases]);

  const [snapshots, setSnapshots] = useState<AllowlistToolSelectMenuOption[]>(
    []
  );

  useEffect(() => {
    const tokenPools = operations
      .filter(
        (operation) =>
          operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL
      )
      .map((operation) => ({
        value: operation.params.id,
        title: operation.params.name,
        subTitle: "Snapshot",
      }));

    const customTokenPools = operations
      .filter(
        (operation) =>
          operation.code === AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL
      )
      .map((operation) => ({
        value: operation.params.id,
        title: operation.params.name,
        subTitle: "Custom Snapshot",
      }));

    setSnapshots([...tokenPools, ...customTokenPools]);
  }, [operations]);

  const onNextStep = (step: PhaseConfigStep) => setConfigStep(step);

  //
  const [phaseGroupConfig, setPhaseGroupConfig] = useState<PhaseGroupConfig>({
    snapshots: [],
    randomHoldersCount: null,
    maxMintCount: null,
  });

  const [phaseGroupSnapshotConfig, setPhaseGroupSnapshotConfig] =
    useState<PhaseGroupSnapshotConfig>({
      groupSnapshotId: selectedPhase.id,
      snapshotId: null,
      snapshotType: null,
      excludeComponentWinners: [],
      topHoldersFilter: null,
    });

  const onSelectSnapshot = ({
    snapshotId,
    snapshotType,
  }: {
    snapshotId: string;
    snapshotType: Pool.TOKEN_POOL | Pool.CUSTOM_TOKEN_POOL;
  }) => {
    setPhaseGroupSnapshotConfig({
      groupSnapshotId: getRandomObjectId(),
      snapshotId,
      snapshotType,
      excludeComponentWinners: [],
      topHoldersFilter: null,
    });

    const haveComponents = targetPhases.some(
      (phase) => phase.components.length > 0
    );

    if (!haveComponents) {
      onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS);
      return;
    }
    onNextStep(PhaseConfigStep.SNAPSHOT_EXCLUDE_COMPONENT_WINNERS);
  };

  const onSelectExcludeComponentWinners = (
    excludeComponentWinners: string[]
  ) => {
    setPhaseGroupSnapshotConfig((prev) => ({
      ...prev,
      excludeComponentWinners,
    }));
    onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS);
  };

  const onSelectTopHoldersSkip = () => {
    setPhaseGroupConfig((prev) => ({
      ...prev,
      snapshots: [...prev.snapshots, phaseGroupSnapshotConfig],
    }));
    setPhaseGroupSnapshotConfig({
      groupSnapshotId: null,
      snapshotId: null,
      snapshotType: null,
      excludeComponentWinners: [],
      topHoldersFilter: null,
    });
    onNextStep(PhaseConfigStep.FINALIZE_SNAPSHOT);
  };

  const onSelectTopHoldersFilter = (params: {
    type: TopHolderType;
    from: number | null;
    to: number | null;
  }) => {
    setPhaseGroupConfig((prev) => ({
      ...prev,
      snapshots: [
        ...prev.snapshots,
        { ...phaseGroupSnapshotConfig, topHoldersFilter: params },
      ],
    }));
    setPhaseGroupSnapshotConfig({
      groupSnapshotId: null,
      snapshotId: null,
      snapshotType: null,
      excludeComponentWinners: [],
      topHoldersFilter: null,
    });
    onNextStep(PhaseConfigStep.FINALIZE_SNAPSHOT);
  };

  const onRemoveGroupSnapshot = (groupSnapshotId: string) => {
    setPhaseGroupConfig((prev) => ({
      ...prev,
      snapshots: prev.snapshots.filter(
        (s) => s.groupSnapshotId !== groupSnapshotId
      ),
    }));
  };

  const onAddAnotherSnapshot = () => {
    setPhaseGroupSnapshotConfig({
      groupSnapshotId: null,
      snapshotId: null,
      snapshotType: null,
      excludeComponentWinners: [],
      topHoldersFilter: null,
    });
    onNextStep(PhaseConfigStep.SELECT_SNAPSHOT);
  };

  const onConfigureGroup = () => {
    setPhaseGroupSnapshotConfig({
      groupSnapshotId: null,
      snapshotId: null,
      snapshotType: null,
      excludeComponentWinners: [],
      topHoldersFilter: null,
    });

    onNextStep(PhaseConfigStep.COMPONENT_SELECT_RANDOM_HOLDERS);
  };

  const onSelectRandomHolders = (randomHoldersCount: number) => {
    setPhaseGroupConfig((prev) => ({
      ...prev,
      randomHoldersCount,
    }));
    onNextStep(PhaseConfigStep.COMPONENT_ADD_SPOTS);
  };

  const onSelectMaxMintCount = (maxMintCount: number) => {
    setPhaseGroupConfig((prev) => ({
      ...prev,
      maxMintCount,
    }));
    onNextStep(PhaseConfigStep.FINALIZE_COMPONENTS);
  };

  const onStartAgain = () => {
    setPhaseGroupSnapshotConfig({
      groupSnapshotId: null,
      snapshotId: null,
      snapshotType: null,
      excludeComponentWinners: [],
      topHoldersFilter: null,
    });
    setPhaseGroupConfig({
      snapshots: [],
      randomHoldersCount: null,
      maxMintCount: null,
    });
    setConfigStep(PhaseConfigStep.SELECT_SNAPSHOT);
  };

  const onSave = () => {
    console.log("SAVE");
    console.log(phaseGroupConfig);
  };

  useEffect(() => {
    console.log([...phaseGroupConfig.snapshots, phaseGroupSnapshotConfig]);
  }, [phaseGroupConfig, phaseGroupSnapshotConfig]);

  return (
    <div className="tw-px-6 tw-gap-y-6 tw-flex tw-flex-col tw-divide-y tw-divide-solid tw-divide-neutral-700 tw-divide-x-0">
      <AllowlistToolAnimationWrapper mode="sync" initial={true}>
        {(() => {
          switch (configStep) {
            case PhaseConfigStep.SELECT_SNAPSHOT:
              return (
                <AllowlistToolAnimationHeightOpacity key="SELECT_SNAPSHOT">
                  <SelectSnapshot
                    snapshots={snapshots}
                    onSelectSnapshot={onSelectSnapshot}
                  />
                </AllowlistToolAnimationHeightOpacity>
              );
            case PhaseConfigStep.SNAPSHOT_EXCLUDE_COMPONENT_WINNERS:
              return (
                <AllowlistToolAnimationHeightOpacity key="SNAPSHOT_EXCLUDE_COMPONENT_WINNERS">
                  <SnapshotExcludeComponentWinners
                    phases={targetPhases}
                    onNextStep={onNextStep}
                    onSelectExcludeComponentWinners={
                      onSelectExcludeComponentWinners
                    }
                  />
                </AllowlistToolAnimationHeightOpacity>
              );
            case PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS:
              return (
                <AllowlistToolAnimationHeightOpacity key="SNAPSHOT_SELECT_TOP_HOLDERS">
                  <SnapshotSelectTopHolders
                    onSelectTopHoldersSkip={onSelectTopHoldersSkip}
                    onSelectTopHoldersFilter={onSelectTopHoldersFilter}
                  />
                </AllowlistToolAnimationHeightOpacity>
              );
            case PhaseConfigStep.FINALIZE_SNAPSHOT:
              return (
                <AllowlistToolAnimationHeightOpacity key="FINALIZE_SNAPSHOT">
                  <FinalizeSnapshot
                    groupSnapshots={[
                      ...phaseGroupConfig.snapshots,
                      phaseGroupSnapshotConfig,
                    ]
                      .filter((s) => !!s.groupSnapshotId)
                      .reverse()}
                    snapshots={snapshots}
                    onStartAgain={onStartAgain}
                    onConfigureGroup={onConfigureGroup}
                    onAddAnotherSnapshot={onAddAnotherSnapshot}
                    onRemoveGroupSnapshot={onRemoveGroupSnapshot}
                  />
                </AllowlistToolAnimationHeightOpacity>
              );
            case PhaseConfigStep.COMPONENT_SELECT_RANDOM_HOLDERS:
              return (
                <AllowlistToolAnimationHeightOpacity key="COMPONENT_SELECT_RANDOM_HOLDERS">
                  <ComponentSelectRandomHolders
                    onNextStep={onNextStep}
                    onSelectRandomHolders={onSelectRandomHolders}
                  />
                </AllowlistToolAnimationHeightOpacity>
              );
            case PhaseConfigStep.COMPONENT_ADD_SPOTS:
              return (
                <AllowlistToolAnimationHeightOpacity key="COMPONENT_ADD_SPOTS">
                  <ComponentAddSpots
                    onSelectMaxMintCount={onSelectMaxMintCount}
                  />
                </AllowlistToolAnimationHeightOpacity>
              );
            case PhaseConfigStep.FINALIZE_COMPONENTS:
              return (
                <AllowlistToolAnimationHeightOpacity key="FINALIZE_COMPONENTS">
                  <FinalizeComponent
                    onSave={onSave}
                    onStartAgain={onStartAgain}
                    phaseGroupConfig={phaseGroupConfig}
                    snapshots={snapshots}
                    onRemoveGroupSnapshot={onRemoveGroupSnapshot}
                  />
                </AllowlistToolAnimationHeightOpacity>
              );
            default:
              assertUnreachable(configStep);
          }
        })()}
      </AllowlistToolAnimationWrapper>
    </div>
  );
}
