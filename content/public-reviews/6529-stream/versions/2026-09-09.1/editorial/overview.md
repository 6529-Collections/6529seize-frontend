## What Stream is

Stream is being developed for releasing and collecting digital art. One permanent NFT contract records token identity and ownership. Separate contracts handle minting rules, artwork presentation, payments, and preservation.

It can represent a 1/1, a series of distinct 1/1 works, or editions. Editions are not limited to The Memes. Each token has its own identity even when several tokens represent copies of the same artwork. The publishing tools and formats available at launch still need confirmation.

**Stream is under community review. This candidate is not a live publishing service, and independent audit and deployment evidence remain incomplete.**

## How to read the status

- **Built in this code:** a concrete implementation exists. This does not mean every required connection is made, independently audited, or deployed.
- **Agreed but unfinished:** an accepted design requires the feature, but its implementation, integration, or evidence is incomplete.
- **Still proposed:** the design itself awaits acceptance.

This review was prepared on September 9, 2026 from commit `92ea123380917032f01aae09691141a2a72df935`. Source links throughout this version point to that exact code. Earlier review versions remain available as historical records.

## Follow the artwork

The intended journey is: prepare the artwork and release terms, obtain the required artist consent, sell or distribute tokens, reveal any generated output, and make the agreed artwork record permanent.

Parts of that journey are built. The permanent Core and manager mint path exist. Full artist authority and the complete launch sale and payment connections still need work. The retained signed-sale rehearsal uses a test-only legacy Core; it is not proof that the whole journey is connected to the permanent Core.

All Stream collections share one Core address. A marketplace that groups only by contract address may display them together. Separate collection presentation depends on marketplace or indexer support.

## Choose your path

- [For artists](./for-artists): approvals, collaborators, payment, and permanence.
- [Tokens and minting](./tokens-collections-and-minting): identity, supply, and the built mint path.
- [Where development stands](./security-testing-and-known-limitations): completed work, remaining connections, and evidence.
- [Community review](./community-review): questions and feedback.

For exact mechanics, use the technical reference and the [source repository](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/release-readiness.md).
