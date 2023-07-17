import { useContext, useEffect, useState } from "react";
import {
  assertUnreachable,
  getRandomObjectId,
} from "../../../../../helpers/AllowlistToolHelpers";
import SelectSnapshot from "./component-config/SelectSnapshot";
import { DistributionPlanToolContext } from "../../../DistributionPlanToolContext";
import { AllowlistToolSelectMenuOption } from "../../../../allowlist-tool/common/select-menu/AllowlistToolSelectMenu";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
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
  MEMES_TDH = "MEMES_TDH",
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
    tdhBlockNumber: number | null;
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
  onClose,
}: {
  name: string;
  description: string;
  selectedPhase: BuildPhasesPhase;
  phases: BuildPhasesPhase[];
  onClose: () => void;
}) {
  const [configStep, setConfigStep] = useState<PhaseConfigStep>(
    PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS
  );
  const { operations, distributionPlan, setToasts, addOperations } = useContext(
    DistributionPlanToolContext
  );
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
    tdhBlockNumber: number | null;
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

  const [isLoading, setIsLoading] = useState(false);
  const addOperation = async ({
    code,
    params,
    distributionPlanId,
  }: {
    code: AllowlistOperationCode;
    params: any;
    distributionPlanId: string;
  }): Promise<{ success: boolean }> => {
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlanId}/operations`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          params,
        }),
      });
      const data: AllowlistToolResponse<AllowlistOperation> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return { success: false };
      }
      addOperations([data]);
      return { success: true };
    } catch (error) {
      setToasts({
        messages: ["Something went wrong. Please try again."],
        type: "error",
      });
      return { success: false };
    }
  };

  const addComponent = async ({
    distributionPlanId,
    phaseId,
    componentName,
    componentDescription,
  }: {
    distributionPlanId: string;
    phaseId: string;
    componentName: string;
    componentDescription: string;
  }): Promise<{ componentId: string | null }> => {
    const componentId = getRandomObjectId();
    const { success } = await addOperation({
      code: AllowlistOperationCode.ADD_COMPONENT,
      params: {
        id: componentId,
        phaseId,
        name: componentName,
        description: componentDescription,
      },
      distributionPlanId,
    });
    if (!success) {
      return { componentId: null };
    }
    return { componentId };
  };

  const addItem = async ({
    componentId,
    distributionPlanId,
    config,
  }: {
    componentId: string;
    distributionPlanId: string;
    config: PhaseGroupSnapshotConfig;
  }) => {
    const { snapshotId, snapshotType } = config;
    if (!snapshotId || !snapshotType) {
      return { itemId: null };
    }
    const snapshot = snapshots.find((s) => s.value === snapshotId);
    if (!snapshot) {
      return { itemId: null };
    }
    const itemId = getRandomObjectId();
    const { success } = await addOperation({
      code: AllowlistOperationCode.ADD_ITEM,
      params: {
        id: itemId,
        name: snapshot.title,
        description: snapshot.subTitle ?? snapshot.title,
        componentId,
        poolId: snapshotId,
        poolType: snapshotType,
      },
      distributionPlanId,
    });
    if (!success) {
      return { itemId: null };
    }
    return { itemId };
  };

  const excludeComponentWinnersFromItem = async ({
    itemId,
    componentIds,
    distributionPlanId,
  }: {
    itemId: string;
    componentIds: string[];
    distributionPlanId: string;
  }): Promise<{
    success: boolean;
  }> => {
    return await addOperation({
      code: AllowlistOperationCode.ITEM_REMOVE_WALLETS_FROM_CERTAIN_COMPONENTS,
      params: {
        itemId,
        componentIds,
      },
      distributionPlanId,
    });
  };

  const itemSortWalletsByTotalTokensCount = async ({
    distributionPlanId,
    itemId,
  }: {
    distributionPlanId: string;
    itemId: string;
  }): Promise<{ success: boolean }> => {
    return await addOperation({
      code: AllowlistOperationCode.ITEM_SORT_WALLETS_BY_TOTAL_TOKENS_COUNT,
      params: {
        itemId,
      },
      distributionPlanId,
    });
  };

  const itemSortWalletsByUniqueTokensCount = async ({
    distributionPlanId,
    itemId,
  }: {
    distributionPlanId: string;
    itemId: string;
  }): Promise<{ success: boolean }> => {
    return await addOperation({
      code: AllowlistOperationCode.ITEM_SORT_WALLETS_BY_UNIQUE_TOKENS_COUNT,
      params: {
        itemId,
      },
      distributionPlanId,
    });
  };

  const itemSortWalletsByMemesTdh = async ({
    distributionPlanId,
    itemId,
    tdhBlockNumber,
  }: {
    distributionPlanId: string;
    itemId: string;
    tdhBlockNumber: number;
  }): Promise<{ success: boolean }> => {
    return await addOperation({
      code: AllowlistOperationCode.ITEM_SORT_WALLETS_BY_MEMES_TDH,
      params: {
        itemId,
        tdhBlockNumber,
      },
      distributionPlanId,
    });
  };

  const sortItemWallets = async ({
    itemId,
    filterType,
    tdhBlockNumber,
    distributionPlanId,
  }: {
    itemId: string;
    filterType: TopHolderType;
    tdhBlockNumber: number | null;
    distributionPlanId: string;
  }): Promise<{ success: boolean }> => {
    switch (filterType) {
      case TopHolderType.TOTAL_TOKENS_COUNT:
        return await itemSortWalletsByTotalTokensCount({
          distributionPlanId,
          itemId,
        });
      case TopHolderType.UNIQUE_TOKENS_COUNT:
        return await itemSortWalletsByUniqueTokensCount({
          distributionPlanId,
          itemId,
        });
      case TopHolderType.MEMES_TDH:
        if (!tdhBlockNumber) {
          return { success: false };
        }
        return await itemSortWalletsByMemesTdh({
          distributionPlanId,
          itemId,
          tdhBlockNumber,
        });
      default:
        assertUnreachable(filterType);
        return { success: false };
    }
  };

  const itemRemoveFirstNWallets = async ({
    itemId,
    count,
    distributionPlanId,
  }: {
    itemId: string;
    distributionPlanId: string;
    count: number;
  }): Promise<{ success: boolean }> => {
    return await addOperation({
      code: AllowlistOperationCode.ITEM_REMOVE_FIRST_N_WALLETS,
      params: {
        itemId,
        count,
      },
      distributionPlanId,
    });
  };

  const itemSelectFirstNWallets = async ({
    itemId,
    count,
    distributionPlanId,
  }: {
    itemId: string;
    distributionPlanId: string;
    count: number;
  }): Promise<{ success: boolean }> => {
    return await addOperation({
      code: AllowlistOperationCode.ITEM_SELECT_FIRST_N_WALLETS,
      params: {
        itemId,
        count,
      },
      distributionPlanId,
    });
  };

  const filterItemTopWallets = async ({
    distributionPlanId,
    itemId,
    filterType,
    from,
    to,
    tdhBlockNumber,
  }: {
    distributionPlanId: string;
    itemId: string;
    filterType: TopHolderType;
    from: number | null;
    to: number | null;
    tdhBlockNumber: number | null;
  }): Promise<{ success: boolean }> => {
    const { success: sortSuccess } = await sortItemWallets({
      itemId,
      filterType,
      distributionPlanId,
      tdhBlockNumber,
    });
    if (!sortSuccess) {
      return { success: false };
    }

    if (typeof from === "number" && from > 1) {
      const { success: removeSuccess } = await itemRemoveFirstNWallets({
        itemId,
        count: from - 1,
        distributionPlanId,
      });
      if (!removeSuccess) {
        return { success: false };
      }
    }

    if (typeof to === "number") {
      const count = to - (typeof from === "number" && from > 1 ? from - 1 : 0);
      const { success: selectSuccess } = await itemSelectFirstNWallets({
        itemId,
        count,
        distributionPlanId,
      });
      if (!selectSuccess) {
        return { success: false };
      }
    }

    return { success: true };
  };

  const addSnapshot = async ({
    componentId,
    distributionPlanId,
    config,
  }: {
    componentId: string;
    distributionPlanId: string;
    config: PhaseGroupSnapshotConfig;
  }): Promise<{ success: boolean }> => {
    const { itemId } = await addItem({
      componentId,
      distributionPlanId,
      config,
    });

    if (!itemId) {
      return { success: false };
    }

    const { excludeComponentWinners, topHoldersFilter } = config;

    if (excludeComponentWinners.length > 0) {
      const { success } = await excludeComponentWinnersFromItem({
        itemId,
        componentIds: excludeComponentWinners,
        distributionPlanId,
      });
      if (!success) {
        return { success: false };
      }
    }

    if (topHoldersFilter) {
      const { success } = await filterItemTopWallets({
        distributionPlanId,
        itemId,
        filterType: topHoldersFilter.type,
        from: topHoldersFilter.from,
        to: topHoldersFilter.to,
        tdhBlockNumber: topHoldersFilter.tdhBlockNumber,
      });
      if (!success) {
        return { success: false };
      }
    }

    return { success: true };
  };

  const componentAddSpotsToWallets = async ({
    distributionPlanId,
    componentId,
    spots,
  }: {
    distributionPlanId: string;
    componentId: string;
    spots: number;
  }): Promise<{ success: boolean }> => {
    return await addOperation({
      code: AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS,
      params: {
        componentId,
        spots,
      },
      distributionPlanId,
    });
  };

  const componentSelectRandomWallets = async ({
    distributionPlanId,
    componentId,
    count,
    seed,
  }: {
    distributionPlanId: string;
    componentId: string;
    count: number;
    seed: string;
  }): Promise<{ success: boolean }> => {
    return await addOperation({
      code: AllowlistOperationCode.COMPONENT_SELECT_RANDOM_WALLETS,
      params: {
        componentId,
        count,
        seed,
      },
      distributionPlanId,
    });
  };

  const onSave = async () => {
    if (
      !distributionPlan ||
      typeof phaseGroupConfig.maxMintCount !== "number" ||
      phaseGroupConfig.maxMintCount < 1
    ) {
      return;
    }
    setIsLoading(true);
    // 1. create component
    const { componentId } = await addComponent({
      distributionPlanId: distributionPlan.id,
      phaseId: selectedPhase.id,
      componentName: name,
      componentDescription: description,
    });
    if (!componentId) {
      setIsLoading(false);
      return;
    }
    // 2. create item (repeat for each snapshot)
    for (const snapshot of phaseGroupConfig.snapshots) {
      await addSnapshot({
        componentId: componentId,
        distributionPlanId: distributionPlan.id,
        config: snapshot,
      });
    }
    // 5. Random holders (if any)
    if (
      typeof phaseGroupConfig.randomHoldersCount === "number" &&
      phaseGroupConfig.randomHoldersCount > 0
    ) {
      await componentSelectRandomWallets({
        distributionPlanId: distributionPlan.id,
        componentId,
        count: phaseGroupConfig.randomHoldersCount,
        seed: distributionPlan.id,
      });
    }
    // 6. Max mint count
    await componentAddSpotsToWallets({
      distributionPlanId: distributionPlan.id,
      componentId,
      spots: phaseGroupConfig.maxMintCount,
    });
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="tw-px-6 tw-gap-y-6 tw-flex tw-flex-col tw-divide-y tw-divide-solid tw-divide-neutral-700 tw-divide-x-0">
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
                onSelectTopHoldersSkip={onSelectTopHoldersSkip}
                onSelectTopHoldersFilter={onSelectTopHoldersFilter}
                config={phaseGroupSnapshotConfig}
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
                onStartAgain={onStartAgain}
                onConfigureGroup={onConfigureGroup}
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
                loading={isLoading}
              />
            );
          default:
            assertUnreachable(configStep);
        }
      })()}
    </div>
  );
}
