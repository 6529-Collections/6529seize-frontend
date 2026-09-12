import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatDecimalString } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatEther, isAddress, zeroAddress } from "viem";
import type {
  CollectBatchAllocation,
  CollectBatchDraftItem,
} from "./collect-batch.types";
import {
  collectProfileWallets,
  isCollectProfileWallet,
} from "./collect-recipient.helpers";
import type { CollectSelectedListing } from "./collect-selection.helpers";

export function collectBatchEthAmount(locale: SupportedLocale, amount: string) {
  return t(locale, "collect.batchReview.ethAmount", {
    amount: formatDecimalString(locale, formatEther(BigInt(amount))),
  });
}

export function collectAllocationQuantity(value: string): bigint | null {
  if (!/^[1-9][0-9]{0,77}$/.test(value)) return null;
  const quantity = BigInt(value);
  return quantity < 2n ** 256n ? quantity : null;
}

export function collectAllocationIssue(
  allocations: readonly CollectBatchAllocation[],
  quantity: string,
  profile: ApiIdentity | null
): "recipient" | "quantity" | "duplicate" | "consent" | null {
  const expected = collectAllocationQuantity(quantity);
  if (expected === null || allocations.length === 0) return "quantity";
  let total = 0n;
  const addresses = new Set<string>();
  for (const allocation of allocations) {
    const address = allocation.recipient.toLowerCase();
    if (!isAddress(allocation.recipient) || address === zeroAddress)
      return "recipient";
    if (addresses.has(address)) return "duplicate";
    addresses.add(address);
    const copies = collectAllocationQuantity(allocation.quantity);
    if (copies === null) return "quantity";
    total += copies;
    if (
      !isCollectProfileWallet(profile, address) &&
      !allocation.acknowledgeExternalRecipient
    )
      return "consent";
  }
  return total === expected ? null : "quantity";
}

export function collectBatchReviewIssue(
  items: readonly CollectBatchDraftItem[],
  profile: ApiIdentity | null,
  maxItems: number,
  maxAllocations: number
) {
  if (items.length === 0) return "empty";
  if (items.length > maxItems) return "limit";
  if (
    items.reduce((count, item) => count + item.allocations.length, 0) >
    maxAllocations
  )
    return "allocationLimit";
  for (const item of items) {
    const issue = collectAllocationIssue(
      item.allocations,
      item.quantity,
      profile
    );
    if (issue !== null) return issue;
  }
  return null;
}

/** Remount draft state before changed account, destination or listing terms can be used. */
export function collectBatchReviewScope(options: {
  readonly profile: ApiIdentity | null;
  readonly payingWallet?: string;
  readonly initialRecipient?: string;
  readonly items: readonly CollectSelectedListing[];
}) {
  return JSON.stringify([
    options.profile?.id,
    options.profile?.primary_wallet.toLowerCase(),
    collectProfileWallets(options.profile)
      .map((wallet) => wallet.wallet.toLowerCase())
      .sort((left, right) => left.localeCompare(right)),
    options.payingWallet?.toLowerCase(),
    options.initialRecipient?.toLowerCase(),
    options.items.map((item) => [
      item.asset.asset_key,
      item.quantity,
      item.order,
    ]),
  ]);
}
