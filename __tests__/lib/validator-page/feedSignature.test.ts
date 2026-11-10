/** @jest-environment node */
import { publicKeyToAddress } from "viem/accounts";

import { isFeedSignatureValid } from "@/lib/validator-page/feedSignature";
import { FEED_SIGNING_KEYS } from "@/lib/validator-page/feedSigningKeys";

import { TEST_FEED } from "./fixtures";
import { signFeed, TEST_FEED_SIGNING_KEY } from "./feedSigning";

const FEED = new TextEncoder().encode(`${JSON.stringify(TEST_FEED)}\n`);
const KEYS = [TEST_FEED_SIGNING_KEY];
// secp256k1's group order: s and n - s are the same signature.
const ORDER =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

function sigFile(fields: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(fields));
}

function fieldsOf(signature: Uint8Array): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(signature)) as Record<
    string,
    unknown
  >;
}

describe("the pinned release feed key", () => {
  it("is 6529's one key, and its address is the one the signature names", () => {
    expect(FEED_SIGNING_KEYS).toHaveLength(1);
    const [key] = FEED_SIGNING_KEYS;
    expect(publicKeyToAddress(`0x${key!.publicKey}`)).toBe(key!.address);
    expect(key!.address).toBe("0xf005F32cb7Ecf25566B8Cf6685394e0cC694B832");
  });

  it("does not trust a feed signed with any other key", () => {
    expect(isFeedSignatureValid(FEED, signFeed(FEED))).toBe(false);
    expect(
      isFeedSignatureValid(FEED, signFeed(FEED, FEED_SIGNING_KEYS[0]!.address))
    ).toBe(false);
  });
});

describe("isFeedSignatureValid", () => {
  it("accepts the feed's bytes signed by a trusted key, its address in any case", () => {
    expect(isFeedSignatureValid(FEED, signFeed(FEED), KEYS)).toBe(true);
    expect(
      isFeedSignatureValid(
        FEED,
        signFeed(
          FEED,
          TEST_FEED_SIGNING_KEY.address.toUpperCase().replace("0X", "0x")
        ),
        KEYS
      )
    ).toBe(true);
  });

  it("accepts the high form of s, as a validator does", () => {
    const fields = fieldsOf(signFeed(FEED));
    const hex = String(fields["signature"]).slice(2);
    const high = ORDER - BigInt(`0x${hex.slice(64)}`);
    const signature = `0x${hex.slice(0, 64)}${high.toString(16).padStart(64, "0")}`;
    expect(
      isFeedSignatureValid(FEED, sigFile({ ...fields, signature }), KEYS)
    ).toBe(true);
  });

  it("refuses a feed changed by one byte", () => {
    const changed = FEED.slice();
    changed[10] = changed[10]! ^ 1;
    expect(isFeedSignatureValid(changed, signFeed(FEED), KEYS)).toBe(false);
  });

  it("refuses another feed's signature", () => {
    const fields = fieldsOf(signFeed(FEED));
    const other = fieldsOf(signFeed(new TextEncoder().encode("{}")));
    expect(
      isFeedSignatureValid(
        FEED,
        sigFile({ ...fields, signature: other["signature"] }),
        KEYS
      )
    ).toBe(false);
  });

  it.each([
    ["an untrusted key", { key: `0x${"12".repeat(20)}` }],
    ["another format", { format: 2 }],
    ["another algorithm", { algorithm: "ecdsa-p256-sha256" }],
    ["a short signature", { signature: "0x1234" }],
    ["a signature that isn't hex", { signature: `0x${"zz".repeat(64)}` }],
    ["no key", { key: undefined }],
  ])("refuses %s", (_name, change) => {
    const fields = { ...fieldsOf(signFeed(FEED)), ...change };
    expect(isFeedSignatureValid(FEED, sigFile(fields), KEYS)).toBe(false);
  });

  it("refuses a signature file that isn't JSON, or is too large", () => {
    expect(
      isFeedSignatureValid(FEED, new Uint8Array([0x30, 0x45, 0x02]), KEYS)
    ).toBe(false);
    const padded = new TextEncoder().encode(
      `${new TextDecoder().decode(signFeed(FEED))}${" ".repeat(1024)}`
    );
    expect(isFeedSignatureValid(FEED, padded, KEYS)).toBe(false);
  });

  it("refuses a feed larger than a validator reads", () => {
    const large = new Uint8Array(56 * 1024 + 1).fill(0x20);
    expect(isFeedSignatureValid(large, signFeed(large), KEYS)).toBe(false);
  });
});
