## Who controls what

Stream distributes responsibilities across contracts and people. **No single role label proves that all required limits are implemented or configured for launch.**

| Actor | Built behavior or agreed responsibility |
| --- | --- |
| Artist | Accepted design requires attribution acceptance, mint consent, and approval of specified economic and finality decisions. Full authority integration is unfinished. |
| Collector | Owns and transfers a minted NFT; can burn it while the applicable Core rules permit. |
| Mint manager | The current registered manager can ask the permanent Core to mint. It checks phase policy and uses the ledger. |
| Governance executor | Supplies the action context used by governed Core changes. The requested action, scope, old state, and new state must match. |
| Sale poster | Receives the poster's share and relevant auction return rights in the retained older sale contracts. This is a named account, not necessarily the artist or transaction submitter. |
| Pause authority | Can stop specified operations in contracts that consult its pause domain. Manager phases and Core collection status have separate controls. |
| Finality guardian | Can veto the scheduled finality action within the registry's rules. |

See [Core governance checks](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L972), [mint authorization](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L955), and [finality veto](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/finality/StreamArtworkFinalityRegistry.sol#L364).

## Artist rights need more than a name

The accepted design requires the artist to accept an attribution and authorize the relevant mint policy or delegate within stated limits. It also includes collaborator acceptance, key rotation, estate arrangements, and consent for certain payment changes.

The newer artist archive stores evidence and the registry directory identifies contracts. Neither is the completed authority system. ADR 0023's division of artist responsibilities remains proposed.

See [accepted artist rights](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0010-world-class-spec-pass.md#L72-L114) and [proposed artist architecture](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0023-modular-artist-authority-domain-ownership.md).

## Setup and replacement powers

The permanent Core uses registered references for surrounding contracts. Updating one requires the relevant governance and module checks; a pointer can also be frozen. This does not turn Core itself into an upgradeable contract.

A replacement must preserve the state and history its job depends on. A new manager address alone does not establish that all old allowances, payment obligations, consent, and preservation records remain usable.

See [pointer updates](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L661) and [governance and successors](./governance-pausing-and-successors).

## Questions for reviewers

Can one account act without the approvals people expect? Can an emergency authority stop the affected operation while people retain the intended exits? Does the proposed launch record name every account and contract with power over an artwork?
