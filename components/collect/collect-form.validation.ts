import type {
  CollectGoalDraft,
  CollectTradeAction,
  CollectTradeDraft,
} from "./collect.types";
import { isAddress, zeroAddress } from "viem";

export function isPositiveEthAmount(value: string): boolean {
  const parts = value.split(".");
  if (parts.length > 2) return false;
  const [whole, fraction] = parts;
  if (whole === undefined || (whole !== "0" && !/^[1-9]\d{0,20}$/.test(whole)))
    return false;
  if (fraction !== undefined && !/^\d{1,18}$/.test(fraction)) return false;
  return /[1-9]/.test(value);
}

const isPositiveWholeQuantity = (value: string): boolean =>
  /^[1-9]\d{0,2}$/.test(value) && BigInt(value) <= 100n;

export function validateCollectGoal(
  draft: CollectGoalDraft,
  requireBudget = true
): "definition" | "quantity" | "budget" | null {
  if (!draft.definitionId && draft.intent !== "tdh") return "definition";
  if (!isPositiveWholeQuantity(draft.targetCount)) return "quantity";
  if (requireBudget && !isPositiveEthAmount(draft.budgetEth)) return "budget";
  return null;
}

export function validateCollectTrade(
  draft: CollectTradeDraft,
  action: CollectTradeAction,
  maxQuantity: string
): "quantity" | "price" | "recipient" | "expiry" | null {
  if (action === "cancel") return null;
  if (
    !/^[1-9]\d{0,20}$/.test(draft.quantity) ||
    !/^[1-9]\d{0,20}$/.test(maxQuantity) ||
    BigInt(draft.quantity) > BigInt(maxQuantity)
  )
    return "quantity";
  if (
    (action === "list" || action === "offer") &&
    !isPositiveEthAmount(draft.unitPriceEth)
  )
    return "price";
  if (
    (action === "list" || action === "offer") &&
    !["24", "168", "720"].includes(draft.expiryHours)
  )
    return "expiry";
  if (
    action === "buy" &&
    (!isAddress(draft.recipient) ||
      draft.recipient.toLowerCase() === zeroAddress)
  )
    return "recipient";
  return null;
}
