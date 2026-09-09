## Selection happens outside the contracts

TDH scoring and community selection are offchain decisions. A signed contract permission can bind a sale to specific terms; it does not prove that the community process was fair or that an artist approved the work.

**Built in the retained older sale code:** a configured signer authorizes a drop. **Agreed but unfinished:** the complete launch system must connect sale authorization, mint policy, artist consent, and payments to the permanent Core.

## What the older drop permission covers

The signed authorization binds the collection, token data, quantity, sale mode, price or auction terms, poster, recipient and payer rules, expiry, signer epoch, and one-use identity. This path accepts one token per authorization; that is not a limit of one token per Stream collection.

An auction permission has no fixed payer or recipient. A different wallet may submit it, but the poster named in the permission retains the poster's proceeds and auction return rights.

See [authorization validation](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/mint/StreamDrops.sol#L561) and [auction registration](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/mint/StreamDrops.sol#L693).

## What this does not prove

A valid signature establishes authorization by the configured signer for those terms. It does not establish artist acceptance, a correct TDH calculation, complete collaborator payments, or a production deployment.

The retained rehearsal imports `LegacyStreamCore` from the test helpers. Its successful sale flow is evidence about that configuration, not proof that the old minter calls the permanent Core. The current permanent Core accepts mint execution through its registered manager.

See [rehearsal imports](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/script/RehearseDeployment.s.sol#L5-L18) and [permanent-Core manager check](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L955).

## Signer control and recovery

The older Drop path checks a signer epoch, expiry, cancellation, and consumed authorization identity. Changing the epoch invalidates old permissions. Pausing Drop execution is a separate control. These checks do not replace custody procedures for the signing key or the required artist-authority checks.

See [signing guidance](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/drop-authorization-signing.md), [custody evidence](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/signer-custody-readiness.md), and [minting](./tokens-collections-and-minting).

## Questions for reviewers

What should the artist and collector see about selection before a sale? Can they distinguish the community decision, the platform's sale permission, and the artist's own consent? How should revoked or expired permissions be explained?
