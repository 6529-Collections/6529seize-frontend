import { randomBytes, toArrayBuffer } from "../bytes";

/**
 * Recovery codes for encrypted message-history backups (design P35 8.3: a
 * 256-bit code shown once). 32 random bytes in Crockford base32 (52
 * characters) plus a 4-character checksum, shown as 14 groups of 4:
 * `XXXX-XXXX-...`. The checksum catches typos before any network call; it
 * says nothing about whether the code opens a particular backup.
 */

const RECOVERY_SECRET_BYTES = 32;
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const DATA_CHARS = 52; // ceil(256 / 5)
const CHECK_CHARS = 4; // 20 bits of SHA-256(secret)
const RECOVERY_CODE_CHARS = DATA_CHARS + CHECK_CHARS;
const GROUP = 4;

/** Big-endian bit stream to base32; the final character is zero padded. */
function toBase32(bytes: Uint8Array, chars: number): string {
  let out = "";
  let buffer = 0;
  let bits = 0;
  let index = 0;
  while (out.length < chars) {
    if (bits < 5) {
      buffer = (buffer << 8) | (index < bytes.length ? bytes[index]! : 0);
      index += 1;
      bits += 8;
    }
    out += ALPHABET[(buffer >> (bits - 5)) & 31];
    bits -= 5;
    buffer &= (1 << bits) - 1;
  }
  return out;
}

/** Inverse of toBase32; null when a character is invalid or padding is set. */
function fromBase32(text: string, byteLength: number): Uint8Array | null {
  const out = new Uint8Array(byteLength);
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const char of text) {
    const value = ALPHABET.indexOf(char);
    if (value < 0) {
      return null;
    }
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      if (index < byteLength) {
        out[index] = (buffer >> bits) & 0xff;
      } else if (((buffer >> bits) & 0xff) !== 0) {
        return null;
      }
      index += 1;
      buffer &= (1 << bits) - 1;
    }
  }
  if (index < byteLength || buffer !== 0) {
    return null;
  }
  return out;
}

async function checksum(secret: Uint8Array): Promise<string> {
  const digest = new Uint8Array(
    await globalThis.crypto.subtle.digest("SHA-256", toArrayBuffer(secret))
  );
  return toBase32(digest, CHECK_CHARS);
}

/** Groups the 56 characters for display: `ABCD-EFGH-…`. */
function formatRecoveryCode(raw: string): string {
  const groups: string[] = [];
  for (let start = 0; start < raw.length; start += GROUP) {
    groups.push(raw.slice(start, start + GROUP));
  }
  return groups.join("-");
}

/** Uppercases, drops spaces and dashes, maps O to 0 and I/L to 1. */
export function normalizeRecoveryCode(input: string): string {
  return input
    .toUpperCase()
    .replaceAll(/[\s-]/g, "")
    .replaceAll("O", "0")
    .replaceAll(/[IL]/g, "1");
}

interface RecoveryCode {
  /** Display form (14 groups of 4). */
  readonly code: string;
  /** The 32-byte secret the backup key is wrapped with. */
  readonly secret: Uint8Array;
}

export async function generateRecoveryCode(): Promise<RecoveryCode> {
  const secret = randomBytes(RECOVERY_SECRET_BYTES);
  return {
    code: formatRecoveryCode(
      toBase32(secret, DATA_CHARS) + (await checksum(secret))
    ),
    secret,
  };
}

/** The secret of a typed code, or null when it is malformed or mistyped. */
export async function parseRecoveryCode(
  input: string
): Promise<Uint8Array | null> {
  const normalized = normalizeRecoveryCode(input);
  if (normalized.length !== RECOVERY_CODE_CHARS) {
    return null;
  }
  const secret = fromBase32(
    normalized.slice(0, DATA_CHARS),
    RECOVERY_SECRET_BYTES
  );
  if (!secret) {
    return null;
  }
  return (await checksum(secret)) === normalized.slice(DATA_CHARS)
    ? secret
    : null;
}
