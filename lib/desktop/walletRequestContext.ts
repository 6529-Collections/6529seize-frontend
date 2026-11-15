/**
 * The content behind a forwarded message's payload hash.
 *
 * A drop signature (M1) and a decision signature (M2) commit to their
 * content only through a SHA-256 payload hash. The app may send that
 * content with the request (`context`, JSON text); the browser page
 * recomputes the hash from it exactly as the API does and shows the content
 * only when the hash is the one the signed message carries. Content that
 * does not match is never shown: the page refuses the request instead.
 *
 * Context JSON (exactly these keys):
 * - drop: `{"v":1,"kind":"drop","drop":<create-drop request without
 *   signature and signature_message>,"terms":<text or null>}`; hash =
 *   `DropHasher` over `{drop, termsOfService: terms}`.
 * - decision: `{"v":1,"kind":"decision","payload":<payload>}`; hash =
 *   SHA-256 of `canonicalCompetitionJson(payload)`. A vote's payload is
 *   `{"value":<number>}`, an entry's `{"drop":<drop>,"drop_id":<id or null>}`.
 */

import { sha256 } from "js-sha256";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { canonicalCompetitionJson } from "@/services/wallet-signatures/competition-signature";
import { DropHasher } from "@/utils/drop-hasher";
import type { WalletMessageFormat } from "@/lib/desktop/walletMessageFormats";

const CONTEXT_VERSION = 1;
const PAYLOAD_HASH_LINE = "Payload Hash: ";
const HASH = /^[0-9a-f]{64}$/;
/** Keys the drop hasher removes or sets itself: never sent in a drop. */
const HASHER_KEYS = ["signature", "signature_message", "terms_of_service"];

type Json = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isId = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;
const hasExactKeys = (value: Json, keys: readonly string[]): boolean => {
  const own = Object.keys(value);
  return (
    own.length === keys.length && keys.every((key) => Object.hasOwn(value, key))
  );
};

interface DropMedia {
  readonly url: string;
  readonly mimeType: string;
}

interface DropPart {
  readonly text: string | null;
  readonly quotedDropId: string | null;
  readonly media: readonly DropMedia[];
  readonly attachments: number;
}

/** The parts of a drop the page summarises; the rest is in `committed`. */
export interface WalletDropContent {
  readonly waveId: string;
  readonly title: string | null;
  readonly replyToDropId: string | null;
  readonly parts: readonly DropPart[];
  readonly metadata: readonly {
    readonly key: string;
    readonly value: string;
  }[];
}

/**
 * Verified content. `committed` is the exact canonical JSON whose SHA-256
 * is the message's payload hash: everything the signature commits to.
 */
export type WalletRequestContent =
  | {
      readonly kind: "drop";
      readonly drop: WalletDropContent;
      readonly terms: string | null;
      readonly committed: string;
    }
  | {
      readonly kind: "decisionVote";
      readonly waveId: string;
      readonly competitionId: string;
      readonly entryId: string;
      readonly value: number;
      readonly committed: string;
    }
  | {
      readonly kind: "decisionEntry";
      readonly waveId: string;
      readonly competitionId: string;
      readonly drop: WalletDropContent;
      readonly committed: string;
    };

/** The context for a drop signature (`buildDropSignatureMessage`). */
export function buildDropSignatureContext({
  drop,
  termsOfService,
}: {
  readonly drop: ApiCreateDropRequest;
  readonly termsOfService: string | null;
}): string {
  const {
    signature: _signature,
    signature_message: _message,
    ...unsigned
  } = drop;
  return JSON.stringify({
    v: CONTEXT_VERSION,
    kind: "drop",
    drop: unsigned,
    // The hasher leaves empty terms out, so they are sent as null.
    terms: termsOfService === "" ? null : termsOfService,
  });
}

/** The context for a decision signature (`buildCompetitionSignatureMessage`). */
export function buildDecisionSignatureContext(payload: unknown): string {
  return JSON.stringify({ v: CONTEXT_VERSION, kind: "decision", payload });
}

/** The payload hash an allowed message commits to, or null. */
export function readWalletPayloadHash(
  text: string,
  format: WalletMessageFormat
): string | null {
  try {
    const hash =
      format === "drop"
        ? text
            .split("\n")
            .find((line) => line.startsWith(PAYLOAD_HASH_LINE))
            ?.slice(PAYLOAD_HASH_LINE.length)
        : (JSON.parse(text) as Json)["payload_hash"];
    return typeof hash === "string" && HASH.test(hash) ? hash : null;
  } catch {
    return null;
  }
}

/**
 * A payload hash in the short form both the app's waiting dialog and the
 * browser page show, so the user can compare them: `2c26b46b…6266e7ae`.
 */
export const shortWalletPayloadHash = (hash: string): string =>
  `${hash.slice(0, 8)}…${hash.slice(-8)}`;

/** An optional string field: absent and null read as null. */
function optionalText(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  return typeof value === "string" ? value : undefined;
}

/** An optional `{drop_id, drop_part_id}` reference: its drop id, or null. */
function optionalDropReference(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  return isRecord(value) &&
    isId(value["drop_id"]) &&
    Number.isSafeInteger(value["drop_part_id"])
    ? value["drop_id"]
    : undefined;
}

/** An optional array whose items must all read; undefined when one fails. */
function optionalList<T>(
  value: unknown,
  read: (item: unknown) => T | null
): readonly T[] | undefined {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return undefined;
  const items: T[] = [];
  for (const item of value) {
    const parsed = read(item);
    if (parsed === null) return undefined;
    items.push(parsed);
  }
  return items;
}

