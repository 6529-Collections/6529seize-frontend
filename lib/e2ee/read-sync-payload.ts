import { randomBytes, utf8Decode, utf8Encode } from "./bytes";

/**
 * The payload of a self group (D175, design P60 §3): read positions shared
 * between one user's own devices, never with anyone else. Every payload is
 * padded to the same length, so every ciphertext lands in the same message
 * bucket whatever it carries.
 */

const READ_SYNC_VERSION = 1;
/** Encoded length of every payload; its ciphertext fills the 4 KiB bucket. */
const READ_SYNC_BODY_BYTES = 3072;
/** Positions per message; a longer list goes out as several pages. */
const READ_SYNC_MAX_POSITIONS = 32;

const GROUP_PATTERN = /^0x[0-9a-f]{64}$/u;
const ID_PATTERN = /^[0-9a-f]{32}$/u;
const TYPES = new Set(["read", "snap", "hello"]);

/** A group handle and the highest log seq read in it. */
export type ReadPosition = readonly [g: string, seq: number];

export type ReadSyncType = "read" | "snap" | "hello";

export interface ReadSyncPayload {
  readonly v: typeof READ_SYNC_VERSION;
  /** read: an update; snap: one snapshot page; hello: a device that joined. */
  readonly t: ReadSyncType;
  readonly id: string;
  /** Sender clock (ms), informational only: merging never uses clocks. */
  readonly ts: number;
  readonly r: readonly ReadPosition[];
  /** Snapshot pages only: [snapshot id, page (1-based), page count]. */
  readonly s?: readonly [id: string, page: number, pages: number];
}

export const newReadSyncId = (): string =>
  Array.from(randomBytes(16), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

/** Encodes and pads to exactly READ_SYNC_BODY_BYTES; throws if it cannot. */
export function encodeReadSync(payload: ReadSyncPayload): Uint8Array {
  if (payload.r.length > READ_SYNC_MAX_POSITIONS) {
    throw new Error("E2EE_READ_SYNC_TOO_MANY");
  }
  const bare = utf8Encode(JSON.stringify({ ...payload, p: "" }));
  const pad = READ_SYNC_BODY_BYTES - bare.length;
  if (pad < 0) {
    throw new Error("E2EE_READ_SYNC_TOO_LARGE");
  }
  // "0" is one byte in UTF-8, so the padding adds exactly `pad` bytes.
  return utf8Encode(JSON.stringify({ ...payload, p: "0".repeat(pad) }));
}

const isSeq = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

function decodePosition(value: unknown): ReadPosition | null {
  if (!Array.isArray(value) || value.length !== 2) {
    return null;
  }
  const [g, seq] = value as unknown[];
  if (typeof g !== "string" || !isSeq(seq)) {
    return null;
  }
  const handle = g.toLowerCase();
  return GROUP_PATTERN.test(handle) ? [handle, seq] : null;
}

function decodeSnapshot(value: unknown): ReadSyncPayload["s"] | null {
  if (!Array.isArray(value) || value.length !== 3) {
    return null;
  }
  const [id, page, pages] = value as unknown[];
  if (
    typeof id !== "string" ||
    !ID_PATTERN.test(id) ||
    !isSeq(page) ||
    !isSeq(pages) ||
    page < 1 ||
    page > pages
  ) {
    return null;
  }
  return [id, page, pages];
}

/**
 * Parses a payload; null for anything this version does not understand
 * (another `v` or `t`, or a broken envelope), which the engine ignores
 * without failing the group. Malformed positions are dropped one by one.
 */
export function decodeReadSync(bytes: Uint8Array): ReadSyncPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(utf8Decode(bytes));
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const json = parsed as Record<string, unknown>;
  const type = json["t"];
  if (
    json["v"] !== READ_SYNC_VERSION ||
    typeof type !== "string" ||
    !TYPES.has(type) ||
    typeof json["id"] !== "string" ||
    !ID_PATTERN.test(json["id"]) ||
    !Array.isArray(json["r"])
  ) {
    return null;
  }
  const positions = json["r"]
    .slice(0, READ_SYNC_MAX_POSITIONS)
    .map(decodePosition)
    .filter((position): position is ReadPosition => position !== null);
  const ts = json["ts"];
  const snapshot = type === "snap" ? decodeSnapshot(json["s"]) : undefined;
  if (snapshot === null) {
    return null;
  }
  return {
    v: READ_SYNC_VERSION,
    t: type as ReadSyncType,
    id: json["id"],
    ts: typeof ts === "number" && Number.isFinite(ts) ? ts : 0,
    r: positions,
    ...(snapshot ? { s: snapshot } : {}),
  };
}

/** Splits positions into pages that each fit one payload. */
export function pagePositions(
  positions: readonly ReadPosition[]
): ReadPosition[][] {
  const pages: ReadPosition[][] = [];
  for (let i = 0; i < positions.length; i += READ_SYNC_MAX_POSITIONS) {
    pages.push(positions.slice(i, i + READ_SYNC_MAX_POSITIONS));
  }
  return pages;
}
