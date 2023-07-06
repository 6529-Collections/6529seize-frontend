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

  const onSelectTopHoldersFilter = (params: {
    type: TopHolderType;
    from: number | null;
    to: number | null;
  }) => {
    setPhaseGroupSnapshotConfig((prev) => ({
      ...prev,
      topHoldersFilter: params,
    }));
    onNextStep(PhaseConfigStep.FINALIZE_SNAPSHOT);
  };

  const onRemoveGroupSnapshot = (groupSnapshotId: string) => {
    setPhaseGroupConfig((prev) => ({
      ...prev,
      snapshots: prev.snapshots.filter(
        (s) => s.groupSnapshotId !== groupSnapshotId
      ),
    }));
    setPhaseGroupSnapshotConfig({
      groupSnapshotId: null,
      snapshotId: null,
      snapshotType: null,
      excludeComponentWinners: [],
      topHoldersFilter: null,
    });
  };

  const onAddAnotherSnapshot = () => {
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
    onNextStep(PhaseConfigStep.SELECT_SNAPSHOT);
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
    console.log("***********");
    console.log("CURRENT SNAPSHOT CONFIG");
    console.log(phaseGroupSnapshotConfig);
    console.log("CURRENT PHASE GROUP CONFIG");
    console.log(phaseGroupConfig);
  }, [phaseGroupSnapshotConfig, phaseGroupConfig]);

  return (
    <div className="tw-px-6 tw-pt-6 tw-gap-y-6 tw-flex tw-flex-col tw-divide-y tw-divide-solid tw-divide-neutral-700 tw-divide-x-0">
      {(() => {
        switch (configStep) {
          case PhaseConfigStep.SELECT_SNAPSHOT:
            return (
              <SelectSnapshot
                snapshots={snapshots}
                onSelectSnapshot={onSelectSnapshot}
              />
            );
          case PhaseConfigStep.SNAPSHOT_EXCLUDE_COMPONENT_WINNERS:
            return (
              <SnapshotExcludeComponentWinners
                phases={targetPhases}
                onNextStep={onNextStep}
                onSelectExcludeComponentWinners={
                  onSelectExcludeComponentWinners
                }
              />
            );
          case PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS:
            return (
              <SnapshotSelectTopHolders
                onNextStep={onNextStep}
                onSelectTopHoldersFilter={onSelectTopHoldersFilter}
              />
            );
          case PhaseConfigStep.FINALIZE_SNAPSHOT:
            return (
              <FinalizeSnapshot
                groupSnapshots={[
                  ...phaseGroupConfig.snapshots,
                  phaseGroupSnapshotConfig,
                ]
                  .filter((s) => !!s.groupSnapshotId)
                  .reverse()}
                snapshots={snapshots}
                onNextStep={onNextStep}
                onAddAnotherSnapshot={onAddAnotherSnapshot}
                onRemoveGroupSnapshot={onRemoveGroupSnapshot}
              />
            );
          case PhaseConfigStep.COMPONENT_SELECT_RANDOM_HOLDERS:
            return (
              <ComponentSelectRandomHolders
                onNextStep={onNextStep}
                onSelectRandomHolders={onSelectRandomHolders}
              />
            );
          case PhaseConfigStep.COMPONENT_ADD_SPOTS:
            return (
              <ComponentAddSpots onSelectMaxMintCount={onSelectMaxMintCount} />
            );
          case PhaseConfigStep.FINALIZE_COMPONENTS:
            return (
              <FinalizeComponent
                onSave={onSave}
                onStartAgain={onStartAgain}
                phaseGroupConfig={phaseGroupConfig}
                snapshots={snapshots}
                onRemoveGroupSnapshot={onRemoveGroupSnapshot}
              />
            );
          default:
            assertUnreachable(configStep);
        }
      })()}
    </div>
  );
}
