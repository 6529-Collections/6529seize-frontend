/**
 * The `personal_sign` messages 6529 Desktop forwards to the browser wallet:
 * an allow-list of the exact formats the web UI signs, and nothing else.
 * Sign-in challenges in any form (structured, SIWE, the legacy nonce text,
 * a bare nonce) and free text never match, so a forwarded signature can
 * never start a session. The desktop host mirrors these rules.
 */

import { canonicalCompetitionJson } from "@/services/wallet-signatures/competition-signature";

/** What a recognised message does, for the page's summary sentence. */
export type WalletMessageFormat = "drop" | "decisionVote" | "decisionEntry";

const HOST_NAME = /^[a-z0-9.-]+$/;
const PORT = /^\d{1,5}$/;

/** A lower-case host name with an optional port, as the API host is written. */
function isHost(value: string): boolean {
  const [name = "", port, extra] = value.split(":");
  return (
    extra === undefined &&
    HOST_NAME.test(name) &&
    (port === undefined || PORT.test(port))
  );
}
const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HASH = /^[0-9a-f]{64}$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const SIGNATURE_TTL_MS = 300_000;

/** The lines of a structured drop signature; `null` marks a value line. */
const DROP_LINES: readonly (readonly [string, string | null])[] = [
  ["6529 Action", ""],
  ["Version: ", "2"],
  ["Audience: ", null],
  ["Domain: ", null],
  ["Client Origin: ", null],
  ["Wallet: ", null],
  ["Chain ID: ", "1"],
  ["Issued At: ", null],
  ["Expiration Time: ", null],
  ["Nonce: ", null],
  ["Action: ", "create_drop"],
  ["Payload Hash: ", null],
  ["Purpose: ", "Sign this message to create a 6529 drop."],
];

/** The values after each line's label, or null when a line differs. */
function readLines(text: string): string[] | null {
  const lines = text.split("\n");
  if (lines.length !== DROP_LINES.length) return null;
  const values: string[] = [];
  for (const [index, [label, fixed]] of DROP_LINES.entries()) {
    const line = lines[index] ?? "";
    if (!line.startsWith(label)) return null;
    const value = line.slice(label.length);
    if (fixed !== null && value !== fixed) return null;
    values.push(value);
  }
  return values;
}

/** An exact UTC timestamp that names a real calendar date and time. */
function isTime(value: string): boolean {
  if (!ISO_TIME.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

/**
 * The structured "6529 Action" drop signature (signed drops, wave terms,
 * quorum proposals, curation drops), for this wallet and this app.
 */
function isDropSignature(
  text: string,
  address: string,
  pageOrigin: string
): boolean {
  const values = readLines(text);
  if (values === null) return false;
  const [, , audience, domain, clientOrigin, wallet, , issuedAt, expiresAt] =
    values;
  const nonce = values[9] ?? "";
  const payloadHash = values[11] ?? "";
  return (
    isHost(audience ?? "") &&
    domain === new URL(pageOrigin).host &&
    clientOrigin === pageOrigin &&
    (wallet ?? "").toLowerCase() === address.toLowerCase() &&
    isTime(issuedAt ?? "") &&
    isTime(expiresAt ?? "") &&
    Date.parse(expiresAt ?? "") - Date.parse(issuedAt ?? "") ===
      SIGNATURE_TTL_MS &&
    UUID_V4.test(nonce) &&
    HASH.test(payloadHash)
  );
}

const DECISION_KEYS = [
  "action",
  "actor_profile_id",
  "actor_wallet",
  "audience",
  "chain_id",
  "competition_entry_id",
  "competition_id",
  "config_version",
  "domain",
  "drop_id",
  "expires_at",
  "issued_at",
  "nonce",
  "payload_hash",
  "wave_id",
] as const;

const isId = (value: unknown): boolean =>
  typeof value === "string" && value.length > 0;
const isOptionalId = (value: unknown): boolean => value === null || isId(value);
const isTimeMs = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

/** A decision vote or entry signature (canonical JSON), for this wallet. */
function readDecisionSignature(
  text: string,
  address: string
): WalletMessageFormat | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record);
  if (
    keys.length !== DECISION_KEYS.length ||
    !DECISION_KEYS.every((key) => Object.hasOwn(record, key))
  ) {
    return null;
  }
  const action = record["action"];
  const wallet = record["actor_wallet"];
  const issuedAt = record["issued_at"];
  const expiresAt = record["expires_at"];
  const valid =
    (action === "VOTE_SET" || action === "ENTRY_CREATE") &&
    typeof wallet === "string" &&
    ADDRESS.test(wallet) &&
    wallet === address.toLowerCase() &&
    record["domain"] === "6529-competition-v1" &&
    record["chain_id"] === 1 &&
    isHost(String(record["audience"])) &&
    isId(record["actor_profile_id"]) &&
    isId(record["competition_id"]) &&
    isId(record["wave_id"]) &&
    isOptionalId(record["competition_entry_id"]) &&
    isOptionalId(record["drop_id"]) &&
    Number.isSafeInteger(record["config_version"]) &&
    (record["config_version"] as number) >= 0 &&
    isTimeMs(issuedAt) &&
    isTimeMs(expiresAt) &&
    expiresAt - issuedAt === SIGNATURE_TTL_MS &&
    UUID_V4.test(String(record["nonce"])) &&
    HASH.test(String(record["payload_hash"])) &&
    canonicalCompetitionJson(record) === text;
  if (!valid) return null;
  return action === "VOTE_SET" ? "decisionVote" : "decisionEntry";
}

/**
 * Which allowed format `text` is, or null when it is none of them. The text
 * has already passed the exact readable-text rule.
 */
export function readWalletMessageFormat(
  text: string,
  address: string,
  pageOrigin: string
): WalletMessageFormat | null {
  try {
    if (isDropSignature(text, address, pageOrigin)) return "drop";
    return readDecisionSignature(text, address);
  } catch {
    // Untrusted text never throws out of here: it is simply not allowed.
    return null;
  }
}
