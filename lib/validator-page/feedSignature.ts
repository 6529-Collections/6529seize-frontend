import { createPublicKey, verify, type KeyObject } from "node:crypto";

import { FEED_SIGNING_KEYS, type FeedSigningKey } from "./feedSigningKeys";

// The validator's check of `releases.json.sig` (its `crates/releases`,
// sig.rs, and docs/releases-feed.md, "The signature"): ECDSA over
// secp256k1 of SHA-256("6529 Validator releases v1" || 0x00 || the feed's
// bytes as received), `r || s` in hex, by a key the file names by address.
const DOMAIN = Buffer.from("6529 Validator releases v1\0", "ascii");
const ALGORITHM = "ecdsa-secp256k1-sha256";
// The validator's own limit: the feed and its signature fit one gossip
// message. The live feed is about 30 KiB and grows with each release; the
// producer drops the oldest test releases to stay under it. A larger feed
// is refused here as every validator refuses it, so the download pages show
// their error state once the last good feed is an hour old.
const MAX_FEED_BYTES = 56 * 1024;
const MAX_SIGNATURE_FILE_BYTES = 1024;
const SIGNATURE = /^0x[0-9a-fA-F]{128}$/;
const PUBLIC_KEY = /^04[0-9a-fA-F]{128}$/;

const publicKeys = new Map<string, KeyObject>();

function publicKeyOf(key: FeedSigningKey): KeyObject | null {
  const known = publicKeys.get(key.publicKey);
  if (known) {
    return known;
  }
  if (!PUBLIC_KEY.test(key.publicKey)) {
    return null;
  }
  const point = Buffer.from(key.publicKey, "hex");
  let keyObject: KeyObject;
  try {
    keyObject = createPublicKey({
      key: {
        kty: "EC",
        crv: "secp256k1",
        x: point.subarray(1, 33).toString("base64url"),
        y: point.subarray(33).toString("base64url"),
      },
      format: "jwk",
    });
  } catch {
    // Well-formed hex that is not a point on the curve.
    return null;
  }
  publicKeys.set(key.publicKey, keyObject);
  return keyObject;
}

type SignatureFile = { readonly key: string; readonly signature: Buffer };

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
  const { key, signature } = file;
  if (
    file["format"] !== 1 ||
    file["algorithm"] !== ALGORITHM ||
    typeof key !== "string" ||
    typeof signature !== "string" ||
    !SIGNATURE.test(signature)
  ) {
    return null;
  }
  return { key: key.trim(), signature: Buffer.from(signature.slice(2), "hex") };
}

/**
 * True when `signatureFile` (the bytes of `releases.json.sig`) is a valid
 * signature over `feed` (the bytes of `releases.json`) by one of `keys`,
 * checked as a validator checks it before it reads the feed.
 */
export function isFeedSignatureValid(
  feed: Uint8Array,
  signatureFile: Uint8Array,
  keys: readonly FeedSigningKey[] = FEED_SIGNING_KEYS
): boolean {
  if (feed.byteLength > MAX_FEED_BYTES) {
    return false;
  }
  const file = readSignatureFile(signatureFile);
  const signer = file
    ? keys.find((key) => key.address.toLowerCase() === file.key.toLowerCase())
    : undefined;
  const publicKey = signer ? publicKeyOf(signer) : null;
  if (!file || !publicKey) {
    return false;
  }
  try {
    return verify(
      "sha256",
      Buffer.concat([DOMAIN, feed]),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      file.signature
    );
  } catch {
    return false;
  }
}
