"use client";

import Button from "@/components/utils/button/Button";
import type { ApiMarketBatchItem } from "@/generated/models/ApiMarketBatchItem";
import {
  ApiMarketBatchOperationStateEnum,
  type ApiMarketBatchOperation,
} from "@/generated/models/ApiMarketBatchOperation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { zeroAddress } from "viem";
import CollectAssetMedia from "./CollectAssetMedia";
import CollectReviewContract from "./CollectReviewContract";
import {
  CollectReviewAmountRow as AmountRow,
  CollectReviewDisclosure,
  CollectReviewMoney as Money,
} from "./CollectReviewPrimitives";
import CollectReviewWallet from "./CollectReviewWallet";
import { resolveCollectContractIdentity } from "./collect-contract-identity";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import { marketBatchStage } from "./market-batch.adapters";

function focusReviewHeading(element: HTMLHeadingElement | null) {
  element?.focus();
}

function assetContract(item: ApiMarketBatchItem) {
  const [chain, address] = item.asset_key.split(":");
  return { chainId: chain === "1" ? 1 : undefined, address };
}

function QuotedItem({
  item,
  selection,
  locale,
  walletNames,
}: {
  readonly item: ApiMarketBatchItem;
  readonly selection: CollectSelectedListing | undefined;
  readonly locale: SupportedLocale;
  readonly walletNames: Readonly<Record<string, string>> | undefined;
}) {
  return (
    <li className="tw-space-y-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-4">
      <div className="tw-flex tw-items-start tw-gap-3">
        {selection && (
          <div className="tw-relative tw-flex tw-size-14 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
            <CollectAssetMedia
              src={selection.asset.image_url}
              name={selection.asset.name}
            />
          </div>
        )}
        <div className="tw-min-w-0 tw-flex-1 tw-space-y-1">
          <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-100">
            {selection?.asset.name ?? item.asset_key}
          </p>
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "collect.batchReview.quotedQuantity", {
              quantity: formatDecimalString(locale, item.quantity),
            })}
          </p>
          <p className="tw-m-0 tw-break-words tw-text-sm tw-font-normal tw-tabular-nums tw-text-iron-100">
            <Money wei={item.amount_wei} currency="ETH" />
          </p>
        </div>
      </div>
      {item.allocations.map((allocation) => (
        <CollectReviewWallet
          key={allocation.recipient.toLowerCase()}
          label={t(locale, "collect.batchReview.deliveryCopies", {
            quantity: formatDecimalString(locale, allocation.quantity),
          })}
          address={allocation.recipient}
          name={walletNames?.[allocation.recipient.toLowerCase()]}
          detail={
            allocation.recipient_in_profile === false
              ? t(locale, "collect.batchReview.outsideProfile")
              : undefined
          }
        />
      ))}
    </li>
  );
}

