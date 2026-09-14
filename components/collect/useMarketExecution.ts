"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { ApiMarketOperationStateEnum } from "@/generated/models/ApiMarketOperation";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { fetchCollectCapabilities } from "@/services/api/collect-api";
import {
  continueMarketOperation,
  fetchMarketOperation,
  submitMarketSignature,
  submitMarketTransaction,
} from "@/services/api/market-api";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useRef, useState } from "react";
import {
  getAddress,
  type Hex,
  type WalletClient,
  type PublicClient,
} from "viem";
import { mainnet } from "viem/chains";
import { usePublicClient, useWalletClient } from "wagmi";
import type { CollectTradeStage } from "./collect.types";
import {
  marketTypedData,
  validateMarketOperation,
  validateMarketOperationForRefresh,
  validateMarketTransaction,
} from "./market-validation";
import { readMarketIntent, saveMarketIntent } from "./market-operation-storage";
import { withMarketOperationLock } from "./market-operation-lock";
import { marketReviewChange } from "./market-review-terms";
import { reviewedMarketGasLimits } from "./market-review-caps";
import {
  marketReviewChangeNotice,
  type MarketReviewChangeNotice,
} from "./market-review-change-description";
import { useMarketWalletScope } from "./useMarketWalletScope";
import { acknowledgeMarketSubmission } from "./market-known-submission";
import { knownMarketTransactionHash } from "./market-known-transaction";
import { isFreshMarketReviewExpiry } from "./market-review-expiry";
import { marketExecutionError } from "./market-execution-errors";
import {
  clearResolvedMarketSend,
  marketOperationSendAttempt,
  sendReviewedMarketTransaction,
  verifyRecoveredMarketTransaction,
} from "./market-send-recovery";

async function checkMarketWallet(
  wallet: WalletClient,
  client: PublicClient,
  expected: ApiMarketPrepareRequest
) {
  if ((await wallet.getChainId()) !== 1 || (await client.getChainId()) !== 1)
    throw new Error("MARKET_WRONG_CHAIN");
  const accounts = await wallet.getAddresses();
  if (
    !accounts.some(
      (address) => address.toLowerCase() === expected.wallet.toLowerCase()
    )
  )
    throw new Error("MARKET_CONNECTION_CHANGED");
  const account = getAddress(expected.wallet);
  const code = await client.getCode({ address: account });
  if (code && code !== "0x") throw new Error("MARKET_UNSUPPORTED_WALLET");
  return account;
}

