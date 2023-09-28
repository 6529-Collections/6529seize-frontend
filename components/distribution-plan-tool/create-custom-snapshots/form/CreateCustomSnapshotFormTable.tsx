import { CustomTokenPoolParamsToken } from "../../../allowlist-tool/allowlist-tool.types";
import CreateCustomSnapshotFormTableItem from "./CreateCustomSnapshotFormTableItem";

export default function CreateCustomSnapshotFormTable({
  tokens,
  onRemoveToken
}: {
  tokens: CustomTokenPoolParamsToken[];
  onRemoveToken: (index: number) => void;
}) {
  return (
    <div className="tw-mt-6 tw-flow-root">
      <div className="-tw-mx-4 -tw-my-2 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
        <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle sm:tw-px-6 lg:tw-px-8">
          <div className="tw-overflow-hidden tw-shadow tw-ring-1 tw-ring-black tw-ring-opacity-5 sm:tw-rounded-lg">
            <table className="tw-min-w-full tw-divide-y tw-divide-solid tw-divide-neutral-700">
              <tbody className="tw-divide-y tw-divide-solid tw-divide-neutral-700/40 tw-bg-neutral-800">
                {tokens.map((token, i) => (
                  <CreateCustomSnapshotFormTableItem
                    key={`create-custom-snapshot-form-table-token-${i}`}
                    token={token}
                    index={i}
                    onRemoveToken={onRemoveToken}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
