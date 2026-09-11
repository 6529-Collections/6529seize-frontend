import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import type { ApiMarketTransaction } from "@/generated/models/ApiMarketTransaction";
import type { ApiMarketSendAttemptRequest } from "@/generated/models/ApiMarketSendAttemptRequest";
import type { ApiMarketSendAttemptRejection } from "@/generated/models/ApiMarketSendAttemptRejection";
import { ApiMarketSendAttemptStatusEnum } from "@/generated/models/ApiMarketSendAttempt";
import {
  beginMarketTransactionAttempt,
  rejectMarketTransactionAttempt,
} from "@/services/api/market-api";
import { isHex, type Hex, type PublicClient } from "viem";
import { readMarketIntent, saveMarketIntent } from "./market-operation-storage";
import {
  createMarketSendAttempt,
  isMarketSendRejected,
  marketTransactionDigest,
  type MarketSendAttempt,
} from "./market-send-attempt";
import { marketReviewTerms } from "./market-review-terms";
import { validateMarketOperation } from "./market-validation";

export function marketOperationSendAttempt(
  operation: ApiMarketOperation
): MarketSendAttempt | undefined {
  const saved = readMarketIntent(
    operation.profile_id,
    operation.id
  )?.sendAttempt;
  const server = operation.send_attempt;
  if (server?.status === ApiMarketSendAttemptStatusEnum.Active)
    return {
      id: server.attempt_id,
      purpose: server.purpose,
      digest: server.transaction_digest,
      snapshotBlock: server.snapshot_block,
      walletRequested: true,
      expectedRevision:
        saved?.id === server.attempt_id ? saved.expectedRevision : "",
      ...(saved?.id === server.attempt_id && saved.rejectionReason
        ? { rejectionReason: saved.rejectionReason }
        : {}),
    };
  if (server && server.attempt_id === saved?.id) return undefined;
  return saved;
}

export function clearResolvedMarketSend(operation: ApiMarketOperation): void {
  const saved = readMarketIntent(operation.profile_id, operation.id);
  const server = operation.send_attempt;
  if (
    !saved?.sendAttempt ||
    !server ||
    server.status === ApiMarketSendAttemptStatusEnum.Active ||
    server.attempt_id !== saved.sendAttempt.id
  )
    return;
  saveMarketIntent(operation.profile_id, operation.id, {
    request: saved.request,
    ...(saved.transactionHash
      ? { transactionHash: saved.transactionHash }
      : {}),
  });
}

export async function rejectUnsentMarketAttempt(
  operation: ApiMarketOperation,
  expected: ApiMarketPrepareRequest,
  attempt: MarketSendAttempt,
  reason: "USER_REJECTED" | "WALLET_NOT_REQUESTED"
): Promise<ApiMarketOperation> {
  saveMarketIntent(expected.profile_id, operation.id, {
    request: expected,
    sendAttempt: { ...attempt, rejectionReason: reason },
  });
  const result = await rejectMarketTransactionAttempt(operation.id, {
    attempt_id: attempt.id,
    reason: reason as ApiMarketSendAttemptRejection["reason"],
    ...(reason === "WALLET_NOT_REQUESTED"
      ? { expected_revision: attempt.expectedRevision }
      : {}),
  });
  if (
    result.id !== operation.id ||
    result.send_attempt?.attempt_id !== attempt.id ||
    result.send_attempt.status !== ApiMarketSendAttemptStatusEnum.Rejected
  )
    throw new Error("MARKET_BROADCAST_UNKNOWN");
  saveMarketIntent(expected.profile_id, operation.id, { request: expected });
  return result;
}

