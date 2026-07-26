"use client";

import {
  ArchiveBoxIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState, type ComponentType, type SVGProps } from "react";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatNumber, formatTime } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  EtherscanBlockView,
  EtherscanPreview,
  EtherscanTransactionView,
} from "@/lib/link-preview/etherscan/types";

import { useLinkPreviewVariant } from "../LinkPreviewContext";

interface Fact {
  readonly labelKey: MessageKey;
  readonly value: string | undefined;
  readonly fullValue?: string | undefined;
}

const TRANSACTION_PREVIEW_TYPE = "etherscan.transaction";
const BLOCK_PREVIEW_TYPE = "etherscan.block";
type EtherscanPagePreview = Extract<
  EtherscanPreview,
  {
    readonly type:
      | "etherscan.list"
      | "etherscan.analytics"
      | "etherscan.tool"
      | "etherscan.page";
  }
>;

type StatusAppearance = {
  readonly labelKey: MessageKey;
  readonly className: string;
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const STATUS_APPEARANCE = {
  success: {
    labelKey: "linkPreview.etherscan.status.success",
    className: "tw-border-success/30 tw-bg-success/10 tw-text-green-100",
    Icon: CheckCircleIcon,
  },
  finalized: {
    labelKey: "linkPreview.etherscan.status.finalized",
    className: "tw-border-success/30 tw-bg-success/10 tw-text-green-100",
    Icon: CheckCircleIcon,
  },
  pending: {
    labelKey: "linkPreview.etherscan.status.pending",
    className: "tw-border-amber-400/30 tw-bg-amber-400/10 tw-text-amber-100",
    Icon: ClockIcon,
  },
  reverted: {
    labelKey: "linkPreview.etherscan.status.reverted",
    className: "tw-border-error/30 tw-bg-error/10 tw-text-red-100",
    Icon: ExclamationTriangleIcon,
  },
  proposed: {
    labelKey: "linkPreview.etherscan.status.proposed",
    className:
      "tw-border-primary-400/30 tw-bg-primary-400/10 tw-text-primary-100",
    Icon: ClockIcon,
  },
  future: {
    labelKey: "linkPreview.etherscan.status.future",
    className: "tw-border-amber-400/30 tw-bg-amber-400/10 tw-text-amber-100",
    Icon: ClockIcon,
  },
  unknown: {
    labelKey: "linkPreview.etherscan.status.unknown",
    className: "tw-border-iron-500/40 tw-bg-iron-700/30 tw-text-iron-200",
    Icon: InformationCircleIcon,
  },
} as const satisfies Readonly<Record<string, StatusAppearance>>;

function shortenIdentity(value: string): string {
  if (value.length <= 22) {
    return value;
  }
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function formatDecimal(
  locale: ReturnType<typeof useBrowserLocale>,
  value: string | undefined,
  maximumFractionDigits = 6
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }
  return formatNumber(locale, numeric, { maximumFractionDigits });
}

function formatIntegerString(
  locale: ReturnType<typeof useBrowserLocale>,
  value: string | undefined
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isSafeInteger(numeric)
    ? formatNumber(locale, numeric, { maximumFractionDigits: 0 })
    : value;
}

function formatEth(
  locale: ReturnType<typeof useBrowserLocale>,
  value: string | undefined
): string | undefined {
  const formatted = formatDecimal(locale, value);
  return formatted === undefined ? undefined : `${formatted} ETH`;
}

function formatTimestamp(
  locale: ReturnType<typeof useBrowserLocale>,
  value: string | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = formatDate(locale, value);
  const time = formatTime(locale, value);
  return time ? `${date} ${time}` : date;
}

function getKindKey(preview: EtherscanPreview): MessageKey {
  return `linkPreview.etherscan.kind.${preview.type.slice(
    "etherscan.".length
  )}` as MessageKey;
}

function getStatus(
  preview: EtherscanPreview
): keyof typeof STATUS_APPEARANCE | null {
  if (preview.network.status === "legacy") {
    return null;
  }
  if (preview.type === TRANSACTION_PREVIEW_TYPE) {
    return preview.transaction.status;
  }
  if (preview.type === BLOCK_PREVIEW_TYPE) {
    return preview.block.status;
  }
  return null;
}

function getTransactionHeadline(
  locale: ReturnType<typeof useBrowserLocale>,
  transaction: EtherscanTransactionView
): string {
  if (transaction.protocolAction) {
    return t(locale, "linkPreview.etherscan.action.compound", {
      action: transaction.protocolAction.action,
      amount: formatDecimal(locale, transaction.protocolAction.amount) ?? "-",
      token: transaction.protocolAction.token,
    });
  }
  switch (transaction.action) {
    case "native-transfer":
      return t(locale, "linkPreview.etherscan.action.nativeTransfer", {
        value: formatDecimal(locale, transaction.valueEth) ?? "0",
      });
    case "token-transfer":
      return t(locale, "linkPreview.etherscan.action.tokenTransfer");
    case "contract-creation":
      return t(locale, "linkPreview.etherscan.action.contractCreation");
    case "contract-interaction":
      return t(locale, "linkPreview.etherscan.action.contractInteraction");
    case "ethereum-transaction":
      return t(locale, "linkPreview.etherscan.action.transaction");
  }
}

function getBlockHeadline(
  locale: ReturnType<typeof useBrowserLocale>,
  block: EtherscanBlockView
): string {
  return `${t(locale, "linkPreview.etherscan.kind.block")} #${
    block.number ?? shortenIdentity(block.identifier)
  }`;
}

function getHeadline(
  locale: ReturnType<typeof useBrowserLocale>,
  preview: EtherscanPreview
): string {
  if (isPagePreview(preview)) {
    return t(locale, preview.page.titleKey);
  }

  switch (preview.type) {
    case TRANSACTION_PREVIEW_TYPE:
      return getTransactionHeadline(locale, preview.transaction);
    case "etherscan.address":
      return shortenIdentity(preview.address.address ?? preview.address.input);
    case "etherscan.token":
      return (
        preview.token.name ??
        preview.token.symbol ??
        shortenIdentity(preview.token.address)
      );
    case "etherscan.nft":
      return `${
        preview.nft.collectionName ?? shortenIdentity(preview.nft.contract)
      } #${preview.nft.tokenId}`;
    case BLOCK_PREVIEW_TYPE:
      return getBlockHeadline(locale, preview.block);
    case "etherscan.uncle":
      return `${t(locale, "linkPreview.etherscan.kind.uncle")} ${shortenIdentity(
        preview.uncle.identifier
      )}`;
    case "etherscan.blob":
      return `${t(locale, "linkPreview.etherscan.kind.blob")} ${shortenIdentity(
        preview.blob.identifier
      )}`;
    case "etherscan.signature":
      return `${t(
        locale,
        "linkPreview.etherscan.kind.signature"
      )} #${preview.signature.identifier}`;
  }
}

function getAddressTypeKey(
  subtype: "eoa" | "contract" | "delegated-eoa" | "unknown"
): MessageKey {
  switch (subtype) {
    case "eoa":
      return "linkPreview.etherscan.address.eoa";
    case "contract":
      return "linkPreview.etherscan.address.contract";
    case "delegated-eoa":
      return "linkPreview.etherscan.address.delegated";
    case "unknown":
      return "linkPreview.etherscan.address.unknown";
  }
}

function getFacts(
  locale: ReturnType<typeof useBrowserLocale>,
  preview: EtherscanPreview
): readonly Fact[] {
  switch (preview.type) {
    case TRANSACTION_PREVIEW_TYPE:
      return [
        {
          labelKey: "linkPreview.etherscan.fact.from",
          value: preview.transaction.from
            ? shortenIdentity(preview.transaction.from)
            : undefined,
          fullValue: preview.transaction.from,
        },
        {
          labelKey: preview.transaction.createdContract
            ? "linkPreview.etherscan.fact.createdContract"
            : "linkPreview.etherscan.fact.to",
          value: shortenIdentity(
            preview.transaction.createdContract ?? preview.transaction.to ?? "-"
          ),
          fullValue:
            preview.transaction.createdContract ?? preview.transaction.to,
        },
        {
          labelKey: "linkPreview.etherscan.fact.block",
          value: formatIntegerString(locale, preview.transaction.blockNumber),
        },
        {
          labelKey: "linkPreview.etherscan.fact.fee",
          value: formatEth(locale, preview.transaction.feeEth),
        },
        {
          labelKey: "linkPreview.etherscan.fact.confirmations",
          value: formatIntegerString(locale, preview.transaction.confirmations),
        },
        {
          labelKey: "linkPreview.etherscan.fact.timestamp",
          value: formatTimestamp(locale, preview.transaction.timestamp),
        },
      ];
    case "etherscan.address":
      return [
        {
          labelKey: "linkPreview.etherscan.fact.type",
          value: t(locale, getAddressTypeKey(preview.address.subtype)),
        },
        {
          labelKey: "linkPreview.etherscan.fact.balance",
          value: formatEth(locale, preview.address.balanceEth),
        },
        {
          labelKey: "linkPreview.etherscan.fact.block",
          value: formatIntegerString(locale, preview.address.blockNumber),
        },
      ];
    case "etherscan.token":
      return [
        {
          labelKey: "linkPreview.etherscan.fact.standard",
          value: preview.token.standard.toUpperCase(),
        },
        {
          labelKey: "linkPreview.etherscan.fact.address",
          value: shortenIdentity(preview.token.address),
          fullValue: preview.token.address,
        },
        {
          labelKey: "linkPreview.etherscan.fact.supply",
          value: formatDecimal(locale, preview.token.totalSupply),
        },
      ];
    case "etherscan.nft":
      return [
        {
          labelKey: "linkPreview.etherscan.fact.standard",
          value: preview.nft.standard.toUpperCase(),
        },
        {
          labelKey: "linkPreview.etherscan.fact.tokenId",
          value: preview.nft.tokenId,
        },
        {
          labelKey: "linkPreview.etherscan.fact.owner",
          value: preview.nft.owner
            ? shortenIdentity(preview.nft.owner)
            : undefined,
          fullValue: preview.nft.owner,
        },
      ];
    case BLOCK_PREVIEW_TYPE:
      return [
        {
          labelKey: "linkPreview.etherscan.fact.timestamp",
          value: formatTimestamp(locale, preview.block.timestamp),
        },
        {
          labelKey: "linkPreview.etherscan.fact.transactions",
          value:
            preview.block.transactionCount === undefined
              ? undefined
              : formatNumber(locale, preview.block.transactionCount),
        },
        {
          labelKey: "linkPreview.etherscan.fact.gas",
          value: preview.block.gasUsed,
        },
        {
          labelKey: "linkPreview.etherscan.fact.feeRecipient",
          value: preview.block.feeRecipient
            ? shortenIdentity(preview.block.feeRecipient)
            : undefined,
          fullValue: preview.block.feeRecipient,
        },
        {
          labelKey: "linkPreview.etherscan.fact.currentHeight",
          value: formatIntegerString(locale, preview.block.currentHeight),
        },
        {
          labelKey: "linkPreview.etherscan.fact.blocksRemaining",
          value: formatIntegerString(locale, preview.block.blocksRemaining),
        },
      ];
    case "etherscan.uncle":
    case "etherscan.blob":
    case "etherscan.signature":
    case "etherscan.list":
    case "etherscan.analytics":
    case "etherscan.tool":
    case "etherscan.page":
      return [];
  }
}

function getCopyValue(preview: EtherscanPreview): string | null {
  switch (preview.type) {
    case TRANSACTION_PREVIEW_TYPE:
      return preview.transaction.hash;
    case "etherscan.address":
      return preview.address.address ?? preview.address.input;
    case "etherscan.token":
      return preview.token.address;
    case "etherscan.nft":
      return `${preview.nft.contract}:${preview.nft.tokenId}`;
    case BLOCK_PREVIEW_TYPE:
      return preview.block.hash ?? preview.block.number ?? null;
    case "etherscan.uncle":
      return preview.uncle.identifier;
    case "etherscan.blob":
      return preview.blob.identifier;
    case "etherscan.signature":
      return preview.canonicalUrl;
    case "etherscan.list":
    case "etherscan.analytics":
    case "etherscan.tool":
    case "etherscan.page":
      return null;
  }
}

function isPagePreview(
  preview: EtherscanPreview
): preview is EtherscanPagePreview {
  return [
    "etherscan.list",
    "etherscan.analytics",
    "etherscan.tool",
    "etherscan.page",
  ].includes(preview.type);
}

function StatusChip({
  status,
  isLegacy,
}: {
  readonly status: keyof typeof STATUS_APPEARANCE | null;
  readonly isLegacy: boolean;
}) {
  const locale = useBrowserLocale();
  if (isLegacy) {
    return (
      <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-iron-500/40 tw-bg-iron-700/30 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-text-iron-200">
        <ArchiveBoxIcon className="tw-size-3.5" aria-hidden="true" />
        {t(locale, "linkPreview.etherscan.liveUnavailable")}
      </span>
    );
  }
  if (!status) {
    return null;
  }
  const appearance = STATUS_APPEARANCE[status];
  return (
    <span
      className={`tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium ${appearance.className}`}
    >
      <appearance.Icon className="tw-size-3.5" aria-hidden="true" />
      {t(locale, appearance.labelKey)}
    </span>
  );
}

export default function EtherscanCard({
  preview,
}: {
  readonly preview: EtherscanPreview;
}) {
  const locale = useBrowserLocale();
  const variant = useLinkPreviewVariant();
  const [copied, setCopied] = useState(false);
  const kind = t(locale, getKindKey(preview));
  const headline = getHeadline(locale, preview);
  const facts = getFacts(locale, preview)
    .filter(
      (fact): fact is Fact & { readonly value: string } =>
        fact.value !== undefined
    )
    .slice(0, variant === "home" ? 6 : 4);
  const copyValue = getCopyValue(preview);
  const status = getStatus(preview);
  const resourceLabel = t(locale, "linkPreview.etherscan.previewLabel", {
    kind,
    network: preview.network.label,
  });

  const handleCopy = () => {
    if (!copyValue) {
      return;
    }
    void navigator.clipboard.writeText(copyValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 700);
    });
  };

  return (
    <article
      aria-label={resourceLabel}
      className="tw-relative tw-flex tw-h-full tw-min-h-0 tw-w-full tw-flex-col tw-gap-2 tw-overflow-y-auto tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/80 tw-p-3 tw-pr-12 tw-shadow-sm tw-shadow-black/20 sm:tw-pr-14"
      data-testid="etherscan-preview-card"
    >
      <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-w-1 tw-bg-primary-400/80" />
      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
        <span className="tw-text-xs tw-font-semibold tw-text-iron-100">
          {t(locale, "linkPreview.etherscan.provider")}
        </span>
        <span className="tw-text-primary-100 tw-rounded-full tw-border tw-border-primary-400/25 tw-bg-primary-400/10 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium">
          {preview.network.label}
        </span>
        <span className="tw-text-[11px] tw-text-iron-400">{kind}</span>
        <StatusChip
          status={status}
          isLegacy={preview.network.status === "legacy"}
        />
      </div>

      <h3
        className="tw-m-0 tw-line-clamp-2 tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-white"
        title={headline}
      >
        {headline}
      </h3>

      {facts.length > 0 && (
        <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-1 sm:tw-grid-cols-2">
          {facts.map((fact) => (
            <div
              key={`${fact.labelKey}-${fact.value}`}
              className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-2"
            >
              <dt className="tw-flex-shrink-0 tw-text-[11px] tw-text-iron-400">
                {t(locale, fact.labelKey)}
              </dt>
              <dd
                className="tw-m-0 tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-text-iron-100"
                aria-label={fact.fullValue}
                title={fact.fullValue}
              >
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {isPagePreview(preview) && (
        <p className="tw-m-0 tw-line-clamp-2 tw-text-xs tw-leading-5 tw-text-iron-300">
          {t(locale, preview.page.descriptionKey)}
        </p>
      )}

      <div className="tw-mt-auto tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
        {preview.contexts.slice(0, 3).map((context) => (
          <span
            key={`${context.kind}-${context.labelKey}`}
            className="tw-rounded-md tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[11px] tw-text-iron-300"
          >
            {t(locale, context.labelKey)}
          </span>
        ))}
        {preview.network.status === "legacy" && (
          <span className="tw-text-[11px] tw-text-iron-300">
            {t(locale, "linkPreview.etherscan.legacy")}
          </span>
        )}
        {preview.completeness === "partial" && (
          <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[11px] tw-text-iron-300">
            <InformationCircleIcon className="tw-size-3.5" aria-hidden="true" />
            {t(locale, "linkPreview.etherscan.partial")}
          </span>
        )}
      </div>

      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        {copyValue && (
          <button
            type="button"
            onClick={handleCopy}
            className="tw-min-h-9 tw-rounded-lg tw-border tw-border-iron-600 tw-bg-iron-800 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          >
            {t(
              locale,
              copied
                ? "linkPreview.etherscan.copied"
                : "linkPreview.etherscan.copy",
              { kind: kind.toLowerCase() }
            )}
          </button>
        )}
        {variant === "home" && (
          <Link
            href={preview.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-inline-flex tw-min-h-9 tw-items-center tw-rounded-lg tw-bg-primary-500 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-white tw-no-underline hover:tw-bg-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300"
          >
            {t(locale, "linkPreview.etherscan.open")}
          </Link>
        )}
      </div>
    </article>
  );
}
