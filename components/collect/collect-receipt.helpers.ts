import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import { ApiMarketBatchOperationKindEnum } from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import type { ReactNode } from "react";
import { collectAssetIdentity } from "./collect.adapters";

export type CollectReceiptOperation =
  | ApiMarketOperation
  | ApiMarketBatchOperation;
export type CollectKnownTransactionPurpose = "APPROVAL" | "TRANSACTION";

export interface CollectReceiptArtwork {
  readonly assetKey: string;
  readonly title: string;
  readonly media?: ReactNode;
  readonly quantity: string;
  readonly orderHash?: string | undefined;
  readonly recipients: readonly {
    readonly address: string;
    readonly quantity: string;
  }[];
}

export function hasCollectKnownSubmission(
  operation: CollectReceiptOperation,
  knownTransactionHash?: string,
  knownTransactionPurpose?: CollectKnownTransactionPurpose
): boolean {
  return (
    Boolean(collectReceiptTransactionHref(knownTransactionHash)) &&
    !hasCollectKnownApproval(
      operation,
      knownTransactionHash,
      knownTransactionPurpose
    ) &&
    !["CONFIRMED", "LIVE", "CANCELLED", "FAILED", "EXPIRED"].includes(
      operation.state
    )
  );
}

/** An approval authorizes a later trade; its hash is never evidence that the trade was sent. */
export function hasCollectKnownApproval(
  operation: CollectReceiptOperation,
  knownTransactionHash?: string,
  knownTransactionPurpose?: CollectKnownTransactionPurpose
): boolean {
  if (
    operation.kind === ApiMarketBatchOperationKindEnum.BuyBatch ||
    collectReceiptTransactionHref(operation.transaction_hash)
  )
    return false;
  const hash =
    knownTransactionHash ??
    operation.send_attempt?.transaction_hash ??
    undefined;
  if (!collectReceiptTransactionHref(hash)) return false;
  if (knownTransactionPurpose) return knownTransactionPurpose === "APPROVAL";
  const recorded = operation.receipt?.transactions.find(
    (transaction) =>
      transaction.transaction_hash.toLowerCase() === hash?.toLowerCase()
  );
  if (recorded) return recorded.purpose.toString() === "APPROVAL";
  const attempt = operation.send_attempt;
  if (
    attempt?.transaction_hash?.toLowerCase() === hash?.toLowerCase() ||
    attempt?.status.toString() === "ACTIVE"
  )
    return attempt?.purpose.toString() === "APPROVAL";
  return (
    operation.state.toString() === "APPROVAL" ||
    operation.approval_transactions.length > 0
  );
}

export function isCollectReceiptOperation(
  operation: CollectReceiptOperation,
  knownTransactionHash?: string,
  knownTransactionPurpose?: CollectKnownTransactionPurpose
) {
  return (
    hasCollectKnownSubmission(
      operation,
      knownTransactionHash,
      knownTransactionPurpose
    ) ||
    ["SUBMITTED", "MINED", "CONFIRMED", "LIVE", "CANCELLED"].includes(
      operation.state
    )
  );
}

export function collectReceiptArtworkHref(assetKey: string): string | null {
  const identity = collectAssetIdentity(assetKey);
  if (!identity) return null;
  const paths = {
    memes: "/the-memes/",
    memelab: "/meme-lab/",
    gradients: "/6529-gradient/",
    pebbles: "/nextgen/token/",
  };
  return `${paths[identity.family]}${encodeURIComponent(identity.tokenId)}`;
}

export function collectReceiptTransactionHref(hash: string | undefined) {
  return hash && /^0x[0-9a-fA-F]{64}$/.test(hash)
    ? `https://etherscan.io/tx/${hash}`
    : null;
}

export function collectReceiptHeading(
  operation: CollectReceiptOperation,
  knownTransactionHash?: string
) {
  if (operation.state.toString() === "MINED")
    return "collect.receipt.title.included";
  if (
    operation.state.toString() === "SUBMITTED" ||
    hasCollectKnownSubmission(operation, knownTransactionHash)
  )
    return "collect.receipt.title.submitted";
  if (
    operation.state.toString() === "CANCELLED" ||
    operation.kind === ApiMarketKind.Cancel
  )
    return "collect.receipt.title.cancel";
  if (operation.state.toString() === "LIVE") {
    if (
      operation.kind === ApiMarketKind.List &&
      BigInt(operation.settlement?.filled_quantity ?? "0") > 0n
    )
      return "collect.receipt.title.partial";
    return operation.kind === ApiMarketKind.Offer
      ? "collect.receipt.title.offer"
      : "collect.receipt.title.list";
  }
  if (
    operation.kind === ApiMarketKind.List ||
    operation.kind === ApiMarketKind.Accept
  )
    return "collect.receipt.title.accept";
  return collectReceiptPurchaseHeading(operation);
}

function collectReceiptPurchaseHeading(operation: CollectReceiptOperation) {
  if (operation.kind === ApiMarketBatchOperationKindEnum.BuyBatch) {
    const membership = operation.items.flatMap((item) =>
      item.allocations.map((allocation) => allocation.recipient_in_profile)
    );
    if (membership.length === 0) return "collect.receipt.title.delivered";
    if (membership.every((inProfile) => inProfile === false))
      return "collect.receipt.title.gift";
    if (membership.every((inProfile) => inProfile === true))
      return "collect.receipt.title.batch";
    return "collect.receipt.title.delivered";
  }
  if (
    operation.kind === ApiMarketKind.Buy &&
    operation.recipient_in_profile === false
  )
    return "collect.receipt.title.gift";
  return "collect.receipt.title.buy";
}
