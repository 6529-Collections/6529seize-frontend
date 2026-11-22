import type { FeedSigningKey } from "@/lib/validator-page/feedSigningKeys";

/**
 * The keys this site trusts for 6529 AI's release list in the validator's
 * format 1 (`feed/releases.bundle.json`, signed under `6529 AI releases v1`),
 * as 6529 AI does (`ai_releases::RELEASE_KEYS` in the 6529 AI source): 6529
 * AI's release-list key, secp256k1 in AWS KMS, alias
 * `alias/6529-ai-releases`, made 2026-11-21, whose address and public key
 * are also in 6529 AI's `deploy/release/release-key.pub`. Each key is named
 * by its address, as `releases.json.sig` names it, with its public key,
 * uncompressed SEC1 (`04 || x || y`), in hex.
 *
 * /ai reads the bundle once one signed with this key is in the bucket, and
 * the Ed25519 list (`feedSigningKeys.ts`) until then. A successor key is
 * added here beside it before the old one is retired.
 */
export const AI_RELEASE_LIST_KEYS: readonly FeedSigningKey[] = [
  {
    address: "0xe8FA289405f8Bd4227aec6256cCD412aE9d0a37B",
    publicKey:
      "048b71bed9cd1409faf90ad0260ebd633cc7563098137786f2fc52dbc1458943a21e4089dca6bcb31f55f2389e1393f828f6bb2ad0d24e7096b2832397af54ce27",
  },
];
