# Randomness

For generative art, a random value can help determine the work itself. At the
pinned commit, Stream's Solidity implements a randomness lifecycle designed to
preserve the full provenance of that value: which provider produced it, which
request and token it belonged to, which provider era authorized it, what
happened if delivery failed, and why a retry cannot become a reroll.

A one-shot callback is shorter. It also leaves delays, provider changes,
failures, retries, and disputed outputs to an operator or private database. The
source lifecycle instead records states that artists and collectors can inspect.

## The randomness flow at a glance

One request moves through these steps:

1. A collection is assigned one randomizer provider, and `StreamCore`—called
   Core here—the permanent token and collection identity contract, increments a
   counter—the provider epoch—that identifies this provider era.
2. The provider adapter creates a request and records the token, collection,
   provider address, provider request ID, and current epoch.
3. The external provider returns raw words through its authenticated callback.
4. Stream verifies the request context, hashes the raw words, and derives one
   seed bound to that provider, request, collection, token, and epoch.
5. It tries to write the seed to Core exactly once.
6. If that Core write fails, an authorized retry reuses the same accepted seed;
   it never asks for fresh randomness.
7. The request record remains as provenance even if the token is later burned.

## Why the lifecycle exists

Without persistent request state, another system must explain:

- which request belonged to which token;
- whether an output came from the current provider era;
- whether the provider returned nothing;
- whether a callback was accepted but Core storage failed;
- whether a retry reused the accepted seed;
- whether a result was abandoned legitimately;
- whether anyone had an opportunity to reroll;
- where the raw provider output can be found.

For generative art, these are part of the manipulation-resistance and
provenance story. The right simplification is a smaller complete state machine,
not an absent one.

## Two providers do not mean one trust model

The common state machine is in
[`StreamRandomizerLifecycle.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol).
This review covers two adapters:

- [`RandomizerVRF.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerVRF.sol)
  requests Chainlink VRF through a configured coordinator and subscription;
- [`RandomizerRNG.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerRNG.sol)
  pays a configured amount of ETH to an external arRNG controller and receives
  its authorized callback later.

The VRF adapter depends on a coordinator, subscription ID, key hash, callback
gas limit, confirmation count, and word count. The arRNG adapter depends on a
controller fixed at construction and a mutable per-request ETH cost.

The lifecycle pins the provider address and Core epoch to each request. It does
not prove that a subscription stays funded, a controller stays available and
honest, or mutable provider settings are appropriate. A common record format
does not make the providers equivalent or trustless.

## Provider assignment creates an authorization era

A collection has one configured randomizer. Core's assignment path records a
new address and increments the collection's randomizer epoch. Replacement
reverts while the old provider reports a pending request for that collection.
See
[`StreamCore.addRandomizer`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L411-L443).

Every request stores the provider and current epoch. Fulfillment checks that
the collection still points to both before accepting output. An old callback
therefore cannot be mistaken for a current result after provider migration.

The epoch has a narrow meaning. It changes when Core assigns a provider.
Changing settings inside the same adapter—VRF callback gas, key hash,
subscription, confirmations, word count, or arRNG cost—does not increment it.
The product should not imply that every provider configuration change creates a
new authorization era.

## Each request has an explicit state

The lifecycle distinguishes five states:

1. `None` — no request record exists.
2. `Pending` — the request exists and may be fulfilled.
3. `Fulfilled` — output was accepted, a seed was derived, and the Core write
   succeeded.
4. `Stale` — an authorized admin marked a pending request stale.
5. `FailedPostProcessing` — output was accepted and the seed derived, but the
   Core write failed.

The
[`RandomnessRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L13-L36)
record stores:

- collection and token;
- provider and provider request ID;
- Core randomizer epoch;
- request and fulfillment times;
- derived seed;
- `rawOutputHash`;
- failure hash;
- post-processing retry count.

"No final seed" can therefore mean no request, a pending provider, a failed
Core write, or a deliberately abandoned request. Those states must not all look
like zero.

## Fulfillment binds the output to one work

A callback is accepted only for a known `Pending` request. The lifecycle checks
the token's collection, recorded provider, live Core provider, and epoch before
deriving the seed.

The raw word array is not stored. Stream stores:

