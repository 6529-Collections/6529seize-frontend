"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { ApiMarketOperationStateEnum } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import {
  fetchMarketOperation,
  prepareMarketOperation,
} from "@/services/api/market-api";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { getAddress, isAddress, zeroAddress } from "viem";
import {
  collectProfileWallets,
  isCollectProfileWallet,
} from "./collect-recipient.helpers";
import { withMarketOperationLock } from "./market-operation-lock";
import { readMarketIntent, saveMarketIntent } from "./market-operation-storage";
import {
  marketOperationHasUnresolvedSend,
  marketOperationNeedsPolling,
} from "./market-recovery";
import {
  validateMarketOperation,
  validateMarketOperationForRefresh,
} from "./market-validation";

interface RecipientUpdateOptions {
  readonly operation: ApiMarketOperation | null;
  readonly expected: ApiMarketPrepareRequest | null;
  readonly profile: ApiIdentity | null;
  readonly wallet: string | undefined;
  readonly enabled: boolean;
  readonly onUpdated: (
    operation: ApiMarketOperation,
    request: ApiMarketPrepareRequest
  ) => void;
  readonly onError: (failure: unknown) => void;
}

function hasPendingPurchase(operation: ApiMarketOperation) {
  const saved = readMarketIntent(operation.profile_id, operation.id);
  return Boolean(
    ![
      ApiMarketOperationStateEnum.Review,
      ApiMarketOperationStateEnum.Approval,
    ].includes(operation.state) ||
    Boolean(operation.transaction_hash) ||
    Boolean(saved?.approvalHash) ||
    Boolean(saved?.transactionHash) ||
    marketOperationHasUnresolvedSend(operation) ||
    marketOperationNeedsPolling(operation)
  );
}

function boundActor(options: RecipientUpdateOptions) {
  const { operation, expected, profile, wallet } = options;
  return Boolean(
    operation?.kind === ApiMarketKind.Buy &&
    expected?.kind === ApiMarketKind.Buy &&
    expected.order &&
    operation.profile_id === expected.profile_id &&
    profile?.id === expected.profile_id &&
    wallet?.toLowerCase() === expected.wallet.toLowerCase() &&
    operation.wallet.toLowerCase() === expected.wallet.toLowerCase() &&
    isCollectProfileWallet(profile, expected.wallet)
  );
}

function assertStoredReview(
  operation: ApiMarketOperation,
  expected: ApiMarketPrepareRequest
) {
  if (hasPendingPurchase(operation))
    throw new Error("MARKET_BROADCAST_UNKNOWN");
  const saved = readMarketIntent(operation.profile_id, operation.id);
  if (!saved || JSON.stringify(saved.request) !== JSON.stringify(expected))
    throw new Error("MARKET_REVIEW_MISMATCH");
  validateMarketOperationForRefresh(operation, expected);
}

function assertSameOperation(
  current: ApiMarketOperation,
  original: ApiMarketOperation
) {
  if (
    current.id !== original.id ||
    current.profile_id !== original.profile_id ||
    current.wallet.toLowerCase() !== original.wallet.toLowerCase()
  )
    throw new Error("MARKET_REVIEW_MISMATCH");
}

function recipientRequest(
  expected: ApiMarketPrepareRequest,
  profile: ApiIdentity | null,
  recipient: string,
  acknowledgeExternal: boolean
): ApiMarketPrepareRequest {
  if (!isAddress(recipient) || getAddress(recipient) === zeroAddress)
    throw new Error("MARKET_REVIEW_MISMATCH");
  const external = !isCollectProfileWallet(profile, recipient);
  if (external && !acknowledgeExternal)
    throw new Error("RECIPIENT_NOT_ACKNOWLEDGED");
  return {
    ...expected,
    recipient: getAddress(recipient),
    acknowledge_external_recipient: external && acknowledgeExternal,
  };
}

function recipientScopes(options: RecipientUpdateOptions) {
  const membership = collectProfileWallets(options.profile)
    .map((item) => item.wallet.toLowerCase())
    .sort((a, b) => a.localeCompare(b));
  const idleIdentity = JSON.stringify({
    id: options.operation?.id,
    expected: options.expected,
    profile: options.profile?.id,
    membership,
    wallet: options.wallet?.toLowerCase(),
  });
  const updateIdentity = JSON.stringify({
    idleIdentity,
    operation: options.operation,
    enabled: options.enabled,
  });
  return { idleIdentity, updateIdentity };
}

