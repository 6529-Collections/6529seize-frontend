"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import {
  fetchMarketBatch,
  prepareMarketBatch,
} from "@/services/api/market-batch-api";
import { useRef, useState } from "react";
import { getAddress, isAddress, zeroAddress } from "viem";
import {
  collectProfileWallets,
  isCollectProfileWallet,
} from "./collect-recipient.helpers";
import { withMarketOperationLock } from "./market-operation-lock";
import { useCollectRecipientScope } from "./useCollectRecipientScope";
import { readMarketBatch, saveMarketBatch } from "./market-batch-storage";
import {
  discardUnsignedMarketBatchReview,
  marketBatchProfileLock,
} from "./market-batch-resume";
import { batchSendAttempt } from "./market-batch-send";
import { batchNeedsPolling } from "./market-batch-recovery";
import {
  validateMarketBatchOperation,
  validateMarketBatchOperationForRefresh,
  validateMarketBatchRequest,
  marketBatchLiteral,
} from "./market-batch-validation";

interface BatchRecipientUpdateOptions {
  readonly operation: ApiMarketBatchOperation | null;
  readonly expected: ApiMarketBatchPrepareRequest | null;
  readonly profile: ApiIdentity | null;
  readonly wallet: string | undefined;
  readonly enabled: boolean;
  readonly onUpdated: (
    operation: ApiMarketBatchOperation,
    request: ApiMarketBatchPrepareRequest
  ) => void;
  readonly onError: (failure: unknown) => void;
  readonly onEmpty?: () => void;
}

function hasPendingPurchase(operation: ApiMarketBatchOperation) {
  const saved = readMarketBatch(operation.profile_id, operation.id);
  return Boolean(
    operation.state !== ApiMarketBatchOperationStateEnum.Review ||
    Boolean(operation.transaction_hash) ||
    Boolean(saved?.transactionHash) ||
    Boolean(batchSendAttempt(operation)) ||
    batchNeedsPolling(operation)
  );
}

function boundActor(options: BatchRecipientUpdateOptions) {
  const { operation, expected, profile, wallet } = options;
  return Boolean(
    operation &&
    expected &&
    marketBatchLiteral(operation.kind, "BUY_BATCH") &&
    marketBatchLiteral(expected.kind, "BUY_BATCH") &&
    expected.items.length > 0 &&
    operation.profile_id === expected.profile_id &&
    profile?.id === expected.profile_id &&
    wallet?.toLowerCase() === expected.wallet.toLowerCase() &&
    operation.wallet.toLowerCase() === expected.wallet.toLowerCase() &&
    isCollectProfileWallet(profile, expected.wallet)
  );
}

function assertStoredReview(
  operation: ApiMarketBatchOperation,
  expected: ApiMarketBatchPrepareRequest,
  wallets: readonly string[]
) {
  if (hasPendingPurchase(operation))
    throw new Error("MARKET_BROADCAST_UNKNOWN");
  const saved = readMarketBatch(operation.profile_id, operation.id);
  if (!saved || JSON.stringify(saved.request) !== JSON.stringify(expected))
    throw new Error("MARKET_REVIEW_MISMATCH");
  validateMarketBatchOperationForRefresh(operation, expected, wallets);
}

function assertSameOperation(
  current: ApiMarketBatchOperation,
  original: ApiMarketBatchOperation
) {
  if (
    current.id !== original.id ||
    current.profile_id !== original.profile_id ||
    current.wallet.toLowerCase() !== original.wallet.toLowerCase()
  )
    throw new Error("MARKET_REVIEW_MISMATCH");
}

function recipientRequest(
  expected: ApiMarketBatchPrepareRequest,
  profile: ApiIdentity | null,
  {
    itemIndex,
    allocationIndex,
    recipient,
    acknowledgeExternal,
  }: {
    itemIndex: number;
    allocationIndex: number;
    recipient: string;
    acknowledgeExternal: boolean;
  }
): ApiMarketBatchPrepareRequest {
  const item = expected.items[itemIndex];
  if (
    !Number.isInteger(itemIndex) ||
    !Number.isInteger(allocationIndex) ||
    !item?.allocations[allocationIndex] ||
    !isAddress(recipient) ||
    getAddress(recipient) === zeroAddress
  )
    throw new Error("MARKET_REVIEW_MISMATCH");
  const external = !isCollectProfileWallet(profile, recipient);
  if (external && !acknowledgeExternal)
    throw new Error("RECIPIENT_NOT_ACKNOWLEDGED");
  const allocations = item.allocations.map((allocation, index) =>
    index === allocationIndex
      ? {
          ...allocation,
          recipient: getAddress(recipient),
          acknowledge_external_recipient: external && acknowledgeExternal,
        }
      : { ...allocation }
  );
  // Choosing an existing destination combines only its copies of this same item.
  const combined: typeof allocations = [];
  for (const allocation of allocations) {
    const existing = combined.find(
      (value) =>
        value.recipient.toLowerCase() === allocation.recipient.toLowerCase()
    );
    if (existing)
      existing.quantity = (
        BigInt(existing.quantity) + BigInt(allocation.quantity)
      ).toString();
    else combined.push(allocation);
  }
  return {
    ...expected,
    items: expected.items.map((value, index) =>
      index === itemIndex ? { ...value, allocations: combined } : value
    ),
  };
}

