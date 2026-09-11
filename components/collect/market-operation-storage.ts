import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import { isAddress, isHex, type Hex } from "viem";
import {
  isMarketSendAttempt,
  type MarketSendAttempt,
} from "./market-send-attempt";

const key = (profileId: string, operationId: string) =>
  `6529-market:${profileId}:${operationId}`;
// Keep a just-returned hash available even if storage becomes unavailable after the wallet opens.
const memory = new Map<string, SavedMarketIntent>();
const isOptionalHash = (value: unknown): value is Hex | undefined =>
  value === undefined ||
  (typeof value === "string" &&
    isHex(value, { strict: true }) &&
    value.length === 66);
interface SavedMarketIntent {
  readonly request: ApiMarketPrepareRequest;
  readonly transactionHash?: Hex;
  readonly approvalHash?: Hex;
  readonly sendAttempt?: MarketSendAttempt;
}
export function saveMarketIntent(
  profileId: string,
  operationId: string,
  intent: SavedMarketIntent
): boolean {
  const storageKey = key(profileId, operationId);
  memory.set(storageKey, intent);
  try {
    const serialized = JSON.stringify(intent);
    localStorage.setItem(storageKey, serialized);
    return localStorage.getItem(storageKey) === serialized;
  } catch {
    return false;
  }
}
export function readMarketIntent(
  profileId: string,
  operationId: string
): SavedMarketIntent | null {
  const remembered = memory.get(key(profileId, operationId));
  const persisted = readPersistedMarketIntent(profileId, operationId);
  if (remembered?.transactionHash) return remembered;
  if (persisted?.transactionHash) return persisted;
  if (remembered?.approvalHash) return remembered;
  if (persisted?.approvalHash) return persisted;
  if (remembered?.sendAttempt) return remembered;
  return persisted ?? remembered ?? null;
}
export function readPersistedMarketIntent(
  profileId: string,
  operationId: string
): SavedMarketIntent | null {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(key(profileId, operationId)) ?? "null"
    );
    if (parsed === null || typeof parsed !== "object" || !("request" in parsed))
      return null;
    const request = parsed.request;
    if (!isSavedMarketRequest(request, profileId)) return null;
    const hash =
      "transactionHash" in parsed ? parsed.transactionHash : undefined;
    const approvalHash =
      "approvalHash" in parsed ? parsed.approvalHash : undefined;
    const sendAttempt =
      "sendAttempt" in parsed ? parsed.sendAttempt : undefined;
    if (!isOptionalHash(hash) || !isOptionalHash(approvalHash)) return null;
    if (sendAttempt !== undefined && !isMarketSendAttempt(sendAttempt))
      return null;
    return {
      request,
      ...(typeof hash === "string" ? { transactionHash: hash } : {}),
      ...(typeof approvalHash === "string" ? { approvalHash } : {}),
      ...(sendAttempt ? { sendAttempt } : {}),
    };
  } catch {
    return null;
  }
}

function isSavedMarketRequest(
  request: unknown,
  profileId: string
): request is ApiMarketPrepareRequest {
  if (request === null || typeof request !== "object") return false;
  const fields = request as Record<string, unknown>;
  for (const name of [
    "profile_id",
    "wallet",
    "recipient",
    "asset_key",
    "kind",
    "quantity",
    "currency",
    "amount_wei",
  ])
    if (typeof fields[name] !== "string") return false;
  return (
    fields["profile_id"] === profileId &&
    Object.values(ApiMarketKind).includes(fields["kind"] as ApiMarketKind) &&
    typeof fields["acknowledge_external_recipient"] === "boolean" &&
    isAddress(fields["wallet"] as string) &&
    isAddress(fields["recipient"] as string) &&
    isAddress(fields["currency"] as string)
  );
}
