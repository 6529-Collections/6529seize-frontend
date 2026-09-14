import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import {
  marketGasCapsWithinReview,
  withReviewedGasCaps,
} from "./market-review-caps";

export function marketReviewChange(
  shown: ApiMarketOperation,
  fresh: ApiMarketOperation
): "terms" | "gas" | null {
  const masked = {
    ...fresh,
    ...(fresh.transaction && shown.transaction
      ? {
          transaction: withReviewedGasCaps(
            fresh.transaction,
            shown.transaction
          ),
        }
      : {}),
    approval_transactions: fresh.approval_transactions.map((tx, index) =>
      shown.approval_transactions[index]
        ? withReviewedGasCaps(tx, shown.approval_transactions[index])
        : tx
    ),
  };
  if (marketReviewTerms(masked) !== marketReviewTerms(shown)) return "terms";
  return marketGasCapsWithinReview(shown.transaction, fresh.transaction) &&
    fresh.approval_transactions.every((tx, index) =>
      marketGasCapsWithinReview(shown.approval_transactions[index], tx)
    )
    ? null
    : "gas";
}

/** Quote refreshes may change zone authorization and timestamps, but never silently change economics. */
export function marketReviewTerms(operation: ApiMarketOperation): string {
  const transaction = operation.transaction;
  return JSON.stringify({
    profile: operation.profile_id,
    wallet: operation.wallet,
    kind: operation.kind,
    asset: operation.asset_key,
    quantity: operation.quantity,
    currency: operation.currency,
    recipient: operation.recipient,
    nftRecipient: operation.nft_recipient,
    total: operation.total_wei,
    net: operation.net_wei,
    fees: operation.fees,
    order: operation.order?.digest,
    approvals: operation.approval_transactions,
    transaction: transaction
      ? {
          sender: transaction.sender,
          to: transaction.to,
          value: transaction.value,
          purpose: transaction.purpose,
          gas: transaction.gas_limit,
          fee: transaction.max_fee_per_gas,
          reserve: transaction.gas_reserve_wei,
        }
      : null,
  });
}
