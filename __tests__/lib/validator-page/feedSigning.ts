import { createECDH, createPrivateKey, sign } from "node:crypto";

import type { FeedSigningKey } from "@/lib/validator-page/feedSigningKeys";

// A test signing key, never 6529's: the scalar 0x65 repeated, as the
// validator's own tests use (crates/releases, sig.rs, TEST_SECRET).
const SECRET = Buffer.alloc(32, 0x65);
const ecdh = createECDH("secp256k1");
ecdh.setPrivateKey(SECRET);
const point = ecdh.getPublicKey();

const PRIVATE_KEY = createPrivateKey({
  key: {
    kty: "EC",
    crv: "secp256k1",
    d: SECRET.toString("base64url"),
    x: point.subarray(1, 33).toString("base64url"),
    y: point.subarray(33).toString("base64url"),
  },
  format: "jwk",
});

/** The test key as `feedSigningKeys.ts` lists a key, by a made-up address. */
export const TEST_FEED_SIGNING_KEY: FeedSigningKey = {
  address: `0x${"5a".repeat(20)}`,
  publicKey: point.toString("hex"),
};

const DOMAIN = Buffer.from("6529 Validator releases v1\0", "ascii");

/** `releases.json.sig` for `feed`, signed as 6529's producer signs it. */
export function signFeed(
  feed: Uint8Array,
  key: string = TEST_FEED_SIGNING_KEY.address
): Uint8Array<ArrayBuffer> {
  const signature = sign("sha256", Buffer.concat([DOMAIN, feed]), {
    key: PRIVATE_KEY,
    dsaEncoding: "ieee-p1363",
  });
  return new TextEncoder().encode(
    `${JSON.stringify({
      format: 1,
      algorithm: "ecdsa-secp256k1-sha256",
      key,
      signature: `0x${signature.toString("hex")}`,
    })}\n`
  );
}