function persistBatchReview(
  operation: ApiMarketBatchOperation,
  request: ApiMarketBatchPrepareRequest,
  wallets: readonly string[]
) {
  if (hasPendingPurchase(operation))
    throw new Error("MARKET_BROADCAST_UNKNOWN");
  validateMarketBatchOperation(operation, request, wallets);
  if (!saveMarketBatch(operation.profile_id, operation.id, { request }))
    throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
}

/** Reprepare one allocation of an exact, unsigned batch purchase; never alter an operation's recovery journal. */
export function useCollectBatchRecipientUpdate(
  options: BatchRecipientUpdateOptions
) {
  const [pending, setPending] = useState(false);
  const pendingAttempt = useRef<object | null>(null);
  const retry = useRef<{
    fingerprint: string;
    request: ApiMarketBatchPrepareRequest;
    key: string;
  } | null>(null);
  const { live, updateGeneration, assertIdle, assertUpdate } =
    useCollectRecipientScope(options, boundActor, pendingAttempt);
  const canEdit =
    options.enabled &&
    boundActor(options) &&
    !pending &&
    options.operation !== null &&
    !hasPendingPurchase(options.operation);

  const revise = async (
    transform: (
      request: ApiMarketBatchPrepareRequest
    ) => ApiMarketBatchPrepareRequest | null
  ): Promise<boolean> => {
    if (pendingAttempt.current) return false;
    const attempt = {};
    pendingAttempt.current = attempt;
    setPending(true);
    try {
      assertUpdate();
      const { operation, expected, profile } = options;
      if (!operation || !expected) throw new Error("MARKET_REVIEW_MISMATCH");
      const request = transform(expected);
      const wallets = collectProfileWallets(profile).map(
        (value) => value.wallet
      );
      if (request) validateMarketBatchRequest(request, wallets);
      return await withMarketOperationLock(
        marketBatchProfileLock(expected.profile_id),
        () =>
          withMarketOperationLock(operation.id, async () => {
            assertUpdate();
            assertStoredReview(operation, expected, wallets);
            const current = await fetchMarketBatch(operation.id);
            assertUpdate();
            assertSameOperation(current, operation);
            assertStoredReview(current, expected, wallets);
            if (request === null) {
              if (!live.current?.options.onEmpty)
                throw new Error("MARKET_REVIEW_MISMATCH");
              discardUnsignedMarketBatchReview(current, expected);
              live.current.options.onEmpty();
              return true;
            }
            if (JSON.stringify(request) === JSON.stringify(expected))
              return true;
            const fingerprint = JSON.stringify({
              operation: operation.id,
              request,
            });
            const previous = retry.current;
            const preparation =
              previous?.fingerprint === fingerprint
                ? previous
                : {
                    fingerprint,
                    request,
                    key: crypto.randomUUID(),
                  };
            retry.current = preparation;
            const prepared = await prepareMarketBatch(
              preparation.request,
              preparation.key
            );
            assertUpdate();
            if (prepared.id === operation.id)
              throw new Error("MARKET_REVIEW_MISMATCH");
            validateMarketBatchOperation(
              prepared,
              preparation.request,
              wallets
            );
            if (hasPendingPurchase(prepared))
              throw new Error("MARKET_BROADCAST_UNKNOWN");
            // Another device may have advanced the original operation while preparation was pending.
            const latest = await fetchMarketBatch(operation.id);
            assertUpdate();
            assertSameOperation(latest, operation);
            assertStoredReview(latest, expected, wallets);
            return withMarketOperationLock(prepared.id, () => {
              assertUpdate();
              assertStoredReview(latest, expected, wallets);
              persistBatchReview(prepared, preparation.request, wallets);
              discardUnsignedMarketBatchReview(latest, expected);
              live.current?.options.onUpdated(prepared, preparation.request);
              retry.current = null;
              return Promise.resolve(true);
            });
          })
      );
    } catch (error_) {
      if (live.current?.update === updateGeneration)
        live.current.options.onError(error_);
      return false;
    } finally {
      if (pendingAttempt.current === attempt) {
        pendingAttempt.current = null;
        if (live.current) setPending(false);
      }
    }
  };
  const update = (
    itemIndex: number,
    allocationIndex: number,
    recipient: string,
    acknowledgeExternal: boolean
  ) =>
    revise((expected) =>
      recipientRequest(expected, options.profile, {
        itemIndex,
        allocationIndex,
        recipient,
        acknowledgeExternal,
      })
    );
  const remove = (itemIndex: number) =>
    revise((expected) => {
      if (!Number.isInteger(itemIndex) || !expected.items[itemIndex])
        throw new Error("MARKET_REVIEW_MISMATCH");
      const items = expected.items.filter((_, index) => index !== itemIndex);
      return items.length === 0
        ? null
        : {
            ...expected,
            items,
            amount_wei: items
              .reduce((total, item) => total + BigInt(item.amount_wei), 0n)
              .toString(),
          };
    });
  const updateAll = (recipient: string, acknowledgeExternal: boolean) =>
    revise((expected) => {
      if (!isAddress(recipient) || getAddress(recipient) === zeroAddress)
        throw new Error("MARKET_REVIEW_MISMATCH");
      const external = !isCollectProfileWallet(options.profile, recipient);
      if (external && !acknowledgeExternal)
        throw new Error("RECIPIENT_NOT_ACKNOWLEDGED");
      return {
        ...expected,
        items: expected.items.map((item) => ({
          ...item,
          allocations: [
            {
              recipient: getAddress(recipient),
              quantity: item.quantity,
              acknowledge_external_recipient: external && acknowledgeExternal,
            },
          ],
        })),
      };
    });
  return { update, updateAll, remove, pending, canEdit, assertIdle };
}
