# For artists

This page describes what the current code lets an artist approve, what other
actors can still change, and which broader artist-governance ideas remain
proposals.

## Your collection identity

### IMPLEMENTED

The Core stores an artist address as part of the collection record. That address
is used by the current artist-approval system. A collection can also refer to
metadata, scripts, dependency versions, supply and mint policy, revenue
recipients, a randomizer, and other module-owned configuration.

The artist address is an important identity field, but it does not by itself
make every collection mutation artist-only.

## Approving a specific collection state

### IMPLEMENTED

The current mechanism in
[`StreamArtistApprovals.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamArtistApprovals.sol)
computes a collection-state hash and verifies an artist signature over that
state. It supports:

- an ordinary externally owned account signature;
- an ERC-1271 signature from a contract wallet such as a Safe;
- an approval that is tied to the current state rather than a vague message.

If a field included in the state hash changes, the old approval becomes stale.
That is the correct direction: a signature for one version of the work should
not silently approve a different version.

### WHAT THIS DOES NOT MEAN

The artist approval is not currently a universal veto. Administrative functions
can still mutate fields within their assigned authority. The present
`freezeCollection` call is authorized through the admin system and does not
itself require a new artist signature.

The community should review whether final approval, final supply, Core freeze,
preservation manifests, and terminal finality each need an artist signature,
governance approval, a delay, or a combination.

## Artwork files, scripts, and token data

### IMPLEMENTED

Stream can represent artwork inputs through collection data, scripts,
token-specific data, images, attributes, dependency records, and metadata
modes. These values do not all live in the same contract. The Metadata page
shows which module stores each record and which commitments can later be frozen.

### KNOWN LIMITATION

An onchain hash does not upload or preserve a file. Before approving a
preservation or finality manifest, the artist needs a human-readable package
showing:

- the exact files and byte hashes;
- every external dependency and version;
- where each byte sequence can be retrieved;
- how a token is reconstructed;
- which browser or runtime assumptions remain;
- what happens if a URI, gateway, RPC provider, or dependency host disappears.

## Supply and editions

Stream is not restricted to one-of-one tokens. A collection can use a supply
limit and mint policy that represents a one-of-one, a fixed edition, or another
supported collection pattern.

### OPEN FOR FEEDBACK

For each pattern, an artist should be able to see:

- the maximum possible supply;
- the minted-ever supply;
- the live supply after burns;
- who can change a supply or mint window;
- when supply becomes final;
- whether any admin or successor path can reopen minting.

One-of-one works receive special permanence and provenance attention in the
repository, but that should not make edition behavior implicit.

## Mint policy and audience

### IMPLEMENTED

Mint phases can describe time windows, executors, optional gates, limits, and
counter scopes. Signed drop authorization can bind a mint to a payer, recipient,
collection, quantity, price, deadline, and sale mode.

### IMPORTANT DISTINCTION

Curation and TDH calculations are outside Solidity. The contract verifies a
configured signer's authorization. Artists therefore depend on:

- the published curation rules;
- the correctness of the service that constructs authorizations;
- protection of the signing keys;
- a clear rotation and incident process;
- the onchain payload binding every value that should not change.

## Fixed-price sales and auctions

An artist's sale configuration may lead to a free or paid fixed-price mint or
an English auction. The artist-facing review should identify:

- the exact currency;
- the price or auction rules;
- the payer and recipient behavior;
- bidder custody and refunds;
- extension rules;
- cancellation boundaries;
- the revenue profile selected at settlement;
- every fee or curator allocation;
- what occurs if no bid is received.

Draft sales documents discuss more profiles than the current implementation.
Dutch auctions, sealed bids, raffles, refund windows, private sales,
burn-to-mint flows, and other profiles must be labelled **PROPOSED** or
**DEFERRED** unless the reviewed release actually implements them.

## Revenue recipients and split profiles

### IMPLEMENTED

Primary-sale settlement can resolve revenue configuration at token,
collection, or default level. Split wallets account for recipients and allow
pull withdrawals. ERC-2981 exposes royalty information.

### WHAT THE ARTIST SHOULD VERIFY

- recipient addresses and percentages;
- which profile wins when more than one level is configured;
- whether the profile can change before or after a sale;
- rounding and residual balance behavior;
- support for ETH and any ERC-20 tokens;
- curator allocation and claim roots;
- emergency withdrawal boundaries;
- whether a marketplace is merely shown a royalty or is contractually forced to
  pay it.

ERC-2981 is a signal. It does not make secondary royalties universally
enforceable.

## Randomness

If the artwork uses randomness, the artist should know the provider and failure
policy before minting. The protocol can bind a request to a provider epoch,
store the raw output hash, derive a seed, and expose pending, fulfilled,
failed-post-processing, or stale states.

### OPEN FOR FEEDBACK

- Can the artist reject a provider?
- Who can migrate the collection to a new provider?
- What happens to already pending tokens?
- How many retries are allowed?
- Can a token be burned before fulfillment?
- Which provider fees are reserved?
- What evidence is required from a provider before launch?

Randomness cannot be described as trustless without explaining the selected
provider.

## Editing and freezing metadata

Before freeze, authorized roles can edit the mutable metadata surfaces assigned
to them. After the relevant Core freeze, covered mutations are rejected.
Separate preservation and artwork-finality modules can add stronger records and
terminal actions.

### ARTIST CHECKLIST BEFORE FREEZE

1. Verify the collection identity and artist address.
2. Verify supply and mint closure.
3. Verify every live token's randomness and metadata state.
4. Verify scripts, token data, images, attributes, dependencies, and content
   hashes.
5. Verify revenue and royalty configuration.
6. Verify the exact freeze manifest.
7. Verify all known burn records.
8. Verify how the work is reconstructed without the current website.
9. Sign only the exact state intended for approval.
10. Preserve an independent copy of the approval package.

## Collaborators, delegation, recovery, and estates

### PROPOSED

The Artist Authority draft discusses a much broader model: collaborators,
delegated roles, guardians, key rotation, estate instructions, sanctions,
disputes, and recovery. The current reviewed release does not contain a complete
production `StreamArtistRegistry` implementing that design.

The public review must not present those ideas as artist protections that
already exist. They remain decisions about the genesis authority model.

## What we think

An artist approval should be legible without a block explorer. It should name
the collection, source version, files, supply, sale rules, revenue recipients,
randomness provider, mutable fields, and irreversible actions. Signing a hash is
not meaningful consent unless the artist can inspect what the hash commits to.

## What can still change

The final boundary between artist, collaborator, admin, guardian, and governance
authority is not fixed. The relationship between artist approval, Core freeze,
and terminal finality is especially important and should be decided before
deployment.

## Questions for artists

1. Which actions must be impossible without your current signature?
2. Should collaborators receive narrow onchain roles, or should the artist
   remain the only signing identity?
3. What recovery and estate process is credible over a fifty-year horizon?
4. Is the approval package understandable enough to sign without Solidity
   knowledge?
5. What preservation evidence would make you comfortable freezing a work?
6. Which sale and royalty settings must become permanent, and when?

