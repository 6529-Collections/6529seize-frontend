import { useContext } from "react";
import { AllowlistTokenPool } from "../../allowlist-tool.types";
import AllowlistToolHistoryIcon from "../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../icons/AllowlistToolJsonIcon";
import AllowlistToolPlusIcon from "../../icons/AllowlistToolPlusIcon";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import AllowlistToolBuilderAddOperation from "../operations/AllowlistToolBuilderAddOperation";

export default function AllowlistToolBuilderTokenPoolsPool({
  tokenPool,
}: {
  tokenPool: AllowlistTokenPool;
}) {
  const { transferPools } = useContext(AllowlistToolBuilderContext);

  const transferPool = transferPools.find(
    (pool) => pool.transferPoolId === tokenPool.transferPoolId
  );
  return (
    <tr>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {tokenPool.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {tokenPool.description}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal  tw-text-neutral-300">
        {transferPool?.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal  tw-text-neutral-300">
        {tokenPool.tokenIds}
      </td>
      <td className="tw-w-40 tw-py-4 tw-pl-6 tw-pr-4 tw-text-sm tw-font-normal sm:tw-pr-6">
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
          <button
            type="button"
            className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-800 tw-transition-all tw-duration-300 tw-ease-out"
          >
            <div className="tw-h-[1.125rem] tw-w-[1.125rem]">
              <AllowlistToolJsonIcon />
            </div>
          </button>
          <AllowlistToolBuilderAddOperation
            validOperations={[]}
            title={`Add operation for token pool "${tokenPool.name}"`}
            targetItemId={null}
            defaultOperation={null}
          />
          <button
            type="button"
            className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-800 tw-transition-all tw-duration-300 tw-ease-out"
          >
            <div className="tw-h-5 tw-w-5">
              <AllowlistToolHistoryIcon />
            </div>
          </button>
        </div>
      </td>
    </tr>
  );
}
