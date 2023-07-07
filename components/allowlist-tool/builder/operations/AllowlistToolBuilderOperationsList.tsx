import { useContext, useEffect, useState } from "react";
import {
  AllowlistCustomTokenPool,
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistPhase,
  AllowlistPhaseComponent,
  AllowlistPhaseComponentItem,
  AllowlistPhaseWithComponentAndItems,
  AllowlistTokenPool,
  AllowlistTransferPool,
  Pool,
} from "../../allowlist-tool.types";
import AllowlistToolBuilderOperationsListitem from "./AllowlistToolBuilderOperationsListitem";
import {
  assertUnreachable,
  getRandomObjectId,
  truncateTextMiddle,
} from "../../../../helpers/AllowlistToolHelpers";
import AllowlistToolAnimationWrapper from "../../common/animation/AllowlistToolAnimationWrapper";
import AllowlistToolAnimationHeightOpacity from "../../common/animation/AllowlistToolAnimationHeightOpacity";
import { AllowlistToolBuilderContext } from "../AllowlistToolBuilderContextWrapper";

export interface AllowlistToolBuilderOperationMeta {
  readonly id: string;
  readonly code: AllowlistOperationCode;
  readonly title: string;
  readonly params: { title: string; description: string }[];
  readonly run: boolean;
}

