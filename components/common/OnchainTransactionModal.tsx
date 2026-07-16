"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { Chain } from "viem";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { getTransactionLink } from "@/helpers/Helpers";
import { trapTabFocus } from "@/components/utils/modal/focusTrap";

export type OnchainTransactionModalStatus =
  | "confirm_wallet"
  | "submitted"
  | "success"
  | "error";

interface OnchainTransactionModalProps {
  readonly status: OnchainTransactionModalStatus;
  readonly title: string;
  readonly subtitle?: ReactNode | undefined;
  readonly message?: string | undefined;
  readonly transactionHash?: string | undefined;
  readonly transactionLink?: string | undefined;
  readonly chain?: Pick<Chain, "id"> | undefined;
  readonly onClose: () => void;
}

const STATUS_EMOJI: Record<OnchainTransactionModalStatus, string> = {
  confirm_wallet: "/emojis/sgt_flushed.webp",
  submitted: "/emojis/sgt_flushed.webp",
  success: "/emojis/sgt_saluting_face.webp",
  error: "/emojis/sgt_sob.webp",
};

const DEFAULT_STATUS_MESSAGE: Record<OnchainTransactionModalStatus, string> = {
  confirm_wallet: "Confirm in your wallet",
  submitted: "Transaction Submitted",
  success: "Transaction Successful!",
  error: "Transaction failed",
};

const TRANSACTION_LINK_CLASS_NAME =
  "tw-inline-flex tw-flex-none tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-white tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-black tw-no-underline tw-transition hover:tw-bg-[#d7d7d7] focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

function StatusEmoji({
  status,
}: Readonly<{ status: OnchainTransactionModalStatus }>) {
  return (
    <Image
      unoptimized
      src={STATUS_EMOJI[status]}
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      className="tw-block tw-size-6 tw-flex-none tw-object-contain"
    />
  );
}

function TransactionLink({ href }: Readonly<{ href: string | null }>) {
  if (!href) {
    return null;
  }

  return (
    <a
      className={TRANSACTION_LINK_CLASS_NAME}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      View Tx
    </a>
  );
}

function ModalStatusContent({
  status,
  message,
  transactionUrl,
}: Readonly<{
  status: OnchainTransactionModalStatus;
  message?: string | undefined;
  transactionUrl: string | null;
}>) {
  if (status === "error") {
    return (
      <div className="tw-w-full tw-min-w-0 tw-max-w-full tw-text-center">
        <p className="tw-m-0 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg tw-font-medium tw-text-red">
          <span>Error</span>
          <StatusEmoji status={status} />
        </p>
        <div className="tw-mx-auto tw-mt-4 tw-max-h-40 tw-w-full tw-max-w-full tw-overflow-y-auto tw-pr-1">
          <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-iron-100 [overflow-wrap:anywhere]">
            {message ?? DEFAULT_STATUS_MESSAGE.error}
          </p>
        </div>
        {transactionUrl ? (
          <div className="tw-mt-3">
            <TransactionLink href={transactionUrl} />
          </div>
        ) : null}
      </div>
    );
  }

  const statusMessage = message ?? DEFAULT_STATUS_MESSAGE[status];

  if (status === "submitted") {
    return (
      <div className="tw-text-center">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-2">
          <StatusEmoji status={status} />
          <p className="tw-m-0 tw-text-lg tw-font-medium tw-text-iron-100">
            {statusMessage}
          </p>
          <TransactionLink href={transactionUrl} />
        </div>
        <div className="tw-mt-4 tw-flex tw-items-center tw-justify-center tw-gap-2">
          <p className="tw-m-0 tw-text-md tw-font-medium tw-text-iron-100">
            Waiting for confirmation
          </p>
          <CircleLoader size={CircleLoaderSize.MEDIUM} />
        </div>
      </div>
    );
  }

  const statusTextColor =
    status === "success" ? "tw-text-green" : "tw-text-iron-100";

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-2 tw-text-center">
      <StatusEmoji status={status} />
      <p className={`tw-m-0 tw-text-lg tw-font-medium ${statusTextColor}`}>
        {statusMessage}
      </p>
      {status === "confirm_wallet" ? (
        <CircleLoader size={CircleLoaderSize.LARGE} />
      ) : (
        <TransactionLink href={transactionUrl} />
      )}
    </div>
  );
}

export default function OnchainTransactionModal({
  status,
  title,
  subtitle,
  message,
  transactionHash,
  transactionLink,
  chain,
  onClose,
}: OnchainTransactionModalProps) {
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const closableRef = useRef(false);
  const closable = status === "success" || status === "error";
  const hasSubtitle = subtitle !== undefined && subtitle !== null;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closableRef.current = closable;
  }, [closable]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      if (event.key === "Escape" && closableRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      trapTabFocus(event, dialog);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      }
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  const transactionUrl =
    transactionLink ??
    (transactionHash !== undefined && chain !== undefined
      ? getTransactionLink(chain.id, transactionHash)
      : null);

  return createPortal(
    <div className="tailwind-scope tw-fixed tw-inset-0 tw-z-[9999] tw-flex tw-items-center tw-justify-center tw-bg-gray-600 tw-bg-opacity-50 tw-px-4 tw-backdrop-blur-[1px]">
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
        ref={dialogRef}
        open
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={hasSubtitle ? subtitleId : undefined}
        tabIndex={-1}
        onCancel={(event) => {
          event.preventDefault();
          if (closable) {
            onClose();
          }
        }}
        className="tw-relative tw-z-[1] tw-w-full tw-max-w-md tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-6 tw-shadow-2xl focus:tw-outline-none"
      >
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-border-b tw-border-iron-800 tw-pb-3">
          <div className="tw-min-w-0">
            <h2
              id={titleId}
              className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
            >
              {title}
            </h2>
            {hasSubtitle ? (
              <p
                id={subtitleId}
                className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400"
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          {closable ? (
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="tw--mt-0.5 tw-inline-flex tw-size-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-400"
            >
              <XMarkIcon className="tw-size-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div
          className="tw-mt-4 tw-flex tw-min-h-[120px] tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-800 tw-p-3"
          role={status === "error" ? "alert" : "status"}
          aria-live={status === "error" ? "assertive" : "polite"}
        >
          <ModalStatusContent
            status={status}
            message={message}
            transactionUrl={transactionUrl}
          />
        </div>
      </dialog>
    </div>,
    document.body
  );
}
