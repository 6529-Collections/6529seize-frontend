## Four different promises

Ending minting, stopping burns, freezing Core state, and finalizing the wider artwork are separate steps. Preservation adds evidence and copies that help people retrieve and understand the work. None of these steps should be described as doing all the others.

## Close the collection

**Built in the permanent Core:** `setCollectionStatus` can close a collection through the required governance action. Closed is terminal. Even a collection with no minted tokens cannot reopen. Core rejects new token allocation unless the collection is active and unfrozen.

This source no longer uses the old Core's `setFinalSupply` function. The zero-supply reopening caveat in the earlier review applies to the legacy implementation, retained under test helpers.

See [collection closure](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L335) and [mint allocation guard](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L886).

## Stop burns and freeze Core

Burn blocking is a separate irreversible action after closure. Core freeze requires the collection to be closed and burns to have been blocked in an earlier block. This ordering gives a distinct boundary between ending minting, stopping destruction, and freezing the Core collection state.

Core freeze is a specific boundary. It does not automatically freeze every metadata contract, royalty policy, external file, or preservation record. Normal token transfers remain separate from the artwork's mutation rules.

See [burn blocking](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L409) and [Core freeze](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L445).

## Finalize the wider artwork

The source contains a finality registry and a read adapter that combines Core facts with collection metadata. The registry checks the expected components and manifest, schedules terminal actions, supports a guardian veto, and rechecks conditions at execution.

**Agreed but unfinished:** the launch system must supply the required components, artist sanction, and complete coverage of every intended artwork-changing route. The existence of a registry does not prove those connections or eliminate missing authority implementations.

The finality package should identify exactly what is frozen, what is excluded, the files and dependencies needed to recover the work, and the evidence supporting each component. “Final” should always have a stated scope.

See [finality registry](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/finality/StreamArtworkFinalityRegistry.sol), [Core facts adapter](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/finality/StreamCoreFinalityAdapter.sol), and [accepted artist sanction](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0010-world-class-spec-pass.md#L85-L107).

## Preservation and later recovery

Preservation records can add evidence without changing the original artwork. A matching hash proves a retrieved copy is correct; it does not retrieve a missing copy. Recovery needs storage, usable software, and instructions.

**Still proposed:** ADR 0020 describes governed recovery that preserves the original finality record and adds recovery history. It is not an implemented right to replace finalized artwork. Its acceptance and required companion integrations remain separate work.

See [preservation records](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/preservation/StreamPreservationRecords.sol) and [recovery proposal](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0020-executor-only-finality-recovery.md).

## Questions for reviewers

What exactly becomes permanent? Can any remaining permission alter it? Can the artist inspect the full package before execution? Could another person recover and render the work without the original platform?
