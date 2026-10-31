/**
 * Byte, hex and base64 helpers shared by the E2EE engine (contract section 1).
 * Hex is lowercase and `0x`-prefixed; JSON byte fields are standard base64.
 */

const HEX_BODY = /^[0-9a-f]*$/u;
const BASE64_CHARS = /^[A-Za-z0-9+/]*={0,2}$/u;

export const utf8Encode = (value: string): Uint8Array =>
  new TextEncoder().encode(value);

export const utf8Decode = (bytes: Uint8Array): string =>
  new TextDecoder("utf-8", { fatal: true }).decode(bytes);

function bytesToHex(bytes: Uint8Array): `0x${string}` {
  let out = "0x";
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, "0");
  }
  return out as `0x${string}`;
}

export function isHex(value: unknown, byteLength?: number): value is string {
  if (typeof value !== "string" || !value.startsWith("0x")) {
    return false;
  }
  const body = value.slice(2);
  if (body.length % 2 !== 0 || !HEX_BODY.test(body)) {
    return false;
  }
  return byteLength === undefined || body.length === byteLength * 2;
}

export function hexToBytes(value: string): Uint8Array {
  const normalized = value.toLowerCase();
  if (!isHex(normalized)) {
    throw new Error("Invalid hex string");
  }
  const body = normalized.slice(2);
  const out = new Uint8Array(body.length / 2);
  for (let index = 0; index < out.length; index += 1) {
    out[index] = Number.parseInt(body.slice(index * 2, index * 2 + 2), 16);
  }
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const step = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += step) {
    binary += String.fromCodePoint(...bytes.subarray(offset, offset + step));
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  if (value.length % 4 !== 0 || !BASE64_CHARS.test(value)) {
    throw new Error("Invalid base64 string");
  }
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    out[index] = binary.codePointAt(index) ?? 0;
  }
  return out;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function u32be(value: number): Uint8Array {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error("u32 out of range");
  }
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, false);
  return out;
}

/** getRandomValues fills at most 65,536 bytes per call. */
const RANDOM_CHUNK = 65_536;

export function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  for (let offset = 0; offset < length; offset += RANDOM_CHUNK) {
    globalThis.crypto.getRandomValues(
      out.subarray(offset, offset + RANDOM_CHUNK)
    );
  }
  return out;
}

export const randomHex = (length: number): `0x${string}` =>
  bytesToHex(randomBytes(length));

/** Copies into a fresh ArrayBuffer-backed view (WebCrypto rejects shared views). */
export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}
