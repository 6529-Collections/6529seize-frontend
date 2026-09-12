import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import {
  fetchMarketBatchCapabilities,
  fetchMarketBatch,
  continueMarketBatch,
  submitMarketBatchTransaction,
} from "@/services/api/market-batch-api";
import {
  getAddress,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { mainnet } from "viem/chains";
import {
  validateMarketBatchOperation,
  marketBatchReviewTerms,
} from "./market-batch-validation";
import {
  batchSendAttempt,
  clearResolvedBatchSend,
  sendReviewedMarketBatch,
} from "./market-batch-send";
import { readMarketBatch, saveMarketBatch } from "./market-batch-storage";
import { verifyRecoveredMarketTransaction } from "./market-send-recovery";
import { withMarketOperationLock } from "./market-operation-lock";

interface Execution {
  readonly client: PublicClient;
  readonly wallet: WalletClient;
  readonly operation: ApiMarketBatchOperation;
  readonly expected: ApiMarketBatchPrepareRequest;
  readonly profileWallets: readonly string[];
  readonly assertConnection: () => void;
  readonly onOperation: (operation: ApiMarketBatchOperation) => void;
}
function assertIdentity(
  operation: ApiMarketBatchOperation,
  prior: ApiMarketBatchOperation
) {
  if (
    operation.id !== prior.id ||
    operation.profile_id !== prior.profile_id ||
    operation.wallet.toLowerCase() !== prior.wallet.toLowerCase()
  )
    throw new Error("MARKET_REVIEW_MISMATCH");
}
export async function recoverMarketBatch(options: {
  readonly client: PublicClient;
  readonly operation: ApiMarketBatchOperation;
  readonly hash: string;
  readonly assertConnection: () => void;
  readonly onOperation: (operation: ApiMarketBatchOperation) => void;
}) {
  const { client, operation, hash, assertConnection, onOperation } = options;
  assertConnection();
  const current = await fetchMarketBatch(operation.id);
  assertIdentity(current, operation);
  const attempt = batchSendAttempt(current);
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
  assertConnection();
  const saved = readMarketBatch(current.profile_id, current.id);
  if (saved)
    saveMarketBatch(current.profile_id, current.id, {
      request: saved.request,
      sendAttempt: attempt,
      transactionHash: verified,
    });
  const resolved = await submitMarketBatchTransaction(current.id, {
    transaction_hash: verified,
  });
  assertIdentity(resolved, operation);
  clearResolvedBatchSend(resolved);
  onOperation(resolved);
}

async function send(options: Execution) {
  const {
    client,
    wallet,
    operation,
    expected,
    profileWallets,
    assertConnection,
    onOperation,
  } = options;
  if ((await client.getChainId()) !== 1 || (await wallet.getChainId()) !== 1)
    throw new Error("MARKET_WRONG_CHAIN");
  const accounts = await wallet.getAddresses();
  if (
    !accounts.some(
      (account) => account.toLowerCase() === expected.wallet.toLowerCase()
    )
  )
    throw new Error("MARKET_CONNECTION_CHANGED");
  const account = getAddress(expected.wallet);
  const code = await client.getCode({ address: account });
  if (code && code !== "0x") throw new Error("MARKET_UNSUPPORTED_WALLET");
  validateMarketBatchOperation(operation, expected, profileWallets);
  const transaction = operation.transaction;
  if (!transaction) throw new Error("MARKET_REVIEW_MISMATCH");
  const request = {
    account,
    to: getAddress(transaction.to),
    value: BigInt(transaction.value),
    data: transaction.data as Hex,
    chain: mainnet,
  };
  await client.call(request);
  const estimated = await client.estimateGas(request);
  const gas = BigInt(transaction.gas_limit!),
    maxFeePerGas = BigInt(transaction.max_fee_per_gas!);
  if (estimated > gas || gas > 16_777_216n)
    throw new Error("MARKET_GAS_CAP_CHANGED");
  const fees = await client.estimateFeesPerGas();
  if (
    fees.maxFeePerGas > maxFeePerGas ||
    fees.maxPriorityFeePerGas > maxFeePerGas
  )
    throw new Error("MARKET_GAS_CAP_CHANGED");
  assertConnection();
  validateMarketBatchOperation(operation, expected, profileWallets);
  const result = await sendReviewedMarketBatch({
    operation,
    expected,
    profileWallets,
    assertConnection,
    onOperation,
    send: () =>
      wallet.sendTransaction({
        ...request,
        gas,
        maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      }),
  });
  const submitted = await submitMarketBatchTransaction(operation.id, {
    transaction_hash: result.hash,
  });
  assertIdentity(submitted, operation);
  onOperation(submitted);
}

/** Explicit review confirmation is the only entry point that can request a wallet transaction. */
export async function confirmMarketBatch(
  options: Execution
): Promise<"UPDATED_REVIEW" | "COMPLETE"> {
  return withMarketOperationLock(options.operation.id, async () => {
    const { operation, expected, assertConnection, onOperation, client } =
      options;
    assertConnection();
    const capability = await fetchMarketBatchCapabilities();
    if (
      capability.available !== true ||
      capability.execution_policy !== "ALL_OR_REVERT" ||
      capability.currency.toString() !== expected.currency.toString() ||
      capability.requires_complete_simulation !== true
    )
      throw new Error("MARKET_ACTION_DISABLED");
    let current = await fetchMarketBatch(operation.id);
    assertIdentity(current, operation);
    clearResolvedBatchSend(current);
    const prior = readMarketBatch(expected.profile_id, current.id);
    if (prior?.transactionHash) {
      await recoverMarketBatch({
        client,
        operation: current,
        hash: prior.transactionHash,
        assertConnection,
        onOperation,
      });
      return "COMPLETE";
    }
    if (batchSendAttempt(current)) throw new Error("MARKET_BROADCAST_UNKNOWN");
    if (current.revision !== operation.revision) {
      onOperation(current);
      return "UPDATED_REVIEW";
    }
    if (current.state !== "REVIEW") {
      onOperation(current);
      return "COMPLETE";
    }
    validateMarketBatchOperation(current, expected, options.profileWallets);
    const refreshed = await continueMarketBatch(current.id);
    assertIdentity(refreshed, operation);
    validateMarketBatchOperation(refreshed, expected, options.profileWallets);
    if (batchSendAttempt(refreshed))
      throw new Error("MARKET_BROADCAST_UNKNOWN");
    assertConnection();
    if (marketBatchReviewTerms(refreshed) !== marketBatchReviewTerms(current)) {
      onOperation(refreshed);
      return "UPDATED_REVIEW";
    }
    current = refreshed;
    onOperation(current);
    if (current.state !== "REVIEW") return "COMPLETE";
    if (
      !saveMarketBatch(expected.profile_id, current.id, { request: expected })
    )
      throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
    await send({ ...options, operation: current });
    return "COMPLETE";
  });
}
