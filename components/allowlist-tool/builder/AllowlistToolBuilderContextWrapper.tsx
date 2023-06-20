import { createContext, use, useEffect, useState } from "react";
import {
  AllowlistCustomTokenPool,
  AllowlistDescription,
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistOperationDescription,
  AllowlistPhase,
  AllowlistPhaseComponent,
  AllowlistPhaseComponentItem,
  AllowlistPhaseComponentWithItems,
  AllowlistPhaseWithComponentAndItems,
  AllowlistRunStatus,
  AllowlistTokenPool,
  AllowlistTransferPool,
  AllowlistWalletPool,
} from "../allowlist-tool.types";
import { Slide, ToastContainer, TypeOptions, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  assertUnreachable,
  getRandomObjectId,
} from "../../../helpers/AllowlistToolHelpers";
import { useRouter } from "next/router";

export interface AllowlistToolBuilderContextActiveHistory {
  operations: AllowlistOperation[];
  title: string;
  subTitle: string | null;
}

type AllowlistToolBuilderContextType = {
  refreshState: () => void;
  refreshKey: string;
  allowlist: AllowlistDescription | null;
  setAllowlist: (allowlist: AllowlistDescription) => void;
  operations: AllowlistOperation[];
  addOperations: (operations: AllowlistOperation[]) => void;
  operationDescriptions: AllowlistOperationDescription[];
  operationsGrouped: AllowlistToolOperationsGrouped;
  activeHistory: AllowlistToolBuilderContextActiveHistory | null;
  setActiveHistory: (
    entity: AllowlistToolBuilderContextActiveHistory | null
  ) => void;
  transferPools: AllowlistTransferPool[];
  setTransferPools: (transferPools: AllowlistTransferPool[]) => void;
  tokenPools: AllowlistTokenPool[];
  setTokenPools: (tokenPools: AllowlistTokenPool[]) => void;
  customTokenPools: AllowlistCustomTokenPool[];
  setCustomTokenPools: (customTokenPools: AllowlistCustomTokenPool[]) => void;
  walletPools: AllowlistWalletPool[];
  setWalletPools: (walletPools: AllowlistWalletPool[]) => void;
  phases: AllowlistPhaseWithComponentAndItems[];
  isGlobalLoading: boolean;
  setPhases: (phases: AllowlistPhaseWithComponentAndItems[]) => void;
  setToasts: ({
    messages,
    type,
  }: {
    messages: string[];
    type: TypeOptions;
  }) => void;
};

const setToast = ({
  message,
  type,
}: {
  message: string;
  type: TypeOptions;
}) => {
  toast(message, {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 3000,
    hideProgressBar: false,
    draggable: false,
    closeOnClick: true,
    transition: Slide,
    theme: "dark",
    type,
  });
};

const setToasts = ({
  messages,
  type,
}: {
  messages: string[];
  type: TypeOptions;
}) => {
  messages.forEach((message) => setToast({ message, type }));
};

export const AllowlistToolBuilderContext =
  createContext<AllowlistToolBuilderContextType>({
    refreshState: () => {},
    refreshKey: "",
    allowlist: null,
    setAllowlist: () => {},
    operations: [],
    operationsGrouped: {
      transferPools: {
        operations: [],
        pools: {},
      },
      tokenPools: {
        operations: [],
        pools: {},
      },
      customTokenPools: {
        operations: [],
        pools: {},
      },
      walletPools: {
        operations: [],
        pools: {},
      },
      phases: {
        operations: [],
        phases: {},
      },
    },
    activeHistory: null,
    setActiveHistory: () => {},
    addOperations: () => {},
    operationDescriptions: [],
    transferPools: [],
    setTransferPools: () => {},
    tokenPools: [],
    setTokenPools: () => {},
    customTokenPools: [],
    setCustomTokenPools: () => {},
    walletPools: [],
    setWalletPools: () => {},
    phases: [],
    setPhases: () => {},
    setToasts: () => {},
    isGlobalLoading: false,
  });

