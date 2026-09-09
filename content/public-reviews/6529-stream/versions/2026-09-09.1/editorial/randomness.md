## A token can exist before its artwork is revealed

Some works need a random result to choose an output. Minting the token and obtaining that result are separate events. A collector should be able to see whether the result is pending, available, or needs recovery.

**Built in the permanent Core:** the token records the entropy coordinator selected at mint and a mint commitment. **Agreed but unfinished:** the complete coordinator, reveal-fee, provider, and recovery path needs its own implementation and launch evidence. Core hooks alone do not prove that service exists.

See [Core mint completion](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L913) and [entropy specification](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/stream-entropy-coordinator.md).

## What the older randomizers demonstrate

The source retains VRF and RNG randomizers with a request lifecycle: pending requests, fulfillment, stale requests, and failed post-processing. If the provider's result is accepted but applying it to the artwork fails, the result can be kept and retried. Retrying post-processing should reuse that accepted seed rather than silently choosing another artwork.

These integrations belong to the older Core flow. The retained sale rehearsal uses a test-only legacy Core and wires those randomizers there. A passing legacy callback is not proof of a complete reveal connection for the permanent Core.

See [VRF fulfillment](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/integrations/randomizers/RandomizerVRF.sol#L73), [same-result retry](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/integrations/randomizers/RandomizerVRF.sol#L116), and [rehearsal](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/script/RehearseDeployment.s.sol).

## Decisions the release must make clear

The release plan must identify the provider, the data committed before the result, who can request and fund a reveal, what the artist can still change, and the recovery rules. It should explain whether changing a provider affects requests already in progress.

A provider result is one part of reproducibility. The artwork also needs the exact program, input data, dependency versions, and instructions. A saved seed cannot recreate a work if its program or required files are missing.

Burning a token does not make a late callback permission to recreate ownership. Replacement providers and recovery tools must preserve the identity and result history already accepted.

## Agreed requirements and open designs

The accepted randomness and long-term architecture decisions define the required trust and recovery boundaries. Later coordinator and recovery specifications describe more than the currently connected legacy flow. Read them as requirements or proposals according to their stated status, not as a catalog of live features.

See [accepted randomness decision](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0005-randomness.md) and [current launch evidence](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/release-artifacts/latest/public-beta-blockers.md).

## Questions for reviewers

Can anyone influence the result after seeing it? Can an operator replace a result under the name of recovery? What does a collector see when funding, the provider, or post-processing fails? Can another person recreate the artwork from the retained package?
