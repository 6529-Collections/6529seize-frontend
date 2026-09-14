import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketBatchPreflight } from "@/generated/models/ApiMarketBatchPreflight";
import { preflightMarketBatch } from "@/services/api/market-batch-api";
import type { Hex, PublicClient } from "viem";
import { marketTransactionDigest } from "./market-send-attempt";

function validSnapshot(
  result: ApiMarketBatchPreflight,
  operation: ApiMarketBatchOperation
) {
  return (
    Number.isSafeInteger(result.block_number) &&
    result.block_number > 0 &&
    result.block_number >=
      (operation.block_number ?? Number.POSITIVE_INFINITY) &&
    Number.isSafeInteger(result.block_timestamp) &&
    result.block_timestamp > 0 &&
    result.block_timestamp >=
      (operation.block_timestamp ?? Number.POSITIVE_INFINITY) &&
    typeof result.block_hash === "string" &&
    /^0x[0-9a-f]{64}$/i.test(result.block_hash)
  );
}

async function verifySnapshot(
  client: PublicClient,
  result: ApiMarketBatchPreflight
) {
  const [snapshot, latest] = await Promise.all([
    client.getBlock({ blockNumber: BigInt(result.block_number) }),
    client.getBlock({ blockTag: "latest" }),
  ]);
  if (
    snapshot.number !== BigInt(result.block_number) ||
    typeof snapshot.hash !== "string" ||
    snapshot.hash.toLowerCase() !== result.block_hash.toLowerCase() ||
    snapshot.timestamp !== BigInt(result.block_timestamp) ||
    typeof latest.timestamp !== "bigint" ||
    latest.timestamp < 0n ||
    latest.timestamp - snapshot.timestamp > 120n ||
    snapshot.timestamp - latest.timestamp > 120n
  )
    throw new Error("MARKET_REVIEW_MISMATCH");
}

/** Simulate only the authenticated stored payload; never upload calldata to public RPC. */
export async function preflightReviewedMarketBatch(
  client: PublicClient,
  operation: ApiMarketBatchOperation
): Promise<bigint> {
  const transaction = operation.transaction;
  if (!transaction) throw new Error("MARKET_REVIEW_MISMATCH");
  const digest = marketTransactionDigest({
    chainId: transaction.chain_id,
    from: transaction.sender,
    to: transaction.to,
    value: BigInt(transaction.value),
    input: transaction.data as Hex,
  });
  const result = await preflightMarketBatch(operation.id, {
    expected_revision: operation.revision,
    transaction_digest: digest,
  });
  if (
    result.operation_id !== operation.id ||
    result.revision !== operation.revision ||
    result.transaction_digest !== digest ||
    typeof result.estimated_gas !== "string" ||
    !/^[1-9]\d{0,77}$/.test(result.estimated_gas) ||
    !validSnapshot(result, operation)
  )
    throw new Error("MARKET_REVIEW_MISMATCH");
  await verifySnapshot(client, result);
  return BigInt(result.estimated_gas);
}
