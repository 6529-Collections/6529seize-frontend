import { isHex, randomBytes, utf8Decode, utf8Encode } from "./bytes";
import { parseImported, type ImportedPayload } from "./imported-payload";

/** Contract section 6: the JSON payload inside MLS application messages. */

const PAYLOAD_VERSION = 1;
const MAX_TEXT_CHARS = 10_000;
const MAX_REACTION_CHARS = 64;
const MAX_ATTACHMENTS = 10;
const MAX_MENTIONS = 200;
const MAX_NAME_CHARS = 255;
/**
 * The largest MESSAGE bucket is 64 KiB; the wrap header, the inner framing,
 * the sender signature and the MLS PrivateMessage overhead must fit too.
 */
export const MAX_BODY_BYTES = 60_000;

const ID_PATTERN = /^[0-9a-f]{32}$/u;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/u;

export interface PayloadAttachment {
  blob: string;
  k: string;
  n: string;
  chunks: number;
  mime: string;
  size: number;
  name: string;
  w?: number;
  h?: number;
}

interface PayloadBase {
  v: 1;
  id: string;
  ts: number;
}

export interface MsgPayload extends PayloadBase {
  t: "msg";
  text: string;
  mentions: string[];
  reply?: string;
  att?: PayloadAttachment[];
  /** History moved from an unencrypted DM (imported-payload.ts). */
  imp?: ImportedPayload;
}

export interface EditPayload extends PayloadBase {
  t: "edit";
  target: string;
  text: string;
  mentions: string[];
}

export interface DelPayload extends PayloadBase {
  t: "del";
  target: string;
}

export interface ReactPayload extends PayloadBase {
  t: "react" | "unreact";
  target: string;
  r: string;
}

export type Payload = MsgPayload | EditPayload | DelPayload | ReactPayload;

export const newMessageId = (): string =>
  Array.from(randomBytes(16), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

const isMessageId = (value: unknown): value is string =>
  typeof value === "string" && ID_PATTERN.test(value);

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonNegativeInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

const charLength = (value: string): number => [...value].length;

const isText = (value: unknown): value is string =>
  typeof value === "string" && charLength(value) <= MAX_TEXT_CHARS;

function parseMentions(value: unknown): string[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.length > MAX_MENTIONS) {
    return null;
  }
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || item.length === 0 || item.length > 128) {
      return null;
    }
    out.push(item);
  }
  return [...new Set(out)];
}

function optionalDimension(value: unknown): number | undefined | null {
  if (value === undefined || value === null) {
    return undefined;
  }
  return isNonNegativeInt(value) ? value : null;
}

function isAttachmentCore(value: Json): boolean {
  return (
    isHex(value["blob"], 16) &&
    typeof value["k"] === "string" &&
    BASE64_PATTERN.test(value["k"]) &&
    typeof value["n"] === "string" &&
    BASE64_PATTERN.test(value["n"]) &&
    isNonNegativeInt(value["chunks"]) &&
    value["chunks"] > 0 &&
    typeof value["mime"] === "string" &&
    value["mime"].length <= 255 &&
    isNonNegativeInt(value["size"]) &&
    typeof value["name"] === "string" &&
    charLength(value["name"]) <= MAX_NAME_CHARS
  );
}

function parseAttachment(value: unknown): PayloadAttachment | null {
  if (!isRecord(value) || !isAttachmentCore(value)) {
    return null;
  }
  const w = optionalDimension(value["w"]);
  const h = optionalDimension(value["h"]);
  if (w === null || h === null) {
    return null;
  }
  const out: PayloadAttachment = {
    blob: value["blob"] as string,
    k: value["k"] as string,
    n: value["n"] as string,
    chunks: value["chunks"] as number,
    mime: value["mime"] as string,
    size: value["size"] as number,
    name: value["name"] as string,
  };
  if (w !== undefined) {
    out.w = w;
  }
  if (h !== undefined) {
    out.h = h;
  }
  return out;
}

function parseAttachments(value: unknown): PayloadAttachment[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.length > MAX_ATTACHMENTS) {
    return null;
  }
  const out: PayloadAttachment[] = [];
  for (const item of value) {
    const parsed = parseAttachment(item);
    if (!parsed) {
      return null;
    }
    out.push(parsed);
  }
  return out;
}

function parseMsg(base: PayloadBase, json: Json): MsgPayload | null {
  const mentions = parseMentions(json["mentions"]);
  const att = parseAttachments(json["att"]);
  const text = json["text"] ?? "";
  if (!isText(text) || mentions === null || att === null) {
    return null;
  }
  const reply = json["reply"];
  if (reply !== undefined && reply !== null && !isMessageId(reply)) {
    return null;
  }
  const out: MsgPayload = { ...base, t: "msg", text, mentions };
  if (typeof reply === "string") {
    out.reply = reply;
  }
  if (att.length > 0) {
    out.att = att;
  }
  // A malformed `imp` is dropped, not fatal: the text (with its plain
  // header) still renders, as it does on clients that predate imports.
  const imp =
    json["imp"] === undefined ? null : parseImported(json["imp"], text);
  if (imp) {
    out.imp = imp;
  }
  return out;
}

function parseTargeted(
  base: PayloadBase,
  t: string,
  json: Json
): Payload | null {
  const target = json["target"];
  if (!isMessageId(target)) {
    return null;
  }
  if (t === "del") {
    return { ...base, t: "del", target };
  }
  if (t === "edit") {
    const mentions = parseMentions(json["mentions"]);
    const text = json["text"];
    if (!isText(text) || mentions === null) {
      return null;
    }
    return { ...base, t: "edit", target, text, mentions };
  }
  const r = json["r"];
  if (typeof r !== "string" || r.length === 0) {
    return null;
  }
  if (
    charLength(r) > MAX_REACTION_CHARS ||
    (t !== "react" && t !== "unreact")
  ) {
    return null;
  }
  return { ...base, t, target, r };
}

/** Parses and validates a payload object; unknown fields are ignored. */
export function parsePayload(value: unknown): Payload | null {
  if (!isRecord(value) || value["v"] !== PAYLOAD_VERSION) {
    return null;
  }
  const id = value["id"];
  const ts = value["ts"];
  const t = value["t"];
  if (!isMessageId(id) || !isNonNegativeInt(ts) || typeof t !== "string") {
    return null;
  }
  const base: PayloadBase = { v: 1, id, ts };
  if (t === "msg") {
    return parseMsg(base, value);
  }
  return parseTargeted(base, t, value);
}

export function decodePayload(body: Uint8Array): Payload | null {
  if (body.length > MAX_BODY_BYTES) {
    return null;
  }
  try {
    return parsePayload(JSON.parse(utf8Decode(body)) as unknown);
  } catch {
    return null;
  }
}

export class PayloadError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.name = "PayloadError";
    this.code = code;
  }
}

/** Validates (round-trips through the parser) and serializes a payload. */
export function encodePayload(payload: Payload): Uint8Array {
  const parsed = parsePayload(payload);
  if (!parsed) {
    throw new PayloadError("E2EE_PAYLOAD_INVALID");
  }
  const bytes = utf8Encode(JSON.stringify(parsed));
  if (bytes.length > MAX_BODY_BYTES) {
    throw new PayloadError("E2EE_PAYLOAD_TOO_LARGE");
  }
  return bytes;
}
