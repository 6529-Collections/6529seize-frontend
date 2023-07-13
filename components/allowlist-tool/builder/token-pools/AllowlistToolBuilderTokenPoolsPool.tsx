import { useContext } from "react";
import {
  AllowlistTokenPool,
  AllowlistToolEntity,
} from "../../allowlist-tool.types";
import AllowlistToolHistoryIcon from "../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../icons/AllowlistToolJsonIcon";
import AllowlistToolBuilderAddOperation from "../operations/AllowlistToolBuilderAddOperation";
import { AllowlistToolBuilderContext } from "../AllowlistToolBuilderContextWrapper";
import AllowlistTooBuilderOperationsHistory from "../operations/history/AllowlistTooBuilderOperationsHistory";

export default function AllowlistToolBuilderTokenPoolsPool({
  tokenPool,
}: {
  tokenPool: AllowlistTokenPool;
}) {
  return (
    <tr>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {tokenPool.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal  tw-text-neutral-300">

      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal  tw-text-neutral-300">
        {tokenPool.tokenIds ?? "All tokens"}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-right  tw-text-neutral-300">
        {tokenPool.walletsCount}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-right tw-text-neutral-300">
        {tokenPool.tokensCount}
      </td>
      <td className="tw-w-40 tw-py-4 tw-pl-6 tw-pr-4 tw-text-sm tw-font-normal sm:tw-pr-6">
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2.5">
          <button
            type="button"
            className="tw-group tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
          >
            <div className="tw-h-4 tw-w-4 tw-flex tw-items-center tw-justify-center">
              <AllowlistToolJsonIcon />
            </div>
          </button>
          <AllowlistToolBuilderAddOperation
            validOperations={[]}
            title={`Token pool "${tokenPool.name}"`}
            targetItemId={null}
            defaultOperation={null}
          />
          <AllowlistTooBuilderOperationsHistory
            entityType={AllowlistToolEntity.TOKEN_POOL}
            targetItemId={tokenPool.id}
          />
        </div>
      </td>
    </tr>
  );
}
