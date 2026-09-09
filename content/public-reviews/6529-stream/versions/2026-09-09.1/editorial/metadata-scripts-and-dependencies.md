## The token and its presentation are separate

The permanent Core records token identity and immutable token data. Artwork presentation belongs to surrounding metadata contracts and the configured router. A metadata URL or file fingerprint does not establish that the artwork is stored entirely onchain or will remain available.

**Built in Core:** bounded calls to a metadata router, fallback metadata, and restricted refresh events. **Agreed but unfinished:** the full router and artwork-serving integration must be verified for the launch configuration. An interface or test router is not a production renderer.

## Reading token and collection metadata

Core's `tokenURI` and `contractURI` read through the configured metadata router. Calls are bounded and have fallback behavior when the router cannot provide a usable answer. The fallback keeps a contract response available; it is not a recovered copy of missing art.

The source also contains collection metadata, shared contract metadata, dependency records, and a rendering library. Review the actual deployment connections before assuming that all these pieces serve a particular token.

See [tokenURI](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L763), [contractURI](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L786), and [metadata architecture](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/metadata-router-and-renderer.md).

## Files, programs, and dependencies

A useful artwork package identifies the exact file or program, its version, the required inputs, and every dependency. Hashes let readers verify that a recovered copy matches. Storage locations and mirrors give them a way to retrieve it.

Dependency updates create versioned records. A link to a dependency, a snapshot record, and an irreversible freeze are different things. A release must identify which versions the artwork uses and which records are still changeable.

Browser support also matters. A program can be saved correctly yet fail to run because it relies on an unavailable library, a remote API, a missing font, or browser behavior. Retained browser checks are useful evidence for the tested package; they are not a guarantee for every artwork forever.

See [dependency registry](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/dependencies/DependencyRegistry.sol), [metadata records](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/metadata/StreamCollectionMetadata.sol), and [permanence packages](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/permanence-packages.md).

## Refresh events are now built

The permanent Core contains restricted helpers for one-token metadata updates, bounded batch updates, and shared contract metadata updates. Caller checks limit which configured modules may emit them. The older review's statement that these helpers are absent no longer describes this source.

An event asks indexers to refresh information. It cannot force every marketplace to refresh immediately or display collections separately. The deployment must still provide the correct router and evidence that the intended platforms use it.

See [single-token refresh](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L832), [batch refresh](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L854), and [contract refresh](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L875).

## Questions for reviewers

Can a collector retrieve and check every required file? Which fields can change, and who controls them? Does a frozen record cover the work itself or only a reference? What remains readable if the normal renderer disappears?