export default function AllowlistToolBuilderOperationsList({
  operations,
  uniqueKey,
}: {
  operations: AllowlistOperation[];
  uniqueKey: string;
}) {
  const randomKey = getRandomObjectId();
  const {
    operationDescriptions,
    transferPools,
    phases,
    tokenPools,
    customTokenPools,
  } = useContext(AllowlistToolBuilderContext);
  const [operationsWithMeta, setOperationsWithMeta] = useState<
    AllowlistToolBuilderOperationMeta[]
  >([]);

  useEffect(() => {
    const getTransferPool = (id: string): AllowlistTransferPool | null => {
      return transferPools.find((pool) => pool.id === id) || null;
    };

    const getPhase = (id: string): AllowlistPhase | null => {
      return phases.find((phase) => phase.id === id) || null;
    };

    const getPhaseForComponent = (
      id: string
    ): AllowlistPhaseWithComponentAndItems | null => {
      return (
        phases.find((phase) =>
          phase.components.find((component) => component.id === id)
        ) || null
      );
    };

    const getComponent = (id: string): AllowlistPhaseComponent | null => {
      const phase = getPhaseForComponent(id);
      return phase?.components.find((component) => component.id === id) ?? null;
    };

    const getItem = (id: string): AllowlistPhaseComponentItem | null => {
      const items = phases.flatMap((phase) =>
        phase.components.flatMap((component) => component.items)
      );
      return items.find((item) => item.id === id) ?? null;
    };

    const getPhaseForComponentItem = (
      itemId: string
    ): AllowlistPhaseWithComponentAndItems | null => {
      const item = getItem(itemId);
      return item
        ? phases.find((phase) => phase.id === item.phaseId) ?? null
        : null;
    };

    const getComponentForItem = (
      itemId: string
    ): AllowlistPhaseComponent | null => {
      const item = getItem(itemId);
      return item ? getComponent(item.phaseComponentId) : null;
    };

    const getTokenPool = (
      poolId: string,
      poolType: Pool
    ): AllowlistTokenPool | AllowlistCustomTokenPool | null => {
      switch (poolType) {
        case Pool.TOKEN_POOL:
          return tokenPools.find((pool) => pool.id === poolId) ?? null;
        case Pool.CUSTOM_TOKEN_POOL:
          return customTokenPools.find((pool) => pool.id === poolId) ?? null;
        case Pool.WALLET_POOL:
          return null;
        default:
          assertUnreachable(poolType);
          return null;
      }
    };

    const mapPoolToString = (pool: Pool): string => {
      switch (pool) {
        case Pool.TOKEN_POOL:
          return "Token Pool";
        case Pool.CUSTOM_TOKEN_POOL:
          return "Custom Token Pool";
        case Pool.WALLET_POOL:
          return "Wallet Pool";
        default:
          assertUnreachable(pool);
          return "";
      }
    };

    const getOperationParams = (
      operation: AllowlistOperation
    ): { title: string; description: string }[] => {
      switch (operation.code) {
        case AllowlistOperationCode.CREATE_ALLOWLIST:
          return [];
        case AllowlistOperationCode.GET_COLLECTION_TRANSFERS:
          return [
            {
              title: "Name",
              description: operation.params.name,
            },
            {
              title: "Description",
              description: operation.params.description,
            },
            {
              title: "Contract",
              description: truncateTextMiddle(operation.params.contract, 11),
            },
            {
              title: "blockNo",
              description: operation.params.blockNo,
            },
          ];
        case AllowlistOperationCode.CREATE_TOKEN_POOL:
          return [
            {
              title: "Name",
              description: operation.params.name,
            },
            {
              title: "Description",
              description: operation.params.description,
            },
            {
              title: "Transfer pool",
              description:
                getTransferPool(operation.params.transferPoolId)?.name ?? "",
            },
            {
              title: "Token IDs",
              description: operation.params.tokenIds ?? "All",
            },
          ];
        case AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL:
          return [
            {
              title: "Name",
              description: operation.params.name,
            },
            {
              title: "Description",
              description: operation.params.description,
            },
            {
              title: "Tokens",
              description: operation.params.tokens.length,
            },
          ];
        case AllowlistOperationCode.CREATE_WALLET_POOL:
          return [
            {
              title: "Name",
              description: operation.params.name,
            },
            {
              title: "Description",
              description: operation.params.description,
            },
            {
              title: "Wallets",
              description: operation.params.wallets.length,
            },
          ];
        case AllowlistOperationCode.ADD_PHASE:
          return [
            {
              title: "Name",
              description: operation.params.name,
            },
            {
              title: "Description",
              description: operation.params.description,
            },
          ];
        case AllowlistOperationCode.ADD_COMPONENT:
          return [
            {
              title: "Name",
              description: operation.params.name,
            },
            {
              title: "Description",
              description: operation.params.description,
            },
            {
              title: "Phase",
              description: getPhase(operation.params.phaseId)?.name ?? "",
            },
          ];
        case AllowlistOperationCode.ADD_ITEM:
          return [
            {
              title: "Name",
              description: operation.params.name,
            },
            {
              title: "Description",
              description: operation.params.description,
            },
            {
              title: "Phase",
              description:
                getPhaseForComponent(operation.params.componentId)?.name ?? "",
            },
            {
              title: "Component",
              description:
                getComponent(operation.params.componentId)?.name ?? "",
            },
            {
              title: "Pool type",
              description: mapPoolToString(operation.params.poolType),
            },
            {
              title: "Token pool",
              description:
                getTokenPool(operation.params.poolId, operation.params.poolType)
                  ?.name ?? "",
            },
          ];
        case AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS:
          return [
            {
              title: "Phase",
              description:
                getPhaseForComponent(operation.params.componentId)?.name ?? "",
            },
            {
              title: "Component",
              description:
                getComponent(operation.params.componentId)?.name ?? "",
            },
            {
              title: "Spots",
              description: operation.params.spots,
            },
          ];
        case AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_WALLETS_EXCLUDING_CERTAIN_COMPONENTS:
          return [
            {
              title: "Phase",
              description:
                getPhaseForComponent(operation.params.componentId)?.name ?? "",
            },
            {
              title: "Component",
              description:
                getComponent(operation.params.componentId)?.name ?? "",
            },
            {
              title: "Spots",
              description: operation.params.spots,
            },
          ];
        case AllowlistOperationCode.ITEM_EXCLUE_TOKEN_IDS:
          return [
            {
              title: "Phase",
              description:
                getPhaseForComponentItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Component",
              description:
                getComponentForItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Item",
              description: getItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Token IDs",
              description: operation.params.tokenIds,
            },
          ];
        case AllowlistOperationCode.ITEM_SELECT_TOKEN_IDS:
          return [
            {
              title: "Phase",
              description:
                getPhaseForComponentItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Component",
              description:
                getComponentForItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Item",
              description: getItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Token IDs",
              description: operation.params.tokenIds,
            },
          ];
        case AllowlistOperationCode.ITEM_REMOVE_FIRST_N_TOKENS:
          return [
            {
              title: "Phase",
              description:
                getPhaseForComponentItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Component",
              description:
                getComponentForItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Item",
              description: getItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Count",
              description: operation.params.count,
            },
          ];
        case AllowlistOperationCode.ITEM_REMOVE_LAST_N_TOKENS:
          return [
            {
              title: "Phase",
              description:
                getPhaseForComponentItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Component",
              description:
                getComponentForItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Item",
              description: getItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Count",
              description: operation.params.count,
            },
          ];
        case AllowlistOperationCode.ITEM_SELECT_FIRST_N_TOKENS:
          return [
            {
              title: "Phase",
              description:
                getPhaseForComponentItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Component",
              description:
                getComponentForItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Item",
              description: getItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Count",
              description: operation.params.count,
            },
          ];
        case AllowlistOperationCode.ITEM_SELECT_LAST_N_TOKENS:
          return [
            {
              title: "Phase",
              description:
                getPhaseForComponentItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Component",
              description:
                getComponentForItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Item",
              description: getItem(operation.params.itemId)?.name ?? "",
            },
            {
              title: "Count",
              description: operation.params.count,
            },
          ];
        case AllowlistOperationCode.ITEM_REMOVE_WALLETS_FROM_CERTAIN_COMPONENTS:
        case AllowlistOperationCode.ITEM_SORT_WALLETS_BY_TOTAL_TOKENS_COUNT:
        case AllowlistOperationCode.ITEM_SORT_WALLETS_BY_UNIQUE_TOKENS_COUNT:
        case AllowlistOperationCode.ITEM_REMOVE_FIRST_N_WALLETS:
        case AllowlistOperationCode.ITEM_SELECT_FIRST_N_WALLETS:
          return [];
        default:
          assertUnreachable(operation.code);
          return [];
      }
    };

    const reversedClone = (array: any[]) => {
      const clone = [...array];
      clone.reverse();
      return clone;
    };

    setOperationsWithMeta(
      reversedClone(operations).map((operation: AllowlistOperation) => {
        const operationDescription = operationDescriptions.find(
          (o) => o.code === operation.code
        );
        return {
          id: operation.id,
          code: operation.code,
          title: operationDescription?.title || operation.code,
          params: getOperationParams(operation),
          run: operation.hasRan,
        };
      })
    );
  }, [
    operationDescriptions,
    operations,
    phases,
    transferPools,
    tokenPools,
    customTokenPools,
  ]);
  return (
    <ul
      role="list"
      className="tw-mt-4 tw-ml-0 tw-pl-0 tw-list-none tw-flex tw-flex-1 tw-flex-col tw-gap-y-4"
    >
      <AllowlistToolAnimationWrapper initial={true}>
        {operationsWithMeta.map((operation) => (
          <AllowlistToolAnimationHeightOpacity
            key={`${uniqueKey}-${operation.id}`}
          >
            <AllowlistToolBuilderOperationsListitem operation={operation} />
          </AllowlistToolAnimationHeightOpacity>
        ))}
      </AllowlistToolAnimationWrapper>
    </ul>
  );
}
