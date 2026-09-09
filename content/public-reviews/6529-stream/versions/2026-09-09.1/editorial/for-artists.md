## Your release plan

A release plan should identify the work, its files and license, its token supply, sale terms, payment recipients, and who may make later changes. A signature screen should explain the exact decision being approved.

**Agreed but unfinished:** the accepted artist model requires more than a general approval of a collection. Artist acceptance, mint consent, payment changes, and final artwork approval have different meanings. A release plan shown in a mockup does not establish that all of these checks are enforced.

The new permanent Core has no collection `artistSignature` function. The older signature survives in the test-only legacy Core. That older signature covers selected collection facts; it does not approve every price or payment split, and the old mint path does not require it to be present or current.

See [accepted artist requirements](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0010-world-class-spec-pass.md#L72-L114), [the artist specification](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/stream-artist-authority.md), and [the legacy approval](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/test/helpers/LegacyStreamCore.sol#L802).

## Identity, collaborators, and authority

**Agreed but unfinished:** the artist must accept an attribution rather than an operator merely assigning it. Collaborators must accept their own roles. The accepted plan includes scoped, expiring delegation, artist key rotation, estate or successor arrangements, and a governed lost-key process with public notice.

These are agreed protections. Their precise implementation and user experience remain work to finish. Do not describe all of them as undecided, or imply that a named artist field alone proves acceptance.

**Still proposed:** ADR 0023 describes how separate artist contracts would own identity, consent, payment designation, and related records. The source already contains an evidence archive and a directory of contract references. Those two contracts do not authorize an artist action or enforce the complete consent process.

See [ADR 0023](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0023-modular-artist-authority-domain-ownership.md), [the evidence archive](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/artist/StreamArtistArchiveV2.sol#L7-L10), and [the directory](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/artist/StreamArtistRegistryV2.sol#L6-L9).

## Payments and royalties

The older signed-sale code credits the named sale poster, protocol, and curator reserve. The poster is not automatically the artist or the person submitting the transaction. A release plan must name the actual recipients and explain how the artist and collaborators receive their shares.

Separate split-wallet and settlement contracts exist. Their presence does not prove that every sale uses them. The complete paid-mint connection remains a launch requirement.

The permanent Core reads royalty information from a configured resolver. This is information for marketplaces; it cannot force a marketplace to pay. Accepted artist requirements include consent for relevant payment changes and the artist's ability to freeze their own royalty receiver assignment. Those protections need the completed artist-authority integration.

See [payments and royalties](./revenue-splits-and-royalties).

## Before making the work permanent

Ending minting, blocking burns, freezing Core state, and finalizing the wider artwork are separate steps. In the permanent Core, a closed collection cannot reopen, including one with no minted tokens. The older zero-supply reopening caveat belongs to the legacy Core.

Before finality, review the exact artwork files, scripts, dependencies, license, payment rules, and remaining permissions. A file fingerprint lets someone check a recovered copy; it cannot retrieve a lost file. Preservation needs usable copies and instructions.

See [freezing and preservation](./freezing-preservation-and-artwork-finality).

## Questions for artists

Which decisions must always require your signature? What should collaborators, delegates, or an estate be allowed to do? What would you need to inspect before an irreversible decision?

Please distinguish feedback on an agreed protection from a proposal to change that protection. Both are useful, but they are different decisions.
