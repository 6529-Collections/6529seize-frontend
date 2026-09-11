# Randomness

For generative art, randomness is part of the work's provenance. A collector
should be able to determine which provider produced the input, which request it
answered, which token and collection it belonged to, how callbacks were
handled, whether anyone requested new randomness, and why the final seed is
permanent.

Stream therefore treats randomness as a lifecycle. Requests, delays, failures,
provider changes, retries, and disputed outputs all receive durable state.

## Each provider has its own trust model

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

In both cases, the request records the provider-adapter address and Core
randomizer epoch. Each adapter separately holds an admin-mutable Core target
through `updateCoreContract`; the request record omits that target address.
Operational evidence must establish subscription funding, controller
availability and integrity, and appropriate mutable parameters.

The shared lifecycle standardizes what Stream records around a request. Each
external provider retains its own trust model.

## Provider assignment creates an authorization era

A collection has one configured randomizer address. Calling Core's assignment
path records the new provider and increments the collection's randomizer epoch.
If the old provider reports a pending request for the collection, replacement
reverts. See
[`StreamCore.addRandomizer`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L411-L443).

Each request records the provider and current Core epoch. Fulfillment checks
the provider assignment and epoch against the adapter's current Core target
before accepting output.

This prevents a callback from one provider era from being mistaken for a
current result after migration. A simple provider pointer with no request-bound
epoch would leave the contract unable to distinguish an authorized old callback
from an unauthorized current one.

The current epoch has a narrow scope. It changes through the Core provider
assignment path. Settings inside the same adapter—including its Core target,
VRF callback gas, key hash, subscription, confirmations, word count, or arRNG
cost—remain within the same Core epoch. A new authorization era begins when the
Core randomizer assignment changes.

An adapter Core-target change can redirect an existing request's fulfillment
checks and final seed write to a different Core. The stored request lacks the
assignment-era Core address needed to authenticate that destination. Binding
the Core target to each request, or enforcing an equivalent immutable
assignment rule through every pending and retry state, is a release blocker.

## Each request has an explicit state

The implemented lifecycle has five states:

1. `None` — no request record exists;
2. `Pending` — the request is recorded and may be fulfilled;
3. `Fulfilled` — provider output was accepted, a seed was derived, and the Core
   write succeeded;
4. `Stale` — an authorized admin marked a pending request stale;
5. `FailedPostProcessing` — output was accepted and the seed derived; the Core
   write failed.

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

Typed state distinguishes an absent request, one waiting on a provider, one
whose accepted seed failed during Core storage, and one deliberately abandoned.

## A compact hash commits to the raw output

The lifecycle stores these commitments derived from the provider's raw word
array:

`keccak256(abi.encode(randomWords))`

See
[`_hashRawRandomWords`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L480-L502).

The hash lets a reviewer compare independently obtained provider output with
the onchain commitment. It avoids permanently storing the full array while
retaining a precise integrity check.

The hash provides integrity evidence: retrieved words can be checked against
the commitment. Provider and release operations must retain the raw evidence
for later verification.

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

Those fields bind provider output to one request and one work. The exact domain
string, ABI encoding, request-ID uniqueness, and callback authentication are
part of the artwork's provenance and should be reviewed byte for byte.

## Fulfillment checks the full request identity

A callback is accepted only for a known `Pending` request. The lifecycle checks
the token's collection, the recorded provider, and the provider assignment and
epoch reported by the adapter's current Core target before deriving a seed.
The final `setTokenHash` call also uses that current target. These checks protect
the assignment era while the adapter's Core target remains unchanged.

Together, these checks admit one known `Pending` request for the recorded token,
provider, assignment era, and callback context. Each terminal request accepts
one fulfillment.

## Failed Core writes preserve the accepted seed

The lifecycle marks the request fulfilled before attempting the Core write. If
that write fails, the request becomes `FailedPostProcessing`.

An authorized admin can retry the Core write at most three times. Every retry
uses the already accepted `derivedSeed` and `rawOutputHash`, skipping the
provider and any new derivation. See
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

