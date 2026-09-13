"use client";

import Button from "@/components/utils/button/Button";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiMarketBatchItem } from "@/generated/models/ApiMarketBatchItem";
import {
  ApiMarketBatchOperationStateEnum,
  type ApiMarketBatchOperation,
} from "@/generated/models/ApiMarketBatchOperation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { zeroAddress } from "viem";
import CollectAssetMedia from "./CollectAssetMedia";
import CollectReviewContract from "./CollectReviewContract";
import {
  CollectReviewAmountRow as AmountRow,
  CollectReviewDisclosure,
  CollectReviewMoney as Money,
} from "./CollectReviewPrimitives";
import CollectReviewWallet from "./CollectReviewWallet";
import CollectReviewRecipient from "./CollectReviewRecipient";
import { resolveCollectContractIdentity } from "./collect-contract-identity";
import { collectProfileWallets } from "./collect-recipient.helpers";
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
  recipients,
}: {
  readonly item: ApiMarketBatchItem;
  readonly selection: CollectSelectedListing | undefined;
  readonly locale: SupportedLocale;
  readonly recipients: ReactNode;
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
      {recipients}
    </li>
  );
}

interface CollectBatchQuoteReviewProps {
  readonly operation: ApiMarketBatchOperation;
  readonly items: readonly CollectSelectedListing[];
  readonly profile: ApiIdentity | null;
  readonly busy: boolean;
  readonly canEdit?: boolean;
  readonly disabledReason?: string | null | undefined;
  readonly message?: string | null | undefined;
  /** Names must come from the operation's current, confirmed profile wallets. */
  readonly walletNames?: Readonly<Record<string, string>> | undefined;
  readonly onConfirm: () => Promise<void>;
  readonly onEdit: () => void;
  readonly onClose: () => void;
  readonly onRecipientChange?: (
    itemIndex: number,
    allocationIndex: number,
    recipient: string,
    acknowledgeExternal: boolean
  ) => Promise<boolean>;
  readonly onRecipientEditingChange?: (editing: boolean) => void;
}

/** Render only controller-validated terms; this component never prepares or sends a transaction. */
export default function CollectBatchQuoteReview(
  props: CollectBatchQuoteReviewProps
) {
  const scope = JSON.stringify([
    props.operation.id,
    props.profile?.id,
    props.operation.wallet.toLowerCase(),
    Boolean(props.onRecipientChange),
    collectProfileWallets(props.profile)
      .map((wallet) => wallet.wallet.toLowerCase())
      .sort((left, right) => {
        if (left < right) return -1;
        return left > right ? 1 : 0;
      }),
  ]);
  return <BatchQuoteReview key={scope} {...props} />;
}

function BatchQuoteReview({
  operation,
  items,
  profile,
  busy,
  canEdit = true,
  disabledReason,
  message,
  walletNames,
  onConfirm,
  onEdit,
  onClose,
  onRecipientChange,
  onRecipientEditingChange,
}: CollectBatchQuoteReviewProps) {
  const locale = useBrowserLocale();
  const [activeRecipient, setActiveRecipient] = useState<string | null>(null);
  const editingRecipient = useRef<string | null>(null);
  const notifyEditing = useRef(onRecipientEditingChange);
  useLayoutEffect(() => {
    notifyEditing.current = onRecipientEditingChange;
  });
  useLayoutEffect(() => {
    notifyEditing.current?.(false);
    return () => notifyEditing.current?.(false);
  }, []);
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
  const recipientDisabled = !ready || busy || Boolean(disabledReason);
  const changeEditing = (key: string, editing: boolean) => {
    if (editing && editingRecipient.current !== null) return;
    editingRecipient.current = editing ? key : null;
    setActiveRecipient(editingRecipient.current);
    onRecipientEditingChange?.(editing);
  };
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
        {operation.items.map((item, itemIndex) => (
          <QuotedItem
            key={`${item.order.protocol_address}:${item.order.order_hash}`}
            item={item}
            selection={itemFor(item)}
            locale={locale}
            recipients={item.allocations.map((allocation, allocationIndex) => {
              const key = `${itemIndex}:${allocationIndex}`;
              const label = t(locale, "collect.batchReview.deliveryCopies", {
                quantity: formatDecimalString(locale, allocation.quantity),
              });
              const name = walletNames?.[allocation.recipient.toLowerCase()];
              return onRecipientChange && profile ? (
                <CollectReviewRecipient
                  key={key}
                  label={label}
                  address={allocation.recipient}
                  name={name}
                  profile={profile}
                  payingWallet={operation.wallet}
                  recipientInProfile={allocation.recipient_in_profile === true}
                  disabled={
                    recipientDisabled ||
                    (activeRecipient !== null && activeRecipient !== key)
                  }
                  onEditingChange={(editing) => changeEditing(key, editing)}
                  onApply={async (recipient, acknowledgeExternal) => {
                    if (recipientDisabled || editingRecipient.current !== key)
                      return false;
                    return onRecipientChange(
                      itemIndex,
                      allocationIndex,
                      recipient,
                      acknowledgeExternal
                    );
                  }}
                />
              ) : (
                <CollectReviewWallet
                  key={key}
                  label={label}
                  address={allocation.recipient}
                  name={name}
                  detail={
                    allocation.recipient_in_profile === false
                      ? t(locale, "collect.batchReview.outsideProfile")
                      : undefined
                  }
                />
              );
            })}
          />
        ))}
      </ul>
      {operation.items.some((item) =>
        item.allocations.some(
          (allocation) => allocation.recipient_in_profile === false
        )
      ) && (
        <p
          role="status"
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
        >
          {t(locale, "collect.review.giftOutcome")}
        </p>
      )}
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
            disabled={recipientDisabled || activeRecipient !== null}
            onClick={() => {
              if (recipientDisabled || editingRecipient.current !== null)
                return;
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
              activeRecipient !== null ||
              operation.state !== ApiMarketBatchOperationStateEnum.Review
            }
            onClick={() => {
              if (busy || editingRecipient.current !== null) return;
              onEdit();
            }}
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
