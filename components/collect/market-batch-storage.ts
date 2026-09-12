import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import { isHex, type Hex } from "viem";
import {
  isMarketSendAttempt,
  type MarketSendAttempt,
} from "./market-send-attempt";
import { validateMarketBatchRequest } from "./market-batch-validation";

export interface SavedMarketBatch {
  readonly request: ApiMarketBatchPrepareRequest;
  readonly transactionHash?: Hex;
  readonly sendAttempt?: MarketSendAttempt;
}
const key = (profile: string, id: string) =>
  `6529-market-batch:${profile}:${id}`;
const memory = new Map<string, SavedMarketBatch>();
/** Call only after authoritative recovery proves a terminal state without an active send. */
export function retireMarketBatch(profile: string, id: string) {
  memory.delete(key(profile, id));
  try {
    localStorage.removeItem(key(profile, id));
  } catch {
    // A leftover journal will be rechecked against the server, never treated as permission to send.
  }
}
/** Enumerate only this profile's public journals, including other tabs and reloads. */
export function listSavedMarketBatches(
  profile: string
): Array<{ id: string; saved: SavedMarketBatch }> {
  const prefix = `6529-market-batch:${profile}:`;
  const keys = new Set(
    [...memory.keys()].filter((item) => item.startsWith(prefix))
  );
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const item = localStorage.key(index);
      if (item?.startsWith(prefix)) keys.add(item);
    }
  } catch {
    throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
  }
  return [...keys].map((item) => {
    const id = item.slice(prefix.length);
    const saved = readMarketBatch(profile, id);
    if (!saved) throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
    return { id, saved };
  });
}
/** Public selected intent and send markers only; never save signed orders or calldata. */
export function saveMarketBatch(
  profile: string,
  id: string,
  value: SavedMarketBatch
): boolean {
  memory.set(key(profile, id), value);
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key(profile, id), serialized);
    return localStorage.getItem(key(profile, id)) === serialized;
  } catch {
    return false;
  }
}
export function readMarketBatch(
  profile: string,
  id: string
): SavedMarketBatch | null {
  const remembered = memory.get(key(profile, id));
  const stored = readPersistedMarketBatch(profile, id);
  if (remembered?.transactionHash) return remembered;
  if (stored?.transactionHash) return stored;
  if (remembered?.sendAttempt) return remembered;
  return stored ?? remembered ?? null;
}
export function readPersistedMarketBatch(
  profile: string,
  id: string
): SavedMarketBatch | null {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(key(profile, id)) ?? "null"
    );
    if (isSaved(parsed, profile)) return parsed;
  } catch {
    /* Storage may disappear after the wallet returns a hash. */
  }
  return null;
}
function isSaved(value: unknown, profile: string): value is SavedMarketBatch {
  if (value === null || typeof value !== "object" || !("request" in value))
    return false;
  const request = value.request as ApiMarketBatchPrepareRequest;
  try {
    if (request.profile_id !== profile) return false;
    // Shape check only. Current authoritative profile membership is rechecked before execution.
    validateMarketBatchRequest(request, [
      request.wallet,
      ...request.items.flatMap((item) =>
        item.allocations
          .filter((allocation) => !allocation.acknowledge_external_recipient)
          .map((allocation) => allocation.recipient)
      ),
    ]);
  } catch {
    return false;
  }
  if (
    "transactionHash" in value &&
    value.transactionHash !== undefined &&
    !(
      typeof value.transactionHash === "string" &&
      isHex(value.transactionHash, { strict: true }) &&
      value.transactionHash.length === 66
    )
  )
    return false;
  if (
    "sendAttempt" in value &&
    value.sendAttempt !== undefined &&
    (!isMarketSendAttempt(value.sendAttempt) ||
      value.sendAttempt.purpose !== "TRANSACTION")
  )
    return false;
  return true;
}
