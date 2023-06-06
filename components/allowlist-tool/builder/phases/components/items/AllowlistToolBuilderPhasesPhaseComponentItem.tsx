import { useContext, useState } from "react";
import {
  AllowlistPhaseComponentItem,
  Pool,
} from "../../../../allowlist-tool.types";
import AllowlistToolHistoryIcon from "../../../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../../../icons/AllowlistToolJsonIcon";
import AllowlistToolPlusIcon from "../../../../icons/AllowlistToolPlusIcon";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import AllowlistToolModelWrapper from "../../../../common/AllowlistToolModelWrapper";
import AllowlistToolBuilderAddItemOperationModal from "../../../operations/add-modal/item/AllowlistToolBuilderAddItemOperationModal";



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
      (pool) => pool.tokenPoolId === phaseComponentItem.poolId
    );
  } else if (phaseComponentItem.poolType === Pool.CUSTOM_TOKEN_POOL) {
    tokenPool = customTokenPools.find(
      (pool) => pool.customTokenPoolId === phaseComponentItem.poolId
    );
  }

  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <tr>
        <td className="tw-whitespace-nowrap tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-font-normal tw-text-neutral-400 sm:tw-pl-24">
          {phaseComponentItem.name}
        </td>
        <td className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-400">
          {phaseComponentItem.description}
        </td>
        <td className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-400">
          {tokenPool?.name}
        </td>
        <td className="tw-w-40 tw-py-2 tw-pl-6 tw-pr-4 tw-text-sm tw-font-normal sm:tw-pr-6">
          <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
            <button
              type="button"
              className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
            >
              <div className="tw-h-[1.125rem] tw-w-[1.125rem]">
                <AllowlistToolJsonIcon />
              </div>
            </button>
            <button
              onClick={() => setShowModal(true)}
              type="button"
              className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
            >
              <div className="tw-h-5 tw-w-5">
                <AllowlistToolPlusIcon />
              </div>
            </button>

            <button
              type="button"
              className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
            >
              <div className="tw-h-5 tw-w-5">
                <AllowlistToolHistoryIcon />
              </div>
            </button>
          </div>
          <AllowlistToolModelWrapper
            showModal={showModal}
            onClose={() => setShowModal(false)}
            title={`Add operation for item "${phaseComponentItem.name}"`}
          >
            <AllowlistToolBuilderAddItemOperationModal
              itemId={phaseComponentItem.phaseComponentItemId}
              onClose={() => setShowModal(false)}
            />
          </AllowlistToolModelWrapper>
        </td>
      </tr>
    </>
  );
}
