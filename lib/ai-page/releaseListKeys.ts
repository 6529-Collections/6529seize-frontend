import type { FeedSigningKey } from "@/lib/validator-page/feedSigningKeys";

/**
 * The keys this site trusts for 6529 AI's release list in the validator's
 * format 1 (`feed/releases.bundle.json`, signed under `6529 AI releases v1`),
 * each named by its address as `releases.json.sig` names it, with its
 * public key, uncompressed SEC1 (`04 || x || y`), in hex.
 *
 * EMPTY until 6529 AI's release-list key exists: the secp256k1 key in the
 * release-signing account waits for the owner's approval. While this list
 * is empty no bundle verifies, and /ai serves the Ed25519 list
 * (`feedSigningKeys.ts`). Once the key is created, put its address and
 * public key here, the same pair 6529 AI's release tool pins, and the
 * pages switch to the bundle with the next list it signs. A successor key
 * is added here beside the current one before the old one is retired.
 */
export const AI_RELEASE_LIST_KEYS: readonly FeedSigningKey[] = [];
