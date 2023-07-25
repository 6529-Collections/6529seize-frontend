import { useContext, useEffect, useState } from "react";
import {
  assertUnreachable,
  getRandomObjectId,
} from "../../../../../helpers/AllowlistToolHelpers";
import SelectSnapshot from "./component-config/select-snapshot/SelectSnapshot";
import { DistributionPlanToolContext } from "../../../DistributionPlanToolContext";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
  DistributionPlanSearchContractMetadataResult,
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

export enum RandomHoldersType {
  BY_COUNT = "BY_COUNT",
  BY_PERCENTAGE = "BY_PERCENTAGE",
}

export interface DistributionPlanSnapshot {
  readonly id: string;
  readonly name: string;
  readonly poolType: Pool.TOKEN_POOL | Pool.CUSTOM_TOKEN_POOL;
  readonly walletsCount: number | null;
}

export interface PhaseGroupSnapshotConfig {
  groupSnapshotId: string | null;
  snapshotId: string | null;
  snapshotType: Pool.TOKEN_POOL | Pool.CUSTOM_TOKEN_POOL | null;
  snapshotSchema: string | null;
  excludeComponentWinners: string[];
  topHoldersFilter: {
    type: TopHolderType;
    from: number | null;
    to: number | null;
    tdhBlockNumber: number | null;
  } | null;
  uniqueWalletsCount: number | null;
}

