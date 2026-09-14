"use client";

import CopyIcon from "@/components/utils/icons/CopyIcon";
import { useDropClipboardCopyFeedback } from "@/hooks/drops/useDropClipboardCopyFeedback";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useId } from "react";
import { getAddress, isAddress } from "viem";

interface CollectReviewWalletProps {
  readonly address: string;
  readonly name?: string | undefined;
  readonly label: string;
  readonly detail?: string | undefined;
}

function ReviewWalletDetails({
  address,
  name,
  label,
  detail,
}: CollectReviewWalletProps) {
  const locale = useBrowserLocale();
  const labelId = useId();
  const identityId = useId();
  const { status, statusMessage, copyToClipboard } =
    useDropClipboardCopyFeedback();
  const copyLabel = t(locale, "walletAddress.copy.walletAriaLabel");
  const displayName = name?.trim();
  const showName =
    Boolean(displayName) && !isAddress(displayName ?? "", { strict: false });

  return (
    <div className="tw-min-w-0">
      <details className="tw-min-w-0 [&[open]>summary>svg]:tw-rotate-180">
        <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-gap-3 tw-rounded-md tw-py-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
          <span
            id={labelId}
            className="tw-shrink-0 tw-text-[13px] tw-text-iron-400"
          >
            {label}
          </span>
          <bdi className="tw-min-w-0 tw-flex-1 tw-text-right tw-text-sm tw-font-normal tw-text-iron-100 [overflow-wrap:anywhere]">
            {showName
              ? displayName
              : `${address.slice(0, 6)}…${address.slice(-4)}`}
          </bdi>
          <ChevronDownIcon
            aria-hidden="true"
            className="tw-size-3 tw-shrink-0 tw-text-iron-400"
          />
        </summary>
        <div className="tw-mb-2 tw-rounded-lg tw-bg-white/[0.03] tw-p-3">
          <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-2">
            <div id={identityId} className="tw-min-w-0 tw-flex-1 tw-py-1">
              <code
                dir="ltr"
                className="tw-block tw-select-text tw-break-all tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-300"
              >
                {address}
              </code>
            </div>
            <button
              type="button"
              aria-label={copyLabel}
              aria-describedby={`${labelId} ${identityId}`}
              title={
                status === "copied"
                  ? t(locale, "walletAddress.copy.copiedTooltip")
                  : copyLabel
              }
              onClick={() => copyToClipboard(() => address)}
              className="tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-white"
            >
              {status === "copied" ? (
                <CheckIcon aria-hidden="true" className="tw-size-5" />
              ) : (
                <CopyIcon />
              )}
            </button>
          </div>
          <output
            aria-live="polite"
            className={
              status === "failed"
                ? "tw-mt-1 tw-block tw-text-xs tw-text-iron-300"
                : "tw-sr-only"
            }
          >
            {statusMessage}
          </output>
        </div>
      </details>
      {detail && (
        <p className="tw-m-0 tw-break-words tw-text-right tw-text-xs tw-leading-5 tw-text-iron-400">
          {detail}
        </p>
      )}
    </div>
  );
}

export default function CollectReviewWallet(props: CollectReviewWalletProps) {
  const address = isAddress(props.address, { strict: false })
    ? getAddress(props.address)
    : props.address;
  return <ReviewWalletDetails key={address} {...props} address={address} />;
}
