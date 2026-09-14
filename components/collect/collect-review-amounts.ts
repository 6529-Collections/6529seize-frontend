import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { formatDecimalString } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { formatEther, zeroAddress } from "viem";

export type CollectPurchaseAmounts = Readonly<{
  purchaseWei: string;
  feesWei: string;
  networkFeeCapWei: string | null;
  maximumTotalWei: string | null;
}>;

function sumKnownWei(values: readonly (string | undefined)[]): bigint | null {
  let total = 0n;
  for (const value of values) {
    if (typeof value !== "string" || !/^(0|[1-9][0-9]{0,77})$/.test(value)) {
      return null;
    }
    total += BigInt(value);
  }
  return total;
}

/** Display only: the caller must validate the operation before reviewing it. */
export function buildCollectPurchaseAmounts(
  operation: ApiMarketOperation
): CollectPurchaseAmounts | null {
  if (operation.kind !== ApiMarketKind.Buy) return null;

  const purchase = BigInt(operation.total_wei);
  const fees = operation.fees.reduce(
    (total, fee) => total + BigInt(fee.amount_wei),
    0n
  );
  const primary = operation.transaction;
  const networkFeeCap = primary
    ? sumKnownWei([
        ...operation.approval_transactions.map(
          (approval) => approval.gas_reserve_wei
        ),
        primary.gas_reserve_wei,
      ])
    : null;
  let maximumTotal: bigint | null = null;
  if (
    primary &&
    networkFeeCap !== null &&
    operation.currency.toLowerCase() === zeroAddress
  ) {
    const approvalValue = sumKnownWei(
      operation.approval_transactions.map((approval) => approval.value)
    );
    // Paid approvals are unsupported. The native purchase value and fees are
    // already included in the price, so neither is added a second time.
    if (approvalValue === 0n && sumKnownWei([primary.value]) === purchase) {
      maximumTotal = purchase + networkFeeCap;
    }
  }

  return {
    purchaseWei: operation.total_wei,
    feesWei: fees.toString(),
    networkFeeCapWei: networkFeeCap?.toString() ?? null,
    maximumTotalWei: maximumTotal?.toString() ?? null,
  };
}

/** Exact localized decimal units; the caller supplies the currency label. */
export function formatCollectReviewWei(
  locale: SupportedLocale,
  wei: string
): string {
  return formatDecimalString(locale, formatEther(BigInt(wei)));
}

/** Round upward so a compact eight-decimal display never understates a cap. */
export function formatCollectNetworkFeeCap(
  locale: SupportedLocale,
  wei: string
): string {
  const precision = 10n ** 10n;
  const rounded = ((BigInt(wei) + precision - 1n) / precision) * precision;
  return formatCollectReviewWei(locale, rounded.toString());
}
