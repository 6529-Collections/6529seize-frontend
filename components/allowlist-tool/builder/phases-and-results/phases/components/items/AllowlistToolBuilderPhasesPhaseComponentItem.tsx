import { useContext, useState } from "react";
import {
  AllowlistOperationCode,
  AllowlistPhaseComponentItem,
  AllowlistToolEntity,
  Pool,
} from "../../../../../allowlist-tool.types";
import AllowlistToolHistoryIcon from "../../../../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../../../../icons/AllowlistToolJsonIcon";

import AllowlistToolBuilderAddOperation from "../../../../operations/AllowlistToolBuilderAddOperation";
import { AllowlistToolBuilderContext } from "../../../../AllowlistToolBuilderContextWrapper";
import AllowlistTooBuilderOperationsHistory from "../../../../operations/history/AllowlistTooBuilderOperationsHistory";

export default function AllowlistToolBuilderPhasesPhaseComponentItem({
  phaseComponentItem,
}: {
  phaseComponentItem: AllowlistPhaseComponentItem;
}) {
  const { tokenPools, customTokenPools } = useContext(
    AllowlistToolBuilderContext
  );
  let tokenPool;

  if (phaseComponentItem.poolType === Pool.TOKEN_POOL) {
    tokenPool = tokenPools.find(
      (pool) => pool.id === phaseComponentItem.poolId
    );
  } else if (phaseComponentItem.poolType === Pool.CUSTOM_TOKEN_POOL) {
    tokenPool = customTokenPools.find(
      (pool) => pool.id === phaseComponentItem.poolId
    );
  }

  const validOperations: AllowlistOperationCode[] = [
    AllowlistOperationCode.ITEM_EXCLUE_TOKEN_IDS,
    AllowlistOperationCode.ITEM_SELECT_TOKEN_IDS,
    AllowlistOperationCode.ITEM_REMOVE_FIRST_N_TOKENS,
    AllowlistOperationCode.ITEM_REMOVE_LAST_N_TOKENS,
    AllowlistOperationCode.ITEM_SELECT_FIRST_N_TOKENS,
    AllowlistOperationCode.ITEM_SELECT_LAST_N_TOKENS,
  ];
  return (
    <>
      <div className="tw-grid tw-grid-cols-12 tw-items-center tw-gap-x-4">
        <div className="tw-col-span-2">
          <div className="tw-whitespace-nowrap tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-font-normal tw-text-neutral-400 sm:tw-pl-[5.25rem]">
            {phaseComponentItem.name}
          </div>
        </div>
        <div className="tw-col-span-2">
          <div className="tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-400">
            {phaseComponentItem.description}
          </div>
        </div>
        <div className="tw-col-span-2">
          <div className="tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-400">
            {tokenPool?.name}
          </div>
        </div>
        <div className="tw-col-span-2 tw-px-3 tw-py-2">
          <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
            {phaseComponentItem.walletsCount}
          </div>
        </div>
        <div className="tw-col-span-2 tw-px-3 tw-py-2">
          <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
            {phaseComponentItem.tokensCount}
          </div>
        </div>
        <div className="tw-col-span-2">
          <div className="tw-py-2 tw-pl-6 tw-pr-4 tw-text-sm tw-font-normal sm:tw-pr-6">
            <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
              <button
                type="button"
                className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
              >
                <div className="tw-h-4 tw-w-4 tw-flex tw-justify-center tw-items-center">
                  <AllowlistToolJsonIcon />
                </div>
              </button>

              <AllowlistToolBuilderAddOperation
                validOperations={validOperations}
                title={`Item "${phaseComponentItem.name}"`}
                targetItemId={phaseComponentItem.id}
                defaultOperation={null}
              />

              <AllowlistTooBuilderOperationsHistory
                entityType={AllowlistToolEntity.ITEM}
                targetItemId={phaseComponentItem.id}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