`keccak256(abi.encode(randomWords))`

See
[`_hashRawRandomWords`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L480-L502).

This commitment lets a reviewer compare independently retrieved words with the
onchain record without paying to store the full array. It proves integrity
after retrieval; it does not preserve or retrieve the words. Provider and
release operations must retain the raw evidence if later verification matters.

The final seed is:

`keccak256(abi.encode(typehash, provider, requestId, collectionId, tokenId, randomizerEpoch, rawOutputHash))`

See
[`_deriveRandomnessSeed`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L484-L502).

The exact domain string, ABI encoding, request-ID uniqueness, and callback
authentication are part of the artwork's provenance. They should be reviewed
byte for byte.

Together, these checks prevent an unknown request, wrong token, obsolete
provider era, already-terminal request, or mismatched collection assignment
from accepting output. Calling the right callback function is not enough; the
entire request context must still match.

## A failed Core write must not become a reroll

The lifecycle first accepts and derives the seed, then attempts the Core write.
If that write fails, the request becomes `FailedPostProcessing`.

An authorized admin may retry at most three times. Each attempt reuses the
stored `derivedSeed` and `rawOutputHash`; it does not call the provider, request
new words, or derive another seed. See
[`_prepareRandomnessPostProcessingRetry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L360-L405),
the
[`VRF retry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerVRF.sol#L116-L135),
and the
[`arRNG retry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerRNG.sol#L115-L134).

Retrying delivery of an accepted seed is a reliability action. Requesting new
randomness after seeing an outcome is a reroll and can become a selection
mechanism.

The repository tests successful fulfillment, empty-word rejection, wrong
provider and epoch handling, failed Core writes, same-seed retries, retry
success, repeated failure, the three-attempt limit, unauthorized retry, burned
tokens, and lifecycle invariants. Focused cases are in
[`StreamRandomizerRetry.t.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/test/StreamRandomizerRetry.t.sol).

These are local tests. They do not prove live provider behavior on the intended
network.

## The current stale state is immediate and terminal

Both adapters expose an admin-authorized `markStaleRequest` with no elapsed-time
or block-delay check. An authorized caller can mark a newly pending request
stale immediately. See
[`RandomizerVRF.markStaleRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerVRF.sol#L109-L114),
[`RandomizerRNG.markStaleRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerRNG.sol#L108-L113),
and
[`_markRandomnessRequestStale`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L454-L472).

`Stale` is terminal. A late callback fails because the request is no longer
pending. The token-to-request binding remains, and
[`_recordRandomnessRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L178-L217)
rejects a second request for the token.

Marking stale reduces the provider's pending count. That may allow Core to
assign another provider for the collection, but it does not clear the affected
token or make it eligible for a new request.

A different policy could require an objective waiting period and one tightly
bounded recovery transition. It would need to define who may act, the delay and
its clock, whether the provider is reused or replaced, how selective rerolls
are prevented, and which events preserve the full lineage. That is not the
behavior described above.

## Provider migration is prospective, not retroactive recovery

Replacement governs new requests. A fulfilled seed cannot be rewritten because
Core accepts a token hash only once. Pending requests block replacement until
they are fulfilled, marked stale, or fail during post-processing and no pending
requests remain.

`FailedPostProcessing` no longer counts as pending. Core can therefore replace
the provider while an accepted seed still needs its same-seed retry. After
replacement, retry preparation rejects the old provider or epoch, which can
strand the request.

There is no separate guard or recovery transition for that ordering. Provider
migration must not be described as recovery for stale or failed tokens. The
lifecycle needs one unambiguous answer for every ordering between replacement
and unresolved accepted work.

## Burn does not erase randomness evidence

A token may be burned while its request is pending. The lifecycle record stays.
A later callback can preserve post-burn audit evidence without recreating the
token or emitting a live-token metadata update.

That keeps one historical question answerable: did the provider eventually
return output for this burned token's request? Burn, callback, retry, provider
accounting, and metadata behavior still need composition review. Treating
"burned" as "never existed" can erase request or liability state.

## Provider funding is part of correctness

VRF depends on a funded external subscription. arRNG reserves native value for
payable requests. These obligations must stay separate from:

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

## What can still fail

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
