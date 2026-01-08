"use client";

import type {
  AllowlistOperation,
  AllowlistOperationBase,
  DistributionPlanSearchContractMetadataResult} from "@/components/allowlist-tool/allowlist-tool.types";
import {
  AllowlistOperationCode,
  Pool,
} from "@/components/allowlist-tool/allowlist-tool.types";
import type { BuildPhasesPhase } from "@/components/distribution-plan-tool/build-phases/BuildPhases";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import {
  assertUnreachable,
  getRandomObjectId,
} from "@/helpers/AllowlistToolHelpers";
import {
  distributionPlanApiFetch,
  distributionPlanApiPost,
} from "@/services/distribution-plan-api";
import { useContext, useEffect, useState } from "react";
import ComponentAddSpots from "./component-config/ComponentAddSpots";
import ComponentSelectRandomHolders from "./component-config/ComponentSelectRandomHolders";
import FinalizeComponent from "./component-config/FinalizeComponent";
import FinalizeSnapshot from "./component-config/FinalizeSnapshot";
import SelectSnapshot from "./component-config/select-snapshot/SelectSnapshot";
import SnapshotExcludeComponentWinners from "./component-config/SnapshotExcludeComponentWinners";
import SnapshotExcludeOtherSnapshots from "./component-config/SnapshotExcludeOtherSnapshots";
import SnapshotSelectTokenIds from "./component-config/SnapshotSelectTokenIds";
import SnapshotSelectTopHolders from "./component-config/SnapshotSelectTopHolders";
import { ComponentRandomHoldersWeightType } from "./component-config/utils/ComponentRandomHoldersWeight";

export enum PhaseConfigStep {
  SELECT_SNAPSHOT = "SELECT_SNAPSHOT",
  SNAPSHOT_EXCLUDE_OTHER_SNAPSHOTS = "SNAPSHOT_EXCLUDE_OTHER_SNAPSHOTS",
  SNAPSHOT_EXCLUDE_COMPONENT_WINNERS = "SNAPSHOT_EXCLUDE_COMPONENT_WINNERS",
  SNAPSHOT_SELECT_TOKEN_IDS = "SNAPSHOT_SELECT_TOKEN_IDS",
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
  readonly poolType: Pool;
  readonly walletsCount: number | null;
}

export interface PhaseGroupSnapshotConfigExcludeSnapshot {
  readonly snapshotId: string;
  readonly snapshotType: Pool;
  readonly extraWallets: string[];
}

export interface PhaseGroupSnapshotConfig {
  groupSnapshotId: string | null;
  snapshotId: string | null;
  snapshotType: Pool | null;
  snapshotSchema: string | null;
  excludeComponentWinners: string[];
  excludeSnapshots: PhaseGroupSnapshotConfigExcludeSnapshot[];
  topHoldersFilter: {
    type: TopHolderType;
    from: number | null;
    to: number | null;
    tdhBlockNumber: number | null;
  } | null;
  tokenIds: string | null;
  uniqueWalletsCount: number | null;
}

export interface PhaseGroupConfig {
  snapshots: PhaseGroupSnapshotConfig[];
  randomHoldersFilter: {
    type: RandomHoldersType;
    value: number;
    weightType: ComponentRandomHoldersWeightType;
    seed: string;
  } | null;
  maxMintCount: number | null;
  uniqueWalletsCount: number | null;
}

interface BuildPhaseFormConfigModalProps {
  readonly name: string;
  readonly description: string;
  readonly selectedPhase: BuildPhasesPhase;
  readonly phases: BuildPhasesPhase[];
  readonly onClose: () => void;
}

