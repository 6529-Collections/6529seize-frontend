import {
  createHash,
  createPublicKey,
  verify,
  type KeyObject,
} from "node:crypto";

import { AI_FEED_SIGNING_KEYS } from "./feedSigningKeys";

// 6529 AI's release feed, version 1: `releases.json.sig` holds an Ed25519
// signature (RFC 8032) over the 32-byte message SHA-256("6529 AI releases
// v1" || 0x00 || the bytes of releases.json as stored), by the key it names
// in `public_key`.
const DOMAIN = Buffer.from("6529 AI releases v1\0", "ascii");
const ALGORITHM = "ed25519-sha256";
/** The feed is at most 64 KiB; a larger one is refused unread. */
export const MAX_AI_FEED_BYTES = 64 * 1024;
const MAX_SIGNATURE_FILE_BYTES = 1024;
const PUBLIC_KEY = /^[0-9a-fA-F]{64}$/;
const SIGNATURE = /^[0-9a-fA-F]{128}$/;

const publicKeys = new Map<string, KeyObject>();

function publicKeyOf(hex: string): KeyObject | null {
  const key = hex.toLowerCase();
  const known = publicKeys.get(key);
  if (known) {
    return known;
  }
  if (!PUBLIC_KEY.test(key)) {
    return null;
  }
  let keyObject: KeyObject;
  try {
    keyObject = createPublicKey({
      key: {
        kty: "OKP",
        crv: "Ed25519",
        x: Buffer.from(key, "hex").toString("base64url"),
      },
      format: "jwk",
    });
  } catch {
    return null;
  }
  publicKeys.set(key, keyObject);
  return keyObject;
}

/**
 * True when `signature` is a valid Ed25519 signature of `message` by the
 * public key `publicKeyHex`. Never throws.
 */
export function verifyEd25519(
  publicKeyHex: string,
  message: Uint8Array,
  signature: Uint8Array
): boolean {
  const key = publicKeyOf(publicKeyHex);
  if (!key || signature.byteLength !== 64) {
    return false;
  }
  try {
    return verify(null, message, key, signature);
  } catch {
    return false;
  }
}

/** An Ed25519 public key as PEM (SPKI), the form OpenSSL reads. */
export function ed25519PublicKeyPem(publicKeyHex: string): string | null {
  const pem = publicKeyOf(publicKeyHex)?.export({
    type: "spki",
    format: "pem",
  });
  return pem === undefined ? null : pem.toString();
}

type SignatureFile = {
  readonly publicKey: string;
  readonly signature: Buffer;
};

function readSignatureFile(bytes: Uint8Array): SignatureFile | null {
  if (bytes.byteLength > MAX_SIGNATURE_FILE_BYTES) {
    return null;
  }
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return null;
  }
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return null;
  }
  const file = json as Record<string, unknown>;
  const publicKey = file["public_key"];
  const signature = file["signature"];
  if (
    file["algorithm"] !== ALGORITHM ||
    typeof publicKey !== "string" ||
    !PUBLIC_KEY.test(publicKey) ||
    typeof signature !== "string" ||
    !SIGNATURE.test(signature)
  ) {
    return null;
  }
  return {
    publicKey: publicKey.toLowerCase(),
    signature: Buffer.from(signature, "hex"),
  };
}

/** The 32-byte message the release key signs for `feed`. */
function aiFeedSigningMessage(feed: Uint8Array): Buffer {
  return createHash("sha256").update(DOMAIN).update(feed).digest();
}

/**
 * True when `signatureFile` (the bytes of `releases.json.sig`) is a valid
 * signature over `feed` (the bytes of `releases.json`) by one of `keys`.
 */
export function isAiFeedSignatureValid(
  feed: Uint8Array,
  signatureFile: Uint8Array,
  keys: readonly string[] = AI_FEED_SIGNING_KEYS
): boolean {
  if (feed.byteLength > MAX_AI_FEED_BYTES) {
    return false;
  }
  const file = readSignatureFile(signatureFile);
  if (!file || !keys.some((key) => key.toLowerCase() === file.publicKey)) {
    return false;
  }
  return verifyEd25519(
    file.publicKey,
    aiFeedSigningMessage(feed),
    file.signature
  );
}
