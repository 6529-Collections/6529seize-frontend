export const PUBLIC_REVIEW_RANDOMNESS_MESSAGES = {
  "publicReview.pages.randomness.currentSummary":
    "How Stream gets one random result, records it, and avoids a second draw.",
  "publicReview.pages.randomness.currentEditorial": `# Randomness

## Randomness in one minute

Some generative art needs a random value before the final work can be made. Stream asks an outside service for that value. The Stream contract that connects to the service is called a provider adapter.

The adapter turns the provider's answer into a seed. A seed is a fixed value that the artwork code can use. The adapter then asks the Core, Stream's shared token contract, to save that seed as the token hash.

The main fairness rule is simple: a retry must not become a redraw. Once Stream has accepted a provider result, no one should get a new result because they dislike the first one.

### What is in the reviewed code

The pinned code:

- supports Chainlink VRF and arRNG provider adapters;
- records each request and its state;
- checks that each answer belongs to the right request, collection, token, adapter, and provider version;
- stores a fingerprint of the provider's answer and makes one seed from it;
- allows up to three retries if the Core fails to save that same seed; and
- keeps a randomness record when a token is burned.

These are facts about the pinned source code. They are not proof that the system is deployed, funded, monitored, or working with live providers.

### What the accepted design says

[ADR 0005: Randomness](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0005-randomness.md) is accepted. It says production drops should use an outside randomness provider. It requires a clear request history. It also requires strict checks on provider answers and no silent second draw.

An accepted ADR records the agreed design. It does not prove that every part is built, audited, deployed, or tested with a live provider.

### What is still open

The pinned code still has important risks:

- an admin can mark a new request stale right away, with no wait;
- a stale token cannot ask for another result, so it can stay unfinished forever;
- a provider change can strand a seed that was accepted but not saved in the Core;
- an adapter's Core address or provider settings can change without a new provider version; and
- live funding, permissions, callbacks, alerts, and recovery steps still need proof.

## How one request moves through Stream

1. During minting, Stream calls the collection's provider adapter.
2. The adapter asks its outside provider for randomness. It records the returned request ID, collection, token, and provider version. The request is now **Pending**.
3. The provider sends back one or more large numbers, called random words.
4. The adapter checks that the request is known and still pending. It also checks the collection, token, adapter, and provider version.
5. The adapter makes one seed from the answer and the request details.
6. The adapter asks the Core to save the seed as the token hash. The Core accepts only a nonzero hash from the current adapter. The token hash must still be empty.

Once the Core saves the seed, the normal path cannot replace it with another one.

### Source links

The shared lifecycle [records the request](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L178-L221), [checks the provider answer](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L224-L282), and asks [StreamCore.setTokenHash](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L844-L883) to save the seed.

## What Stream records

Each request has one of five states:

1. **None** — there is no request.
2. **Pending** — the provider has been asked, but no answer has been accepted.
3. **Fulfilled** — the answer was accepted and the Core saved the seed.
4. **Stale** — an admin ended a pending request.
5. **FailedPostProcessing** — the answer and seed were accepted, but the Core did not save the seed.

The record keeps the request ID, collection, token, adapter, and provider version. It also keeps the request and fulfillment times, seed, answer fingerprint, failure fingerprint, and retry count.

This matters because “waiting for the provider” is not the same as “the provider answered, but the save failed.” The state shows which problem happened.

See the [request states and stored fields](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L13-L36) and the [request views](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L134-L175).

## The answer fingerprint

The contract does not store all the random words. It stores this hash:

    keccak256(abi.encode(randomWords))

A hash is a short fingerprint. If someone keeps the original words, anyone can hash them again and check that they match the stored fingerprint.

After a successful Core save, the adapter puts the original words in a **RequestFulfilled** event. A failed save does not emit that event. Operations must keep the original answer elsewhere. Without it, the fingerprint cannot show which words the provider returned.

See [_hashRawRandomWords](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L480-L482).

## How the seed is tied to one request

The seed includes:

- the provider adapter;
- the provider request ID;
- the collection ID;
- the token ID;
- the provider version; and
- the fingerprint of the provider's answer.

This stops one provider answer from being reused as if it belonged to another request or token.

See [_deriveRandomnessSeed](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L484-L502) for the exact formula.

## Failed Core writes preserve the accepted seed

A provider answer can pass every check and still fail when the adapter asks the Core to save the seed. The request then becomes **FailedPostProcessing**.

An authorized admin can retry the Core save up to three times. Every retry uses the stored seed and answer fingerprint. It does not call the provider again. It does not make a new seed.

This is the key difference:

- A retry tries to save the same accepted result again.
- A redraw asks for a new random result.

The retry also checks that the token, collection, adapter, and provider version still match. If any of them changed, the retry fails.

See the [shared retry checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L360-L451), [VRF retry](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerVRF.sol#L116-L135), [arRNG retry](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerRNG.sol#L115-L134), and [focused retry tests](https://github.com/{sourceRepository}/blob/{sourceCommit}/test/StreamRandomizerRetry.t.sol).

## The current stale state is immediate and terminal

An authorized admin can mark a **Pending** request as **Stale**. The code has no minimum wait. The admin can act as soon as the request is made.

A late provider answer is rejected. The token keeps its old request link, so it cannot ask again.

### What the accepted design says

ADR 0005 prefers a stuck but honest token over a second draw after people may have seen the first result. A stale request is final unless a separate governance decision creates a safe recovery rule.

## The stale recovery question

Should an admin have to wait before marking a request stale? If recovery is allowed, the rules must say who can act and how long they must wait. The rules must also prevent a biased second draw.

A wait or one-time recovery rule is only a possible change. That is an open review idea. It is not implemented in the pinned contracts.

See [VRF stale marking](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerVRF.sol#L109-L114), [arRNG stale marking](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerRNG.sol#L108-L113), and the [shared stale change](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L454-L472).

## Provider migration governs future requests

Each collection has one current provider adapter. It also has a provider version. The code calls this the **randomizerEpoch**.

When the Core replaces the adapter, it raises this version number. New requests use the new adapter and version. An old request cannot finish after the Core moves to the new setup.

The Core normally blocks an adapter change while the old adapter has pending requests. This protects requests that are still waiting for an answer.

## Some important changes do not raise the provider version

ADR 0005 says a critical provider setting change should raise the provider version. The pinned adapters do not raise it for every setting.

An authorized admin can change the adapter's Core address. VRF settings and arRNG cost can also change without a new provider version.

A request stores the adapter and provider version. It does not store the Core address used when the request began. If an admin changes that address, unfinished work can be checked against or written to a different Core.

This needs one clear rule before release. Either bind each request to its starting Core, or block important setting changes while a request is unfinished.

## A provider change can strand an accepted seed

The lifecycle stops counting a request as pending before it asks the Core to save the seed. If the save fails, the request becomes **FailedPostProcessing**. It is no longer in the pending count.

The Core can then allow a provider change. A later retry still comes from the old adapter. It fails because the adapter or provider version no longer matches.

An accepted seed can be stranded before it reaches the Core.

Reviewers need one rule: block provider changes while an accepted seed still waits to be saved.

See [StreamCore.addRandomizer](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L411-L443) and the [retry binding checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L360-L405).

## The two provider adapters

The pinned code has two adapters that use the shared request lifecycle:

- [RandomizerVRF.sol](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerVRF.sol) uses Chainlink VRF. It needs a coordinator, a funded subscription, and correct callback settings.
- [RandomizerRNG.sol](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/RandomizerRNG.sol) pays an arRNG controller and waits for an answer. It needs native ETH and an available controller.

Both adapters use the same request states and checks. The two outside services still have different risks.

**RandomizerNXT.sol** is still in the source tree. It uses block-based randomness. ADR 0005 does not allow this method in production. The pinned contract also returns **false** from **isRandomizerContract()**. The Core therefore cannot use it as a live adapter.

## Burn preserves randomness evidence

Burning a token removes ownership. It does not erase an existing randomness request.

If a valid provider answer arrives after the burn and its adapter is still current, the code can save the seed as audit evidence. It also records a burned-token randomness event.

This does not bring the token back. It does not restore ownership or send a live-token metadata update.

See the [burned-token event](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L124-L132), its [confirmation path](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRandomizerLifecycle.sol#L304-L321), and the Core's [post-burn record](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L844-L883).

## Provider funding is part of correctness

The VRF adapter needs a funded subscription. The arRNG adapter needs native ETH. Even correct code cannot make an unfunded or unavailable provider answer.

The pinned arRNG adapter reports its whole balance as reserved. It reports zero surplus that can be taken out in an emergency.

ADR 0005 says provider fees, refunds, and balances must also follow [ADR 0003's payment rules](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0003-payment-accounting.md) and [ADR 0004's admin rules](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0004-admin-governance.md).

Before release, evidence must show the real provider accounts, settings, funding, and callback rights. It must also show the alerts, refill steps, and failure drills.

## What can fail

- Stream must reject a wrong, late, or repeated callback.
- A provider answer can pass, but the Core save can fail.
- All three retries to save the same seed can fail.
- The original random words can be lost, which makes their fingerprint hard to check.
- A provider account can run out of funds or stop answering.

The pinned tests cover many local contract cases. Those tests show local behavior. They do not prove live provider operation.

## Questions for reviewers

1. How should a request stay tied to the Core address used when it began?
2. Which setting changes must start a new provider version?
3. How long must an admin wait before marking a request stale?
4. Should a stale token stay unfinished forever, or is there a safe one-time recovery rule?
5. Can a provider change while an accepted seed still needs to be saved?
6. Is three the right maximum number of same-seed retries?
7. Where will the original random words be kept so anyone can check their fingerprint?
8. What live funding, callback, alert, and failure-drill proof must exist before release?
9. Do both supported providers give artists and collectors a clear record of how the final seed was made?`,
} as const;
