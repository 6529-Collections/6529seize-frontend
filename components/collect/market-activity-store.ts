"use client";

import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import { ApiMarketBatchOperationKindEnum } from "@/generated/models/ApiMarketBatchOperation";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import { ApiMarketSendAttemptStatusEnum } from "@/generated/models/ApiMarketSendAttempt";
import {
  ApiMarketReceiptTransactionPurposeEnum,
  ApiMarketReceiptTransactionStatusEnum,
  ApiMarketReceiptTransactionConfirmationEnum,
} from "@/generated/models/ApiMarketReceiptTransaction";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { MARKET_SEAPORT } from "./market-validation";

export interface ConfirmedMarketPurchase {
  readonly operationId: string;
  readonly profileId: string;
  readonly assetKey: string;
  readonly orderHash: string;
  readonly protocolAddress: string;
  readonly quantity: string;
  readonly remainingQuantity?: string;
  readonly confirmedAt: number;
  readonly blockNumber?: number;
}
export type PendingMarketPurchase = Omit<
  ConfirmedMarketPurchase,
  "confirmedAt" | "remainingQuantity"
>;
export interface MarketActivity {
  readonly id: string;
  readonly profileId: string;
  readonly kind: string;
  readonly state: string;
  readonly updatedAt: number;
  readonly transactionHash?: string;
  readonly purchases: readonly ConfirmedMarketPurchase[];
}
type Operation = ApiMarketOperation | ApiMarketBatchOperation;
const PREFIX = "6529-market-activity:v1:";
const EMPTY: readonly MarketActivity[] = [];
const profiles = new Map<string, readonly MarketActivity[]>();
const listeners = new Set<() => void>();
const hash = (value: unknown): value is string =>
  typeof value === "string" && /^0x[\da-f]{64}$/i.test(value);
const uint = (value: unknown): value is string =>
  typeof value === "string" && /^(0|[1-9]\d{0,77})$/.test(value);
const trackedStates = new Set([
  "SUBMITTED",
  "MINED",
  "UNKNOWN",
  "PUBLISHING",
  "LIVE",
  "CONFIRMED",
  "CANCEL_PENDING",
]);
const pendingStates = new Set([
  "SUBMITTED",
  "MINED",
  "UNKNOWN",
  "AWAITING_TRANSACTION",
]);

