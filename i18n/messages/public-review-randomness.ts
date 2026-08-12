export const PUBLIC_REVIEW_RANDOMNESS_MESSAGES = {
  "publicReview.pages.randomness.currentSummary":
    "How Stream asks for outside randomness, records one result, retries that same result, and handles provider failures.",
  "publicReview.pages.randomness.currentEditorial": `# Randomness

## Randomness in one minute

Some generative art needs an unpredictable value to create the final work. Stream asks an outside randomness provider for that value. It turns the answer into a seed—a fixed value the artwork code can use—and keeps a record that ties the answer to one provider request, one collection, and one token.

The main fairness rule is simple: a retry must not become a redraw. If Stream accepts a provider result but fails to save it in the Core, Stream's shared token contract, an authorized admin can retry the save. The retry uses the same accepted seed. It does not ask the provider for another result.

### What is in the reviewed code

The pinned contracts:

- record each request and its state;
- check the request, provider, collection, and provider era before accepting an answer;
- store a hash of the provider's raw answer and derive one token seed from it;
- allow up to three attempts to save the same accepted seed after a Core-write failure; and
- keep randomness evidence when a token is burned.

### What the accepted design says

[\`ADR 0005: Randomness\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0005-randomness.md) is accepted. It calls for provider-backed randomness, a clear request lifecycle, strict callback checks, and no silent redraw after a provider has accepted a request.

An accepted ADR records the target design. It does not prove that every part is built, tested live, audited, or deployed.

### What is still open

The current code still has important risks:

- an authorized admin can mark a new request stale immediately, with no waiting period;
- a stale token cannot make another request, so it can remain unresolved forever;
- changing providers can strand an accepted seed that still needs a Core-write retry; and
- live provider funding, callbacks, permissions, and monitoring still need real-world proof.

## How one request moves through Stream

1. Minting asks the collection's current provider for randomness.
2. Stream records the provider request ID, collection, token, and current provider era. The request becomes \`Pending\`.
3. The provider returns one or more random words. Stream checks that the request is known, still pending, and belongs to the expected collection, provider, and era.
4. Stream hashes the raw words and derives one seed tied to that exact context.
5. The provider adapter asks the Core to save the seed as the token hash. A successful write makes the result permanent.

**Why this matters:** A collector should be able to trace where the artwork's random input came from and see whether any later action created another chance to draw.

### Technical details

The shared lifecycle records a request in [\`_recordRandomnessRequest\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L178-L221), checks an answer in [\`_fulfillRandomnessRequest\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L224-L282), and lets the Core write a token hash only once in [\`StreamCore.setTokenHash\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L844-L883).

## Each provider has its own trust model

The reviewed code has two provider adapters. An adapter is a contract that connects Stream to an outside provider:

- [\`RandomizerVRF.sol\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerVRF.sol) asks Chainlink VRF for randomness. It depends on a coordinator, funded subscription, key hash, callback gas limit, confirmation count, and word count.
- [\`RandomizerRNG.sol\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerRNG.sol) pays an external arRNG controller and waits for its authorized callback. It depends on that controller and a configurable request cost.

Both use the same [shared request lifecycle](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol). That makes their records consistent. It does not make the outside services equally trustworthy or reliable.

\`RandomizerNXT.sol\` is still in the source tree, but ADR 0005 excludes its block-based approach from production use. It is not part of the approved production provider set reviewed here.

**Why this matters:** Contract checks cannot prove that a live subscription is funded, a controller stays available, or operators will notice a failed callback.

## Provider assignment creates an authorization era

Each collection has one current provider adapter. An authorized admin can replace it through [\`StreamCore.addRandomizer\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L411-L443).

Every replacement increases the collection's provider era, called the \`randomizerEpoch\`. New requests record the provider and era. A callback is rejected if they no longer match the collection's current settings.

The Core blocks a provider change while the old provider reports pending requests for that collection. This prevents an ordinary change from silently invalidating work that is still waiting for an answer.

### Current code risk

Changing settings inside the same adapter does not start a new Core era. This includes its Core target and the VRF or arRNG settings.

Each request stores the adapter and era, but not the Core address that was current when the request began. An authorized adapter admin can change that Core target. The existing request may then be checked against, or written to, a different Core.

The review treats request-time Core binding, or an equivalent rule that cannot change while work is unresolved, as required before release.

## Each request has an explicit state

The current lifecycle has five states:

1. \`None\` — no request exists.
2. \`Pending\` — the provider has been asked and no answer has been accepted.
3. \`Fulfilled\` — the answer was accepted, the seed was derived, and the Core write succeeded.
4. \`Stale\` — an authorized admin abandoned a pending request.
5. \`FailedPostProcessing\` — the answer and seed were accepted, but saving the seed in the Core failed.

The record also keeps the collection, token, provider, provider request ID, era, request and fulfillment times, derived seed, raw-output hash, failure hash, and retry count.

**Why this matters:** Waiting for a provider is different from accepting an answer and failing to save it. The states keep those failures visible.

### Technical details

See the [request states and stored fields](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L13-L36) and the [request views](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L134-L175).

## A compact hash commits to the raw output

The contract stores this hash of the provider's raw words:

\`keccak256(abi.encode(randomWords))\`

The full word array is not kept in contract storage. The hash lets someone compare a separately saved provider answer with the onchain record. If the words match, they produce the same hash.

A hash proves integrity. It does not keep the raw words available. Provider and release operations must preserve those words so people can check them later.

### Technical details

See [\`_hashRawRandomWords\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L480-L482). Both reviewed adapters also define a provider-specific \`RequestFulfilled\` event containing the raw words.

## Seed derivation binds the output to one context

Stream derives the token seed from:

- a fixed Stream randomness label;
- the provider adapter;
- the provider request ID;
- the collection ID;
- the token ID;
- the provider era; and
- the hash of the raw provider words.

This stops the same provider output from being treated as if it belonged to another request or artwork.

### Technical details

The exact formula is:

\`keccak256(abi.encode(typehash, provider, requestId, collectionId, tokenId, randomizerEpoch, rawOutputHash))\`

Review the exact encoding in [\`_deriveRandomnessSeed\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L484-L502).

## Fulfillment checks the full request identity

The shared lifecycle accepts an answer only when:

- the request exists and is still \`Pending\`;
- the request belongs to this provider adapter;
- the token still maps to the recorded collection; and
- the collection still points to the recorded provider and era.

It then derives the seed. The Core accepts a nonzero token hash only from the collection's current provider, and only while that token hash is still empty.

These checks protect one known request while the adapter's Core target stays unchanged. They do not solve the mutable Core-target risk described above.

## Failed Core writes preserve the accepted seed

A provider answer can be valid even when the later Core write fails. The request then becomes \`FailedPostProcessing\`.

An authorized admin can retry the Core write up to three times. Every retry uses the stored seed and raw-output hash. It does not call the provider or derive a new seed.

**Why this matters:** Retrying the same accepted result is a reliability action. Asking for fresh randomness after seeing a result is a redraw and can be used to select a preferred outcome.

The retained tests cover successful answers, empty answers, wrong provider or era, failed writes, same-seed retries, the retry limit, unauthorized retries, burns, and lifecycle invariants. Those tests show local behavior. They do not prove live provider operation.

### Technical details

See the [shared retry checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L360-L451), [VRF retry](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerVRF.sol#L116-L135), [arRNG retry](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerRNG.sol#L115-L134), and [focused retry tests](https://github.com/{sourceRepository}/blob/{sourceCommit}/test/StreamRandomizerRetry.t.sol).

## The current stale state is immediate and terminal

Both reviewed provider adapters let an authorized admin mark a \`Pending\` request stale. The code has no minimum wait. The admin can do this immediately after the request is recorded.

\`Stale\` is final for that request. A late provider answer is rejected. The token stays linked to the old request, so the code also rejects a second request for that token.

Marking the request stale lowers the provider's pending count. That can allow the collection to change providers, but it does not give the affected token a new result.

### Accepted design and open recovery idea

ADR 0005 favors a stuck but honest state over a redraw that someone could use after seeing an outcome. It treats \`Stale\` as terminal unless a separate governance recovery decision defines a safe exception.

This review raises one possible rule: require an objective wait and allow one tightly limited recovery step. That is an open review idea. It is not implemented in the pinned contracts.

Reviewers still need to decide who may act, how long the wait is, whether the provider changes, how redraws are prevented, and which events preserve the full history.

### Technical details

See [VRF stale marking](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerVRF.sol#L109-L114), [arRNG stale marking](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerRNG.sol#L108-L113), and the [shared stale transition](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L454-L472).

## Provider migration governs future requests

A provider change controls new requests. It does not rewrite a seed that the Core has already stored.

Pending requests normally block a provider change. Stale requests do not, because stale marking removes them from the pending count.

There is another gap. The lifecycle also removes a request from the pending count before trying the Core write. If that write fails, the request becomes \`FailedPostProcessing\`. When no other requests are pending, the Core can change providers even though the accepted seed still needs a retry. The retry then fails because its old provider or era is no longer current.

**Current result:** An accepted seed can be stranded before it reaches the Core.

Reviewers need one clear rule for provider changes while any accepted work is unresolved.

## Burn preserves randomness evidence

A token can be burned while its randomness request is pending. Burning removes ownership, but it does not erase the request record.

If a valid provider answer arrives later, the current code can store it as post-burn audit evidence. It does not restore ownership, make the token live again, or send a live-token metadata update.

**Why this matters:** People can still answer whether the provider eventually returned an output for that burned token.

Burn, callback, retry, provider accounting, and metadata behavior still need to be tested together. Other modules must not treat “burned” as “never existed.”

### Technical details

See the [burned-token randomness event](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L124-L132), its [confirmation path](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L304-L321), and the Core's [post-burn hash record](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L844-L883).

## Provider funding is part of correctness

The VRF path needs a funded external subscription. The arRNG path needs native ETH for paid requests. A correct contract cannot get an answer when its outside provider account or controller is unavailable.

Provider money must stay separate from sale proceeds, bids, refunds, recipient balances, and true surplus. The current arRNG adapter reports its full balance as reserved and reports zero emergency-withdrawable surplus.

[ADR 0005](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0005-randomness.md) says provider fees, refunds, and balances must follow [ADR 0003's payment rules](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0003-payment-accounting.md) and [ADR 0004's admin controls](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0004-admin-governance.md).

Before production use, evidence must identify the real coordinator or controller, live settings, funded accounts, callback permissions, alerts, and refill process.

\`RandomizerNXT.sol\` needs separate approval and operating evidence before any production use because it sits outside the accepted production provider set.

## What the randomness record must explain

Artists, collectors, and reviewers should be able to answer:

- Which request belonged to this token?
- Which provider and provider era produced the answer?
- Did the provider return no words?
- Was the answer accepted but the Core write failed?
- Did every retry reuse the accepted seed?
- Who marked a request stale, and was that allowed?
- Did any action create another chance to draw?
- Where can the raw provider words be found and checked?

These facts are part of the artwork's provenance. They help show that a result was not silently replaced with a preferred one.

## What can fail

### Current code risks

- Important adapter-setting changes stay inside the same Core era.
- Changing an adapter's Core target can redirect an unresolved request.
- An authorized admin can mark a healthy request stale immediately.
- A stale token can remain unresolved forever.
- A provider change can strand a \`FailedPostProcessing\` request.
- All three same-seed Core-write retries can fail.

### Checks and live-operation risks

- A callback may target the wrong request, token, collection, provider, or era.
- A late or duplicate result may try to reopen a finished state.
- The raw provider words may be unavailable, so their stored hash cannot be checked.
- A subscription, reserve, coordinator, controller, callback permission, or monitoring account may fail.
- Burn and reserve accounting may disagree with the request state.

## Questions for reviewers

1. How should each request stay tied to the Core address that was current when it began?
2. Which provider-setting changes must start a new provider era?
3. Should stale marking require a minimum wait? How should that wait be measured?
4. Should a stale token get exactly one safe recovery route, or is permanent unresolved state intentional?
5. Can a provider change while any accepted seed still needs a Core write?
6. Is three the right maximum for same-seed Core-write retries?
7. Where must the raw provider words remain available so people can check their hash?
8. Which funding, callback, monitoring, and failure-drill evidence must block production use?
9. Do all supported providers give artists and collectors an equally clear provenance record, even when their trust models differ?`,
} as const;
