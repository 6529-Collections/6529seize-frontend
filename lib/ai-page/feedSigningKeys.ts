/**
 * The keys this site trusts for 6529 AI's release feed, each an Ed25519
 * public key in hex, as `releases.json.sig` names it in `public_key`.
 *
 * 6529 AI's Ed25519 release key in AWS KMS, alias
 * `alias/6529-ai-releases-ed25519`, which signed 0.1.0-rc.1's and rc.2's
 * feed and `SHA256SUMS`. Its public half is also 6529 AI's
 * `deploy/release/release-key-ed25519.pub`, the key that `release.py
 * verify` checks `SHA256SUMS.sig` with. It signs nothing new: from
 * 0.1.0-rc.3 the list is the bundle, checked with `releaseListKeys.ts`.
 */
export const AI_FEED_SIGNING_KEYS: readonly string[] = [
  "58fb7856a682e6352c4e03f65eb80fe9468f4c72c96b9a7709ff2be37d7c77c4",
];
