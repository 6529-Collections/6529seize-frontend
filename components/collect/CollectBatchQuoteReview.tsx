"use client";

import Button from "@/components/utils/button/Button";
import type { ApiMarketBatchItem } from "@/generated/models/ApiMarketBatchItem";
import {
  ApiMarketBatchOperationStateEnum,
  type ApiMarketBatchOperation,
} from "@/generated/models/ApiMarketBatchOperation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatDecimalString } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { ReactNode } from "react";
import { getAddress } from "viem";
import CollectAssetMedia from "./CollectAssetMedia";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import { marketBatchStage } from "./market-batch.adapters";
import { collectBatchEthAmount as ethAmount } from "./collect-batch-review.helpers";

function focusReviewHeading(element: HTMLHeadingElement | null) {
  element?.focus();
}

function Fact({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-x-4 tw-gap-y-1">
      <dt className="tw-text-xs tw-text-iron-400">{label}</dt>
      <dd className="tw-m-0 tw-max-w-full tw-break-all tw-text-right tw-text-xs tw-tabular-nums tw-text-iron-100">
        {children}
      </dd>
    </div>
  );
}

function QuotedItem({
  item,
  selection,
  locale,
}: {
  readonly item: ApiMarketBatchItem;
  readonly selection: CollectSelectedListing | undefined;
  readonly locale: SupportedLocale;
}) {
  return (
    <li className="tw-space-y-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-4">
      <div className="tw-flex tw-items-start tw-gap-3">
        {selection && (
          <div className="tw-relative tw-flex tw-size-14 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
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
        </div>
        <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100">
          {ethAmount(locale, item.amount_wei)}
        </p>
      </div>
      <dl className="tw-m-0 tw-space-y-2">
        {item.allocations.map((allocation) => (
          <Fact
            key={allocation.recipient.toLowerCase()}
            label={t(locale, "collect.batchReview.deliveryCopies", {
              quantity: formatDecimalString(locale, allocation.quantity),
            })}
          >
            <span className="tw-font-mono">
              {getAddress(allocation.recipient)}
            </span>
            {allocation.recipient_in_profile === false && (
              <span className="tw-block tw-text-iron-400">
                {t(locale, "collect.batchReview.outsideProfile")}
              </span>
            )}
          </Fact>
        ))}
      </dl>
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
  readonly onConfirm: () => Promise<void>;
  readonly onEdit: () => void;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const gas = operation.transaction?.gas_reserve_wei;
  const maximum =
    gas === undefined
      ? null
      : (BigInt(operation.total_wei) + BigInt(gas)).toString();
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
      className="tw-space-y-4"
    >
      <div className="tw-space-y-1">
        <h2
          ref={focusReviewHeading}
          tabIndex={-1}
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100"
        >
          {t(locale, "collect.batchReview.quoteTitle")}
        </h2>
        <p role="status" className="tw-m-0 tw-text-sm tw-text-iron-200">
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
          />
        ))}
      </ul>
      <dl className="tw-m-0 tw-space-y-3">
        <Fact label={t(locale, "collect.trade.payingWallet")}>
          <span className="tw-font-mono">{getAddress(operation.wallet)}</span>
        </Fact>
        <Fact label={t(locale, "collect.batchReview.purchaseTotal")}>
          {ethAmount(locale, operation.total_wei)}
        </Fact>
        <Fact label={t(locale, "collect.trade.gasCap")}>
          {gas === undefined
            ? t(locale, "collect.batchReview.gasUnavailable")
            : ethAmount(locale, gas)}
        </Fact>
      </dl>
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, "collect.batchReview.gasNote")}
      </p>
      <details>
        <summary className="tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-py-3 tw-text-xs tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "collect.batchReview.feesDetails")}
        </summary>
        <div className="tw-space-y-4 tw-py-2">
          {operation.items.map((item) => (
            <dl
              key={`${item.order.protocol_address}:${item.order.order_hash}`}
              className="tw-m-0 tw-space-y-2"
            >
              <Fact label={t(locale, "collect.trade.asset")}>
                {itemFor(item)?.asset.name ?? item.asset_key}
              </Fact>
              {item.net_wei !== undefined && (
                <Fact label={t(locale, "collect.trade.sellerReceives")}>
                  {ethAmount(locale, item.net_wei)}
                </Fact>
              )}
              {item.fees?.map((fee, index) => (
                <Fact
                  key={`${fee.recipient}:${index}`}
                  label={t(locale, "collect.batchReview.fee", {
                    number: index + 1,
                  })}
                >
                  {ethAmount(locale, fee.amount_wei)}
                  <span className="tw-block tw-font-mono">
                    {getAddress(fee.recipient)}
                  </span>
                </Fact>
              ))}
              <Fact label={t(locale, "collect.batchReview.orderHash")}>
                {item.order.order_hash}
              </Fact>
            </dl>
          ))}
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.trade.expiry", {
              time: formatDate(locale, operation.expires_at, {
                dateStyle: "medium",
                timeStyle: "medium",
              }),
            })}
          </p>
        </div>
      </details>
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
      <div className="tw-sticky tw-bottom-0 tw-z-20 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-3">
        {maximum !== null && (
          <dl className="tw-m-0 tw-w-full">
            <Fact label={t(locale, "collect.batchReview.maximumTotal")}>
              {ethAmount(locale, maximum)}
            </Fact>
          </dl>
        )}
        {operation.state === ApiMarketBatchOperationStateEnum.Review && (
          <Button
            variant="action"
            size="lg"
            loading={busy}
            disabled={!ready || Boolean(disabledReason)}
            onClick={() => {
              void onConfirm();
            }}
          >
            {t(locale, "collect.buy.atPrice", {
              price: ethAmount(locale, operation.total_wei),
            })}
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
    </section>
  );
}
