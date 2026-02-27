"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useId } from "react";
import { createPortal } from "react-dom";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { getClaimTxModalEmoji } from "@/components/drop-forge/launch/dropForgeLaunchClaimPageClient.helpers";
import { getTransactionLink } from "@/helpers/Helpers";
import type { Chain } from "viem";

type ClaimTransactionModalState = {
  status: "confirm_wallet" | "submitted" | "success" | "error";
  message?: string | undefined;
  txHash?: `0x${string}` | undefined;
  actionLabel?: string | undefined;
};

export default function ClaimTransactionModal({
  state,
  chain,
  onClose,
}: Readonly<{
  state: ClaimTransactionModalState | null;
  chain: Chain;
  onClose: () => void;
}>) {
  const titleId = useId();
  if (!state) return null;

  const closable = state.status === "success" || state.status === "error";
  const txUrl = state.txHash ? getTransactionLink(chain.id, state.txHash) : null;
  const modalTitle = state.actionLabel ?? "Onchain Action";

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="tw-fixed tw-inset-0 tw-z-[1100] tw-flex tw-items-center tw-justify-center tw-bg-gray-600 tw-bg-opacity-50 tw-px-4 tw-backdrop-blur-[1px]">
      {closable ? (
        <button
          type="button"
          aria-label="Close modal backdrop"
          tabIndex={-1}
          onClick={onClose}
          className="tw-absolute tw-inset-0 tw-border-0 tw-bg-transparent tw-p-0"
        />
      ) : (
        <div className="tw-absolute tw-inset-0" aria-hidden="true" />
      )}
      <dialog
        open
        aria-modal="true"
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          if (closable) {
            onClose();
          }
        }}
        className="tw-relative tw-z-[1] tw-w-full tw-max-w-md tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-6 tw-shadow-2xl"
      >
        <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-800 tw-pb-3">
          <h2
            id={titleId}
            className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-white"
          >
            {modalTitle}
          </h2>
          {closable ? (
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="tw--mt-0.5 tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-400"
            >
              <XMarkIcon className="tw-h-5 tw-w-5" />
            </button>
          ) : null}
        </div>

        <div className="tw-mt-4 tw-flex tw-min-h-[120px] tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-800 tw-p-3">
          {state.status === "error" ? (
            <div className="tw-w-full tw-min-w-0 tw-max-w-full tw-text-center">
              <p className="tw-mb-4 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg tw-font-medium tw-text-red">
                <span>Error</span>
                <img
                  src={getClaimTxModalEmoji("error")}
                  alt="error"
                  className="tw-h-6 tw-w-6"
                />
              </p>
              <div className="tw-mx-auto tw-max-h-40 tw-w-full tw-max-w-full tw-overflow-auto tw-pr-1">
                <p className="tw-mb-0 tw-whitespace-pre-wrap tw-break-words tw-text-iron-100">
                  {state.message || "Transaction failed"}
                </p>
              </div>
              {txUrl ? (
                <a
                  className="btn btn-white btn-sm tw-mt-3 tw-font-medium"
                  href={txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Tx
                </a>
              ) : null}
            </div>
          ) : null}

          {state.status === "confirm_wallet" ? (
            <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
              <img
                src={getClaimTxModalEmoji("confirm_wallet")}
                alt="confirm_wallet"
                className="tw-h-6 tw-w-6"
              />
              <p className="tw-mb-0 tw-text-lg tw-font-medium tw-text-iron-100">
                Confirm in your wallet
              </p>
              <CircleLoader size={CircleLoaderSize.LARGE} />
            </div>
          ) : null}

          {state.status === "submitted" ? (
            <div className="tw-text-center">
              <p className="tw-mb-4 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg tw-font-medium tw-text-iron-100">
                <img
                  src={getClaimTxModalEmoji("submitted")}
                  alt="submitted"
                  className="tw-h-6 tw-w-6"
                />
                Transaction Submitted
                {txUrl ? (
                  <a
                    className="btn btn-white btn-sm tw-font-medium"
                    href={txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Tx
                  </a>
                ) : null}
              </p>
              <p className="tw-mb-2 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-md tw-font-medium tw-text-iron-100">
                Waiting for confirmation <CircleLoader size={CircleLoaderSize.MEDIUM} />
              </p>
            </div>
          ) : null}

          {state.status === "success" ? (
            <div className="tw-text-center">
              <p className="tw-mb-0 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg tw-font-medium tw-text-green">
                <img
                  src={getClaimTxModalEmoji("success")}
                  alt="success"
                  className="tw-h-6 tw-w-6"
                />
                Transaction Successful!
                {txUrl ? (
                  <a
                    className="btn btn-white btn-sm tw-font-medium"
                    href={txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Tx
                  </a>
                ) : null}
              </p>
            </div>
          ) : null}
        </div>
      </dialog>
    </div>,
    document.body
  );
}
