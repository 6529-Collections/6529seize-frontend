"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatDecimalString } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { ReactNode } from "react";
import type { CollectTradeReview } from "./collect.types";
import { collectAssetIdentity } from "./collect.adapters";
import CollectReviewWallet from "./CollectReviewWallet";
import CollectReviewContract from "./CollectReviewContract";
import {
  CollectReviewAmountRow,
  CollectReviewDisclosure,
  CollectReviewMoney,
} from "./CollectReviewPrimitives";
import { MARKET_SEAPORT, MARKET_ZERO } from "./market-validation";

/** Presentation of the same immutable operation validated by the execution controller. */
export default function CollectOrderSummary({
  review,
  actionSlot,
}: {
  readonly review: CollectTradeReview;
  readonly actionSlot: ReactNode;
}) {
  const locale = useBrowserLocale();
  const view = review.orderReview;
  if (!view) return null;
  const { operation, walletName } = view;
  const identity = collectAssetIdentity(operation.asset_key);
  const [chain, contract] = operation.asset_key.split(":");
  const currency =
    operation.currency.toLowerCase() === MARKET_ZERO ? "ETH" : "WETH";
  const offering = review.action === "offer";
  const cancelling = review.action === "cancel";
  const walletLabel = offering
    ? "collect.review.payWith"
    : "collect.review.sellFrom";
  const collection = identity
    ? t(locale, `collect.collection.${identity.family}`)
    : t(locale, "collect.trade.asset");
  const transactions = [
    ...operation.approval_transactions,
    ...(operation.transaction ? [operation.transaction] : []),
  ];
  const knownGas =
    transactions.length > 0 &&
    transactions.every(
      (transaction) => transaction.gas_reserve_wei !== undefined
    );
  const gas = knownGas
    ? transactions
        .reduce(
          (sum, transaction) => sum + BigInt(transaction.gas_reserve_wei!),
          0n
        )
        .toString()
    : null;
  return (
    <section className="tw-space-y-5">
      <div className="tw-flex tw-items-center tw-gap-3">
        {review.media !== null && review.media !== undefined && (
          <div className="tw-relative tw-flex tw-size-16 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
            {review.media}
          </div>
        )}
        <div className="tw-min-w-0">
          <h2 className="tw-m-0 tw-break-words tw-text-lg tw-font-semibold tw-leading-6 tw-tracking-tight">
            {review.title}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
            {collection}
            {identity ? ` #${identity.tokenId}` : ""} ·{" "}
            {t(locale, "collect.review.copies", {
              quantity: formatDecimalString(locale, operation.quantity),
            })}
          </p>
        </div>
      </div>
      <dl className="tw-m-0 tw-space-y-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5">
        <CollectReviewAmountRow
          label={t(locale, `collect.review.total.${review.action}`)}
          prominent
        >
          <CollectReviewMoney wei={operation.total_wei} currency={currency} />
        </CollectReviewAmountRow>
        {!offering && !cancelling && (
          <CollectReviewAmountRow label={t(locale, "collect.review.orderNet")}>
            <CollectReviewMoney wei={operation.net_wei} currency={currency} />
          </CollectReviewAmountRow>
        )}
        {gas !== null && (
          <CollectReviewAmountRow
            label={t(locale, "collect.review.networkCap")}
          >
            <CollectReviewMoney wei={gas} currency="ETH" cap />
          </CollectReviewAmountRow>
        )}
      </dl>
      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-2">
        <CollectReviewWallet
          label={t(
            locale,
            cancelling ? "collect.review.signWith" : walletLabel
          )}
          address={operation.wallet}
          name={walletName}
        />
        {!cancelling && (
          <CollectReviewWallet
            label={t(
              locale,
              offering ? "collect.review.deliverTo" : "collect.review.receiveTo"
            )}
            address={operation.wallet}
            name={walletName}
          />
        )}
      </div>
      {operation.order && (
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.trade.orderEnds")}:{" "}
          {formatDate(
            locale,
            Number(operation.order.components.end_time) * 1000,
            { dateStyle: "medium", timeStyle: "short" }
          )}
        </p>
      )}
      {(offering || review.action === "list") && (
        <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.trade.orderWarning")}
        </p>
      )}
      {cancelling && (
        <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.trade.cancelWarning")}
        </p>
      )}
      {actionSlot}
      <div>
        <CollectReviewDisclosure
          label={t(locale, "collect.review.priceDetails")}
        >
          <dl className="tw-m-0 tw-space-y-3">
            <CollectReviewAmountRow
              label={t(locale, "collect.trade.sellerReceives")}
            >
              <CollectReviewMoney wei={operation.net_wei} currency={currency} />
            </CollectReviewAmountRow>
            {operation.fees.map((fee, index) => (
              <CollectReviewAmountRow
                key={`${fee.recipient}-${index}`}
                label={t(locale, "collect.review.fee")}
              >
                <CollectReviewMoney wei={fee.amount_wei} currency={currency} />
              </CollectReviewAmountRow>
            ))}
            {offering && (
              <CollectReviewAmountRow
                label={t(locale, "collect.trade.liability")}
              >
                <CollectReviewMoney
                  wei={operation.potential_liability_wei}
                  currency={currency}
                />
              </CollectReviewAmountRow>
            )}
          </dl>
          <CollectReviewDisclosure
            label={t(locale, "collect.review.exactAmounts")}
            nested
          >
            <dl className="tw-m-0 tw-space-y-3">
              {transactions.map((transaction, index) => (
                <CollectReviewAmountRow
                  key={`${transaction.purpose}-${index}`}
                  label={`${t(locale, "collect.trade.gasCap")} ${formatDecimalString(locale, String(index + 1))}`}
                >
                  {transaction.gas_reserve_wei ? (
                    <CollectReviewMoney
                      wei={transaction.gas_reserve_wei}
                      currency="ETH"
                    />
                  ) : (
                    t(locale, "collect.review.gasUnknown")
                  )}
                </CollectReviewAmountRow>
              ))}
            </dl>
          </CollectReviewDisclosure>
        </CollectReviewDisclosure>
        <CollectReviewDisclosure
          label={t(locale, "collect.review.contractDetails")}
        >
          {contract && (
            <CollectReviewContract
              chainId={Number(chain)}
              address={contract}
              role="nft"
            />
          )}
          <CollectReviewContract
            chainId={Number(chain)}
            address={operation.order?.protocol_address ?? MARKET_SEAPORT}
            role="exchange"
          />
          {Array.from(new Set(operation.fees.map((fee) => fee.recipient))).map(
            (address) => (
              <CollectReviewContract
                key={address}
                chainId={Number(chain)}
                address={address}
                role="fee"
              />
            )
          )}
          <CollectReviewDisclosure
            label={t(locale, "collect.review.orderTerms")}
            nested
          >
            <dl className="tw-m-0 tw-space-y-3">
              {[...review.facts, ...review.technicalFacts].map(
                (fact, index) => (
                  <div key={`${fact.label}-${index}`}>
                    <dt className="tw-text-xs tw-text-iron-400">
                      {fact.label}
                    </dt>
                    <dd className="tw-m-0 tw-mt-1 tw-select-text tw-text-[13px] tw-leading-5 tw-text-iron-200 [overflow-wrap:anywhere]">
                      {fact.value}
                    </dd>
                  </div>
                )
              )}
            </dl>
          </CollectReviewDisclosure>
        </CollectReviewDisclosure>
      </div>
    </section>
  );
}