/** Reprepare one exact, unsigned purchase; never alter an operation's recovery journal. */
export function useCollectRecipientUpdate(options: RecipientUpdateOptions) {
  const [pending, setPending] = useState(false);
  const pendingAttempt = useRef<object | null>(null);
  const retry = useRef<{
    fingerprint: string;
    request: ApiMarketPrepareRequest;
    key: string;
  } | null>(null);
  const { idleIdentity, updateIdentity } = recipientScopes(options);
  const idleGeneration = useMemo(
    () => ({ identity: idleIdentity }),
    [idleIdentity]
  );
  const updateGeneration = useMemo(
    () => ({ identity: updateIdentity }),
    [updateIdentity]
  );
  const live = useRef<{
    idle: object;
    update: object;
    options: RecipientUpdateOptions;
  } | null>(null);
  useLayoutEffect(() => {
    live.current = { idle: idleGeneration, update: updateGeneration, options };
    return () => {
      live.current = null;
    };
  }, [idleGeneration, updateGeneration, options]);

  const assertIdle = () => {
    if (
      live.current?.idle !== idleGeneration ||
      !boundActor(live.current.options) ||
      pendingAttempt.current
    )
      throw new Error("MARKET_CONNECTION_CHANGED");
  };
  const assertUpdate = () => {
    if (
      live.current?.update !== updateGeneration ||
      !live.current.options.enabled ||
      !boundActor(live.current.options)
    )
      throw new Error("MARKET_CONNECTION_CHANGED");
  };
  const canEdit =
    options.enabled &&
    boundActor(options) &&
    !pending &&
    options.operation !== null &&
    !hasPendingPurchase(options.operation);

  const update = async (
    recipient: string,
    acknowledgeExternal: boolean
  ): Promise<boolean> => {
    if (pendingAttempt.current) return false;
    const attempt = {};
    pendingAttempt.current = attempt;
    setPending(true);
    try {
      assertUpdate();
      const { operation, expected, profile } = options;
      if (!operation || !expected) throw new Error("MARKET_REVIEW_MISMATCH");
      const request = recipientRequest(
        expected,
        profile,
        recipient,
        acknowledgeExternal
      );
      return await withMarketOperationLock(operation.id, async () => {
        assertUpdate();
        assertStoredReview(operation, expected);
        const current = await fetchMarketOperation(operation.id);
        assertUpdate();
        assertSameOperation(current, operation);
        assertStoredReview(current, expected);
        if (
          request.recipient.toLowerCase() ===
            expected.recipient.toLowerCase() &&
          request.acknowledge_external_recipient ===
            expected.acknowledge_external_recipient
        )
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
        const prepared = await prepareMarketOperation(
          preparation.request,
          preparation.key
        );
        assertUpdate();
        if (prepared.id === operation.id)
          throw new Error("MARKET_REVIEW_MISMATCH");
        validateMarketOperation(prepared, preparation.request);
        if (hasPendingPurchase(prepared))
          throw new Error("MARKET_BROADCAST_UNKNOWN");
        // Another device may have advanced the original operation while preparation was pending.
        const latest = await fetchMarketOperation(operation.id);
        assertUpdate();
        assertSameOperation(latest, operation);
        assertStoredReview(latest, expected);
        return withMarketOperationLock(prepared.id, () => {
          assertUpdate();
          if (hasPendingPurchase(prepared))
            throw new Error("MARKET_BROADCAST_UNKNOWN");
          validateMarketOperation(prepared, preparation.request);
          if (
            !saveMarketIntent(prepared.profile_id, prepared.id, {
              request: preparation.request,
            })
          )
            throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
          live.current?.options.onUpdated(prepared, preparation.request);
          retry.current = null;
          return Promise.resolve(true);
        });
      });
    } catch (failure) {
      if (live.current?.update === updateGeneration)
        live.current.options.onError(failure);
      return false;
    } finally {
      if (pendingAttempt.current === attempt) {
        pendingAttempt.current = null;
        if (live.current) setPending(false);
      }
    }
  };
  return { update, pending, canEdit, assertIdle };
}
