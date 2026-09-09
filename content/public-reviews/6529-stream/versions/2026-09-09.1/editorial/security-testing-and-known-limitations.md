## What this snapshot covers

This review describes commit `92ea123380917032f01aae09691141a2a72df935`, checked on September 9, 2026. The committed evidence still marks public beta and production as blocked. A source file, a passing local check, and a verified deployment are different forms of evidence.

See [release readiness](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/release-readiness.md), [public-beta blockers](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/release-artifacts/latest/public-beta-blockers.md), and [risk register](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/release-artifacts/latest/risk-register.json).

## Built in this code

- The permanent ERC-721 Core records collection and token identity, manages explicit collection closure, and restricts minting to its registered manager.
- The manager and ledger implement ADR 0018's batch operation roots, per-token identities, and replay accounting.
- Core reads royalty information from a resolver and has restricted metadata refresh helpers.
- Governance includes a bound action catalog and target-side transition checks.
- Separate metadata, revenue, preservation, and finality components exist. Their required launch connections must still be verified.

The committed bytecode proof reports Core at **18,997 runtime bytes**, leaving **5,579 bytes** below the 24,576-byte limit. This is retained build evidence, not a fresh deployment measurement. The old 424-byte margin does not describe this candidate.

See [ADR 0018](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0018-batch-operation-root-and-token-identity.md), [Core](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol), and [bytecode proof](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/release-artifacts/latest/bytecode-release-proof.json).

## Agreed but unfinished

The accepted design requires artist acceptance and consent, collaborator and estate protections, exact paid-mint settlement, complete launch component bindings, and evidence that replacement contracts preserve obligations and history.

The retained fixed-price and auction rehearsal imports a test-only legacy Core. It must not be counted as a complete integration with the permanent Core. Metadata routing and entropy hooks also need their actual serving and reveal implementations, not only interfaces or test doubles.

The artist directory and archive are concrete but limited: they store expected contract identities and evidence. They do not enforce the complete artist-authority model.

See [rehearsal imports](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/script/RehearseDeployment.s.sol#L5-L18), [artist directory](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/artist/StreamArtistRegistryV2.sol#L6-L9), and [accepted artist requirements](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0010-world-class-spec-pass.md#L72-L114).

## Still proposed

ADR 0019's payment-intent orchestration, ADR 0020's finality recovery, and ADR 0023's artist-domain architecture remain proposals. Related schemas, diagrams, tests, or foundation contracts do not make those proposals accepted or complete.

See [ADR 0019](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0019-payment-intent-orchestration.md), [ADR 0020](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0020-executor-only-finality-recovery.md), and [ADR 0023](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0023-modular-artist-authority-domain-ownership.md).

## Evidence still needed

The retained public-beta ledger has two completed rows, three pending rows, and four missing rows. Production has eleven missing rows. Missing evidence includes the completed external audit, testnet rehearsal, verified non-local addresses, and explorer verification. Fork deployment, ceremony, and randomizer evidence need review for the changed configuration.

Retained browser and marketplace checks apply to their recorded configurations. They do not prove that every artwork, marketplace, or future deployment works. Publication of this review is not permission to launch the contracts.

## Review priorities

Trace one complete artist-approved paid mint. Check rollback and replay across manager, ledger, payment, and Core. Check the boundary between legacy rehearsals and permanent-Core evidence. Exercise collection closure, burn blocking, finality, emergency stops, and module replacement with their exact authorities.

Use the technical reference for declarations and source, and [community review](./community-review) to attach findings to this candidate.
