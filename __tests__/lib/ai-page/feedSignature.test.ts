/** @jest-environment node */
import { createHash } from "node:crypto";

import {
  ed25519PublicKeyPem,
  isAiFeedSignatureValid,
  MAX_AI_FEED_BYTES,
  verifyEd25519,
} from "@/lib/ai-page/feedSignature";
import { AI_FEED_SIGNING_KEYS } from "@/lib/ai-page/feedSigningKeys";

import { signAiFeed, signRawHex, TEST_AI_FEED_KEY } from "./feedSigning";
import { feedBytes } from "./fixtures";

const FEED = feedBytes();
const KEYS = [TEST_AI_FEED_KEY];
const RELEASE_KEY =
  "58fb7856a682e6352c4e03f65eb80fe9468f4c72c96b9a7709ff2be37d7c77c4";

function sigFile(fields: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(fields));
}

function fieldsOf(signature: Uint8Array): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(signature)) as Record<
    string,
    unknown
  >;
}

describe("the pinned 6529 AI release key", () => {
  it("is the one key the feed format names", () => {
    expect(AI_FEED_SIGNING_KEYS).toEqual([RELEASE_KEY]);
  });

  it("is the key in 6529 AI's release-key-ed25519.pub", () => {
    expect(ed25519PublicKeyPem(RELEASE_KEY)).toBe(
      "-----BEGIN PUBLIC KEY-----\n" +
        "MCowBQYDK2VwAyEAWPt4VqaC5jUsTgP2XrgP6UaPTHLJa5p3Cf8r4318d8Q=\n" +
        "-----END PUBLIC KEY-----\n"
    );
  });

  it("verifies a signature the release key made in AWS KMS", () => {
    // 6529 AI's release.py self-test: the release key's signature of this
    // message, which is not a feed's.
    const signature = Buffer.from(
      "NTM54P8tg4LEcywv7otJ3GqrsQKNnl3cD0+F/HzwWRwtPXyWnlnh7BIJ+YgzAaDGPJnMRm2sShaDaL7ZkI/4Dg==",
      "base64"
    );
    const message = Buffer.from("6529 AI release key test\n");
    expect(verifyEd25519(RELEASE_KEY, message, signature)).toBe(true);
    const changed = Buffer.from(message);
    changed[0] = changed[0]! ^ 1;
    expect(verifyEd25519(RELEASE_KEY, changed, signature)).toBe(false);
  });

  it("checks RFC 8032's first test vector", () => {
    expect(
      verifyEd25519(
        "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
        new Uint8Array(),
        Buffer.from(
          "e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
          "hex"
        )
      )
    ).toBe(true);
  });

  it("does not trust a feed signed with any other key", () => {
    expect(isAiFeedSignatureValid(FEED, signAiFeed(FEED))).toBe(false);
    // Naming the release key does not make another key's signature valid.
    expect(
      isAiFeedSignatureValid(
        FEED,
        signAiFeed(FEED, { public_key: RELEASE_KEY })
      )
    ).toBe(false);
  });
});

describe("isAiFeedSignatureValid", () => {
  it("accepts the feed's bytes signed by a trusted key, its hex in any case", () => {
    expect(isAiFeedSignatureValid(FEED, signAiFeed(FEED), KEYS)).toBe(true);
    const upper = signAiFeed(FEED, {
      public_key: TEST_AI_FEED_KEY.toUpperCase(),
    });
    expect(isAiFeedSignatureValid(FEED, upper, KEYS)).toBe(true);
  });

  it("refuses a feed changed by one byte", () => {
    const changed = FEED.slice();
    changed[10] = changed[10]! ^ 1;
    expect(isAiFeedSignatureValid(changed, signAiFeed(FEED), KEYS)).toBe(false);
  });

  it("refuses a signature changed by one byte", () => {
    const fields = fieldsOf(signAiFeed(FEED));
    const hex = String(fields["signature"]);
    const flipped = `${hex.slice(0, 10)}${hex[10] === "0" ? "1" : "0"}${hex.slice(11)}`;
    expect(
      isAiFeedSignatureValid(
        FEED,
        sigFile({ ...fields, signature: flipped }),
        KEYS
      )
    ).toBe(false);
  });

  it("refuses another feed's signature", () => {
    const other = fieldsOf(signAiFeed(new TextEncoder().encode("{}")));
    const fields = fieldsOf(signAiFeed(FEED));
    expect(
      isAiFeedSignatureValid(
        FEED,
        sigFile({ ...fields, signature: other["signature"] }),
        KEYS
      )
    ).toBe(false);
  });

  it("refuses a signature without the feed's domain", () => {
    // Signatures of the feed's bytes, or of their SHA-256 without "6529 AI
    // releases v1" and its zero byte, sign something else.
    const fields = fieldsOf(signAiFeed(FEED));
    for (const message of [FEED, createHash("sha256").update(FEED).digest()]) {
      expect(
        isAiFeedSignatureValid(
          FEED,
          sigFile({ ...fields, signature: signRawHex(message) }),
          KEYS
        )
      ).toBe(false);
    }
  });

  it.each([
    ["an untrusted key", { public_key: "12".repeat(32) }],
    ["another algorithm", { algorithm: "ecdsa-secp256k1-sha256" }],
    ["a short signature", { signature: "1234" }],
    ["a signature that isn't hex", { signature: "zz".repeat(64) }],
    ["no public key", { public_key: undefined }],
    ["a public key with 0x", { public_key: `0x${TEST_AI_FEED_KEY}` }],
  ])("refuses %s", (_name, change) => {
    const fields = { ...fieldsOf(signAiFeed(FEED)), ...change };
    expect(isAiFeedSignatureValid(FEED, sigFile(fields), KEYS)).toBe(false);
  });

  it("refuses a signature file that isn't JSON, or is too large", () => {
    expect(
      isAiFeedSignatureValid(FEED, new Uint8Array([0x30, 0x45, 0x02]), KEYS)
    ).toBe(false);
    const padded = new TextEncoder().encode(
      `${new TextDecoder().decode(signAiFeed(FEED))}${" ".repeat(1024)}`
    );
    expect(isAiFeedSignatureValid(FEED, padded, KEYS)).toBe(false);
  });

  it("refuses a feed larger than 64 KiB", () => {
    const large = new Uint8Array(MAX_AI_FEED_BYTES + 1).fill(0x20);
    expect(isAiFeedSignatureValid(large, signAiFeed(large), KEYS)).toBe(false);
  });

  it("returns not verified for a listed key that is not hex", () => {
    expect(isAiFeedSignatureValid(FEED, signAiFeed(FEED), ["not a key"])).toBe(
      false
    );
  });
});
