"use client";

import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import { ApiMarketBatchOperationKindEnum } from "@/generated/models/ApiMarketBatchOperation";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatDecimalString } from "@/i18n/format";
import { t } from "@/i18n/messages";
import CollectReviewContract from "./CollectReviewContract";
import {
  CollectReviewAmountRow as AmountRow,
  CollectReviewDisclosure,
  CollectReviewMoney as Money,
} from "./CollectReviewPrimitives";
import {
  collectReceiptTransactionHref,
  type CollectReceiptOperation,
} from "./collect-receipt.helpers";
import { MARKET_SEAPORT, MARKET_ZERO } from "./market-validation";

export default function CollectReceiptDetails({
  operation,
}: {
  readonly operation: CollectReceiptOperation;
}) {
  const locale = useBrowserLocale();
  const receipt = operation.receipt;
  const payment = receipt?.payment;
  const currency =
    (payment?.currency ?? operation.currency).toLowerCase() === MARKET_ZERO
      ? "ETH"
      : "WETH";
  const listing = operation.state.toString() === "LIVE";
  const paymentUnavailable =
    operation.kind === ApiMarketKind.List &&
    operation.state.toString() === "CONFIRMED" &&
    !collectReceiptTransactionHref(
      operation.transaction_hash ?? operation.settlement?.transaction_hash
    );
  const fees =
    payment?.fees ??
    (listing && operation.kind !== ApiMarketBatchOperationKindEnum.BuyBatch
      ? operation.fees
      : []);
  const gross =
    payment?.total_wei ?? (listing ? operation.total_wei : undefined);
  const net =
    payment?.net_wei ??
    (listing && operation.kind !== ApiMarketBatchOperationKindEnum.BuyBatch
      ? operation.net_wei
      : undefined);
  const assets =
    operation.kind === ApiMarketBatchOperationKindEnum.BuyBatch
      ? operation.items.map((item) => ({
          assetKey: item.asset_key,
          orderHash: item.order.order_hash,
          protocol: item.order.protocol_address,
        }))
      : [
          {
            assetKey: operation.asset_key,
            orderHash: operation.order_hash ?? operation.order?.order_hash,
            protocol: operation.order?.protocol_address ?? MARKET_SEAPORT,
          },
        ];
  return (
    <div>
      <CollectReviewDisclosure label={t(locale, "collect.receipt.costs")}>
        <dl className="tw-m-0 tw-space-y-3">
          {gross !== undefined && (
            <AmountRow label={t(locale, "collect.review.price")}>
              <Money wei={gross} currency={currency} compact />
            </AmountRow>
          )}
          {net !== undefined && (
            <AmountRow label={t(locale, "collect.trade.sellerReceives")}>
              <Money wei={net} currency={currency} compact />
            </AmountRow>
          )}
          {fees.map((fee, index) => (
            <AmountRow
              key={`${fee.recipient}:${index}`}
              label={t(locale, "collect.review.fee")}
            >
              <Money wei={fee.amount_wei} currency={currency} compact />
            </AmountRow>
          ))}
        </dl>
        {!payment && !listing && (
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(
              locale,
              paymentUnavailable
                ? "collect.receipt.paymentUnavailable"
                : "collect.receipt.paymentPending"
            )}
          </p>
        )}
        {(gross !== undefined || net !== undefined) && (
          <CollectReviewDisclosure
            label={t(locale, "collect.receipt.exactAmounts")}
            nested
          >
            <dl className="tw-m-0 tw-space-y-3">
              {gross !== undefined && (
                <AmountRow label={t(locale, "collect.review.price")}>
                  <Money wei={gross} currency={currency} />
                </AmountRow>
              )}
              {net !== undefined && (
                <AmountRow label={t(locale, "collect.trade.sellerReceives")}>
                  <Money wei={net} currency={currency} />
                </AmountRow>
              )}
              {fees.map((fee, index) => (
                <AmountRow
                  key={`${fee.recipient}:${index}`}
                  label={t(locale, "collect.review.fee")}
                >
                  <Money wei={fee.amount_wei} currency={currency} />
                </AmountRow>
              ))}
            </dl>
          </CollectReviewDisclosure>
        )}
      </CollectReviewDisclosure>
      {receipt && receipt.transactions.length > 0 && (
        <CollectReviewDisclosure
          label={t(locale, "collect.receipt.networkTransactions")}
        >
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.receipt.costIncomplete")}
          </p>
          {receipt.transactions.map((transaction, index) => {
            const href = collectReceiptTransactionHref(
              transaction.transaction_hash
            );
            return (
              <div key={transaction.transaction_hash} className="tw-space-y-3">
                <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2">
                  <span className="tw-text-sm tw-font-medium tw-text-iron-100">
                    {t(
                      locale,
                      transaction.purpose.toString() === "APPROVAL"
                        ? "collect.receipt.approvalNumber"
                        : "collect.receipt.transactionNumber",
                      { number: formatDecimalString(locale, String(index + 1)) }
                    )}
                  </span>
                  <span className="tw-text-xs tw-text-iron-400">
                    {t(
                      locale,
                      `collect.receipt.networkStatus.${transaction.status}`
                    )}
                  </span>
                </div>
                <dl className="tw-m-0 tw-space-y-3">
                  <AmountRow label={t(locale, "collect.receipt.paidWith")}>
                    <span className="tw-select-text tw-break-all tw-font-mono tw-text-xs">
                      {transaction.payer_wallet}
                    </span>
                  </AmountRow>
                  <AmountRow label={t(locale, "collect.receipt.networkFee")}>
                    {transaction.network_fee_wei === undefined ? (
                      t(locale, "collect.receipt.costUnavailable")
                    ) : (
                      <Money wei={transaction.network_fee_wei} currency="ETH" />
                    )}
                  </AmountRow>
                  <AmountRow label={t(locale, "collect.receipt.confirmedAt")}>
                    {formatDate(locale, transaction.block_timestamp * 1000, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </AmountRow>
                  <AmountRow label={t(locale, "collect.receipt.block")}>
                    {formatDecimalString(
                      locale,
                      String(transaction.block_number)
                    )}
                  </AmountRow>
                  {transaction.gas_used !== undefined && (
                    <AmountRow label={t(locale, "collect.receipt.gasUsed")}>
                      {formatDecimalString(locale, transaction.gas_used)}
                    </AmountRow>
                  )}
                  {transaction.effective_gas_price_wei !== undefined && (
                    <AmountRow label={t(locale, "collect.receipt.gasPrice")}>
                      {formatDecimalString(
                        locale,
                        transaction.effective_gas_price_wei
                      )}
                    </AmountRow>
                  )}
                </dl>
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-sm tw-text-xs tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                  >
                    {t(locale, "collect.receipt.transaction")}
                  </a>
                )}
                <p className="tw-m-0 tw-select-text tw-break-all tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-400">
                  {transaction.transaction_hash}
                </p>
              </div>
            );
          })}
        </CollectReviewDisclosure>
      )}
      <CollectReviewDisclosure label={t(locale, "collect.receipt.contracts")}>
        {Array.from(
          new Map(
            assets.map((asset) => [
              asset.assetKey.split(":").slice(0, 2).join(":"),
              asset,
            ])
          ).values()
        ).map((asset) => {
          const [chain, contract] = asset.assetKey.split(":");
          return contract ? (
            <CollectReviewContract
              key={contract}
              chainId={Number(chain)}
              address={contract}
              role="nft"
            />
          ) : null;
        })}
        {Array.from(new Set(assets.map((asset) => asset.protocol))).map(
          (address) => (
            <CollectReviewContract
              key={address}
              chainId={1}
              address={address}
              role="exchange"
            />
          )
        )}
        {Array.from(new Set(fees.map((fee) => fee.recipient))).map(
          (address) => (
            <CollectReviewContract
              key={address}
              chainId={1}
              address={address}
              role="fee"
            />
          )
        )}
        <dl className="tw-m-0 tw-space-y-3">
          {assets
            .filter((asset) => asset.orderHash)
            .map((asset) => (
              <AmountRow
                key={`${asset.assetKey}:${asset.orderHash ?? ""}`}
                label={t(locale, "collect.receipt.orderHash")}
              >
                <span className="tw-select-text tw-font-mono tw-text-xs">
                  {asset.orderHash}
                </span>
              </AmountRow>
            ))}
        </dl>
      </CollectReviewDisclosure>
    </div>
  );
}
