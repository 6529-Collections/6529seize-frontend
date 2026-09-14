"use client";

import Button from "@/components/utils/button/Button";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
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
import CollectReviewChangeDetails from "./CollectReviewChangeDetails";
import type { MarketReviewChangeNotice } from "./market-review-change-description";
import { resolveCollectContractIdentity } from "./collect-contract-identity";
import { collectProfileWallets } from "./collect-recipient.helpers";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import { marketBatchStage } from "./market-batch.adapters";
import type { CollectTradeStage } from "./collect.types";
import { useCollectPlanMetadata } from "./CollectPlanMetadataProvider";
import CollectTransactionReceipt from "./CollectTransactionReceipt";
import { isCollectReceiptOperation } from "./collect-receipt.helpers";

function focusReviewHeading(element: HTMLHeadingElement | null) {
  element?.focus();
}

function assetContract(item: ApiMarketBatchItem) {
  const [chain, address] = item.asset_key.split(":");
  return { chainId: chain === "1" ? 1 : undefined, address };
}

function QuotedItem({
  item,
  asset,
  locale,
  recipients,
  onRemove,
  disabled,
}: {
  readonly item: ApiMarketBatchItem;
  readonly asset: ApiCollectAsset | undefined;
  readonly locale: SupportedLocale;
  readonly recipients: ReactNode;
  readonly onRemove?: (() => void) | undefined;
  readonly disabled: boolean;
}) {
  return (
    <li className="tw-space-y-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-5">
      <div className="tw-flex tw-items-start tw-gap-4">
        {asset && (
          <div className="tw-relative tw-flex tw-size-20 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
            <CollectAssetMedia src={asset.image_url} name={asset.name} />
          </div>
        )}
        <div className="tw-min-w-0 tw-flex-1 tw-space-y-1">
          <p className="tw-m-0 tw-break-words tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
            {asset?.name ?? item.asset_key}
          </p>
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "collect.batchReview.quotedQuantity", {
              quantity: formatDecimalString(locale, item.quantity),
            })}
          </p>
          <p className="tw-m-0 tw-break-words tw-text-sm tw-font-normal tw-tabular-nums tw-text-iron-100">
            <Money wei={item.amount_wei} currency="ETH" compact />
          </p>
        </div>
        {onRemove && (
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            aria-label={t(locale, "collect.checkout.removeArtwork", {
              title: asset?.name ?? item.asset_key,
            })}
            className="tw-min-h-11 tw-shrink-0 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-40 desktop-hover:hover:tw-text-white"
          >
            {t(locale, "collect.checkout.remove")}
          </button>
        )}
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
  readonly knownTransactionHash?: string | undefined;
  readonly reviewChangeNotice?: MarketReviewChangeNotice | undefined;
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
  readonly onRemove?: ((index: number) => Promise<boolean>) | undefined;
  readonly onAllRecipientsChange?:
    | ((recipient: string, acknowledgeExternal: boolean) => Promise<boolean>)
    | undefined;
  readonly stage?: CollectTradeStage | null | undefined;
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
  knownTransactionHash,
  reviewChangeNotice,
  walletNames,
  onConfirm,
  onEdit,
  onClose,
  onRecipientChange,
  onRecipientEditingChange,
  onRemove,
  onAllRecipientsChange,
  stage,
}: CollectBatchQuoteReviewProps) {
  const locale = useBrowserLocale();
  const metadata = useCollectPlanMetadata();
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
  const hasExternalRecipient = operation.items.some((item) =>
    item.allocations.some(
      (allocation) => allocation.recipient_in_profile === false
    )
  );
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
  const destinations = operation.items.flatMap((item) => item.allocations);
  const assetFor = (item: ApiMarketBatchItem) =>
    itemFor(item)?.asset ?? metadata.assets.get(item.asset_key);
  if (isCollectReceiptOperation(operation, knownTransactionHash)) {
    return (
      <CollectTransactionReceipt
        operation={operation}
        knownTransactionHash={knownTransactionHash}
        spacious
        onClose={onClose}
        walletNames={walletNames}
        artworks={operation.items.map((item) => {
          const asset = assetFor(item);
          return {
            assetKey: item.asset_key,
            title: asset?.name ?? "",
            media: asset ? (
              <CollectAssetMedia src={asset.image_url} name={asset.name} />
            ) : undefined,
            quantity: item.quantity,
            orderHash: item.order.order_hash,
            recipients: item.allocations.map((allocation) => ({
              address: allocation.recipient,
              quantity: allocation.quantity,
            })),
          };
        })}
      />
    );
  }
  const recipientCounts = new Map<string, number>();
  for (const allocation of destinations) {
    const address = allocation.recipient.toLowerCase();
    recipientCounts.set(address, (recipientCounts.get(address) ?? 0) + 1);
  }
  const commonRecipient = destinations.reduce<
    (typeof destinations)[number] | undefined
  >(
    (common, allocation) =>
      !common ||
      (recipientCounts.get(allocation.recipient.toLowerCase()) ?? 0) >
        (recipientCounts.get(common.recipient.toLowerCase()) ?? 0)
        ? allocation
        : common,
    undefined
  );
  const uniformDelivery =
    commonRecipient &&
    destinations.every(
      (allocation) =>
        allocation.recipient.toLowerCase() ===
        commonRecipient.recipient.toLowerCase()
    );
  return (
    <section
      aria-label={t(locale, "collect.batchReview.quoteTitle")}
      className="tw-grid tw-min-w-0 tw-items-start tw-gap-x-12 tw-gap-y-6 tw-pb-32 lg:tw-grid-cols-[minmax(0,1fr)_360px] lg:tw-pb-0"
    >
      <div className="tw-space-y-2 lg:tw-col-span-2">
        <h2
          ref={focusReviewHeading}
          tabIndex={-1}
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100 sm:tw-text-3xl"
        >
          {t(locale, "collect.batchReview.quoteTitle")}
        </h2>
        <p role="status" className="tw-m-0 tw-text-xs tw-text-iron-300">
          {t(
            locale,
            `collect.trade.stage.${stage ?? marketBatchStage(operation)}`
          )}
        </p>
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.batchReview.atomic")}
        </p>
      </div>
      <div className="tw-min-w-0">
        <ul className="tw-m-0 tw-list-none tw-p-0">
          {operation.items.map((item, itemIndex) => (
            <QuotedItem
              key={`${item.order.protocol_address}:${item.order.order_hash}`}
              item={item}
              asset={assetFor(item)}
              locale={locale}
              disabled={recipientDisabled || activeRecipient !== null}
              onRemove={
                onRemove
                  ? () => {
                      if (
                        !recipientDisabled &&
                        editingRecipient.current === null
                      )
                        void onRemove(itemIndex);
                    }
                  : undefined
              }
              recipients={
                <details
                  className="tw-min-w-0"
                  open={
                    item.allocations.some(
                      (allocation) =>
                        allocation.recipient.toLowerCase() !==
                        commonRecipient?.recipient.toLowerCase()
                    ) || activeRecipient?.startsWith(`${itemIndex}:`) === true
                  }
                >
                  <summary className="tw-ml-24 tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-xs tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                    {t(locale, "collect.checkout.deliveryDetails")}
                  </summary>
                  {item.allocations.map((allocation, allocationIndex) => {
                    const key = `${itemIndex}:${allocationIndex}`;
                    const label = t(
                      locale,
                      "collect.batchReview.deliveryCopies",
                      {
                        quantity: formatDecimalString(
                          locale,
                          allocation.quantity
                        ),
                      }
                    );
                    const name =
                      walletNames?.[allocation.recipient.toLowerCase()];
                    return onRecipientChange && profile ? (
                      <CollectReviewRecipient
                        key={key}
                        label={label}
                        address={allocation.recipient}
                        name={name}
                        profile={profile}
                        payingWallet={operation.wallet}
                        recipientInProfile={
                          allocation.recipient_in_profile === true
                        }
                        disabled={
                          recipientDisabled ||
                          (activeRecipient !== null && activeRecipient !== key)
                        }
                        onEditingChange={(editing) =>
                          changeEditing(key, editing)
                        }
                        onApply={async (recipient, acknowledgeExternal) => {
                          if (
                            recipientDisabled ||
                            editingRecipient.current !== key
                          )
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
                </details>
              }
            />
          ))}
        </ul>
        <output
          aria-live="polite"
          className={
            hasExternalRecipient
              ? "tw-m-0 tw-block tw-text-xs tw-leading-5 tw-text-iron-400"
              : "tw-sr-only"
          }
        >
          {hasExternalRecipient ? t(locale, "collect.review.giftOutcome") : ""}
        </output>
      </div>
      <div className="tw-min-w-0 lg:tw-self-stretch">
        <aside
          className="tw-min-w-0 tw-space-y-5 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.02] tw-p-5 sm:tw-p-6 lg:tw-sticky lg:tw-top-24"
          aria-label={t(locale, "collect.checkout.summary")}
        >
          <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
            {t(locale, "collect.checkout.summary")}
          </h3>
          {commonRecipient && onAllRecipientsChange && profile && (
            <CollectReviewRecipient
              label={t(
                locale,
                uniformDelivery
                  ? "collect.checkout.deliverAll"
                  : "collect.checkout.changeAll"
              )}
              address={commonRecipient.recipient}
              name={walletNames?.[commonRecipient.recipient.toLowerCase()]}
              profile={profile}
              payingWallet={operation.wallet}
              recipientInProfile={commonRecipient.recipient_in_profile === true}
              disabled={
                recipientDisabled ||
                (activeRecipient !== null && activeRecipient !== "all")
              }
              onEditingChange={(editing) => changeEditing("all", editing)}
              onApply={(recipient, acknowledged) =>
                recipientDisabled || editingRecipient.current !== "all"
                  ? Promise.resolve(false)
                  : onAllRecipientsChange(recipient, acknowledged)
              }
            />
          )}
          {commonRecipient &&
            uniformDelivery &&
            (!onAllRecipientsChange || !profile) && (
              <CollectReviewWallet
                label={t(locale, "collect.checkout.deliverAll")}
                address={commonRecipient.recipient}
                name={walletNames?.[commonRecipient.recipient.toLowerCase()]}
              />
            )}
          {!uniformDelivery && (
            <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(locale, "collect.checkout.deliveryExceptions")}
            </p>
          )}
          <dl className="tw-m-0 tw-space-y-3">
            <AmountRow label={t(locale, "collect.batchReview.purchaseTotal")}>
              <Money wei={operation.total_wei} currency="ETH" compact />
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
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.review.maximumNote")}
          </p>
          {message && (
            <p
              role="status"
              className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300"
            >
              {message}
            </p>
          )}
          {message && reviewChangeNotice && (
            <CollectReviewChangeDetails notice={reviewChangeNotice} />
          )}
          {disabledReason && (
            <p
              role="status"
              className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300"
            >
              {disabledReason}
            </p>
          )}
          <div className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-10 tw-space-y-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4 tw-pb-[max(1rem,env(safe-area-inset-bottom))] lg:tw-static lg:tw-bg-transparent lg:tw-px-0 lg:tw-pb-0">
            {maximum !== null && (
              <dl className="tw-m-0">
                <AmountRow
                  prominent
                  label={t(locale, "collect.review.maximum")}
                >
                  <Money wei={maximum} currency="ETH" cap capDecimals={5} />
                </AmountRow>
              </dl>
            )}
            <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-2 lg:tw-flex lg:tw-flex-wrap">
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
              {canEdit && !onRemove && (
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
              <Button
                variant="secondary"
                size="lg"
                disabled={busy}
                onClick={onClose}
              >
                {t(locale, "collect.batchReview.close")}
              </Button>
            </div>
          </div>
        </aside>
      </div>
      <div className="tw-min-w-0 lg:tw-col-span-2">
        <CollectReviewDisclosure
          label={t(locale, "collect.review.priceDetails")}
        >
          {operation.items.map((item) => (
            <div
              key={`${item.order.protocol_address}:${item.order.order_hash}`}
              className="tw-space-y-3"
            >
              <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-200">
                {assetFor(item)?.name ?? item.asset_key}
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
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.batchReview.gasNote")}
          </p>
          <CollectReviewDisclosure
            label={t(locale, "collect.review.exactAmounts")}
            nested
          >
            <dl className="tw-m-0 tw-space-y-3">
              {operation.items.map((item) => (
                <AmountRow
                  key={`${item.order.protocol_address}:${item.order.order_hash}`}
                  label={assetFor(item)?.name ?? item.asset_key}
                >
                  <Money wei={item.amount_wei} currency="ETH" />
                </AmountRow>
              ))}
              <AmountRow label={t(locale, "collect.batchReview.purchaseTotal")}>
                <Money wei={operation.total_wei} currency="ETH" />
              </AmountRow>
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
                {assetFor(item)?.name ?? item.asset_key}
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
