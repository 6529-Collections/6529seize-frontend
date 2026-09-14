import { isHex, type Hex } from "viem";
import type { MarketSendAttempt } from "./market-send-attempt";

interface Operation {
  readonly profile_id: string;
  readonly wallet: string;
  readonly transaction_hash?: string | null;
  readonly send_attempt?: {
    readonly attempt_id: string;
    readonly purpose: string;
    readonly transaction_digest: string;
    readonly status: string;
    readonly transaction_hash: string | null;
  } | null;
}
interface Saved {
  readonly request: { readonly profile_id: string; readonly wallet: string };
  readonly sendAttempt?: MarketSendAttempt;
  readonly approvalHash?: string;
  readonly transactionHash?: string;
}

function transactionHash(value: string | null | undefined): Hex | undefined {
  return value && isHex(value, { strict: true }) && value.length === 66
    ? value
    : undefined;
}

/** A previous approval or another attempt's hash cannot hide an unknown send. */
export function knownMarketTransactionHash(
  operation: Operation,
  attempt: MarketSendAttempt | undefined,
  saved: Saved | null
): Hex | undefined {
  const matchingActor =
    saved?.request.profile_id === operation.profile_id &&
    saved.request.wallet.toLowerCase() === operation.wallet.toLowerCase();
  if (!attempt)
    return (
      transactionHash(operation.transaction_hash) ??
      transactionHash(matchingActor ? saved.transactionHash : undefined)
    );

  const server = operation.send_attempt;
  if (
    server?.status === "ACTIVE" &&
    server.attempt_id === attempt.id &&
    server.purpose === attempt.purpose &&
    server.transaction_digest === attempt.digest
  ) {
    const hash = transactionHash(server.transaction_hash);
    if (hash) return hash;
  }
  if (
    !matchingActor ||
    saved.sendAttempt?.id !== attempt.id ||
    saved.sendAttempt.purpose !== attempt.purpose ||
    saved.sendAttempt.digest !== attempt.digest
  )
    return undefined;
  return transactionHash(
    attempt.purpose === "APPROVAL" ? saved.approvalHash : saved.transactionHash
  );
}
