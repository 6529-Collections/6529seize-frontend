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
}: CreateCustomSnapshotFormAddWalletsModalProps) {
  const totalWallets = tokens.length;
  const chunkCount =
    totalWallets > 0 && chunkSize > 0
      ? Math.ceil(totalWallets / chunkSize)
      : 0;
  const walletLabel = totalWallets === 1 ? "wallet" : "wallets";
  const snapshotLabel =
    chunkCount === 1 ? "custom snapshot" : "custom snapshots";

  return (
    <div className="tw-overflow-hidden tw-rounded-lg">
      <div className="tw-max-h-[calc(100vh_+_-100px)] tw-overflow-x-hidden tw-overflow-y-auto">
        <div className="tw-rounded-lg tw-p-6">
          <h2 className="tw-m-0 tw-max-w-sm tw-pr-12 tw-text-lg tw-font-medium tw-text-white">
            Add wallets
          </h2>
          <div className="tw-mt-2 tw-space-y-1">
            <p className="tw-text-xs tw-text-iron-300">
              Each custom snapshot supports up to {chunkSize.toLocaleString()}{" "}
              wallets. Larger lists are split automatically.
            </p>
            <p className="tw-text-xs tw-text-iron-300">
              You can add up to {maxRows.toLocaleString()} wallets in one batch.
            </p>
            {totalWallets > 0 && (
              <>
                <p className="tw-text-xs tw-text-iron-100">
                  Currently added {totalWallets.toLocaleString()} {walletLabel}.
                  This will create {chunkCount.toLocaleString()} {snapshotLabel}.
                </p>
                {totalWallets > maxRows && (
                  <p className="tw-text-xs tw-text-yellow-400">
                    Warning: Exceeds batch limit of {maxRows.toLocaleString()}{" "}
                    wallets.
                  </p>
                )}
              </>
            )}
          </div>
          <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-items-end">
            <div className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-items-end">
              <div className="tw-relative tw-min-w-0">
                <div className="tw-flex tw-items-center tw-justify-between">
                  <label
                    htmlFor="custom-snapshot-wallet-address"
                    className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100"
                  >
                    Wallet address.
                  </label>
                </div>
                <div className="tw-mt-1.5">
                  <input
                    id="custom-snapshot-wallet-address"
                    type="text"
                    name="owner"
                    autoComplete="off"
                    onChange={(e) => setManualWallet(e.target.value.trim())}
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
              <div>
                <button
                  onClick={addManualWallet}
                  type="button"
                  className="tw-w-full tw-cursor-pointer tw-rounded-lg tw-border-2 tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-w-auto desktop-hover:hover:tw-bg-iron-800/80"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="md:tw-pb-3">
              <CreateCustomSnapshotFormUpload
                fileName={fileName}
                setFileName={setFileName}
                setTokens={addUploadedTokens}
              />
            </div>
          </div>

          <div>
            <CreateCustomSnapshotFormTable
              tokens={tokens}
              onRemoveToken={onRemoveToken}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