Those tests establish local behavior. Live-network evidence must establish
correct operation of external provider infrastructure.

## The current stale state is immediate and terminal

Both provider contracts expose an admin-authorized `markStaleRequest`. The call
contains no elapsed-time or block-delay check. An authorized caller can mark a
newly pending request stale immediately. See
[`RandomizerVRF.markStaleRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerVRF.sol#L109-L114),
[`RandomizerRNG.markStaleRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerRNG.sol#L108-L113),
and
[`_markRandomnessRequestStale`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L454-L472).

`Stale` is terminal for that request and late callbacks are rejected. The
token-to-request binding remains, and
[`_recordRandomnessRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L178-L217)
rejects a second request for that token.

Marking a request stale decrements the provider's pending count and can allow a
new provider assignment at collection level. The affected token remains bound
to its terminal request and ineligible for a new request.

A proposed recovery policy would require an objective waiting period and one
tightly bounded recovery transition. That proposal awaits implementation.
It would need to specify:

- who may act;
- the minimum delay and how it is measured;
- whether recovery reuses or replaces the provider;
- how selective rerolls are prevented;
- which events preserve the full lineage.

The current design gives an authorized admin immediate power to place a token
into a permanent terminal state.

## Provider migration governs future requests

Provider replacement applies to new requests. A fulfilled seed is permanent
because Core accepts a token hash only once. Pending requests block
replacement until they are fulfilled, fail during post-processing, or are
marked stale and no pending requests remain.

`FailedPostProcessing` decrements the pending count. Core can therefore replace
the provider while an accepted seed still needs a same-seed retry. After
replacement, the retry preparation rejects the old provider or epoch. The
request can be stranded.

The current source applies provider migration to future requests; stale and
failed tokens keep their existing terminal state.

This complexity needs one unambiguous lifecycle answer for every ordering
between provider
replacement and unresolved accepted work.

## Burn preserves randomness evidence

A token can be burned while randomness is pending. The lifecycle record
remains. A later provider callback preserves post-burn audit evidence while the
burn and live-token metadata state stay unchanged.

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

`RandomizerNXT.sol` remains in the source tree outside the reviewed production
provider set. Production use requires separate operating evidence and policy
approval.

## What the randomness record must explain

The persistent request record lets artists, collectors, and reviewers determine:

- which request belonged to which token;
- which provider and provider era produced the output;
- whether the provider returned nothing;
- whether a callback was accepted and the Core write failed;
- whether a retry reused the accepted seed;
- whether a stale result was abandoned legitimately;
- whether any action created another chance to draw randomness;
- where the raw provider output can be found.

These facts establish provenance and manipulation resistance for generative
artwork. The state machine should contain exactly the states needed to preserve
them.

## What can fail

- Mutable provider-setting changes reuse the existing Core epoch.
- An adapter Core-target update redirects checks or delivery for an existing
  request.
- An authorized admin marks a healthy request stale immediately.
- Terminal stale state leaves a token permanently unresolved.
- Provider replacement strands a `FailedPostProcessing` request.
- A callback is accepted for the wrong request, token, collection, provider, or
  epoch.
- A failed Core write exhausts all same-seed retries.
- A late result overwrites or attempts to reopen a terminal state.
- Raw provider words are unavailable for verification of `rawOutputHash`.
- A subscription, reserve, coordinator, controller, or operational account
  fails.
- Burn leaves request or reserve accounting inconsistent.

## Questions for reviewers

1. How should each request bind its assignment-era Core target through
   fulfillment and retries?
2. Which provider properties and configuration changes must create a new Core
   epoch?
3. Should stale marking require a minimum elapsed time, and how should that time
   be measured?
4. Should a stale token have exactly one recovery route, or is permanent
   unresolved state intentional?
5. Can provider replacement occur while any accepted seed still needs
   post-processing?
6. Is three the right maximum for deterministic same-seed Core-write retries?
7. Where must raw provider output remain available so its hash can be checked?
8. Which provider funding, callback, monitoring, and failure-drill evidence must
   block production use?
9. Does every supported provider give artists and collectors an equally clear
   provenance record even though its trust model differs?