export interface AllowlistToolOperationsGrouped {
  transferPools: {
    operations: AllowlistOperation[];
    pools: Record<string, AllowlistOperation[]>;
  };
  tokenPools: {
    operations: AllowlistOperation[];
    pools: Record<string, AllowlistOperation[]>;
  };
  customTokenPools: {
    operations: AllowlistOperation[];
    pools: Record<string, AllowlistOperation[]>;
  };
  walletPools: {
    operations: AllowlistOperation[];
    pools: Record<string, AllowlistOperation[]>;
  };
  phases: {
    operations: AllowlistOperation[];
    phases: Record<
      string,
      {
        operations: AllowlistOperation[];
        components: Record<
          string,
          {
            operations: AllowlistOperation[];
            items: Record<string, AllowlistOperation[]>;
          }
        >;
      }
    >;
  };
}

export default function AllowlistToolBuilderContextWrapper({
  children,
  allowlistState,
  operationDescriptions,
}: {
  children: React.ReactNode;
  allowlistState: AllowlistDescription;
  operationDescriptions: AllowlistOperationDescription[];
}) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState<string>(getRandomObjectId());

  const [allowlist, setAllowlist] =
    useState<AllowlistDescription>(allowlistState);
  const [operations, setOperations] = useState<AllowlistOperation[]>([]);

  const [transferPools, setTransferPools] = useState<AllowlistTransferPool[]>(
    []
  );
  const [optimisticTransferPools, setOptimisticTransferPools] = useState<
    AllowlistTransferPool[]
  >([]);
  const [tokenPools, setTokenPools] = useState<AllowlistTokenPool[]>([]);
  const [optimisticTokenPools, setOptimisticTokenPools] = useState<
    AllowlistTokenPool[]
  >([]);
  const [customTokenPools, setCustomTokenPools] = useState<
    AllowlistCustomTokenPool[]
  >([]);
  const [optimisticCustomTokenPools, setOptimisticCustomTokenPools] = useState<
    AllowlistCustomTokenPool[]
  >([]);
  const [walletPools, setWalletPools] = useState<AllowlistWalletPool[]>([]);
  const [optimisticWalletPools, setOptimisticWalletPools] = useState<
    AllowlistWalletPool[]
  >([]);

  const [phases, setPhases] = useState<AllowlistPhaseWithComponentAndItems[]>(
    []
  );
  const [optimisticPhases, setOptimisticPhases] = useState<AllowlistPhase[]>(
    []
  );

  const [optimisticComponents, setOptimisticComponents] = useState<
    AllowlistPhaseComponent[]
  >([]);

  const [optimisticItems, setOptimisticItems] = useState<
    AllowlistPhaseComponentItem[]
  >([]);

  const [finalPhases, setFinalPhases] = useState<
    AllowlistPhaseWithComponentAndItems[]
  >([]);

  const getPhaseIdForComponent = ({
    phasesClone,
    optimisticComponentsClone,
    componentId,
  }: {
    phasesClone: AllowlistPhaseWithComponentAndItems[];
    optimisticComponentsClone: AllowlistPhaseComponent[];
    componentId: string;
  }) =>
    phasesClone.find((phase) =>
      phase.components.some((c) => c.id === componentId)
    )?.id ??
    optimisticComponentsClone.find((c) => c.id === componentId)?.phaseId ??
    null;

  const getComponentIdForItem = ({
    phasesClone,
    optimisticItemsClone,
    itemId,
  }: {
    phasesClone: AllowlistPhaseWithComponentAndItems[];
    optimisticItemsClone: AllowlistPhaseComponentItem[];
    itemId: string;
  }) =>
    phasesClone
      .flatMap((phase) => phase.components)
      .find((component) => component.items.some((i) => i.id === itemId))?.id ??
    optimisticItemsClone.find((item) => item.id === itemId)?.phaseId ??
    null;

  useEffect(() => {
    const getOptimisticComponents = (phaseId: string) =>
      optimisticComponents.filter((component) => component.phaseId === phaseId);

    const getOptimisticItems = (componentId: string) =>
      optimisticItems.filter((item) => item.phaseComponentId === componentId);

    const results: AllowlistPhaseWithComponentAndItems[] = [];
    results.push(
      ...phases.map((phase) => ({
        ...phase,
        components: [
          ...phase.components.map((component) => ({
            ...component,
            items: [...component.items, ...getOptimisticItems(component.id)],
          })),
          ...getOptimisticComponents(phase.id).map((component) => ({
            ...component,
            items: getOptimisticItems(component.id),
          })),
        ],
      })),
      ...optimisticPhases.map((phase) => ({
        ...phase,
        components: getOptimisticComponents(phase.id).map((component) => ({
          ...component,
          items: getOptimisticItems(component.id),
        })),
      }))
    );
    setFinalPhases(results);
  }, [
    setFinalPhases,
    phases,
    optimisticPhases,
    optimisticComponents,
    optimisticItems,
  ]);

  const doOperationsOptimisticUpdates = (
    newOperations: AllowlistOperation[]
  ) => {
    const optimisticPools = newOperations
      .filter((operation) => !operation.hasRan)
      .reduce<{
        transferPools: AllowlistTransferPool[];
        tokenPools: AllowlistTokenPool[];
        customTokenPools: AllowlistCustomTokenPool[];
        walletPools: AllowlistWalletPool[];
        phases: AllowlistPhase[];
        components: AllowlistPhaseComponent[];
        items: AllowlistPhaseComponentItem[];
      }>(
        (acc, operation) => {
          const { code } = operation;
          switch (code) {
            case AllowlistOperationCode.GET_COLLECTION_TRANSFERS:
              acc.transferPools.push({
                id: operation.params.id,
                allowlistId: router.query.id as string,
                name: operation.params.name,
                description: operation.params.description,
                contract: operation.params.contract,
                blockNo: operation.params.blockNo,
                transfersCount: 0,
              });
              break;
            case AllowlistOperationCode.CREATE_TOKEN_POOL:
              acc.tokenPools.push({
                id: operation.params.id,
                allowlistId: router.query.id as string,
                name: operation.params.name,
                description: operation.params.description,
                transferPoolId: operation.params.transferPoolId,
                tokenIds: operation.params.tokenIds,
                walletsCount: 0,
                tokensCount: 0,
              });
              break;
            case AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL:
              acc.customTokenPools.push({
                id: operation.params.id,
                allowlistId: router.query.id as string,
                name: operation.params.name,
                description: operation.params.description,
                walletsCount: 0,
                tokensCount: 0,
              });
              break;
            case AllowlistOperationCode.CREATE_WALLET_POOL:
              acc.walletPools.push({
                id: operation.params.id,
                allowlistId: router.query.id as string,
                name: operation.params.name,
                description: operation.params.description,
                walletsCount: 0,
              });
              break;
            case AllowlistOperationCode.ADD_PHASE:
              acc.phases.push({
                id: operation.params.id,
                allowlistId: router.query.id as string,
                name: operation.params.name,
                description: operation.params.description,
                insertionOrder: 0,
                walletsCount: 0,
                tokensCount: 0,
                winnersWalletsCount: 0,
                winnersSpotsCount: 0,
              });
              break;
            case AllowlistOperationCode.ADD_COMPONENT:
              acc.components.push({
                id: operation.params.id,
                allowlistId: router.query.id as string,
                phaseId: operation.params.phaseId,
                name: operation.params.name,
                description: operation.params.description,
                insertionOrder: 0,
                walletsCount: 0,
                tokensCount: 0,
                winnersWalletsCount: 0,
                winnersSpotsCount: 0,
              });

              break;
            case AllowlistOperationCode.ADD_ITEM:
              acc.items.push({
                id: operation.params.id,
                allowlistId: router.query.id as string,
                phaseId:
                  getPhaseIdForComponent({
                    componentId: operation.params.componentId,
                    phasesClone: phases,
                    optimisticComponentsClone: optimisticComponents,
                  }) ?? "",
                phaseComponentId: operation.params.componentId,
                poolId: operation.params.poolId,
                poolType: operation.params.poolType,
                name: operation.params.name,
                description: operation.params.description,
                insertionOrder: 0,
                walletsCount: 0,
                tokensCount: 0,
              });
              break;
            case AllowlistOperationCode.CREATE_ALLOWLIST:
            case AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS:
            case AllowlistOperationCode.ITEM_EXCLUE_TOKEN_IDS:
            case AllowlistOperationCode.ITEM_SELECT_TOKEN_IDS:
            case AllowlistOperationCode.ITEM_REMOVE_FIRST_N_TOKENS:
            case AllowlistOperationCode.ITEM_REMOVE_LAST_N_TOKENS:
            case AllowlistOperationCode.ITEM_SELECT_FIRST_N_TOKENS:
            case AllowlistOperationCode.ITEM_SELECT_LAST_N_TOKENS:
              break;
            default:
              assertUnreachable(code);
          }
          return acc;
        },
        {
          transferPools: [],
          tokenPools: [],
          customTokenPools: [],
          walletPools: [],
          phases: [],
          components: [],
          items: [],
        }
      );
    setOptimisticTransferPools([
      ...optimisticTransferPools,
      ...optimisticPools.transferPools,
    ]);
    setOptimisticTokenPools([
      ...optimisticTokenPools,
      ...optimisticPools.tokenPools,
    ]);
    setOptimisticCustomTokenPools([
      ...optimisticCustomTokenPools,
      ...optimisticPools.customTokenPools,
    ]);
    setOptimisticWalletPools([
      ...optimisticWalletPools,
      ...optimisticPools.walletPools,
    ]);
    setOptimisticPhases([...optimisticPhases, ...optimisticPools.phases]);
    setOptimisticComponents([
      ...optimisticComponents,
      ...optimisticPools.components,
    ]);
    setOptimisticItems([...optimisticItems, ...optimisticPools.items]);
  };

  const addOperations = (newOperations: AllowlistOperation[]) => {
    doOperationsOptimisticUpdates(newOperations);
    const allOperations = [...operations, ...newOperations];
    setOperations(allOperations);
  };

  const [operationsGrouped, setOperationsGrouped] =
    useState<AllowlistToolOperationsGrouped>({
      transferPools: {
        operations: [],
        pools: {},
      },
      tokenPools: {
        operations: [],
        pools: {},
      },
      customTokenPools: {
        operations: [],
        pools: {},
      },
      walletPools: {
        operations: [],
        pools: {},
      },
      phases: {
        operations: [],
        phases: {},
      },
    });

  useEffect(() => {
    const state: AllowlistToolOperationsGrouped = {
      transferPools: {
        operations: [],
        pools: {},
      },
      tokenPools: {
        operations: [],
        pools: {},
      },
      customTokenPools: {
        operations: [],
        pools: {},
      },
      walletPools: {
        operations: [],
        pools: {},
      },
      phases: {
        operations: [],
        phases: {},
      },
    };

    const addOperationToComponent = (operation: AllowlistOperation) => {
      const phaseId = getPhaseIdForComponent({
        componentId: operation.params.componentId,
        phasesClone: phases,
        optimisticComponentsClone: optimisticComponents,
      });
      if (!phaseId) return;
      if (!state.phases.phases[phaseId]) {
        state.phases.phases[phaseId] = {
          operations: [],
          components: {},
        };
      }
      if (
        !state.phases.phases[phaseId].components[operation.params.componentId]
      ) {
        state.phases.phases[phaseId].components[operation.params.componentId] =
          {
            operations: [],
            items: {},
          };
      }
      state.phases.phases[phaseId].components[
        operation.params.componentId
      ].operations.push(operation);
    };

    const addOperationToItem = (operation: AllowlistOperation) => {
      const componentId = getComponentIdForItem({
        phasesClone: phases,
        optimisticItemsClone: optimisticItems,
        itemId: operation.params.itemId,
      });
      if (!componentId) return;
      const phaseId = getPhaseIdForComponent({
        componentId,
        phasesClone: phases,
        optimisticComponentsClone: optimisticComponents,
      });
      if (!phaseId) return;
      if (!state.phases.phases[phaseId]) {
        state.phases.phases[phaseId] = {
          operations: [],
          components: {},
        };
      }
      if (!state.phases.phases[phaseId].components[componentId]) {
        state.phases.phases[phaseId].components[componentId] = {
          operations: [],
          items: {},
        };
      }
      if (
        !state.phases.phases[phaseId].components[componentId].items[
          operation.params.itemId
        ]
      ) {
        state.phases.phases[phaseId].components[componentId].items[
          operation.params.itemId
        ] = [];
      }
      state.phases.phases[phaseId].components[componentId].items[
        operation.params.itemId
      ].push(operation);
    };

    for (const operation of operations) {
      const { code } = operation;
      switch (code) {
        case AllowlistOperationCode.CREATE_ALLOWLIST:
          break;
        case AllowlistOperationCode.GET_COLLECTION_TRANSFERS:
          state.transferPools.operations.push(operation);
          break;
        case AllowlistOperationCode.CREATE_TOKEN_POOL:
          state.tokenPools.operations.push(operation);
          break;
        case AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL:
          state.customTokenPools.operations.push(operation);
          break;
        case AllowlistOperationCode.CREATE_WALLET_POOL:
          state.walletPools.operations.push(operation);
          break;
        case AllowlistOperationCode.ADD_PHASE:
          state.phases.operations.push(operation);
          if (!state.phases.phases[operation.params.id]) {
            state.phases.phases[operation.params.id] = {
              operations: [],
              components: {},
            };
          }
          break;
        case AllowlistOperationCode.ADD_COMPONENT:
          if (!state.phases.phases[operation.params.phaseId]) {
            state.phases.phases[operation.params.phaseId] = {
              operations: [],
              components: {},
            };
          }

          state.phases.phases[operation.params.phaseId].operations.push(
            operation
          );
          break;

        case AllowlistOperationCode.ADD_ITEM:
          addOperationToComponent(operation);
          break;
        case AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS:
          addOperationToComponent(operation);
          break;
        case AllowlistOperationCode.ITEM_EXCLUE_TOKEN_IDS:
          addOperationToItem(operation);
          break;
        case AllowlistOperationCode.ITEM_SELECT_TOKEN_IDS:
          addOperationToItem(operation);
          break;
        case AllowlistOperationCode.ITEM_REMOVE_FIRST_N_TOKENS:
          addOperationToItem(operation);
          break;
        case AllowlistOperationCode.ITEM_REMOVE_LAST_N_TOKENS:
          addOperationToItem(operation);
          break;
        case AllowlistOperationCode.ITEM_SELECT_FIRST_N_TOKENS:
          addOperationToItem(operation);
          break;
        case AllowlistOperationCode.ITEM_SELECT_LAST_N_TOKENS:
          addOperationToItem(operation);
          break;
        default:
          assertUnreachable(code);
      }
    }
    setOperationsGrouped(structuredClone(state));
  }, [operations, phases, optimisticComponents]);

  const [activeHistory, setActiveHistory] =
    useState<AllowlistToolBuilderContextActiveHistory | null>(null);

  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  useEffect(() => {
    setIsGlobalLoading(
      !!allowlist?.activeRun?.status &&
        [AllowlistRunStatus.PENDING, AllowlistRunStatus.CLAIMED].includes(
          allowlist?.activeRun?.status
        )
    );
  }, [allowlist]);

  const refreshState = () => {
    setOperations([]);
    setTransferPools([]);
    setTokenPools([]);
    setCustomTokenPools([]);
    setWalletPools([]);
    setPhases([]);
    setOptimisticTransferPools([]);
    setOptimisticTokenPools([]);
    setOptimisticCustomTokenPools([]);
    setOptimisticWalletPools([]);
    setOptimisticPhases([]);
    setOptimisticComponents([]);
    setOptimisticItems([]);
    setFinalPhases([]);
    setOperationsGrouped({
      transferPools: {
        operations: [],
        pools: {},
      },
      tokenPools: {
        operations: [],
        pools: {},
      },
      customTokenPools: {
        operations: [],
        pools: {},
      },
      walletPools: {
        operations: [],
        pools: {},
      },
      phases: {
        operations: [],
        phases: {},
      },
    });
    setActiveHistory(null);
    setRefreshKey(getRandomObjectId());
  };

  return (
    <AllowlistToolBuilderContext.Provider
      value={{
        refreshState,
        refreshKey,
        allowlist,
        setAllowlist,
        operations,
        addOperations,
        operationDescriptions,
        operationsGrouped,
        activeHistory,
        setActiveHistory,
        transferPools: [...transferPools, ...optimisticTransferPools],
        setTransferPools,
        tokenPools: [...tokenPools, ...optimisticTokenPools],
        setTokenPools,
        customTokenPools: [...customTokenPools, ...optimisticCustomTokenPools],
        setCustomTokenPools,
        walletPools: [...walletPools, ...optimisticWalletPools],
        setWalletPools,
        phases: finalPhases,
        isGlobalLoading,
        setPhases,
        setToasts,
      }}
    >
      {children}
      <ToastContainer />
    </AllowlistToolBuilderContext.Provider>
  );
}