const readMedia = (value: unknown): DropMedia | null =>
  isRecord(value) &&
  typeof value["url"] === "string" &&
  typeof value["mime_type"] === "string"
    ? { url: value["url"], mimeType: value["mime_type"] }
    : null;

const readAttachment = (value: unknown): string | null =>
  isRecord(value) && isId(value["attachment_id"])
    ? value["attachment_id"]
    : null;

function readPart(value: unknown): DropPart | null {
  if (!isRecord(value)) return null;
  const text = optionalText(value["content"]);
  const quotedDropId = optionalDropReference(value["quoted_drop"]);
  const media = optionalList(value["media"], readMedia);
  const attachments = optionalList(value["attachments"], readAttachment);
  if (
    text === undefined ||
    quotedDropId === undefined ||
    media === undefined ||
    attachments === undefined
  ) {
    return null;
  }
  return { text, quotedDropId, media, attachments: attachments.length };
}

const readMetadata = (
  value: unknown
): { readonly key: string; readonly value: string } | null =>
  isRecord(value) &&
  typeof value["data_key"] === "string" &&
  typeof value["data_value"] === "string"
    ? { key: value["data_key"], value: value["data_value"] }
    : null;

/**
 * The summarised fields of a drop. Null when a field the page summarises
 * has an unexpected shape, so a summary never misreads what is signed.
 */
function readDrop(value: unknown): WalletDropContent | null {
  if (!isRecord(value) || !isId(value["wave_id"])) return null;
  const parts = optionalList(value["parts"], readPart);
  const metadata = optionalList(value["metadata"], readMetadata);
  const title = optionalText(value["title"]);
  const replyToDropId = optionalDropReference(value["reply_to"]);
  if (
    !Array.isArray(value["parts"]) ||
    parts === undefined ||
    metadata === undefined ||
    title === undefined ||
    replyToDropId === undefined
  ) {
    return null;
  }
  return { waveId: value["wave_id"], title, replyToDropId, parts, metadata };
}

/** The drop hasher's canonical JSON for a drop and its terms. */
function dropCommitment(drop: Json, terms: string | null): string {
  const committed: Record<string, unknown> = { ...drop };
  if (terms) committed["terms_of_service"] = terms;
  return canonicalCompetitionJson(committed);
}

function verifyDrop(
  context: Json,
  payloadHash: string
): WalletRequestContent | null {
  if (!hasExactKeys(context, ["v", "kind", "drop", "terms"])) return null;
  const { drop: rawDrop, terms } = context;
  if (
    !isRecord(rawDrop) ||
    HASHER_KEYS.some((key) => Object.hasOwn(rawDrop, key))
  ) {
    return null;
  }
  // Empty terms would be left out of the hash; they are sent as null.
  if (terms !== null && !isId(terms)) return null;
  const hash = new DropHasher().hash({
    drop: rawDrop as unknown as ApiCreateDropRequest,
    termsOfService: terms,
  });
  // What is shown as committed must be exactly what was hashed.
  const committed = dropCommitment(rawDrop, terms);
  const drop = readDrop(rawDrop);
  if (hash !== payloadHash || sha256(committed) !== hash || drop === null) {
    return null;
  }
  return { kind: "drop", drop, terms, committed };
}

function verifyDecision(
  context: Json,
  message: Json
): WalletRequestContent | null {
  if (!hasExactKeys(context, ["v", "kind", "payload"])) return null;
  const payload = context["payload"];
  if (!isRecord(payload)) return null;
  const committed = canonicalCompetitionJson(payload);
  if (sha256(committed) !== message["payload_hash"]) return null;
  const waveId = String(message["wave_id"]);
  const competitionId = String(message["competition_id"]);
  if (message["action"] === "VOTE_SET") {
    const value = payload["value"];
    const entryId = message["competition_entry_id"];
    if (
      !hasExactKeys(payload, ["value"]) ||
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      !isId(entryId)
    ) {
      return null;
    }
    return {
      kind: "decisionVote",
      waveId,
      competitionId,
      entryId,
      value,
      committed,
    };
  }
  const dropId = payload["drop_id"];
  const drop = readDrop(payload["drop"]);
  if (
    !hasExactKeys(payload, ["drop", "drop_id"]) ||
    (dropId !== null && !isId(dropId)) ||
    drop === null
  ) {
    return null;
  }
  return { kind: "decisionEntry", waveId, competitionId, drop, committed };
}

/**
 * Check a request's `context` against the allowed message it came with
 * (`text`, already matched to `format`). Returns the content only when its
 * recomputed hash is exactly the message's payload hash and every field the
 * page summarises has the expected shape; null otherwise. Never throws.
 */
export function verifyWalletRequestContext(
  text: string,
  format: WalletMessageFormat,
  context: string
): WalletRequestContent | null {
  try {
    const parsed: unknown = JSON.parse(context);
    const payloadHash = readWalletPayloadHash(text, format);
    if (
      !isRecord(parsed) ||
      parsed["v"] !== CONTEXT_VERSION ||
      payloadHash === null
    ) {
      return null;
    }
    if (format === "drop") {
      return parsed["kind"] === "drop" ? verifyDrop(parsed, payloadHash) : null;
    }
    return parsed["kind"] === "decision"
      ? verifyDecision(parsed, JSON.parse(text) as Json)
      : null;
  } catch {
    return null;
  }
}