async function executeReviewedMarketOperation(options: {
  wallet: WalletClient;
  client: PublicClient;
  operation: ApiMarketOperation;
  expected: ApiMarketPrepareRequest;
  assertConnection: () => void;
  onCommitment:
    | ((
        operation: ApiMarketOperation,
        expected: ApiMarketPrepareRequest
      ) => void)
    | undefined;
  setStage: (stage: CollectTradeStage) => void;
  onOperation: (operation: ApiMarketOperation) => void;
  onKnownHash: (hash: Hex, purpose: "APPROVAL" | "TRANSACTION") => void;
}) {
  const {
    wallet,
    client,
    operation,
    expected,
    assertConnection,
    onCommitment,
    setStage,
    onOperation,
    onKnownHash,
  } = options;
  const account = await checkMarketWallet(wallet, client, expected);
  const approval = operation.approval_transactions[0];
  const transaction = approval ?? operation.transaction;
  if (transaction) {
    validateMarketTransaction(transaction, operation, expected);
    const request = {
      account,
      to: getAddress(transaction.to),
      value: BigInt(transaction.value),
      data: transaction.data as Hex,
      chain: mainnet,
    };
    await client.call(request);
    const estimatedGas = await client.estimateGas(request);
    const fees = await reviewedMarketGasLimits(
      client,
      transaction,
      estimatedGas
    );
    assertConnection();
    validateMarketOperation(operation, expected);
    const { hash } = await sendReviewedMarketTransaction({
      operation,
      expected,
      transaction,
      assertConnection,
      send: () => {
        setStage(approval ? "approval" : "wallet");
        return wallet.sendTransaction({ ...request, ...fees });
      },
      onOperation,
    });
    // The server journals approval hashes too, so reload/device changes cannot reopen a send.
    setStage("submitted");
    onKnownHash(hash, approval ? "APPROVAL" : "TRANSACTION");
    const submitted = await acknowledgeMarketSubmission(
      () => submitMarketTransaction(operation.id, { transaction_hash: hash }),
      () => {
        setStage("reconciling");
        assertConnection();
      }
    );
    assertMarketOperationIdentity(submitted, operation);
    assertConnection();
    onOperation(submitted);
  } else {
    if (
      !operation.order ||
      !["LIST", "OFFER"].includes(operation.kind) ||
      operation.state !== ApiMarketOperationStateEnum.AwaitingSignature
    )
      throw new Error("MARKET_REVIEW_MISMATCH");
    assertConnection();
    validateMarketOperation(operation, expected);
    setStage("signature");
    const signature = await wallet.signTypedData({
      ...marketTypedData(operation.order.components),
      account,
    });
    assertConnection();
    validateMarketOperation(operation, expected);
    if (operation.kind === ApiMarketKind.Offer)
      onCommitment?.(operation, expected);
    setStage("publishing");
    onOperation(await submitMarketSignature(operation.id, { signature }));
  }
}

async function recoverRecordedMarketTransaction(options: {
  readonly client: PublicClient;
  readonly operation: ApiMarketOperation;
  readonly hash: string;
  readonly assertRecoveryActor: () => void;
  readonly onOperation: (operation: ApiMarketOperation) => void;
}) {
  const { client, operation, hash, assertRecoveryActor, onOperation } = options;
  assertRecoveryActor();
  const current = await fetchMarketOperation(operation.id);
  assertMarketOperationIdentity(current, operation);
  assertRecoveryActor();
  const attempt = marketOperationSendAttempt(current);
  if (!attempt) {
    onOperation(current);
    return;
  }
  const verified = await verifyRecoveredMarketTransaction(
    client,
    current,
    attempt,
    hash
  );
  assertRecoveryActor();
  const saved = readMarketIntent(current.profile_id, current.id);
  if (saved)
    saveMarketIntent(current.profile_id, current.id, {
      request: saved.request,
      sendAttempt: attempt,
      ...(attempt.purpose === "APPROVAL"
        ? { approvalHash: verified }
        : { transactionHash: verified }),
    });
  const resolved = await submitMarketTransaction(current.id, {
    transaction_hash: verified,
  });
  assertMarketOperationIdentity(resolved, operation);
  assertRecoveryActor();
  clearResolvedMarketSend(resolved);
  onOperation(resolved);
}

async function assertMarketActionEnabled(expected: ApiMarketPrepareRequest) {
  const capability = await fetchCollectCapabilities();
  if (
    !capability.actions.some(
      (action) =>
        action.action.toString() === expected.kind.toString() && action.enabled
    )
  )
    throw new Error("MARKET_ACTION_DISABLED");
}

function assertMarketOperationIdentity(
  operation: ApiMarketOperation,
  reviewed: ApiMarketOperation
) {
  if (
    operation.id !== reviewed.id ||
    operation.profile_id !== reviewed.profile_id ||
    operation.wallet.toLowerCase() !== reviewed.wallet.toLowerCase()
  )
    throw new Error("MARKET_REVIEW_MISMATCH");
}

