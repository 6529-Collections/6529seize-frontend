/**
 * The keys this site trusts for 6529 AI's release feed, each an Ed25519
 * public key in hex, as `releases.json.sig` names it in `public_key`.
 *
 * 6529 AI's release key in AWS KMS, alias `alias/6529-ai-releases`. Its
 * public half is also 6529 AI's `deploy/release/release-key.pub`, the key
 * that `release.py verify` checks `SHA256SUMS.sig` with. A successor key is
 * added here beside it before the old one is retired.
 */
export const AI_FEED_SIGNING_KEYS: readonly string[] = [
  "58fb7856a682e6352c4e03f65eb80fe9468f4c72c96b9a7709ff2be37d7c77c4",
];
