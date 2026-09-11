# Recover a profile CMS publication

A publication has two durable artifacts: a canonical content core and a signed
publication manifest. The manifest identifies the content by URI and SHA-256,
includes the full EIP-712 message and signature, and supplies the envelope needed
to reconstruct a V1 package. Save the publication's recovery receipt when
exporting a site.

## Recover and verify

Use the repository wrapper and an installed dependency set:

```bash
6529 exec tsx ops/scripts/profile-cms-recover.ts \
  --manifest ar://PUBLICATION_TRANSACTION_ID \
  --expected-signer 0xEXPECTED_SIGNING_WALLET \
  --out recovered-site
```

Replace the example values with the recovery URI and a trusted expected signer.
The output directory must not already exist. Add `--manifest-hash sha256:HASH`
to verify the manifest against a separately saved recovery receipt.

The command retrieves the manifest and content through public Arweave/IPFS
gateways. It does not use the 6529 API, a connected profile, a wallet key or a
6529 session. The command checks:

- content bytes against the signed package hash;
- package schema, payload hash and semantic validity;
- the exact CMS EIP-712 domain and type definitions;
- manifest identity, version, path and storage fields against the signed message;
- reconstructed signature and storage envelopes;
- the signing wallet's signature.

An expired publication deadline does not invalidate a historical signature.
The deadline limits acceptance of a new publish request, not later archival
verification.

## Recover from saved files

For an ordinary wallet signature, verification can run entirely offline:

```bash
6529 exec tsx ops/scripts/profile-cms-recover.ts \
  --manifest-file publication.json \
  --content-file content.json \
  --expected-signer 0xEXPECTED_SIGNING_WALLET \
  --out recovered-site
```

The command writes `publication.json`, `content.json`, the reconstructed
`package.json`, and static HTML pages. It prints the entry HTML path. Serve the
output directory with a static file server or open that file directly.

Published website links can use readable page addresses such as `/handle/studio`.
The signed package retains archive file paths; recovered navigation points to
those local HTML files. The archive preserves content and navigation rather than
requiring the interactive studio or its exact visual presentation.

Static recovery renders ordinary text/media, navigation, gallery works and 2D
room placements. It does not execute author JavaScript or activate embedded HTML
and 3D runtimes. More specialized blocks retain their structured source in an
expandable panel. Referenced media still needs its original host or decentralized
gateway unless separately mirrored; recovering page JSON does not archive every
external asset.

## Contract wallets

Add `--rpc` for an EIP-1271 contract-wallet publication:

```bash
6529 exec tsx ops/scripts/profile-cms-recover.ts \
  --manifest-file publication.json --content-file content.json \
  --rpc https://YOUR_CHAIN_RPC \
  --expected-signer 0xEXPECTED_CONTRACT_WALLET \
  --out recovered-site
```

The RPC chain must match the signed domain. The command requires contract code
and the EIP-1271 success value, and labels the result `eip1271-current-state`.
Contract signatures depend on chain state: this checks the wallet's current
validation policy, not its policy at an independently proven historical block.
Keep credential-bearing RPC URLs out of shared commands, logs and reports.

## What verification establishes

A successful result proves that the displayed wallet signed the recovered
content and publication intent. Compare it with a trusted expected wallet or
recovery receipt. It does not independently prove membership in 6529's profile
registry, the current owner of a handle, or that this historical publication is
still the profile's current primary website. The output makes those limits
explicit.

Unpublishing removes the current 6529 website pointer; it does not delete durable
content or invalidate an earlier signature. Older publications without a recovery
manifest need a new signed publication to acquire this recovery format.

## Related areas

- [Profile Website Studio](../profiles/feature-profile-cms-builder.md)
- [Use Your Own Agent with the Website Studio](../profiles/feature-profile-cms-builder-ai-agent-affordances.md)
- [Developer documentation](README.md)
