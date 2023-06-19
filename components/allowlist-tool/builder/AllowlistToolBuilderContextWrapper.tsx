import { createContext, useEffect, useState } from "react";
import {
  AllowlistCustomTokenPool,
  AllowlistDescription,
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistOperationDescription,
  AllowlistPhase,
  AllowlistPhaseComponent,
  AllowlistPhaseComponentItem,
  AllowlistPhaseWithComponentAndItems,
  AllowlistTokenPool,
  AllowlistTransferPool,
  AllowlistWalletPool,
} from "../allowlist-tool.types";
import { Slide, ToastContainer, TypeOptions, toast } from "react-toastify";
import {
  assertUnreachable,
  getRandomObjectId,
} from "../../../helpers/AllowlistToolHelpers";
import { useRouter } from "next/router";
import { get } from "http";

type AllowlistToolBuilderContextType = {
  refreshState: () => void;
  refreshKey: string;
  allowlist: AllowlistDescription | null;
  setAllowlist: (allowlist: AllowlistDescription) => void;
  operations: AllowlistOperation[];
  addOperations: (operations: AllowlistOperation[]) => void;
  operationDescriptions: AllowlistOperationDescription[];
  transferPools: AllowlistTransferPool[];
  setTransferPools: (transferPools: AllowlistTransferPool[]) => void;
  tokenPools: AllowlistTokenPool[];
  setTokenPools: (tokenPools: AllowlistTokenPool[]) => void;
  customTokenPools: AllowlistCustomTokenPool[];
  setCustomTokenPools: (customTokenPools: AllowlistCustomTokenPool[]) => void;
  walletPools: AllowlistWalletPool[];
  setWalletPools: (walletPools: AllowlistWalletPool[]) => void;
  phases: AllowlistPhaseWithComponentAndItems[];
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
  });

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
    setRefreshKey(getRandomObjectId());
  };

  const getPhaseIdForComponent = (componentId: string) =>
    phases.find((phase) => phase.components.some((c) => c.id === componentId))
      ?.id ??
    optimisticComponents.find((c) => c.id === componentId)?.phaseId ??
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
                  getPhaseIdForComponent(operation.params.componentId) ?? "",
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
        transferPools: [...transferPools, ...optimisticTransferPools],
        setTransferPools,
        tokenPools: [...tokenPools, ...optimisticTokenPools],
        setTokenPools,
        customTokenPools: [...customTokenPools, ...optimisticCustomTokenPools],
        setCustomTokenPools,
        walletPools: [...walletPools, ...optimisticWalletPools],
        setWalletPools,
        phases: finalPhases,
        setPhases,
        setToasts,
      }}
    >
      {children}
      <ToastContainer />
    </AllowlistToolBuilderContext.Provider>
  );
}
