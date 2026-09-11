import type { ApiMarketTransaction } from "@/generated/models/ApiMarketTransaction";
import { getAddress, isHex, sha256, stringToHex, type Hex } from "viem";

/** Public transaction fingerprint only: never persist signatures or order calldata. */
export interface MarketSendAttempt {
  readonly id: string;
  readonly purpose: "APPROVAL" | "TRANSACTION";
  readonly digest: string;
  readonly snapshotBlock: number;
  readonly walletRequested: boolean;
  readonly expectedRevision: string;
  readonly rejectionReason?: "USER_REJECTED" | "WALLET_NOT_REQUESTED";
}

export function marketTransactionDigest(transaction: {
  readonly chainId: number | undefined;
  readonly from: string;
  readonly to: string;
  readonly value: bigint;
  readonly input: Hex;
}): string {
  if (transaction.chainId !== 1) throw new Error("MARKET_REVIEW_MISMATCH");
  // Match the independently implemented backend reviewed-transaction digest.
  return sha256(
    stringToHex(
      JSON.stringify({
        chain_id: 1,
        from: getAddress(transaction.from).toLowerCase(),
        to: getAddress(transaction.to).toLowerCase(),
        data: transaction.input.toLowerCase(),
        value: transaction.value.toString(),
      })
    )
  ).slice(2);
}

export function createMarketSendAttempt(
  transaction: ApiMarketTransaction,
  snapshotBlock: number | undefined,
  expectedRevision = ""
): MarketSendAttempt {
  if (
    snapshotBlock === undefined ||
    !Number.isSafeInteger(snapshotBlock) ||
    snapshotBlock < 0 ||
    !isHex(transaction.data, { strict: true })
  )
    throw new Error("MARKET_REVIEW_MISMATCH");
  return {
    id: crypto.randomUUID(),
    purpose: transaction.purpose.startsWith("APPROVE_")
      ? "APPROVAL"
      : "TRANSACTION",
    digest: marketTransactionDigest({
      chainId: transaction.chain_id,
      from: transaction.sender,
      to: transaction.to,
      value: BigInt(transaction.value),
      input: transaction.data,
    }),
    snapshotBlock,
    walletRequested: false,
    expectedRevision,
  };
}

export function isMarketSendAttempt(
  value: unknown
): value is MarketSendAttempt {
  if (value === null || typeof value !== "object") return false;
  const fields = value as Record<string, unknown>;
  return (
    typeof fields["id"] === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      fields["id"]
    ) &&
    (fields["purpose"] === "APPROVAL" || fields["purpose"] === "TRANSACTION") &&
    typeof fields["digest"] === "string" &&
    /^[0-9a-f]{64}$/.test(fields["digest"]) &&
    typeof fields["snapshotBlock"] === "number" &&
    Number.isSafeInteger(fields["snapshotBlock"]) &&
    fields["snapshotBlock"] >= 0 &&
    typeof fields["walletRequested"] === "boolean" &&
    typeof fields["expectedRevision"] === "string" &&
    [undefined, "USER_REJECTED", "WALLET_NOT_REQUESTED"].includes(
      fields["rejectionReason"] as string | undefined
    )
  );
}

/** Only the wallet's explicit EIP-1193 user rejection proves no send occurred. */
export function isMarketSendRejected(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 8; depth++) {
    if (current === null || typeof current !== "object") return false;
    if ("code" in current && current.code === 4001) return true;
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}
