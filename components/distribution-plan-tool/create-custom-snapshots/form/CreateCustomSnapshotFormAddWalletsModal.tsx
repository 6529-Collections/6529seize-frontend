import CreateCustomSnapshotFormUpload from "./CreateCustomSnapshotFormUpload";
import { CustomTokenPoolParamsToken } from "../../../allowlist-tool/allowlist-tool.types";
import CreateCustomSnapshotFormTable from "./CreateCustomSnapshotFormTable";

export default function CreateCustomSnapshotFormAddWalletsModal({
  fileName,
  setFileName,
  tokens,
  addUploadedTokens,

  setManualWallet,
  addManualWallet,
  onRemoveToken,
  onClose,
}: {
  fileName: string | null;
  setFileName: (fileName: string | null) => void;
  tokens: CustomTokenPoolParamsToken[];
  addUploadedTokens: (tokens: CustomTokenPoolParamsToken[]) => void;
  setManualWallet: (manualWallet: string | null) => void;
  addManualWallet: () => void;
  onRemoveToken: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="tw-rounded-lg tw-overflow-hidden">
      <div className="tw-max-h-[calc(100vh_+_-100px)] tw-overflow-y-auto tw-overflow-x-hidden">
        <div className="tw-p-6 tw-rounded-lg">
          <p className="tw-max-w-sm tw-text-lg tw-text-white tw-font-medium tw-mb-0">
            Add wallets
          </p>
          <div className="tw-mt-6 tw-flex tw-gap-x-4">
            <div className="tw-flex tw-justify-between tw-w-full tw-gap-x-4">
              <div className="tw-flex tw-gap-x-4">
                <div className="tw-w-80 tw-relative">
                  <div className="tw-flex tw-justify-between tw-items-center">
                    <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                      Wallet address.
                    </label>
                  </div>
                  <div className="tw-mt-1.5">
                    <input
                      type="text"
                      name="owner"
                      autoComplete="off"
                      onChange={(e) => setManualWallet(e.target.value ?? "")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                      className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-3 tw-pr-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40
              hover:tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                    />
                  </div>
                </div>
                <div className="tw-self-end">
                  <button
                    onClick={addManualWallet}
                    type="button"
                    className="tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="tw-mt-10">
                <CreateCustomSnapshotFormUpload
                  fileName={fileName}
                  setFileName={setFileName}
                  setTokens={addUploadedTokens}
                />
              </div>
            </div>
          </div>

          <div>
            <CreateCustomSnapshotFormTable
              tokens={tokens}
              onRemoveToken={onRemoveToken}
            />
          </div>

          <div className="tw-mt-8 tw-flex tw-justify-end">
            <button
              onClick={onClose}
              type="button"
              className="tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
