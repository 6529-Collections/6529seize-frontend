# provenance-core (copied)

A copy of `@6529-collections/provenance-core` from
[6529-Collections/6529-provenance-app](https://github.com/6529-Collections/6529-provenance-app), at
the commit in `SOURCE.json`. It reads `ProvenanceRegistry` contracts, checks content against their
hashes, and builds the owner Safe's governance SafeTxs.

**Do not edit these files.** Change the package in its own repository, then copy it again:

```bash
node ops/scripts/sync-provenance-core.mjs --repo ../6529-provenance-app --commit <sha>
```

The copy is temporary. This repository's package policy refuses `link:` and `file:` dependencies,
and the package is not on npm yet. Once it is published, delete this directory, depend on
`@6529-collections/provenance-core`, and point the imports at the package. The on-chain Museum
preview's `lib/museum/onchain/` switches to the same package at the same time.

Copying changes two things: relative imports lose their `.js` suffix, and each TypeScript file gets
a header naming the source commit. `__tests__/lib/provenance-core/vectors.test.ts` runs the
package's shared vectors against this copy.
