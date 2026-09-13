import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import { formatDecimalString } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { formatUnits, zeroAddress } from "viem";
import { formatCollectReviewWei } from "./collect-review-amounts";
import { resolveCollectContractIdentity } from "./collect-contract-identity";
import { MARKET_WETH } from "./market-validation";

type Review = ApiMarketOperation | ApiMarketBatchOperation;

function amount(value: string | undefined): bigint | null {
  return value !== undefined && /^(0|[1-9]\d{0,77})$/.test(value)
    ? BigInt(value)
    : null;
}

function sum(values: readonly (string | undefined)[]): bigint | null {
  let total = 0n;
  for (const value of values) {
    const parsed = amount(value);
    if (parsed === null) return null;
    total += parsed;
  }
  return total;
}

function currency(review: Review): "ETH" | "WETH" | null {
  if (review.currency.toLowerCase() === zeroAddress) return "ETH";
  return review.currency.toLowerCase() === MARKET_WETH ? "WETH" : null;
}

function fees(review: Review): bigint | null {
  if ("fees" in review) return sum(review.fees.map((fee) => fee.amount_wei));
  if (review.items.some((item) => item.fees === undefined)) return null;
  return sum(
    review.items.flatMap((item) => item.fees!.map((fee) => fee.amount_wei))
  );
}

function gas(review: Review): bigint | null {
  if (!review.transaction) return null;
  return sum([
    review.transaction.gas_reserve_wei,
    ...review.approval_transactions.map((tx) => tx.gas_reserve_wei),
  ]);
}

function maximum(review: Review): bigint | null {
  const reserve = gas(review);
  const total = amount(review.total_wei);
  if (
    !["BUY", "BUY_BATCH"].includes(review.kind) ||
    currency(review) !== "ETH" ||
    reserve === null ||
    total === null ||
    amount(review.transaction?.value) !== total ||
    sum(review.approval_transactions.map((tx) => tx.value)) !== 0n
  )
    return null;
  return total + reserve;
}

function artwork(assetKey: string): string {
  const [chain, contract, token] = assetKey.split(":");
  if (chain !== "1" || !contract || !token) return assetKey;
  const name = resolveCollectContractIdentity(1, contract, "nft").name;
  return name ? `${name} #${token}` : assetKey;
}

function items(review: Review) {
  return "items" in review
    ? review.items.map((item) => ({
        ...item,
        key: `${item.asset_key}:${item.order.protocol_address.toLowerCase()}:${item.order.order_hash.toLowerCase()}`,
      }))
    : [{ ...review, key: review.asset_key, amount_wei: review.total_wei }];
}

function quantityChanges(
  shown: Review,
  fresh: Review,
  locale: SupportedLocale
): string[] {
  const before = items(shown);
  const after = items(fresh);
  const changes: string[] = [];
  for (const item of after) {
    const previous = before.find((value) => value.key === item.key);
    if (!previous || previous.quantity === item.quantity) continue;
    if (amount(previous.quantity) === null || amount(item.quantity) === null)
      continue;
    changes.push(
      t(locale, "collect.trade.changedQuantity", {
        artwork: artwork(item.asset_key),
        before: formatDecimalString(locale, previous.quantity),
        after: formatDecimalString(locale, item.quantity),
      })
    );
  }
  return changes;
}

function destinations(review: Review): string {
  if ("items" in review)
    return JSON.stringify(
      review.items.map((item) => ({
        asset: item.asset_key,
        allocations: item.allocations.map((allocation) => ({
          recipient: allocation.recipient.toLowerCase(),
          quantity: allocation.quantity,
        })),
      }))
    );
  return JSON.stringify([
    review.recipient.toLowerCase(),
    review.nft_recipient?.toLowerCase(),
  ]);
}

/** Explain only differences present in the two validated snapshots. Never authorizes a send. */
export function marketReviewChangeDescription(
  shown: Review,
  fresh: Review,
  locale: SupportedLocale,
  change: "terms" | "gas"
): string {
  const changes = quantityChanges(shown, fresh, locale);
  const addAmount = (
    key: MessageKey,
    before: bigint | null,
    after: bigint | null,
    unit: string
  ) => {
    if (before === null || after === null || before === after) return;
    changes.push(
      t(locale, key, {
        before: formatCollectReviewWei(locale, before.toString()),
        after: formatCollectReviewWei(locale, after.toString()),
        currency: unit,
      })
    );
  };
  const unit = currency(shown);
  if (unit && unit === currency(fresh)) {
    addAmount(
      "collect.trade.changedPrice",
      amount(shown.total_wei),
      amount(fresh.total_wei),
      unit
    );
    addAmount("collect.trade.changedFees", fees(shown), fees(fresh), unit);
  }
  if (destinations(shown) !== destinations(fresh))
    changes.push(t(locale, "collect.trade.changedDelivery"));
  if (shown.currency.toLowerCase() !== fresh.currency.toLowerCase())
    changes.push(t(locale, "collect.trade.changedCurrency"));
  addAmount("collect.trade.changedNetworkFee", gas(shown), gas(fresh), "ETH");
  addAmount(
    "collect.trade.changedMaximum",
    maximum(shown),
    maximum(fresh),
    "ETH"
  );
  if (change === "gas") {
    const explainDecreases = changes.length === 0;
    const before = shown.transaction;
    const after = fresh.transaction;
    for (const key of ["gas_limit", "max_fee_per_gas"] as const) {
      const previous = amount(before?.[key]);
      const current = amount(after?.[key]);
      if (
        previous === null ||
        current === null ||
        previous === current ||
        (!explainDecreases && current < previous)
      )
        continue;
      const format = (value: bigint) =>
        formatDecimalString(
          locale,
          key === "max_fee_per_gas" ? formatUnits(value, 9) : value.toString()
        );
      changes.push(
        t(
          locale,
          key === "gas_limit"
            ? "collect.trade.changedGasLimit"
            : "collect.trade.changedGasPrice",
          {
            before: format(previous),
            after: format(current),
          }
        )
      );
    }
  }
  if (changes.length === 0)
    return t(
      locale,
      change === "gas"
        ? "collect.trade.gasChanged"
        : "collect.trade.refreshReview"
    );
  return `${changes.join(" ")} ${t(locale, "collect.trade.reviewUpdatedTerms")}`;
}
