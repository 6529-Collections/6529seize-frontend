# Randomness

Stream treats randomness as a lifecycle, not as a single call that returns a
number. A token can need randomness for its artwork, a provider can be delayed
or fail, and the protocol still needs an auditable route to a final seed.

The main orchestration is in
[`StreamRandomizerLifecycle.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamRandomizerLifecycle.sol).
Provider implementations include
[`RandomizerVRF.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/RandomizerVRF.sol),
[`RandomizerRNG.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/RandomizerRNG.sol),
and
[`RandomizerNXT.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/RandomizerNXT.sol).

## Choosing a provider

### IMPLEMENTED

A collection is assigned a randomness provider. The assignment is part of the
collection's configuration rather than a choice made by the collector at mint
time. The lifecycle records enough context to bind a request to the collection,
token, provider, and provider configuration that were active for that request.

Provider epochs matter. If a provider's operational configuration changes,
requests made before and after the change must not become indistinguishable.
Recording the epoch lets a reviewer reconstruct which provider configuration
was expected to answer.

The provider boundary is replaceable, but replacement must not rewrite an
already fulfilled token's seed or silently reinterpret an outstanding request.

## Request lifecycle

### IMPLEMENTED

The lifecycle distinguishes at least these ideas:

1. randomness has not been requested;
2. a request is pending with a particular provider;
3. the provider has produced raw randomness;
4. protocol post-processing has completed and the final seed is stored;
5. a request has failed or become stale and is eligible for a bounded recovery
   action.

Those states should be visible independently. A provider callback is not the
same thing as a finished artwork seed if the protocol still has required
post-processing.

The lifecycle stores the provider's raw result separately from the derived
seed. That separation helps an auditor answer two different questions:

- did the provider return the value it was expected to return?
- did Stream transform that value into the token seed exactly as specified?

## What is bound into the seed

Randomness should not be portable between unrelated tokens. The derivation
binds protocol context such as the token or collection identity to the provider
result. Otherwise a valid result for one request might be replayed as the
result for another.

### REVIEW CHECK

Reviewers should verify the exact byte encoding, field order, domain separation,
and collision assumptions in the implementation. A sentence saying that values
are “hashed together” is not sufficient. The generated Technical Reference
provides the exact functions and source ranges.

## Provider callbacks

Provider callbacks are privileged entry points because accepting a callback can
fix a token's seed permanently.

The contract needs to establish all of the following:

- the caller is the expected provider contract;
- the request identifier exists;
- the callback belongs to the same token and provider epoch;
- the request is still pending;
- the callback has not already been consumed;
- the result is valid for that provider;
- a late callback cannot overwrite a recovered or terminal state.

Provider contracts may depend on an oracle, coordinator, subscription, funded
account, relayer, or offchain service. Stream can validate the onchain caller
and request state. It cannot make those external systems available.

## Failure and retry

### IMPLEMENTED

The lifecycle includes recovery for a request that does not complete normally.
Recovery is deliberately bounded. Unlimited retries would let an authorized
party keep drawing values and select a favorable one.

A retry must preserve the history of the prior request. It should not make a
failed request look as if it never existed. Events should show the old request,
the reason or condition that made recovery available, the new provider request,
and the terminal result.

### OPEN FOR FEEDBACK

The waiting period before a request is considered stale is a policy decision.
Too short a period can discard an honest delayed result. Too long a period can
leave artwork unresolved. The right value may differ by provider, but extra
configuration also creates more operational risk.

## Provider migration

A collection may need a new provider because the current provider is
deprecated, unavailable, or unsuitable. Migration must distinguish future
tokens from outstanding requests and fulfilled tokens.

The safest default is:

- a fulfilled seed is immutable;
- a pending request keeps its recorded provider unless the explicit recovery
  rules allow migration;
- a new provider applies prospectively;
- the change emits enough information to reconstruct the boundary.

Migration is not an administrative shortcut for rerolling an unwanted artwork.

## Token burn

A token can be burned while external randomness work is outstanding. Burn,
callback, recovery, accounting, and provider reserve behavior must compose
cleanly. A later callback for a burned token must not resurrect ownership,
create a second mint, or leave unexplained liabilities.

Whether the final randomness record remains queryable after burn is separate
from whether the ERC-721 exists. Historical evidence is usually valuable even
when the token no longer exists.

## Provider reserves and value

Some provider integrations can require native value or funded reserves.
Provider funds must be accounted for separately from:

- primary-sale proceeds;
- auction bids and refunds;
- revenue withdrawal balances;
- accidental surplus.

An emergency surplus withdrawal cannot safely use the contract's raw balance.
It must exclude every provider and user liability.

## NXT provider status

### KNOWN LIMITATION

The reviewed repository explicitly prevents the NXT provider from being
configured for production. Its presence in the source tree is not evidence that
it is approved or operational for a live deployment.

### EVIDENCE PENDING

Local mocks and unit tests do not prove that a live VRF, RNG, subscription,
coordinator, callback, payment, timeout, or recovery path works on the intended
network. The current candidate lacks complete non-local provider evidence.

Before deployment, each production provider needs a recorded end-to-end
exercise with the actual contracts, configuration, funded accounts, callback
permissions, failure handling, and monitoring.

## What we think

Randomness policy should be boring to operate and difficult to manipulate. A
smaller provider set with strong evidence is preferable to several nominal
choices whose recovery and funding assumptions have not been exercised.

The artist and collector should be able to tell when the seed became fixed,
which provider supplied it, and which recovery rule—if any—was used.

## What can fail

- the provider or epoch is incompletely bound to the request;
- a callback is replayed or accepted from the wrong caller;
- recovery permits repeated draws and selection;
- a late result overwrites a terminal seed;
- migration changes an already pending or fulfilled token;
- an operational account or subscription runs out of funds;
- a burned token leaves a live request or liability in an inconsistent state;
- raw randomness and the final derived seed cannot be independently checked.

## Questions for reviewers

1. Is the seed derivation sufficiently domain-separated and reproducible?
2. Who may declare or act on a stale request?
3. How many recovery attempts should ever be possible?
4. Should a provider migration affect pending requests, or only new ones?
5. What evidence should be mandatory before a provider is allowed in a
   production collection?
6. Which provider and lifecycle facts should appear directly in collector UI?
