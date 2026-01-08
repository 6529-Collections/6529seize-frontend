import type { CustomTokenPoolParamsToken } from "@/components/allowlist-tool/allowlist-tool.types";
import CreateCustomSnapshotFormTable from "./CreateCustomSnapshotFormTable";
import CreateCustomSnapshotFormUpload from "./CreateCustomSnapshotFormUpload";

interface CreateCustomSnapshotFormAddWalletsModalProps {
  readonly fileName: string | null;
  readonly setFileName: (fileName: string | null) => void;
  readonly tokens: CustomTokenPoolParamsToken[];
  readonly addUploadedTokens: (
    tokens: CustomTokenPoolParamsToken[],
  ) => boolean;
  readonly chunkSize: number;
  readonly maxRows: number;
  readonly setManualWallet: (manualWallet: string | null) => void;
  readonly addManualWallet: () => void;
  readonly onRemoveToken: (index: number) => void;
  readonly onClose: () => void;
}

export default function CreateCustomSnapshotFormAddWalletsModal({
  fileName,
  setFileName,
  tokens,
  addUploadedTokens,

  chunkSize,
  maxRows,
  setManualWallet,
  addManualWallet,
  onRemoveToken,
  onClose,
}: CreateCustomSnapshotFormAddWalletsModalProps) {
  const totalWallets = tokens.length;
  const chunkCount =
    totalWallets > 0 && chunkSize > 0
      ? Math.ceil(totalWallets / chunkSize)
      : 0;
  const walletLabel = totalWallets === 1 ? "wallet" : "wallets";
  const snapshotLabel = chunkCount === 1 ? "custom snapshot" : "custom snapshots";

  return (
    <div className="tw-rounded-lg tw-overflow-hidden">
      <div className="tw-max-h-[calc(100vh_+_-100px)] tw-overflow-y-auto tw-overflow-x-hidden">
        <div className="tw-p-6 tw-rounded-lg">
          <p className="tw-max-w-sm tw-text-lg tw-text-white tw-font-medium tw-mb-0">
            Add wallets
          </p>
          <div className="tw-mt-2 tw-space-y-1">
            <p className="tw-text-xs tw-text-iron-300">
              Each custom snapshot supports up to {chunkSize.toLocaleString()} wallets. Larger lists are split automatically.
            </p>
            <p className="tw-text-xs tw-text-iron-300">
              You can add up to {maxRows.toLocaleString()} wallets in one batch.
            </p>
            {totalWallets > 0 && (
              <>
                <p className="tw-text-xs tw-text-iron-100">
                  Currently added {totalWallets.toLocaleString()} {walletLabel}. This will create {chunkCount.toLocaleString()} {snapshotLabel}.
                </p>
                {totalWallets > maxRows && (
                  <p className="tw-text-xs tw-text-yellow-400">
                    Warning: Exceeds batch limit of {maxRows.toLocaleString()} wallets.
                  </p>
                )}
              </>
            )}
          </div>
          <div className="tw-mt-6 tw-flex tw-gap-x-4">
            <div className="tw-flex tw-justify-between tw-w-full tw-gap-x-4">
              <div className="tw-flex tw-gap-x-4">
                <div className="tw-w-80 tw-relative">
                  <div className="tw-flex tw-justify-between tw-items-center">
                    <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100">
                      Wallet address.
                    </label>
                  </div>
                  <div className="tw-mt-1.5">
                    <input
                      type="text"
                      name="owner"
                      autoComplete="off"
                      onChange={(e) =>
                        setManualWallet((e.target.value ?? "").trim())
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                      className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-3 tw-pr-3 tw-bg-iron-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40
              hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                    />
                  </div>
                </div>
                <div className="tw-self-end">
                  <button
                    onClick={addManualWallet}
                    type="button"
                    className="tw-cursor-pointer tw-bg-transparent hover:tw-bg-iron-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-iron-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
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
