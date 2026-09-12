import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { MARKET_WETH } from "./market-validation";

const UINT = /^(0|[1-9][0-9]{0,77})$/;
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
