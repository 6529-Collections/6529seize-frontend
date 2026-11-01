import { utf8Decode, utf8Encode } from "../bytes";
import type { PayloadAttachment } from "../payload";
import type { StoredMessage, StoredNotice } from "../records";
import type { GroupMetadata } from "../wasm-types";
import { BackupError } from "./errors";

/**
 * Plaintext layout of a backup segment (the JSON inside one chunk, history
 * backup v2; the chunk header with its hash-chain link is in crypto.ts).
 * Only what is needed to display past history: conversation metadata and
 * member list, messages with their display fields, attachment references
 * with their keys, and the report evidence (body + signature). Never MLS
 * state, ratchets or keys of the device.
 */

interface BackupMember {
  deviceKey: string;
  profileId: string | null;
  leaf: number;
  identity: string;
}

export interface BackupGroupRecord {
  g: string;
  metadata: GroupMetadata;
  members: BackupMember[];
  epoch: number;
  epochFp: string;
  createdAt: number;
  joinedAt: number;
  updatedAt: number;
}

export type BackupMessageRecord = Omit<StoredMessage, "pending">;

export interface BackupSegment {
  v: 2;
  at: number;
  groups: BackupGroupRecord[];
  messages: BackupMessageRecord[];
}

/** What the engine hands to the backup module (copies, never live state). */
export interface BackupHistory {
  groups: BackupGroupRecord[];
  messages: BackupMessageRecord[];
}

export const messageKey = (g: string, id: string): string => `${g}|${id}`;

/** 53-bit string hash (cyrb53): detects records changed since last backup. */
export function fingerprint(value: unknown): string {
  const text = JSON.stringify(value);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  // Hashes UTF-16 code units on purpose: it only has to be deterministic
  // for the same JSON string, and code units cover every character.
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export interface EncodedSegment {
  json: Uint8Array;
  groups: BackupGroupRecord[];
  messages: BackupMessageRecord[];
}

/** Greedy packing of records into segments of at most `maxBytes` JSON. */
export function packSegments(
  history: BackupHistory,
  maxBytes: number,
  at: number
): EncodedSegment[] {
  const out: EncodedSegment[] = [];
  let groups: BackupGroupRecord[] = [];
  let messages: BackupMessageRecord[] = [];
  // Fixed overhead of `{"v":2,"at":…,"groups":[],"messages":[]}`.
  const base = utf8Encode(
    JSON.stringify({ v: 2, at, groups: [], messages: [] })
  ).length;
  let size = base;

  const flush = () => {
    if (groups.length === 0 && messages.length === 0) {
      return;
    }
    const segment: BackupSegment = { v: 2, at, groups, messages };
    out.push({ json: utf8Encode(JSON.stringify(segment)), groups, messages });
    groups = [];
    messages = [];
    size = base;
  };

  const add = (bytes: number, push: () => void) => {
    if (base + bytes > maxBytes) {
      throw new BackupError("E2EE_BACKUP_SEGMENT_TOO_LARGE");
    }
    if (size + bytes + 1 > maxBytes) {
      flush();
    }
    push();
    size += bytes + 1;
  };

  for (const group of history.groups) {
    add(utf8Encode(JSON.stringify(group)).length, () => groups.push(group));
  }
  for (const message of history.messages) {
    add(utf8Encode(JSON.stringify(message)).length, () =>
      messages.push(message)
    );
  }
  flush();
  return out;
}

// -- validation -------------------------------------------------------------

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);
const isNullable = <T>(
  value: unknown,
  check: (v: unknown) => v is T
): value is T | null => value === null || check(value);

function isMetadata(value: unknown): value is GroupMetadata {
  return (
    isObject(value) &&
    value["v"] === 1 &&
    isString(value["g"]) &&
    (value["kind"] === "dm" || value["kind"] === "group") &&
    isNullable(value["name"], isString) &&
    isStringArray(value["admins"]) &&
    isString(value["created_by"])
  );
}

function isMember(value: unknown): value is BackupMember {
  return (
    isObject(value) &&
    isString(value["deviceKey"]) &&
    isNullable(value["profileId"], isString) &&
    isNumber(value["leaf"]) &&
    isString(value["identity"])
  );
}

