# Randomness

This review covers an incomplete, undeployed candidate; [Current Implementation and Readiness](./security-testing-and-known-limitations) is the authoritative record of what is connected, implemented, proposed, and still required.

For generative art, randomness is not merely a number. It is part of the work's
provenance. A collector should be able to determine which provider produced the
input, which request it answered, which token and collection it belonged to,
whether a callback failed, whether anyone requested new randomness, and why the
final seed cannot later be replaced.

That is why Stream treats randomness as a lifecycle rather than a one-shot
callback. A smaller design can request a value and store the result, but then
delays, failures, provider changes, retries, and disputed outputs have no
durable state model.

## Two providers do not mean one trust model

The shared lifecycle is implemented in
[`StreamRandomizerLifecycle.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol).
The two provider implementations covered by this review are:

- [`RandomizerVRF.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerVRF.sol),
  which requests Chainlink VRF through a configured coordinator and
  subscription;
- [`RandomizerRNG.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerRNG.sol),
  which sends a configured ETH amount to an external arRNG controller and later
  receives its authorized callback.

The VRF adapter depends on a configured coordinator, subscription ID, key hash,
callback gas limit, confirmation count, and word count. The arRNG adapter
depends on a controller fixed at construction plus a mutable per-request ETH
cost.

In both cases, Stream pins the provider address and Core randomizer epoch to the
request. It does not prove that a subscription remains funded, that a controller
remains available and honest, or that mutable operating parameters are
appropriate.

The shared lifecycle standardizes what Stream records around a request. It does
not make different external providers equivalent or "trustless."

## Provider assignment creates an authorization era

A collection has one configured randomizer address. Calling Core's assignment
path records the new provider and increments the collection's randomizer epoch.
If the old provider reports a pending request for the collection, replacement
reverts. See
[`StreamCore.addRandomizer`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L411-L443).

Each request records the provider and current Core epoch. Fulfillment checks
that the collection still points to that same provider and epoch before
accepting output.

This prevents a callback from one provider era from being mistaken for a
current result after migration. A simple provider pointer with no request-bound
epoch would leave the contract unable to distinguish an authorized old callback
from an unauthorized current one.

The current epoch has a narrow scope. It changes through the Core provider
assignment path. Changing settings inside the same adapter—such as VRF callback
gas, key hash, subscription, confirmations, word count, or arRNG cost—does not
increment the Core epoch. The review should not claim that every provider
configuration change creates a new authorization era.

## Each request has an explicit state

The implemented lifecycle has five states:

1. `None` — no request record exists;
2. `Pending` — the request is recorded and may be fulfilled;
3. `Fulfilled` — provider output was accepted, a seed was derived, and the Core
   write succeeded;
4. `Stale` — an authorized admin marked a pending request stale;
5. `FailedPostProcessing` — output was accepted and the seed derived, but
   writing the seed to Core failed.

The request record stores:

- collection and token;
- provider and provider request ID;
- Core randomizer epoch;
- request and fulfillment times;
- derived seed;
- `rawOutputHash`;
- failure hash;
- post-processing retry count.

See
[`RandomnessRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L13-L36).

Typed state matters because "not finalized" can mean several different things.
A request that has never existed, one still waiting on a provider, one whose
accepted seed failed during Core storage, and one deliberately abandoned should
not all look like zero.

## Stream commits to raw output without storing every word

The lifecycle does not store the provider's raw word array. It stores:

`keccak256(abi.encode(randomWords))`

See
[`_hashRawRandomWords`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L480-L502).

The hash lets a reviewer compare independently obtained provider output with
the onchain commitment. It avoids permanently storing the full array while
retaining a precise integrity check.

That tradeoff separates integrity from availability. The hash proves that
retrieved words match the commitment. It does not preserve those words or make
them retrievable. Provider and release operations must retain the raw evidence
if later verification matters.

## Seed derivation binds the output to one context

The final seed is derived as:

`keccak256(abi.encode(typehash, provider, requestId, collectionId, tokenId, randomizerEpoch, rawOutputHash))`

See
[`_deriveRandomnessSeed`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L484-L502).

This binds the accepted provider output to:

- one provider;
- one provider request;
- one collection;
- one token;
- one Core provider epoch.

Without those fields, the same provider output could be ambiguous across
requests or works. The exact domain string, ABI encoding, request-ID uniqueness,
and callback authentication are therefore part of the artwork's provenance and
should be reviewed byte for byte.

## Fulfillment checks more than the callback sender

A callback is accepted only for a known `Pending` request. The lifecycle checks
the token's collection, the recorded provider, and the live Core provider and
epoch before deriving a seed.

Those checks prevent:

- a provider from fulfilling an unknown request;
- a request from being applied to the wrong token;
- a callback from an obsolete provider era;
- a terminal request from being fulfilled twice;
- a provider output from being accepted after relevant collection assignment
  changed.

Calling the right callback function is not sufficient. The request context must
still match.

## A failed Core write must not become a reroll

The lifecycle marks the request fulfilled before attempting the Core write. If
that write fails, the request becomes `FailedPostProcessing`.

