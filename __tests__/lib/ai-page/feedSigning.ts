import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
} from "node:crypto";

// Written out here rather than imported, so the tests check the site's
// message against the feed format: SHA-256("6529 AI releases v1" || 0x00 ||
// the feed's bytes).
const DOMAIN = Buffer.from("6529 AI releases v1\0", "ascii");

// A test signing key, never 6529 AI's: the Ed25519 seed 0x29 repeated.
const PKCS8_ED25519_PREFIX = Buffer.from(
  "302e020100300506032b657004220420",
  "hex"
);
const PRIVATE_KEY = createPrivateKey({
  key: Buffer.concat([PKCS8_ED25519_PREFIX, Buffer.alloc(32, 0x29)]),
  format: "der",
  type: "pkcs8",
});

/** The test key's public half in hex, as `releases.json.sig` names it. */
export const TEST_AI_FEED_KEY = Buffer.from(
  String(createPublicKey(PRIVATE_KEY).export({ format: "jwk" }).x),
  "base64url"
).toString("hex");

/** The test key's signature of `message` as it is, in hex. */
export function signRawHex(message: Uint8Array): string {
  return sign(null, message, PRIVATE_KEY).toString("hex");
}

/** `releases.json.sig` for `feed`, signed as 6529 AI's release tool signs it. */
export function signAiFeed(
  feed: Uint8Array,
  fields: Record<string, unknown> = {}
): Uint8Array<ArrayBuffer> {
  const message = createHash("sha256").update(DOMAIN).update(feed).digest();
  const signature = sign(null, message, PRIVATE_KEY);
  return new TextEncoder().encode(
    `${JSON.stringify({
      algorithm: "ed25519-sha256",
      public_key: TEST_AI_FEED_KEY,
      signature: signature.toString("hex"),
      ...fields,
    })}\n`
  );
}