function isPurchase(
  value: unknown,
  profileId: string,
  operationId: string
): value is ConfirmedMarketPurchase {
  if (value === null || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    p["profileId"] === profileId &&
    p["operationId"] === operationId &&
    typeof p["assetKey"] === "string" &&
    /^1:0x[\da-f]{40}:\d+$/i.test(p["assetKey"]) &&
    hash(p["orderHash"]) &&
    typeof p["protocolAddress"] === "string" &&
    /^0x[\da-f]{40}$/i.test(p["protocolAddress"]) &&
    uint(p["quantity"]) &&
    (p["remainingQuantity"] === undefined || uint(p["remainingQuantity"])) &&
    typeof p["confirmedAt"] === "number" &&
    Number.isFinite(p["confirmedAt"])
  );
}
function read(profileId: string): readonly MarketActivity[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(PREFIX + profileId) ?? "[]"
    );
    if (!Array.isArray(parsed) || parsed.length > 200) return EMPTY;
    return parsed.filter((value): value is MarketActivity => {
      if (value === null || typeof value !== "object") return false;
      const a = value as Record<string, unknown>;
      return (
        a["profileId"] === profileId &&
        typeof a["id"] === "string" &&
        /^[\da-f-]{36}$/i.test(a["id"]) &&
        typeof a["kind"] === "string" &&
        typeof a["state"] === "string" &&
        typeof a["updatedAt"] === "number" &&
        Number.isFinite(a["updatedAt"]) &&
        Array.isArray(a["purchases"]) &&
        a["purchases"].length <= 128 &&
        a["purchases"].every((p) =>
          isPurchase(p, profileId, a["id"] as string)
        ) &&
        (a["transactionHash"] === undefined || hash(a["transactionHash"]))
      );
    });
  } catch {
    return EMPTY;
  }
}
function emit() {
  for (const listener of listeners) listener();
}
function hydrate(profileId: string) {
  if (!profiles.has(profileId)) {
    profiles.set(profileId, read(profileId));
    emit();
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => {
    if (!event.key?.startsWith(PREFIX)) return;
    const profileId = event.key.slice(PREFIX.length);
    profiles.set(profileId, read(profileId));
    emit();
  };
  window.addEventListener("storage", storage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", storage);
  };
}
export function useMarketActivities(profileId: string | null | undefined) {
  useEffect(() => {
    if (profileId) hydrate(profileId);
  }, [profileId]);
  return useSyncExternalStore(
    subscribe,
    () => (profileId ? (profiles.get(profileId) ?? EMPTY) : EMPTY),
    () => EMPTY
  );
}
export function useConfirmedMarketPurchases(
  profileId: string | null | undefined
): readonly ConfirmedMarketPurchase[] {
  const activities = useMarketActivities(profileId);
  return useMemo(
    () =>
      activities
        .filter((a) => a.state === "CONFIRMED")
        .flatMap((a) => a.purchases),
    [activities]
  );
}
export function usePendingMarketPurchases(
  profileId: string | null | undefined
): readonly PendingMarketPurchase[] {
  const activities = useMarketActivities(profileId);
  return useMemo(
    () =>
      activities
        .filter((a) => pendingStates.has(a.state))
        .flatMap((a) => a.purchases),
    [activities]
  );
}
/** Read immediately before a user action; this must not be called during render. */
export function readPendingMarketPurchases(
  profileId: string
): readonly PendingMarketPurchase[] {
  hydrate(profileId);
  return (profiles.get(profileId) ?? EMPTY)
    .filter((activity) => pendingStates.has(activity.state))
    .flatMap((activity) => activity.purchases);
}
function purchases(
  operation: Operation,
  existing: MarketActivity | undefined
): readonly ConfirmedMarketPurchase[] {
  const transaction = operation.receipt?.transactions.find(
    (item) =>
      item.purpose === ApiMarketReceiptTransactionPurposeEnum.Transaction &&
      item.status === ApiMarketReceiptTransactionStatusEnum.Success &&
      item.confirmation ===
        ApiMarketReceiptTransactionConfirmationEnum.Confirmed &&
      Number.isFinite(item.block_timestamp) &&
      item.block_timestamp > 0
  );
  // A historical operation can receive a new updated_at when receipt metadata
  // arrives. Without block time or an observed pending transition, zero means
  // "confirmation time unknown" so that history cannot clear a new selection.
  let confirmedAt = 0;
  if (transaction) confirmedAt = transaction.block_timestamp * 1000;
  else if (
    operation.state.toString() !== "CONFIRMED" ||
    (existing !== undefined && pendingStates.has(existing.state))
  ) {
    confirmedAt = operation.updated_at;
  }
  const candidateBlock =
    transaction?.block_number ?? operation.settlement?.block_number;
  const blockNumber =
    typeof candidateBlock === "number" &&
    Number.isSafeInteger(candidateBlock) &&
    candidateBlock > 0
      ? candidateBlock
      : undefined;
  const common = {
    operationId: operation.id,
    profileId: operation.profile_id,
    confirmedAt,
    ...(blockNumber === undefined ? {} : { blockNumber }),
  };
  if (operation.kind === ApiMarketBatchOperationKindEnum.BuyBatch)
    return operation.items.map((item) => {
      const settled = operation.settlement?.items.find(
        (p) =>
          p.asset_key === item.asset_key &&
          p.order.order_hash.toLowerCase() ===
            item.order.order_hash.toLowerCase()
      );
      return {
        ...common,
        assetKey: item.asset_key,
        orderHash: item.order.order_hash.toLowerCase(),
        protocolAddress: item.order.protocol_address.toLowerCase(),
        quantity: item.quantity,
        ...(settled?.order_remaining_quantity === undefined
          ? {}
          : { remainingQuantity: settled.order_remaining_quantity }),
      };
    });
  if (operation.kind !== ApiMarketKind.Buy || !operation.order_hash) return [];
  return [
    {
      ...common,
      assetKey: operation.asset_key,
      orderHash: operation.order_hash.toLowerCase(),
      protocolAddress:
        operation.order?.protocol_address.toLowerCase() ?? MARKET_SEAPORT,
      quantity: operation.quantity,
      ...(operation.settlement?.order_remaining_quantity === undefined
        ? {}
        : { remainingQuantity: operation.settlement.order_remaining_quantity }),
    },
  ];
}

function preserveConfirmedEvidence(
  next: readonly ConfirmedMarketPurchase[],
  existing: MarketActivity | undefined,
  state: string
): readonly ConfirmedMarketPurchase[] {
  if (state !== "CONFIRMED" || existing?.state !== "CONFIRMED") return next;
  return next.map((purchase) => {
    const prior = existing.purchases.find(
      (item) =>
        item.assetKey === purchase.assetKey &&
        item.orderHash === purchase.orderHash &&
        item.protocolAddress === purchase.protocolAddress
    );
    if (!prior) return purchase;
    let remainingQuantity =
      purchase.remainingQuantity ?? prior.remainingQuantity;
    if (
      purchase.remainingQuantity !== undefined &&
      prior.remainingQuantity !== undefined &&
      BigInt(prior.remainingQuantity) < BigInt(purchase.remainingQuantity)
    ) {
      remainingQuantity = prior.remainingQuantity;
    }
    const blockNumber = purchase.blockNumber ?? prior.blockNumber;
    return {
      ...purchase,
      confirmedAt:
        prior.confirmedAt > 0 && purchase.confirmedAt > 0
          ? Math.min(prior.confirmedAt, purchase.confirmedAt)
          : Math.max(prior.confirmedAt, purchase.confirmedAt),
      ...(remainingQuantity === undefined ? {} : { remainingQuantity }),
      ...(blockNumber === undefined ? {} : { blockNumber }),
    };
  });
}
/** Store public identities and display evidence only, never signatures, calldata or send permission. */
export function recordMarketActivity(operation: Operation) {
  if (typeof operation.profile_id !== "string") return false;
  hydrate(operation.profile_id);
  const prior = profiles.get(operation.profile_id) ?? EMPTY;
  const existing = prior.find((a) => a.id === operation.id);
  if (
    !existing &&
    !trackedStates.has(operation.state) &&
    !operation.send_attempt
  )
    return false;
  if (existing && operation.updated_at < existing.updatedAt) return false;
  const state =
    ["REVIEW", "APPROVAL"].includes(operation.state) &&
    operation.send_attempt?.status === ApiMarketSendAttemptStatusEnum.Active
      ? "AWAITING_TRANSACTION"
      : operation.state;
  const next: MarketActivity = {
    id: operation.id,
    profileId: operation.profile_id,
    kind: operation.kind,
    state,
    updatedAt: operation.updated_at,
    purchases: preserveConfirmedEvidence(
      purchases(operation, existing),
      existing,
      state
    ),
    ...(operation.transaction_hash
      ? { transactionHash: operation.transaction_hash }
      : {}),
  };
  if (JSON.stringify(existing) === JSON.stringify(next)) return false;
  const values = [...prior.filter((a) => a.id !== next.id), next]
    .sort(
      (a, b) =>
        Number(pendingStates.has(b.state)) -
          Number(pendingStates.has(a.state)) || b.updatedAt - a.updatedAt
    )
    .slice(0, 200);
  profiles.set(operation.profile_id, values);
  try {
    localStorage.setItem(PREFIX + operation.profile_id, JSON.stringify(values));
  } catch {
    /* In-memory progress still works. */
  }
  emit();
  return true;
}
const celebrated = new Set<string>();
export function claimMarketCelebration(
  profileId: string,
  operationId: string
): boolean {
  const key = `6529-market-celebrated:${profileId}:${operationId}`;
  if (celebrated.has(key)) return false;
  celebrated.add(key);
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
  } catch {
    /* A blocked storage API must never block the receipt. */
  }
  return true;
}