An authorized admin can retry the Core write at most three times. Every retry
uses the already accepted `derivedSeed` and `rawOutputHash`. It does not call
the provider, request new words, or derive a different seed. See
[`_prepareRandomnessPostProcessingRetry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L360-L405),
the
[`VRF retry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerVRF.sol#L116-L135),
and the
[`arRNG retry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerRNG.sol#L115-L134).

This distinction is central. Retrying delivery of an accepted seed is a
reliability action. Requesting fresh randomness after seeing an outcome is a
reroll and can become a selection mechanism.

The repository tests successful fulfillment, empty-word rejection, wrong
provider and epoch handling, failed Core writes, same-seed retries, retry
success, repeated failure, the three-attempt limit, unauthorized retry, burned
tokens, and stateful lifecycle invariants. Focused evidence is in
[`StreamRandomizerRetry.t.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/test/StreamRandomizerRetry.t.sol).

Those tests establish local behavior. They do not prove that external provider
infrastructure will operate correctly on the intended network.

## The current stale state is immediate and terminal

Both provider contracts expose an admin-authorized `markStaleRequest`. The call
contains no elapsed-time or block-delay check. An authorized caller can mark a
newly pending request stale immediately. See
[`RandomizerVRF.markStaleRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerVRF.sol#L109-L114),
[`RandomizerRNG.markStaleRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerRNG.sol#L108-L113),
and
[`_markRandomnessRequestStale`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L454-L472).

`Stale` is terminal for that request. A late callback fails because the request
is no longer pending. The token-to-request binding remains, and
[`_recordRandomnessRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L178-L217)
rejects a second request for that token.

Marking a request stale decrements the provider's pending count. That can remove
the collection-level obstacle to assigning another provider, but it does not
clear the affected token's binding or make that token eligible for a new
request.

An alternative policy could require an objective waiting period and define one
tightly bounded recovery transition. That policy is proposed, not implemented.
It would need to specify:

- who may act;
- the minimum delay and how it is measured;
- whether recovery reuses or replaces the provider;
- how selective rerolls are prevented;
- which events preserve the full lineage.

The current design decision is therefore consequential: strong admin discretion
can place a token into an immediate terminal state with no recovery.

## Provider migration is prospective, not retroactive recovery

Provider replacement applies to new requests. A fulfilled seed cannot be
rewritten because Core accepts a token hash only once. Pending requests block
replacement until they are fulfilled, fail during post-processing, or are
marked stale and no pending requests remain.

`FailedPostProcessing` is no longer counted as pending. Core can therefore
replace the provider while an accepted seed still needs a same-seed retry. After
replacement, the retry preparation rejects the old provider or epoch. The
request can be stranded.

The current source has no separate guard or recovery transition for that
ordering. Provider migration should not be described as a recovery mechanism
for stale or failed tokens.

This is complexity that needs reconciliation, not celebration. The lifecycle
should have one unambiguous answer for every ordering between provider
replacement and unresolved accepted work.

## Burn does not erase randomness evidence

A token can be burned while randomness is pending. The lifecycle record
remains. A later provider callback can preserve post-burn audit evidence without
recreating the token or emitting a live-token metadata update.

This keeps the historical question answerable: did the provider eventually
return an output for the request associated with the burned token?

Burn, callback, retry, provider accounting, and metadata behavior still need to
be reviewed together. A module that treats "burned" as "never existed" can lose
request or liability state.

## Provider funding is part of correctness

The VRF path depends on a funded external subscription. The arRNG path reserves
native value for payable requests. Provider obligations must remain separate
from:

- sale proceeds;
- auction bids and refunds;
- recipient credits;
- accidental or recoverable surplus.

Operational evidence must identify the real coordinator or controller,
configuration, funded accounts, callback permissions, request health, failure
alerts, and replenishment process.

`RandomizerNXT.sol` remains in the source tree but is not approved by the
reviewed release policy as a production provider. Source presence is not
operating evidence.

## What a simpler design would externalize

A one-shot provider callback can be shorter than a persistent lifecycle. It
also leaves an operator, indexer, or private database to explain:

- which request belonged to which token;
- whether an output came from the current provider era;
- whether the provider returned nothing;
- whether a callback was accepted but Core storage failed;
- whether a retry reused the accepted seed;
- whether a stale result was abandoned legitimately;
- whether anyone received a chance to reroll;
- where the raw provider output can be found.

For generative artwork, those are not incidental operational details. They are
part of the provenance and manipulation-resistance story.

The right simplification is a smaller, complete state machine—not an absent one.

## What can fail

- Mutable provider settings change without a new Core epoch.
- An authorized admin marks a healthy request stale immediately.
- Terminal stale state leaves a token permanently unresolved.
- Provider replacement strands a `FailedPostProcessing` request.
- A callback is accepted for the wrong request, token, collection, provider, or
  epoch.
- A failed Core write exhausts all same-seed retries.
- A late result overwrites or attempts to reopen a terminal state.
- Raw provider words cannot be retrieved to verify `rawOutputHash`.
- A subscription, reserve, coordinator, controller, or operational account
  fails.
- Burn leaves request or reserve accounting inconsistent.

## Questions for reviewers

1. Which provider properties and configuration changes must create a new Core
   epoch?
2. Should stale marking require a minimum elapsed time, and how should that time
   be measured?
3. Should a stale token have exactly one recovery route, or is permanent
   unresolved state intentional?
4. Can provider replacement occur while any accepted seed still needs
   post-processing?
5. Is three the right maximum for deterministic same-seed Core-write retries?
6. Where must raw provider output remain available so its hash can be checked?
7. Which provider funding, callback, monitoring, and failure-drill evidence must
   block production use?
8. Does every supported provider give artists and collectors an equally clear
   provenance record even though its trust model differs?
