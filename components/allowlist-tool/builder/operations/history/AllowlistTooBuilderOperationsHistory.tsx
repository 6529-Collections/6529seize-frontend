import { useContext, useEffect, useState } from "react";
import {
  AllowlistOperation,
  AllowlistToolEntity,
} from "../../../allowlist-tool.types";
import AllowlistToolHistoryIcon from "../../../icons/AllowlistToolHistoryIcon";
import { AllowlistToolBuilderContext } from "../../AllowlistToolBuilderContextWrapper";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";

const ENTITY_TYPE_TO_TITLE: Record<AllowlistToolEntity, string> = {
  [AllowlistToolEntity.TRANSFER_POOLS]: "Transfer Pools",
  [AllowlistToolEntity.TRANSFER_POOL]: "Transfer Pool",
  [AllowlistToolEntity.TOKEN_POOLS]: "Token Pools",
  [AllowlistToolEntity.TOKEN_POOL]: "Token Pool",
  [AllowlistToolEntity.CUSTOM_TOKEN_POOLS]: "Custom Token Pools",
  [AllowlistToolEntity.CUSTOM_TOKEN_POOL]: "Custom Token Pool",
  [AllowlistToolEntity.WALLET_POOLS]: "Wallet Pools",
  [AllowlistToolEntity.WALLET_POOL]: "Wallet Pool",
  [AllowlistToolEntity.PHASES]: "Phases",
  [AllowlistToolEntity.PHASE]: "Phase",
  [AllowlistToolEntity.COMPONENT]: "Component",
  [AllowlistToolEntity.ITEM]: "Item",
};

export default function AllowlistTooBuilderOperationsHistory({
  entityType,
  targetItemId,
}: {
  entityType: AllowlistToolEntity;
  targetItemId: string | null;
}) {
  const [subTitle, setSubTitle] = useState<string | null>(null);

  const {
    setActiveHistory,
    operationsGrouped,
    transferPools,
    tokenPools,
    customTokenPools,
    walletPools,
    phases,
  } = useContext(AllowlistToolBuilderContext);

  const [targetOperations, setTargetOperations] = useState<
    AllowlistOperation[]
  >([]);

  useEffect(() => {
    const getPhaseIdForComponent = (componentId: string) =>
      phases.find((phase) => phase.components.find((c) => c.id === componentId))
        ?.id ?? null;

    const getComponentIdForItem = (itemId: string) => {
      const component = phases
        .flatMap((phase) => phase.components)
        .find((component) =>
          component.items.find((item) => item.id === itemId)
        );
      return component?.id ?? null;
    };
    switch (entityType) {
      case AllowlistToolEntity.TRANSFER_POOLS:
        setTargetOperations(operationsGrouped?.transferPools?.operations ?? []);
        setSubTitle(null);
        break;
      case AllowlistToolEntity.TRANSFER_POOL:
        if (!targetItemId) break;
        setTargetOperations(
          operationsGrouped?.transferPools?.pools[targetItemId] ?? []
        );
        setSubTitle(
          transferPools.find((transferPool) => transferPool.id === targetItemId)
            ?.name ?? null
        );
        break;
      case AllowlistToolEntity.TOKEN_POOLS:
        setTargetOperations(operationsGrouped?.tokenPools?.operations ?? []);
        setSubTitle(null);
        break;
      case AllowlistToolEntity.TOKEN_POOL:
        if (!targetItemId) break;
        setTargetOperations(
          operationsGrouped?.tokenPools?.pools[targetItemId] ?? []
        );
        setSubTitle(
          tokenPools.find((tokenPool) => tokenPool.id === targetItemId)?.name ??
            null
        );
        break;
      case AllowlistToolEntity.CUSTOM_TOKEN_POOLS:
        setTargetOperations(
          operationsGrouped?.customTokenPools?.operations ?? []
        );
        setSubTitle(null);
        break;
      case AllowlistToolEntity.CUSTOM_TOKEN_POOL:
        if (!targetItemId) break;
        setTargetOperations(
          operationsGrouped?.customTokenPools?.pools[targetItemId] ?? []
        );
        setSubTitle(
          customTokenPools.find(
            (customTokenPool) => customTokenPool.id === targetItemId
          )?.name ?? null
        );
        break;
      case AllowlistToolEntity.WALLET_POOLS:
        setTargetOperations(operationsGrouped?.walletPools?.operations ?? []);
        setSubTitle(null);
        break;
      case AllowlistToolEntity.WALLET_POOL:
        if (!targetItemId) break;
        setTargetOperations(
          operationsGrouped?.walletPools?.pools[targetItemId] ?? []
        );
        setSubTitle(
          walletPools.find((walletPool) => walletPool.id === targetItemId)
            ?.name ?? null
        );
        break;
      case AllowlistToolEntity.PHASES:
        setTargetOperations(operationsGrouped?.phases?.operations ?? []);
        setSubTitle(null);
        break;
      case AllowlistToolEntity.PHASE:
        if (!targetItemId) break;
        setTargetOperations(
          operationsGrouped?.phases?.phases[targetItemId]?.operations ?? []
        );
        setSubTitle(
          phases.find((phase) => phase.id === targetItemId)?.name ?? null
        );
        break;
      case AllowlistToolEntity.COMPONENT:
        if (!targetItemId) break;
        const phaseId = getPhaseIdForComponent(targetItemId);
        if (!phaseId) break;
        setTargetOperations(
          operationsGrouped?.phases?.phases[phaseId]?.components[targetItemId]
            ?.operations ?? []
        );
        const component = phases
          .find((phase) => phase.id === phaseId)
          ?.components.find((component) => component.id === targetItemId);
        setSubTitle(component?.name ?? null);

        break;
      case AllowlistToolEntity.ITEM:
        if (!targetItemId) break;
        const componentId = getComponentIdForItem(targetItemId);
        if (!componentId) break;
        const phaseId2 = getPhaseIdForComponent(componentId);
        if (!phaseId2) break;
        setTargetOperations(
          operationsGrouped?.phases?.phases[phaseId2]?.components[componentId]
            ?.items[targetItemId] ?? []
        );
        const item = phases
          .find((phase) => phase.id === phaseId2)
          ?.components.find((component) => component.id === componentId)
          ?.items.find((item) => item.id === targetItemId);
        setSubTitle(item?.name ?? null);
        break;
      default:
        assertUnreachable(entityType);
    }
  }, [
    operationsGrouped,
    entityType,
    targetItemId,
    transferPools,
    customTokenPools,
    tokenPools,
    walletPools,
    phases,
  ]);

  return (
    <div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActiveHistory({
            operations: targetOperations,
            title: ENTITY_TYPE_TO_TITLE[entityType],
            subTitle: subTitle,
          });
        }}
        type="button"
        className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-w-8 tw-h-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
      >
        <div className="tw-h-[1.125rem] tw-w-[1.125rem] tw-flex tw-items-center tw-justify-center">
          <AllowlistToolHistoryIcon />
        </div>
      </button>
    </div>
  );
}
