# Randomness

Stream treats randomness as a lifecycle, not as a single call that returns a
number. A token can need randomness for its artwork, a provider can be delayed
or fail, and the protocol still needs an auditable route to one final seed.

The shared lifecycle is in
[`StreamRandomizerLifecycle.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol).
The two production-capable provider implementations in this review are
[`RandomizerVRF.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerVRF.sol)
and
[`RandomizerRNG.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerRNG.sol).

**VRF** means verifiable random function: the Chainlink coordinator returns
random words with cryptographic proof through its configured subscription.
**RNG** means random-number generator; in the second implementation, the
external arRNG controller receives a payable request and later supplies the
numbers through its authorized callback.

| Question | Chainlink VRF implementation | arRNG implementation |
| --- | --- | --- |
| Who receives the request? | The configured Chainlink VRF coordinator | The configured arRNG controller |
| How is it funded? | A configured Chainlink subscription ID | The randomizer sends the configured `ethRequired` amount with each request |
| Who may fulfill? | The coordinator enforced by `VRFConsumerBaseV2` | The controller enforced by `ArrngConsumer` |
| Mutable operating settings | Key hash, subscription, callback gas, confirmation count, and word count | Per-request ETH cost, plus the controller address fixed at construction |
| What Stream pins | Provider address and Core randomizer epoch for each request | Provider address and Core randomizer epoch for each request |
| What Stream does not prove | That the subscription remains funded or its mutable settings are correct | That the controller remains available, honestly operated, or correctly priced |

These are materially different trust and payment paths. The shared lifecycle
normalizes what Stream records after a request; it does not make the two
external providers equivalent.

## Choosing a provider

### IMPLEMENTED

A collection has one randomizer contract address. Calling Core's
`addRandomizer` assignment path records the new address and increments the
collection's randomizer epoch. If the old provider reports any pending requests
for that collection, replacement reverts. See
[`StreamCore.addRandomizer`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L411-L443).

That epoch has a narrow meaning. It changes through the Core provider-assignment
path. Changing operational settings inside the same VRF or RNG provider—such as
the VRF callback gas limit, key hash, subscription, confirmation count, or RNG
cost—does not increment the Core epoch. The reviewed code therefore does not
support the broader claim that every provider-configuration change creates a
new epoch.

Each request records the provider address and current Core epoch. Fulfillment
checks that the collection still points to that provider and epoch before
accepting the result.

## Exact request states and stored evidence

### IMPLEMENTED

The lifecycle has five states:

1. `None` — no request record;
2. `Pending` — the provider request has been recorded and may be fulfilled;
3. `Fulfilled` — provider output was accepted, a seed was derived, and the
   Core write succeeded;
4. `Stale` — an authorized admin marked a pending request stale;
5. `FailedPostProcessing` — provider output was accepted and the seed was
   derived, but writing that seed to Core failed.

The request record stores the collection, token, provider, provider request ID,
epoch, request and fulfillment times, derived seed, `rawOutputHash`, failure
hash, and post-processing retry count. It does **not** store the provider's raw
word array. The lifecycle hashes that array with
`keccak256(abi.encode(randomWords))` and stores only the resulting hash. See
[`RandomnessRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L13-L36)
and
[`_hashRawRandomWords`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L480-L502).

The hash lets a reviewer compare independently obtained raw words with the
onchain commitment. It is not a copy of those words and does not by itself make
them retrievable.

## Seed derivation

### IMPLEMENTED

The final seed is:

`keccak256(abi.encode(typehash, provider, requestId, collectionId, tokenId, randomizerEpoch, rawOutputHash))`

This binds the accepted output to one provider, request, collection, token, and
Core provider epoch. Exact field order and encoding are visible in
[`_deriveRandomnessSeed`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L484-L502).

### REVIEW CHECK

Reviewers should verify the domain string, exact ABI encoding, provider callback
authentication, request-ID uniqueness, and the assumptions under which the raw
provider words can later be recovered and checked against `rawOutputHash`.

## Fulfillment and deterministic post-processing retry

### IMPLEMENTED

A provider callback is accepted only for a known `Pending` request. The
lifecycle checks the token's collection, the recorded provider, and the live
Core provider address and epoch before deriving a seed. It then marks the
request fulfilled before trying to write the seed to Core.

