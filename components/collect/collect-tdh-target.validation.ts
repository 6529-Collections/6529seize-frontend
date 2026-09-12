import { parseEther } from "viem";
import type {
  CollectTdhTargetDraft,
  CollectTdhTargetField,
} from "./collect-tdh-target.types";

export function parseCollectTdhTarget(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d{1,16}$/.test(trimmed)) return null;
  const amount = BigInt(trimmed);
  return amount <= BigInt(Number.MAX_SAFE_INTEGER) ? amount.toString() : null;
}

export function parseCollectTdhTargetBudget(
  value: string
): string | undefined | null {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  if (trimmed.length > 100 || !/^(0|[1-9]\d*)(?:\.\d{1,18})?$/.test(trimmed))
    return null;
  const amount = parseEther(trimmed);
  return amount < 2n ** 256n ? amount.toString() : null;
}

export function validateCollectTdhTargetDraft(
  draft: CollectTdhTargetDraft
): CollectTdhTargetField | undefined {
  if (parseCollectTdhTarget(draft.targetTdh) === null) return "target";
  if (parseCollectTdhTargetBudget(draft.budgetEth) === null) return "budget";
  return undefined;
}