export default function BuildPhaseFormConfigModal({
  name,
  description,
  selectedPhase,
  phases,
  onClose,
}: BuildPhaseFormConfigModalProps) {
  const [configStep, setConfigStep] = useState<PhaseConfigStep>(
    PhaseConfigStep.SELECT_SNAPSHOT
  );
  const {
    operations,
    distributionPlan,
    tokenPools,
    customTokenPools,
    fetchOperations,
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

    const getCustomTokenPoolWalletsCount = (
      operation: AllowlistOperation
    ): number | null => {
      if (operation.code !== AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL) {
        return null;
      }

      const tokens = operation.params["tokens"];
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
        id: operation.params["id"],
        name: operation.params["name"],
        poolType: Pool.TOKEN_POOL,
        walletsCount: findTokenPoolWalletsCount(operation.params["id"]),
      }));

    const customPools = operations
      .filter(
        (operation) =>
          operation.code === AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL
      )
      .map<DistributionPlanSnapshot>((operation) => ({
        id: operation.params["id"],
        name: operation.params["name"],
        poolType: Pool.CUSTOM_TOKEN_POOL,
        walletsCount: getCustomTokenPoolWalletsCount(operation),
      }));

    setSnapshots([...pools, ...customPools]);
  }, [operations, tokenPools, customTokenPools]);

  const onNextStep = (step: PhaseConfigStep) => setConfigStep(step);

  //
  const [phaseGroupConfig, setPhaseGroupConfig] = useState<PhaseGroupConfig>({
    snapshots: [],
    randomHoldersFilter: null,
    maxMintCount: null,
    uniqueWalletsCount: null,
  });

  const [phaseGroupSnapshotConfig, setPhaseGroupSnapshotConfig] =
    useState<PhaseGroupSnapshotConfig>({
      groupSnapshotId: selectedPhase.id,
      snapshotId: null,
      snapshotType: null,
      snapshotSchema: null,
      excludeComponentWinners: [],
      excludeSnapshots: [],
      tokenIds: null,
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
      excludeSnapshots: [],
      topHoldersFilter: null,
      tokenIds: null,
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
        operation.params["id"] === snapshotId
    );
    if (!tokenPool) {
      return null;
    }
    const contract = tokenPool.params["contract"];
    const endpoint = `/other/contract-metadata/${contract}`;
    setIsLoadingContractSchema(true);
    const { data } =
      await distributionPlanApiFetch<DistributionPlanSearchContractMetadataResult | null>(
        endpoint
      );

    setIsLoadingContractSchema(false);
    return data?.tokenType ?? null;
  };

  const onSelectSnapshot = async ({
    snapshotId,
    snapshotType,
    uniqueWalletsCount,
  }: {
    snapshotId: string;
    snapshotType: Pool;
    uniqueWalletsCount: number | null;
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
      excludeSnapshots: [],
      topHoldersFilter: null,
      tokenIds: null,
      uniqueWalletsCount,
    });

    const haveMoreSnapshots = !!operations.filter(
      (operation) =>
        [
          AllowlistOperationCode.CREATE_TOKEN_POOL,
          AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL,
        ].includes(operation.code) && operation.params["id"] !== snapshotId
    ).length;

    if (haveMoreSnapshots) {
      onNextStep(PhaseConfigStep.SNAPSHOT_EXCLUDE_OTHER_SNAPSHOTS);
      return;
    }
    const haveComponents = targetPhases.some(
      (phase) => phase.components.length > 0
    );

    if (!haveComponents) {
      onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_TOKEN_IDS);
      return;
    }
    onNextStep(PhaseConfigStep.SNAPSHOT_EXCLUDE_COMPONENT_WINNERS);
  };

  const onExcludeOtherSnapshotsNextStep = () => {
    const haveComponents = targetPhases.some(
      (phase) => phase.components.length > 0
    );

    if (!haveComponents) {
      onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_TOKEN_IDS);
      return;
    }
    onNextStep(PhaseConfigStep.SNAPSHOT_EXCLUDE_COMPONENT_WINNERS);
  };

  const onSelectExcludeOtherSnapshots = (param: {
    snapshotsToExclude: {
      snapshotId: string;
      snapshotType: Pool;
      extraWallets: string[];
    }[];
    uniqueWalletsCount: number | null;
  }) => {
    setPhaseGroupSnapshotConfig((prev) => ({
      ...prev,
      excludeSnapshots: param.snapshotsToExclude,
      uniqueWalletsCount: param.uniqueWalletsCount,
    }));
    onExcludeOtherSnapshotsNextStep();
  };

  const onSelectExcludeComponentWinners = ({
    excludeComponentWinners,
    uniqueWalletsCount,
  }: {
    excludeComponentWinners: string[];
    uniqueWalletsCount: number | null;
  }) => {
    setPhaseGroupSnapshotConfig((prev) => ({
      ...prev,
      excludeComponentWinners,
      uniqueWalletsCount,
    }));
    onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_TOKEN_IDS);
  };

  const onSelectTopHoldersSkip = () => {
    setPhaseGroupConfig((prev) => ({
      ...prev,
      snapshots: [...prev.snapshots, phaseGroupSnapshotConfig],
    }));
    resetPhaseGroupSnapshotConfig();
    onNextStep(PhaseConfigStep.FINALIZE_SNAPSHOT);
  };

  const onSelectTokenIds = (tokenIds: string) => {
    setPhaseGroupSnapshotConfig((prev) => ({
      ...prev,
      tokenIds: tokenIds.length ? tokenIds : null,
    }));
    onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS);
  };

  const onSelectTopHoldersFilter = (params: {
    type: TopHolderType;
    from: number | null;
    to: number | null;
    tdhBlockNumber: number | null;
    uniqueWalletsCount: number | null;
  }) => {
    setPhaseGroupConfig((prev) => ({
      ...prev,
      snapshots: [
        ...prev.snapshots,
        {
          ...phaseGroupSnapshotConfig,
          topHoldersFilter: params,
          uniqueWalletsCount: params.uniqueWalletsCount,
        },
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
    weightType: ComponentRandomHoldersWeightType;
    seed: string;
  }) => {
    setPhaseGroupConfig((prev) => ({
      ...prev,
      randomHoldersFilter: {
        type: param.randomHoldersType,
        value: param.value,
        weightType: param.weightType,
        seed: param.seed,
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
      uniqueWalletsCount: null,
    });
    setConfigStep(PhaseConfigStep.SELECT_SNAPSHOT);
  };

  const [isAddingOperations, setIsAddingOperations] = useState(false);
  const createOperations = async ({
    ops,
    distributionPlanId,
  }: {
    ops: {
      code: AllowlistOperationCode;
      params: any;
    }[];
    distributionPlanId: string;
  }): Promise<{ success: boolean }> => {
    const endpoint = `/allowlists/${distributionPlanId}/operations/batch`;
    const { success } = await distributionPlanApiPost<AllowlistOperation[]>({
      endpoint,
      body: ops,
    });
    if (!success) {
      return { success: false };
    }
    await fetchOperations(distributionPlanId);
    return { success: true };
  };

  const [newOperations, setNewOperations] = useState<AllowlistOperationBase[]>(
    []
  );

  useEffect(() => {
    const getSortItemWalletsOperation = ({
      itemId,
      filterType,
      tdhBlockNumber,
    }: {
      itemId: string;
      filterType: TopHolderType;
      tdhBlockNumber: number | null;
    }): AllowlistOperationBase | null => {
      switch (filterType) {
        case TopHolderType.TOTAL_TOKENS_COUNT:
          return {
            code: AllowlistOperationCode.ITEM_SORT_WALLETS_BY_TOTAL_TOKENS_COUNT,
            params: {
              itemId,
            },
          };
        case TopHolderType.UNIQUE_TOKENS_COUNT:
          return {
            code: AllowlistOperationCode.ITEM_SORT_WALLETS_BY_UNIQUE_TOKENS_COUNT,
            params: {
              itemId,
            },
          };
        case TopHolderType.MEMES_TDH:
          if (!tdhBlockNumber) {
            return null;
          }
          return {
            code: AllowlistOperationCode.ITEM_SORT_WALLETS_BY_MEMES_TDH,
            params: {
              itemId,
              tdhBlockNumber,
            },
          };
        default:
          assertUnreachable(filterType);
          return null;
      }
    };
    const getOperations = (): AllowlistOperationBase[] => {
      const result: AllowlistOperationBase[] = [];
      const componentId = getRandomObjectId();
      result.push({
        code: AllowlistOperationCode.ADD_COMPONENT,
        params: {
          id: componentId,
          phaseId: selectedPhase.id,
          name: name,
          description: description,
        },
      });
      const {
        snapshots: groupSnapshots,
        randomHoldersFilter,
        maxMintCount,
      } = phaseGroupConfig;
      for (const groupSnapshot of groupSnapshots) {
        const {
          snapshotType,
          snapshotId,
          excludeComponentWinners,
          excludeSnapshots,
          tokenIds,
          topHoldersFilter,
        } = groupSnapshot;
        if (!snapshotType || !snapshotId) continue;
        const itemId = getRandomObjectId();
        const snapshot = snapshots.find(
          (s) => s.id === groupSnapshot.snapshotId
        );
        if (!snapshot) continue;
        result.push({
          code: AllowlistOperationCode.ADD_ITEM,
          params: {
            id: itemId,
            name: name,
            description: name,
            componentId,
            poolId: snapshotId,
            poolType: snapshotType,
          },
        });

        if (excludeSnapshots.length > 0) {
          result.push({
            code: AllowlistOperationCode.ITEM_REMOVE_WALLETS_FROM_CERTAIN_TOKEN_POOLS,
            params: {
              itemId,
              pools: excludeSnapshots.map((s) => ({
                poolType: s.snapshotType,
                poolId: s.snapshotId,
              })),
            },
          });
        }

        if (excludeComponentWinners.length > 0) {
          result.push({
            code: AllowlistOperationCode.ITEM_REMOVE_WALLETS_FROM_CERTAIN_COMPONENTS,
            params: {
              itemId,
              componentIds: excludeComponentWinners,
            },
          });
        }

        if (tokenIds?.length) {
          result.push({
            code: AllowlistOperationCode.ITEM_SELECT_WALLETS_OWNING_TOKEN_IDS,
            params: {
              itemId,
              tokenIds,
            },
          });
        }

        if (topHoldersFilter) {
          const {
            type: filterType,
            tdhBlockNumber,
            from,
            to,
          } = topHoldersFilter;
          const sortOperation = getSortItemWalletsOperation({
            itemId,
            filterType,
            tdhBlockNumber,
          });
          if (!sortOperation) {
            continue;
          }
          result.push(sortOperation);

          if (typeof from === "number" && from > 1) {
            const removeOperation = {
              code: AllowlistOperationCode.ITEM_REMOVE_FIRST_N_WALLETS,
              params: {
                itemId,
                count: from - 1,
              },
            };
            result.push(removeOperation);
          }

          if (typeof to === "number") {
            const count =
              to - (typeof from === "number" && from > 1 ? from - 1 : 0);
            const selectOperation = {
              code: AllowlistOperationCode.ITEM_SELECT_FIRST_N_WALLETS,
              params: {
                itemId,
                count,
              },
            };
            result.push(selectOperation);
          }
        }
      }

      if (randomHoldersFilter && distributionPlan?.id) {
        const {
          type: randomHoldersType,
          value,
          weightType,
          seed,
        } = randomHoldersFilter;
        const coreParams: {
          componentId: string;
          seed: string;
          weightType?: ComponentRandomHoldersWeightType | undefined;
        } = {
          componentId,
          seed,
        };

        if (weightType !== ComponentRandomHoldersWeightType.OFF) {
          coreParams.weightType = weightType;
        }
        switch (randomHoldersType) {
          case RandomHoldersType.BY_COUNT:
            result.push({
              code: AllowlistOperationCode.COMPONENT_SELECT_RANDOM_WALLETS,
              params: {
                ...coreParams,
                count: value,
              },
            });
            break;
          case RandomHoldersType.BY_PERCENTAGE:
            result.push({
              code: AllowlistOperationCode.COMPONENT_SELECT_RANDOM_PERCENTAGE_WALLETS,
              params: {
                ...coreParams,
                percentage: value,
              },
            });
            break;
          default:
            assertUnreachable(randomHoldersType);
        }
      }

      if (typeof maxMintCount === "number" && maxMintCount > 0) {
        result.push({
          code: AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS,
          params: {
            componentId,
            spots: maxMintCount,
          },
        });
      }

      return result;
    };

    setNewOperations(getOperations());
  }, [
    phaseGroupConfig,
    snapshots,
    distributionPlan?.id,
    selectedPhase.id,
    name,
    description,
  ]);

  const onSave = async () => {
    if (
      !distributionPlan ||
      typeof phaseGroupConfig.maxMintCount !== "number" ||
      phaseGroupConfig.maxMintCount < 1
    ) {
      return;
    }

    setIsAddingOperations(true);
    const { success } = await createOperations({
      distributionPlanId: distributionPlan.id,
      ops: newOperations,
    });
    if (success) {
      runOperations();
    }
    onClose();
  };

  const [modalTitle, setModalTitle] = useState(`Configure group "${name}"`);
  useEffect(() => {
    setModalTitle(`Configure group "${name}"`);
  }, [name]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-700">
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
              />
            );
          case PhaseConfigStep.SNAPSHOT_EXCLUDE_OTHER_SNAPSHOTS:
            return (
              phaseGroupSnapshotConfig.snapshotId && (
                <SnapshotExcludeOtherSnapshots
                  config={phaseGroupSnapshotConfig}
                  snapshots={snapshots}
                  onSkip={onExcludeOtherSnapshotsNextStep}
                  onSelectExcludeOtherSnapshots={onSelectExcludeOtherSnapshots}
                  title={modalTitle}
                  onClose={onClose}
                />
              )
            );
          case PhaseConfigStep.SNAPSHOT_EXCLUDE_COMPONENT_WINNERS:
            return (
              phaseGroupSnapshotConfig.snapshotId && (
                <SnapshotExcludeComponentWinners
                  config={phaseGroupSnapshotConfig}
                  phases={targetPhases}
                  onNextStep={onNextStep}
                  onSelectExcludeComponentWinners={
                    onSelectExcludeComponentWinners
                  }
                  title={modalTitle}
                  onClose={onClose}
                />
              )
            );
          case PhaseConfigStep.SNAPSHOT_SELECT_TOKEN_IDS:
            return (
              <SnapshotSelectTokenIds
                title={modalTitle}
                onNextStep={onNextStep}
                onSelectTokenIds={onSelectTokenIds}
                onClose={onClose}
              />
            );
          case PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS:
            return (
              <SnapshotSelectTopHolders
                onSelectTopHoldersSkip={onSelectTopHoldersSkip}
                onSelectTopHoldersFilter={onSelectTopHoldersFilter}
                config={phaseGroupSnapshotConfig}
                title={modalTitle}
                onClose={onClose}
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
                phases={targetPhases}
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
                loading={isAddingOperations}
                title={modalTitle}
                onClose={onClose}
                phases={targetPhases}
              />
            );
          default:
            assertUnreachable(configStep);
            return null;
        }
      })()}
    </div>
  );
}