export function useMarketExecution(
  onOperation: (operation: ApiMarketOperation) => void
) {
  const locale = useBrowserLocale();
  const auth = useAuth();
  const connection = useSeizeConnectContext();
  const { data: wallet } = useWalletClient();
  const client = usePublicClient({ chainId: 1 });
  const [stage, setStage] = useState<CollectTradeStage | null>(null);
  const executionStage = useRef<CollectTradeStage>("preparing");
  const updateStage = (next: CollectTradeStage | null) => {
    if (next !== null) executionStage.current = next;
    setStage(next);
  };
  const [message, setMessage] = useState<string | undefined>();
  const [reviewChangeNotice, setReviewChangeNotice] =
    useState<MarketReviewChangeNotice>();
  const showReviewChange = (
    shown: ApiMarketOperation,
    fresh: ApiMarketOperation,
    change: "terms" | "gas"
  ) => {
    const notice = marketReviewChangeNotice(shown, fresh, locale, change);
    setReviewChangeNotice(notice);
    setMessage(notice.summary);
  };
  const busy = useRef(false);
  const walletScope = useMarketWalletScope({
    auth,
    connection,
    wallet,
    client,
  });
  const [knownTransaction, setKnownTransaction] = useState<{
    operationId: string;
    hash: string;
    purpose: "APPROVAL" | "TRANSACTION";
  }>();
  const confirm = async (
    operation: ApiMarketOperation,
    expected: ApiMarketPrepareRequest,
    assertIntent?: () => void,
    onCommitment?: (
      operation: ApiMarketOperation,
      expected: ApiMarketPrepareRequest
    ) => void
  ) => {
    if (busy.current) return;
    setReviewChangeNotice(undefined);
    if (!client || !wallet) {
      setMessage(t(locale, "collect.trade.walletNotReady"));
      return;
    }
    busy.current = true;
    setMessage(undefined);
    updateStage("preparing");
    try {
      const assertScope = walletScope.capture(expected);
      await withMarketOperationLock(operation.id, async () => {
        const assertConnection = () => {
          assertScope();
          assertIntent?.();
        };
        assertConnection();
        await assertMarketActionEnabled(expected);
        let current = await fetchMarketOperation(operation.id);
        assertMarketOperationIdentity(current, operation);
        clearResolvedMarketSend(current);
        // Revisions can change with quote metadata; reviewed terms are compared below.
        const prior = readMarketIntent(expected.profile_id, current.id);
        const attempt = marketOperationSendAttempt(current);
        const knownHash = knownMarketTransactionHash(current, attempt, prior);
        if (knownHash && attempt) {
          updateStage("reconciling");
          setKnownTransaction({
            operationId: current.id,
            hash: knownHash,
            purpose: attempt.purpose,
          });
          await recoverRecordedMarketTransaction({
            client,
            operation: current,
            hash: knownHash,
            assertRecoveryActor: walletScope.capture(operation, true, true),
            onOperation,
          });
          return;
        }
        if (attempt) throw new Error("MARKET_BROADCAST_UNKNOWN");
        if (prior?.transactionHash) {
          updateStage("reconciling");
          setKnownTransaction({
            operationId: current.id,
            hash: prior.transactionHash,
            purpose: "TRANSACTION",
          });
          onOperation(
            await submitMarketTransaction(current.id, {
              transaction_hash: prior.transactionHash,
            })
          );
          return;
        }
        if (prior?.approvalHash) {
          updateStage("reconciling");
          const receipt = await client.waitForTransactionReceipt({
            hash: prior.approvalHash,
            confirmations: 1,
          });
          if (receipt.status !== "success") {
            saveMarketIntent(expected.profile_id, current.id, {
              request: expected,
            });
            throw new Error("MARKET_APPROVAL_REVERTED");
          }
          assertConnection();
          const continued = await continueMarketOperation(current.id);
          assertConnection();
          assertMarketOperationIdentity(continued, operation);
          if (marketOperationSendAttempt(continued))
            throw new Error("MARKET_BROADCAST_UNKNOWN");
          validateMarketOperation(continued, expected);
          saveMarketIntent(expected.profile_id, current.id, {
            request: expected,
          });
          onOperation(continued);
          setStage(null);
          return;
        }
        assertConnection();
        if (
          !["REVIEW", "APPROVAL", "AWAITING_SIGNATURE"].includes(current.state)
        ) {
          onOperation(current);
          return;
        }
        if (
          ["BUY", "ACCEPT", "CANCEL"].includes(current.kind) ||
          !isFreshMarketReviewExpiry(current.expires_at)
        ) {
          // The old snapshot binds the user's intent, not execution authority.
          // Only the fresh continuation below can reach the wallet.
          validateMarketOperationForRefresh(current, expected);
          const refreshed = await continueMarketOperation(current.id);
          assertConnection();
          assertMarketOperationIdentity(refreshed, operation);
          if (marketOperationSendAttempt(refreshed))
            throw new Error("MARKET_BROADCAST_UNKNOWN");
          validateMarketOperation(refreshed, expected);
          const change = marketReviewChange(operation, refreshed);
          if (change) {
            onOperation(refreshed);
            setStage(null);
            showReviewChange(operation, refreshed, change);
            return;
          }
          current = refreshed;
          onOperation(refreshed);
        } else {
          validateMarketOperation(current, expected);
        }
        if (
          ["LIST", "OFFER"].includes(current.kind) &&
          current.state === ApiMarketOperationStateEnum.Review &&
          current.approval_transactions.length === 0
        ) {
          const continued = await continueMarketOperation(current.id);
          assertConnection();
          assertMarketOperationIdentity(continued, operation);
          if (marketOperationSendAttempt(continued))
            throw new Error("MARKET_BROADCAST_UNKNOWN");
          validateMarketOperation(continued, expected);
          onOperation(continued);
          const change = marketReviewChange(current, continued);
          if (change) {
            setStage(null);
            showReviewChange(current, continued, change);
            return;
          }
          current = continued;
        }
        const change = marketReviewChange(operation, current);
        if (change) {
          onOperation(current);
          setStage(null);
          showReviewChange(operation, current, change);
          return;
        }
        if (
          !saveMarketIntent(expected.profile_id, current.id, {
            request: expected,
          })
        )
          throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
        // A completed approval's hash must not conceal a later unknown fulfillment.
        setKnownTransaction(undefined);
        await executeReviewedMarketOperation({
          wallet,
          client,
          operation: current,
          expected,
          assertConnection,
          onCommitment,
          setStage: updateStage,
          onOperation,
          onKnownHash: (hash, purpose) =>
            setKnownTransaction({ operationId: current.id, hash, purpose }),
        });
        setStage(null);
      });
    } catch (error) {
      setReviewChangeNotice(undefined);
      setMessage(marketExecutionError(error, locale, executionStage.current));
      setStage(null);
    } finally {
      setStage(null);
      busy.current = false;
    }
  };
  const recoverTransaction = async (
    operation: ApiMarketOperation,
    hash: string
  ) => {
    if (busy.current) return;
    setReviewChangeNotice(undefined);
    if (!client) {
      setMessage(t(locale, "collect.trade.walletNotReady"));
      return;
    }
    busy.current = true;
    setMessage(undefined);
    updateStage("reconciling");
    try {
      await withMarketOperationLock(operation.id, async () => {
        const assertRecoveryActor = walletScope.capture(operation, true, true);
        await recoverRecordedMarketTransaction({
          client,
          operation,
          hash,
          assertRecoveryActor,
          onOperation,
        });
      });
    } catch (error) {
      setReviewChangeNotice(undefined);
      setMessage(marketExecutionError(error, locale, executionStage.current));
    } finally {
      setStage(null);
      busy.current = false;
    }
  };
  const clearMessage = () => {
    setMessage(undefined);
    setReviewChangeNotice(undefined);
  };
  return {
    confirm,
    recoverTransaction,
    stage,
    busy: stage !== null,
    message,
    reviewChangeNotice,
    clearMessage,
    knownTransaction,
    ready: walletScope.ready,
    readinessReason: walletScope.readinessReason,
  };
}