/** Render only controller-validated terms; this component never prepares or sends a transaction. */
export default function CollectBatchQuoteReview({
  operation,
  items,
  busy,
  canEdit = true,
  disabledReason,
  message,
  walletNames,
  onConfirm,
  onEdit,
  onClose,
}: {
  readonly operation: ApiMarketBatchOperation;
  readonly items: readonly CollectSelectedListing[];
  readonly busy: boolean;
  readonly canEdit?: boolean;
  readonly disabledReason?: string | null | undefined;
  readonly message?: string | null | undefined;
  /** Names must come from the operation's current, confirmed profile wallets. */
  readonly walletNames?: Readonly<Record<string, string>> | undefined;
  readonly onConfirm: () => Promise<void>;
  readonly onEdit: () => void;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const gas = operation.transaction?.gas_reserve_wei;
  // The validated native batch has no approvals. Do not invent a mixed-currency or incomplete maximum.
  const maximum =
    gas !== undefined &&
    operation.currency.toLowerCase() === zeroAddress &&
    operation.approval_transactions.length === 0 &&
    operation.transaction?.value === operation.total_wei
      ? (BigInt(operation.total_wei) + BigInt(gas)).toString()
      : null;
  const ready =
    operation.state === ApiMarketBatchOperationStateEnum.Review &&
    gas !== undefined;
  const itemFor = (item: ApiMarketBatchItem) =>
    items.find(
      (selection) =>
        selection.asset.asset_key === item.asset_key &&
        selection.order.identity.order_hash.toLowerCase() ===
          item.order.order_hash.toLowerCase() &&
        selection.order.identity.protocol_address.toLowerCase() ===
          item.order.protocol_address.toLowerCase()
    );
  return (
    <section
      aria-label={t(locale, "collect.batchReview.quoteTitle")}
      className="tw-min-w-0 tw-space-y-5"
    >
      <div className="tw-space-y-1">
        <h2
          ref={focusReviewHeading}
          tabIndex={-1}
          className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-snug tw-tracking-tight tw-text-iron-100"
        >
          {t(locale, "collect.batchReview.quoteTitle")}
        </h2>
        <p role="status" className="tw-m-0 tw-text-xs tw-text-iron-300">
          {t(locale, `collect.trade.stage.${marketBatchStage(operation)}`)}
        </p>
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.batchReview.atomic")}
        </p>
      </div>
      <ul className="tw-m-0 tw-list-none tw-p-0">
        {operation.items.map((item) => (
          <QuotedItem
            key={`${item.order.protocol_address}:${item.order.order_hash}`}
            item={item}
            selection={itemFor(item)}
            locale={locale}
            walletNames={walletNames}
          />
        ))}
      </ul>
      <dl className="tw-m-0 tw-space-y-3">
        <AmountRow label={t(locale, "collect.batchReview.purchaseTotal")}>
          <Money wei={operation.total_wei} currency="ETH" />
        </AmountRow>
        <AmountRow label={t(locale, "collect.review.networkCap")}>
          {gas === undefined ? (
            t(locale, "collect.batchReview.gasUnavailable")
          ) : (
            <Money wei={gas} currency="ETH" cap />
          )}
        </AmountRow>
      </dl>
      <CollectReviewWallet
        label={t(locale, "collect.review.payWith")}
        address={operation.wallet}
        name={walletNames?.[operation.wallet.toLowerCase()]}
      />
      <div className="tw-space-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4">
        {maximum !== null && (
          <dl className="tw-m-0">
            <AmountRow prominent label={t(locale, "collect.review.maximum")}>
              <Money wei={maximum} currency="ETH" cap capDecimals={5} />
            </AmountRow>
          </dl>
        )}
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.batchReview.gasNote")}
        </p>
      </div>
      {message && (
        <p
          role="status"
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300"
        >
          {message}
        </p>
      )}
      {disabledReason && (
        <p
          role="status"
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300"
        >
          {disabledReason}
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        {operation.state === ApiMarketBatchOperationStateEnum.Review && (
          <Button
            variant="action"
            size="lg"
            fullWidth
            loading={busy}
            disabled={!ready || Boolean(disabledReason)}
            onClick={() => {
              void onConfirm();
            }}
          >
            {t(locale, "collect.trade.continue")}
          </Button>
        )}
        {canEdit && (
          <Button
            variant="secondary"
            size="lg"
            disabled={
              busy ||
              operation.state !== ApiMarketBatchOperationStateEnum.Review
            }
            onClick={onEdit}
          >
            {t(locale, "collect.buy.editPurchase")}
          </Button>
        )}
        <Button variant="secondary" size="lg" disabled={busy} onClick={onClose}>
          {t(locale, "collect.batchReview.close")}
        </Button>
      </div>
      <div>
        <CollectReviewDisclosure
          label={t(locale, "collect.review.priceDetails")}
        >
          {operation.items.map((item) => (
            <div
              key={`${item.order.protocol_address}:${item.order.order_hash}`}
              className="tw-space-y-3"
            >
              <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-200">
                {itemFor(item)?.asset.name ?? item.asset_key}
              </p>
              <dl className="tw-m-0 tw-space-y-3">
                {item.net_wei !== undefined && (
                  <AmountRow label={t(locale, "collect.trade.sellerReceives")}>
                    <Money wei={item.net_wei} currency="ETH" />
                  </AmountRow>
                )}
                {item.fees?.map((fee, index) => (
                  <AmountRow
                    key={`${fee.recipient}:${index}`}
                    label={t(
                      locale,
                      resolveCollectContractIdentity(
                        assetContract(item).chainId,
                        fee.recipient,
                        "fee"
                      ).name === "OpenSea"
                        ? "collect.review.openSeaFee"
                        : "collect.review.fee"
                    )}
                  >
                    <Money wei={fee.amount_wei} currency="ETH" />
                  </AmountRow>
                ))}
              </dl>
            </div>
          ))}
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "collect.review.feesIncluded")}
          </p>
          <CollectReviewDisclosure
            label={t(locale, "collect.review.exactAmounts")}
            nested
          >
            <dl className="tw-m-0 tw-space-y-3">
              {gas !== undefined && (
                <AmountRow label={t(locale, "collect.review.exactGas")}>
                  <Money wei={gas} currency="ETH" />
                </AmountRow>
              )}
              {maximum !== null && (
                <AmountRow label={t(locale, "collect.review.exactMaximum")}>
                  <Money wei={maximum} currency="ETH" />
                </AmountRow>
              )}
            </dl>
          </CollectReviewDisclosure>
        </CollectReviewDisclosure>
        <CollectReviewDisclosure
          label={t(locale, "collect.review.contractDetails")}
        >
          {operation.items.map((item) => (
            <div
              key={`${item.order.protocol_address}:${item.order.order_hash}`}
              className="tw-space-y-3"
            >
              <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-200">
                {itemFor(item)?.asset.name ?? item.asset_key}
              </p>
              {assetContract(item).address && (
                <CollectReviewContract
                  chainId={assetContract(item).chainId}
                  address={assetContract(item).address!}
                  role="nft"
                />
              )}
              <CollectReviewContract
                chainId={assetContract(item).chainId}
                address={item.order.protocol_address}
                role="exchange"
              />
              {[
                ...new Set(
                  item.fees?.map((fee) => fee.recipient.toLowerCase())
                ),
              ].map((recipient) => (
                <CollectReviewContract
                  key={recipient}
                  chainId={assetContract(item).chainId}
                  address={recipient}
                  role="fee"
                />
              ))}
              <dl className="tw-m-0">
                <AmountRow label={t(locale, "collect.batchReview.orderHash")}>
                  {item.order.order_hash}
                </AmountRow>
              </dl>
            </div>
          ))}
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.review.liveCheck")}
          </p>
        </CollectReviewDisclosure>
      </div>
    </section>
  );
}