function isGroupRecord(value: unknown): value is BackupGroupRecord {
  return (
    isObject(value) &&
    isString(value["g"]) &&
    isMetadata(value["metadata"]) &&
    value["metadata"].g.toLowerCase() === value["g"].toLowerCase() &&
    Array.isArray(value["members"]) &&
    value["members"].every(isMember) &&
    isNumber(value["epoch"]) &&
    isString(value["epochFp"]) &&
    isNumber(value["createdAt"]) &&
    isNumber(value["joinedAt"]) &&
    isNumber(value["updatedAt"])
  );
}

function isAttachment(value: unknown): value is PayloadAttachment {
  return (
    isObject(value) &&
    isString(value["blob"]) &&
    isString(value["k"]) &&
    isString(value["n"]) &&
    isNumber(value["chunks"]) &&
    isString(value["mime"]) &&
    isNumber(value["size"]) &&
    isString(value["name"])
  );
}

function isNotice(value: unknown): value is StoredNotice {
  return (
    isObject(value) &&
    isString(value["type"]) &&
    isNullable(value["actorProfileId"], isString) &&
    isStringArray(value["targetProfileIds"])
  );
}

function isReactions(value: unknown): value is Record<string, string[]> {
  return isObject(value) && Object.values(value).every(isStringArray);
}

function isMessageCore(value: Json): boolean {
  return (
    isString(value["id"]) &&
    isString(value["g"]) &&
    isNumber(value["seq"]) &&
    (value["kind"] === "message" || value["kind"] === "notice") &&
    isNullable(value["senderProfileId"], isString) &&
    isNullable(value["senderDeviceKey"], isString) &&
    isNumber(value["ts"]) &&
    isNumber(value["serverTs"]) &&
    isString(value["text"]) &&
    isStringArray(value["mentions"]) &&
    isNullable(value["reply"], isString)
  );
}

function isMessageRecord(value: unknown): value is BackupMessageRecord {
  return (
    isObject(value) &&
    isMessageCore(value) &&
    Array.isArray(value["attachments"]) &&
    value["attachments"].every(isAttachment) &&
    isNullable(value["editedAt"], isNumber) &&
    typeof value["deleted"] === "boolean" &&
    isReactions(value["reactions"]) &&
    typeof value["sigOk"] === "boolean" &&
    typeof value["undecryptable"] === "boolean" &&
    (value["notice"] === undefined || isNotice(value["notice"])) &&
    isNullable(value["epoch"], isNumber) &&
    isNullable(value["body"], isString) &&
    isNullable(value["sig"], isString)
  );
}

/** Parses one decrypted segment; malformed records are dropped. */
export function decodeSegment(json: Uint8Array): BackupSegment {
  let parsed: unknown;
  try {
    parsed = JSON.parse(utf8Decode(json));
  } catch {
    throw new BackupError("E2EE_BACKUP_CORRUPT");
  }
  if (
    !isObject(parsed) ||
    parsed["v"] !== 2 ||
    !Array.isArray(parsed["groups"]) ||
    !Array.isArray(parsed["messages"])
  ) {
    throw new BackupError("E2EE_BACKUP_CORRUPT");
  }
  return {
    v: 2,
    at: isNumber(parsed["at"]) ? parsed["at"] : 0,
    groups: parsed["groups"].filter(isGroupRecord),
    messages: parsed["messages"].filter(isMessageRecord),
  };
}

/**
 * Later segments win: a record seen again is a newer version of it. The
 * order is the verified hash-chain order (chain.ts), so the server cannot
 * reorder, replay or drop segments to bring back an older version.
 */
export function mergeSegments(
  segments: readonly BackupSegment[]
): BackupHistory {
  const groups = new Map<string, BackupGroupRecord>();
  const messages = new Map<string, BackupMessageRecord>();
  for (const segment of segments) {
    for (const group of segment.groups) {
      groups.set(group.g.toLowerCase(), group);
    }
    for (const message of segment.messages) {
      messages.set(messageKey(message.g.toLowerCase(), message.id), message);
    }
  }
  return { groups: [...groups.values()], messages: [...messages.values()] };
}
