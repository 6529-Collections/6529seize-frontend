/**
 * A key the release feed may be signed with: its Ethereum-style address, as
 * `releases.json.sig` names it, and its public key, uncompressed SEC1
 * (`04 || x || y`), in hex.
 */
export type FeedSigningKey = {
  readonly address: string;
  readonly publicKey: string;
};

/**
 * The keys this site trusts for the release feed, as every validator release
 * does (`releases::TRUSTED_KEYS` in the validator's `crates/releases`, and
 * its `docs/releases-feed.md`, "The key"): 6529's release-list key in AWS
 * KMS, alias `alias/6529-validator-releases`, made 2026-11-01. A successor
 * key is added here beside it before the old one is retired.
 */
export const FEED_SIGNING_KEYS: readonly FeedSigningKey[] = [
  {
    address: "0xf005F32cb7Ecf25566B8Cf6685394e0cC694B832",
    publicKey:
      "0439827393cf57ca2b10d94ebea48fcb70fd9c3064c36993a75e69e7169b79722f36e05b7354a8c68833a7faa6e4bafebbadc18a13c1ae5ac7b862953eefd1b65f",
  },
];