If the Core write fails, the request becomes `FailedPostProcessing`. An
authorized admin can retry that Core write at most three times. Every retry
uses the already accepted `derivedSeed` and `rawOutputHash`; it does not call
the randomness provider, request new words, or derive a different seed. The
limit and same-seed behavior are in
[`StreamRandomizerLifecycle`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L7-L11)
and
[`_prepareRandomnessPostProcessingRetry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L360-L405).
The provider implementations perform only the deterministic Core
`setTokenHash` call during retry:
[`VRF retry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerVRF.sol#L116-L135)
and
[`RNG retry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerRNG.sol#L115-L134).

### TESTED

The repository tests successful fulfillment, empty-word rejection, wrong
provider and epoch handling, failed Core writes, same-seed retries, retry
success, repeated retry failure, the three-attempt limit, unauthorized retry,
burned tokens, and stateful lifecycle invariants. The focused retry evidence is
in
[`StreamRandomizerRetry.t.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/test/StreamRandomizerRetry.t.sol).
These are local tests, not proof that the external provider infrastructure will
operate correctly on the intended network.

## Stale requests are terminal in the current code

### KNOWN LIMITATION

Both provider contracts expose `markStaleRequest` to their configured function
admin or a global admin. The call contains no elapsed-time or block-delay check.
An authorized caller can mark a newly pending request `Stale` immediately. See
[`RandomizerVRF.markStaleRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerVRF.sol#L109-L114),
[`RandomizerRNG.markStaleRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/RandomizerRNG.sol#L108-L113),
and
[`_markRandomnessRequestStale`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L454-L472).

`Stale` is terminal for that request in the reviewed implementation. A late
provider callback fails because the request is no longer `Pending`. The
token-to-request binding is deliberately retained after fulfillment or stale
marking, and `_recordRandomnessRequest` rejects a second request for that token.
There is no implemented stale-request redraw or migration path. See
[`_recordRandomnessRequest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRandomizerLifecycle.sol#L178-L217).

Marking a request stale decrements the provider's pending counter. That can
remove Core's pending-request obstacle to assigning a different provider, but
it does not clear the stale token's binding or make that token eligible for a
new request.

### PROPOSED

A different policy could require an objective waiting period before stale
marking and define one tightly bounded recovery action for the affected token.
That policy is not implemented. It would need to specify who may act, the
minimum delay, whether recovery reuses or replaces the provider, how reroll
selection is prevented, and what events preserve the full history.

### OPEN FOR FEEDBACK

The community should decide whether immediate admin stale marking is acceptable
when `Stale` permanently prevents that token from receiving another randomness
request. If not, reviewers should propose an exact delay and one-way recovery
state machine rather than assume the present code already has one.

## Provider migration

Provider replacement is prospective for new requests. A fulfilled seed cannot
be rewritten because Core accepts a token hash only once. A pending request
blocks provider replacement until it is fulfilled, fails post-processing, or
is marked stale and no pending requests remain.

`FailedPostProcessing` is no longer counted as pending. Core can therefore
replace the provider while such a request still needs a same-seed retry. After
replacement, `_prepareRandomnessPostProcessingRetry` rejects the old provider
or epoch, so that request cannot complete through the implemented retry path.
The reviewed code does not add a separate guard or recovery route for that
ordering.

Provider migration is therefore not an implemented stale-token recovery
mechanism. Reviewers should consider the provider-assignment rule and the
terminal token binding together.

## Token burn

A token can be burned while randomness work is outstanding. The reviewed code
retains the lifecycle record and can record a fulfilled seed as post-burn audit
evidence without recreating the token or emitting a live-token metadata update.
Burn, callback, post-processing retry, and provider accounting still need to be
tested as one composition.

## Provider reserves and value

Some provider integrations require native value or a funded external
subscription. Provider funds and obligations must remain separate from sale
proceeds, auction refunds, revenue balances, and accidental surplus. Operational
evidence must cover the real coordinator or controller, funded accounts,
callback permissions, failure alerts, and replenishment.

## NXT provider status

### KNOWN LIMITATION

`RandomizerNXT.sol` remains in the source tree, but the reviewed release policy
does not approve it as a production provider. Source presence is not deployment
or operating evidence.

### EVIDENCE PENDING

Local mocks and tests do not prove that a live VRF subscription, RNG
controller, callback, payment, stale policy, or monitoring path works on the
intended network. Each provider needs candidate-bound, end-to-end evidence
before deployment.

## What we think

Randomness policy should be boring to operate and difficult to manipulate. The
current same-seed post-processing retry is appropriately different from a
provider redraw. The immediate, terminal stale path needs an explicit community
decision because it combines strong admin discretion with no recovery for the
affected token.

## What can fail

- a provider's internal configuration changes without a new Core epoch;
- an authorized admin marks a healthy request stale immediately;
- the terminal stale binding leaves a token permanently unresolved;
- provider replacement strands a `FailedPostProcessing` request before retry;
- a callback is replayed or accepted for the wrong request, token, or epoch;
- a failed Core write exhausts all three same-seed retries;
- a late result attempts to overwrite a terminal state;
- an operational account, coordinator, or subscription runs out of funds;
- raw provider words cannot later be obtained to verify `rawOutputHash`;
- a burned token leaves a request or liability in an inconsistent state.

## Questions for reviewers

1. Should stale marking require a minimum elapsed time, and how should it be
   measured?
2. Should a stale token have exactly one recovery path, or is terminal failure
   intentional?
3. Is the stored raw-output hash sufficient, and where must the raw words remain
   available?
4. Which operational provider changes should require a new Core epoch?
5. Is three the right maximum for deterministic same-seed Core-write retries?
6. What non-local evidence should block a provider from production use?
