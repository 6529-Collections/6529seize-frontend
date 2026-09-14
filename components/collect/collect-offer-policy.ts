import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { MARKET_WETH } from "./market-validation";

const UINT = /^(0|[1-9][0-9]{0,77})$/;
const POSITIVE_UINT = /^[1-9][0-9]{0,77}$/;
const UINT256_MAX = (1n << 256n) - 1n;

function offerAmount(value: unknown): bigint {
  if (typeof value !== "string" || !UINT.test(value)) throwLimit();
  const amount = BigInt(value);
  if (amount > UINT256_MAX) throwLimit();
  return amount;
}

function throwLimit(): never {
  throw new Error("MARKET_OFFER_LIMIT_EXCEEDED");
}

function isCanonicalPositiveUint256(value: unknown): value is string {
  return (
    typeof value === "string" &&
    POSITIVE_UINT.test(value) &&
    BigInt(value) <= UINT256_MAX
  );
}

/** Enforce a caller-owned ceiling against the complete WETH offer amount. */
export function assertCollectOfferAmount(
  request: ApiMarketPrepareRequest,
  maximumOfferAmountWei?: string
): void {
  if (
    request.kind !== ApiMarketKind.Offer ||
    maximumOfferAmountWei === undefined
  )
    return;
  if (
    typeof request.currency !== "string" ||
    request.currency.toLowerCase() !== MARKET_WETH
  )
    throwLimit();
  if (offerAmount(request.amount_wei) > offerAmount(maximumOfferAmountWei))
    throwLimit();
}

/** Keep a caller-selected offer quantity fixed across every review boundary. */
export function assertCollectOfferQuantity(
  request: ApiMarketPrepareRequest,
  fixedOfferQuantity?: string
): void {
  if (request.kind !== ApiMarketKind.Offer || fixedOfferQuantity === undefined)
    return;
  if (
    !isCanonicalPositiveUint256(fixedOfferQuantity) ||
    !isCanonicalPositiveUint256(request.quantity) ||
    request.quantity !== fixedOfferQuantity
  )
    throw new Error("MARKET_OFFER_QUANTITY_CHANGED");
}
