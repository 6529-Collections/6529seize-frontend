"use client";

import OpenseaIcon from "@/components/user/utils/icons/OpenseaIcon";
import CopyIcon from "@/components/utils/icons/CopyIcon";
import { useDropClipboardCopyFeedback } from "@/hooks/drops/useDropClipboardCopyFeedback";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import { useRef } from "react";
import {
  resolveCollectContractIdentity,
  type CollectContractRole,
} from "./collect-contract-identity";

interface ContractProps {
  readonly chainId?: number | undefined;
  readonly address: string;
  readonly role: CollectContractRole;
}

function ContractIdentity({ chainId, address, role }: ContractProps) {
  const locale = useBrowserLocale();
  const details = useRef<HTMLDetailsElement>(null);
  const { status, statusMessage, copyToClipboard } =
    useDropClipboardCopyFeedback();
  const identity = resolveCollectContractIdentity(chainId, address, role);
  const name =
    identity.name ??
    t(
      locale,
      role === "fee"
        ? "collect.review.unknownRecipient"
        : "collect.review.unknownContract"
    );
  const roles = {
    nft: t(locale, "collect.review.nftContract"),
    exchange: t(locale, "collect.review.exchangeContract"),
    fee: t(
      locale,
      identity.name === "OpenSea"
        ? "collect.review.marketplaceFee"
        : "collect.review.fee"
    ),
    approval: t(locale, "collect.review.approvalContract"),
  };
  const iconButton =
    "tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-white";
  return (
    <div className="tw-min-w-0">
      <div className="tw-flex tw-items-start tw-gap-1">
        <details
          ref={details}
          className="tw-min-w-0 tw-flex-1 [&[open]>summary>svg]:tw-rotate-180"
        >
          <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-gap-3 tw-rounded-lg focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
            <span className="tw-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-white/5 tw-text-iron-400">
              {identity.name === "OpenSea" ? (
                <OpenseaIcon />
              ) : (
                <Square3Stack3DIcon aria-hidden="true" className="tw-size-4" />
              )}
            </span>
            <span className="tw-min-w-0 tw-flex-1 tw-py-1">
              <span className="tw-block tw-break-words tw-text-[13px] tw-font-medium tw-text-iron-100">
                {name}
              </span>
              <span className="tw-block tw-text-xs tw-text-iron-400">
                {roles[role]}
              </span>
            </span>
            <ChevronDownIcon
              aria-hidden="true"
              className="tw-size-3 tw-shrink-0 tw-text-iron-400"
            />
          </summary>
          <code
            dir="ltr"
            className="tw-mt-2 tw-block tw-select-text tw-break-all tw-rounded-lg tw-bg-white/[0.03] tw-p-3 tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-300"
          >
            {identity.address}
          </code>
        </details>
        <button
          type="button"
          aria-label={t(locale, "collect.review.copyAddress", { label: name })}
          className={iconButton}
          onClick={() => {
            if (details.current) details.current.open = true;
            copyToClipboard(() => identity.address);
          }}
        >
          {status === "copied" ? (
            <CheckIcon aria-hidden="true" className="tw-size-4" />
          ) : (
            <CopyIcon />
          )}
        </button>
        {identity.explorerUrl && (
          <a
            href={identity.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(locale, "collect.review.openExplorer", {
              label: name,
            })}
            className={iconButton}
          >
            <ArrowUpRightIcon aria-hidden="true" className="tw-size-4" />
          </a>
        )}
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
  );
}

export default function CollectReviewContract(props: ContractProps) {
  return (
    <ContractIdentity
      key={`${props.chainId ?? "unknown"}:${props.role}:${props.address.toLowerCase()}`}
      {...props}
    />
  );
}