export interface PhaseGroupConfig {
  snapshots: PhaseGroupSnapshotConfig[];
  randomHoldersFilter: {
    type: RandomHoldersType;
    value: number;
  } | null;
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
    PhaseConfigStep.SELECT_SNAPSHOT
  );
  const {
    operations,
    distributionPlan,
    tokenPools,
    customTokenPools,
    setToasts,
    addOperations,
    runOperations,
  } = useContext(DistributionPlanToolContext);
  const [targetPhases, setTargetPhases] = useState<BuildPhasesPhase[]>([]);

  useEffect(() => {
    const currentPhaseIndex = phases.findIndex(
      (p) => p.id === selectedPhase.id
    );
    setTargetPhases(phases.slice(0, currentPhaseIndex + 1));
  }, [selectedPhase, phases]);

  const [snapshots, setSnapshots] = useState<DistributionPlanSnapshot[]>([]);

  useEffect(() => {
    const findTokenPoolWalletsCount = (tokenPoolId: string): number | null => {
      const tokenPool = tokenPools.find((p) => p.id === tokenPoolId);
      if (!tokenPool) {
        return null;
      }
      return tokenPool.walletsCount;
    };

    const constCustomTokenPoolWalletsCount = (
      operation: AllowlistOperation
    ): number | null => {
      if (operation.code !== AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL) {
        return null;
      }

      const tokens = operation.params.tokens;
      if (!tokens) {
        return null;
      }

      return new Set(tokens.map((t: any) => t.owner)).size;
    };

    const pools = operations
      .filter(
        (operation) =>
          operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL
      )
      .map<DistributionPlanSnapshot>((operation) => ({
        id: operation.params.id,
        name: operation.params.name,
        poolType: Pool.TOKEN_POOL,
        walletsCount: findTokenPoolWalletsCount(operation.params.id),
      }));

    const customPools = operations
      .filter(
        (operation) =>
          operation.code === AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL
      )
      .map<DistributionPlanSnapshot>((operation) => ({
        id: operation.params.id,
        name: operation.params.name,
        poolType: Pool.CUSTOM_TOKEN_POOL,
        walletsCount: constCustomTokenPoolWalletsCount(operation),
      }));

    setSnapshots([...pools, ...customPools]);
  }, [operations, tokenPools, customTokenPools]);

  const onNextStep = (step: PhaseConfigStep) => setConfigStep(step);

  //
  const [phaseGroupConfig, setPhaseGroupConfig] = useState<PhaseGroupConfig>({
    snapshots: [],
    randomHoldersFilter: null,
    maxMintCount: null,
  });

  const [phaseGroupSnapshotConfig, setPhaseGroupSnapshotConfig] =
    useState<PhaseGroupSnapshotConfig>({
      groupSnapshotId: selectedPhase.id,
      snapshotId: null,
      snapshotType: null,
      snapshotSchema: null,
      excludeComponentWinners: [],
      topHoldersFilter: null,
      uniqueWalletsCount: null,
    });

  const resetPhaseGroupSnapshotConfig = () => {
    setPhaseGroupSnapshotConfig({
      groupSnapshotId: null,
      snapshotId: null,
      snapshotType: null,
      snapshotSchema: null,
      excludeComponentWinners: [],
      topHoldersFilter: null,
      uniqueWalletsCount: null,
    });
  };

  const [isLoadingContractSchema, setIsLoadingContractSchema] = useState(false);

  const getContractSchema = async (
    snapshotId: string
  ): Promise<string | null> => {
    const tokenPool = operations.find(
      (operation) =>
        operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL &&
        operation.params.id === snapshotId
    );
    if (!tokenPool) {
      return null;
    }
    const contract = tokenPool.params.contract;
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/other/contract-metadata/${contract}`;
    setIsLoadingContractSchema(true);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data: AllowlistToolResponse<DistributionPlanSearchContractMetadataResult | null> =
        await response.json();

      if (data && "error" in data) {
        return null;
      }
      return data?.tokenType ?? null;
    } catch (error) {
      return null;
    } finally {
      setIsLoadingContractSchema(false);
    }
  };

  const onSelectSnapshot = async ({
    snapshotId,
    snapshotType,
  }: {
    snapshotId: string;
    snapshotType: Pool.TOKEN_POOL | Pool.CUSTOM_TOKEN_POOL;
  }) => {
    const contractSchema =
      snapshotType === Pool.TOKEN_POOL
        ? await getContractSchema(snapshotId)
        : null;
    setPhaseGroupSnapshotConfig({
      groupSnapshotId: getRandomObjectId(),
      snapshotId,
      snapshotType,
      snapshotSchema: contractSchema,
      excludeComponentWinners: [],
      topHoldersFilter: null,
      uniqueWalletsCount: null,
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
    resetPhaseGroupSnapshotConfig();
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
    resetPhaseGroupSnapshotConfig();
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
    resetPhaseGroupSnapshotConfig();
    onNextStep(PhaseConfigStep.SELECT_SNAPSHOT);
  };

  const onConfigureGroup = () => {
    resetPhaseGroupSnapshotConfig();
    onNextStep(PhaseConfigStep.COMPONENT_SELECT_RANDOM_HOLDERS);
  };

  const onSelectRandomHolders = (param: {
    value: number;
    randomHoldersType: RandomHoldersType;
  }) => {
    setPhaseGroupConfig((prev) => ({
      ...prev,
      randomHoldersFilter: {
        type: param.randomHoldersType,
        value: param.value,
      },
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
    resetPhaseGroupSnapshotConfig();
    setPhaseGroupConfig({
      snapshots: [],
      randomHoldersFilter: null,
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
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) {
      return { itemId: null };
    }
    const itemId = getRandomObjectId();
    const { success } = await addOperation({
      code: AllowlistOperationCode.ADD_ITEM,
      params: {
        id: itemId,
        name: snapshot.name,
        description: snapshot.name,
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
    value,
    randomHoldersType,
    seed,
  }: {
    distributionPlanId: string;
    componentId: string;
    value: number | null;
    randomHoldersType: RandomHoldersType;
    seed: string;
  }): Promise<{ success: boolean }> => {
    switch (randomHoldersType) {
      case RandomHoldersType.BY_COUNT:
        return await addOperation({
          code: AllowlistOperationCode.COMPONENT_SELECT_RANDOM_WALLETS,
          params: {
            componentId,
            count: value,
            seed,
          },
          distributionPlanId,
        });
      case RandomHoldersType.BY_PERCENTAGE:
        return await addOperation({
          code: AllowlistOperationCode.COMPONENT_SELECT_RANDOM_PERCENTAGE_WALLETS,
          params: {
            componentId,
            percentage: value,
            seed,
          },
          distributionPlanId,
        });
      default:
        assertUnreachable(randomHoldersType);
        return { success: false };
    }
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
    if (phaseGroupConfig.randomHoldersFilter) {
      await componentSelectRandomWallets({
        distributionPlanId: distributionPlan.id,
        componentId,
        value: phaseGroupConfig.randomHoldersFilter.value,
        randomHoldersType: phaseGroupConfig.randomHoldersFilter.type,
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
    runOperations();
    onClose();
  };

  const [modalTitle, setModalTitle] = useState(`Configure group "${name}"`);
  useEffect(() => {
    setModalTitle(`Configure group "${name}"`);
  }, [name]);

  const [uniqueWalletsCount, setUniqueWalletsCount] = useState<number | null>(
    null
  );

  return (
    <div className="tw-px-6 tw-gap-y-6 tw-flex tw-flex-col tw-divide-y tw-divide-solid tw-divide-neutral-700 tw-divide-x-0">
      {(() => {
        switch (configStep) {
          case PhaseConfigStep.SELECT_SNAPSHOT:
            return (
              <SelectSnapshot
                snapshots={snapshots}
                onSelectSnapshot={onSelectSnapshot}
                title={modalTitle}
                onClose={onClose}
                isLoading={isLoadingContractSchema}
                uniqueWalletsCount={uniqueWalletsCount}
                setUniqueWalletsCount={setUniqueWalletsCount}
              />
            );
          case PhaseConfigStep.SNAPSHOT_EXCLUDE_COMPONENT_WINNERS:
            return (
              phaseGroupSnapshotConfig.snapshotId && (
                <SnapshotExcludeComponentWinners
                  snapshotId={phaseGroupSnapshotConfig.snapshotId}
                  phases={targetPhases}
                  onNextStep={onNextStep}
                  onSelectExcludeComponentWinners={
                    onSelectExcludeComponentWinners
                  }
                  title={modalTitle}
                  onClose={onClose}
                  setUniqueWalletsCount={setUniqueWalletsCount}
                />
              )
            );
          case PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS:
            return (
              <SnapshotSelectTopHolders
                onSelectTopHoldersSkip={onSelectTopHoldersSkip}
                onSelectTopHoldersFilter={onSelectTopHoldersFilter}
                config={phaseGroupSnapshotConfig}
                title={modalTitle}
                onClose={onClose}
                uniqueWalletsCount={uniqueWalletsCount}
                setUniqueWalletsCount={setUniqueWalletsCount}
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
                title={modalTitle}
                onClose={onClose}
              />
            );
          case PhaseConfigStep.COMPONENT_SELECT_RANDOM_HOLDERS:
            return (
              <ComponentSelectRandomHolders
                onNextStep={onNextStep}
                onSelectRandomHolders={onSelectRandomHolders}
                title={modalTitle}
                onClose={onClose}
              />
            );
          case PhaseConfigStep.COMPONENT_ADD_SPOTS:
            return (
              <ComponentAddSpots
                onSelectMaxMintCount={onSelectMaxMintCount}
                title={modalTitle}
                onClose={onClose}
              />
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
                title={modalTitle}
                onClose={onClose}
              />
            );
          default:
            assertUnreachable(configStep);
        }
      })()}
    </div>
  );
}