/** A server acknowledgement and durable local marker both precede the wallet request. */
export async function sendReviewedMarketTransaction(options: {
  readonly operation: ApiMarketOperation;
  readonly expected: ApiMarketPrepareRequest;
  readonly transaction: ApiMarketTransaction;
  readonly assertConnection: () => void;
  readonly send: () => Promise<Hex>;
  readonly onOperation: (operation: ApiMarketOperation) => void;
}): Promise<{ hash: Hex; attempt: MarketSendAttempt }> {
  const {
    operation,
    expected,
    transaction,
    assertConnection,
    send,
    onOperation,
  } = options;
  let attempt = createMarketSendAttempt(
    transaction,
    operation.block_number,
    operation.revision
  );
  let walletRequested = false;
  if (
    !saveMarketIntent(expected.profile_id, operation.id, {
      request: expected,
      sendAttempt: attempt,
    })
  )
    throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
  try {
    const armed = await beginMarketTransactionAttempt(operation.id, {
      expected_revision: operation.revision,
      attempt_id: attempt.id,
      purpose: attempt.purpose as ApiMarketSendAttemptRequest["purpose"],
      transaction_digest: attempt.digest,
    });
    const server = armed.send_attempt;
    if (
      armed.id !== operation.id ||
      server?.status !== ApiMarketSendAttemptStatusEnum.Active ||
      server.attempt_id !== attempt.id ||
      server.purpose.toString() !== attempt.purpose ||
      server.transaction_digest !== attempt.digest ||
      server.snapshot_block !== attempt.snapshotBlock ||
      createMarketSendAttempt(server.transaction, server.snapshot_block)
        .digest !== attempt.digest ||
      marketReviewTerms(armed) !== marketReviewTerms(operation)
    )
      throw new Error("MARKET_REVIEW_MISMATCH");
    validateMarketOperation(armed, expected);
    assertConnection();
    attempt = { ...attempt, walletRequested: true };
    if (
      !saveMarketIntent(expected.profile_id, operation.id, {
        request: expected,
        sendAttempt: attempt,
      })
    )
      throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
    onOperation(armed);
    walletRequested = true;
    const hash = await send();
    if (!isHex(hash, { strict: true }) || hash.length !== 66)
      throw new Error("MARKET_BROADCAST_UNKNOWN");
    saveMarketIntent(expected.profile_id, operation.id, {
      request: expected,
      sendAttempt: attempt,
      ...(attempt.purpose === "APPROVAL"
        ? { approvalHash: hash }
        : { transactionHash: hash }),
    });
    return { hash, attempt };
  } catch (error) {
    if (!walletRequested || isMarketSendRejected(error)) {
      try {
        onOperation(
          await rejectUnsentMarketAttempt(
            operation,
            expected,
            attempt,
            walletRequested ? "USER_REJECTED" : "WALLET_NOT_REQUESTED"
          )
        );
      } catch {
        throw new Error("MARKET_BROADCAST_UNKNOWN");
      }
      throw error;
    }
    throw new Error("MARKET_BROADCAST_UNKNOWN");
  }
}

export async function verifyRecoveredMarketTransaction(
  client: PublicClient,
  operation: ApiMarketOperation,
  attempt: MarketSendAttempt,
  value: string
): Promise<Hex> {
  if (!isHex(value, { strict: true }) || value.length !== 66)
    throw new Error("MARKET_REVIEW_MISMATCH");
  if ((await client.getChainId()) !== 1) throw new Error("MARKET_WRONG_CHAIN");
  const transaction = await client.getTransaction({ hash: value });
  if (
    !transaction.to ||
    transaction.hash.toLowerCase() !== value.toLowerCase() ||
    transaction.from.toLowerCase() !== operation.wallet.toLowerCase() ||
    isPriorMarketSnapshot(transaction.blockNumber, attempt.snapshotBlock) ||
    marketTransactionDigest({
      chainId: transaction.chainId,
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      input: transaction.input,
    }) !== attempt.digest
  )
    throw new Error("MARKET_REVIEW_MISMATCH");
  return value;
}

function isPriorMarketSnapshot(
  blockNumber: bigint | null,
  snapshotBlock: number
): boolean {
  // Pending RPC transactions can have a null block even when a client generic
  // narrows its result to mined transactions.
  return blockNumber !== null && blockNumber <= BigInt(snapshotBlock);
}
