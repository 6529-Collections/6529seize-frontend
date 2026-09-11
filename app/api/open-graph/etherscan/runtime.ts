import type { Hash } from "viem";

const BLOCK_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

export function isBlockHash(value: string): value is Hash {
  return BLOCK_HASH_PATTERN.test(value);
}

export function asBigInt(value: unknown): bigint | undefined {
  return typeof value === "bigint" ? value : undefined;
}

export function getTransactionBlockNumber(transaction: {
  readonly blockNumber?: bigint | null | undefined;
}): bigint | undefined {
  return transaction.blockNumber ?? undefined;
}
