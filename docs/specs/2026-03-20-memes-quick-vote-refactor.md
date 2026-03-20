---
title: Memes Quick Vote Refactor
version: 0.1
status: draft
created: 2026-03-20
---

# Memes Quick Vote Refactor

## Problem Statement

Quick vote currently depends on loading the full set of participatory submissions for the memes wave and then deriving quick-vote eligibility on the client. That creates a poor fit for both the footer button and the voting dialog.

For the footer button, the user only needs a small summary: how much voting power remains and how many submissions are still unrated. Today we still pay the cost of loading every page of participatory submissions before we can show that one number. As the wave grows, the button becomes coupled to repeated pagination, unnecessary network traffic, and avoidable waiting.

For the voting dialog, the current model also starts from the full dataset, then filters to unrated and still-eligible items, then reorders the queue around skipped submissions. This works, but it is heavier than necessary and pushes too much responsibility for pagination, freshness, and queue assembly into the client.

The result is a system that is more complex than the user experience requires:

- The button needs summary data but depends on full queue data.
- The queue needs only the next workable item but depends on the entire history.
- The client has no lightweight way to validate that a skipped or queued submission is still safe to show when it comes back to the front.
- Skip behavior is correct enough today, but it is built on top of a queue assembled from a full historical scan.

## Goals

- Decouple the quick-vote button from full submission pagination.
- Reduce initial network work required to open quick vote.
- Move summary ownership and item freshness checks closer to the server.
- Preserve the existing quick-vote behavior from the user perspective where it still makes sense.
- Keep skipped submissions deferred rather than lost.
- Ensure stale or deleted submissions disappear cleanly without breaking the flow.

## Non-Goals

- Redesign the quick-vote UI.
- Change the meaning of an unrated submission.
- Change the voting action itself.
- Remove skip as a concept.
- Solve every wave voting use case beyond memes quick vote.

## Current Behavior Summary

The current quick-vote flow works roughly like this:

1. Load every page of participatory submissions for the memes wave for the active viewer context.
2. Filter on the client to keep only submissions that are still eligible for quick vote.
3. Derive footer stats from that filtered set.
4. Build the dialog queue from that same filtered set.
5. Move skipped submissions to the back of the queue using locally stored identifiers.
6. After each vote, update recent amounts, clear the skipped state for the voted submission, optimistically reduce remaining voting power, and invalidate cached drops so the full dataset can be fetched again.

Important behavior already embedded in the current system:

- Only unrated submissions are treated as quick-vote candidates.
- A submission must still be votable for the viewer right now.
- Temporary optimistic items are excluded.
- Voting window constraints are enforced.
- Skipped submissions are deferred, not removed.
- Stored skipped entries are cleaned up when they no longer match eligible submissions.

## Proposed Direction

The refactor should split quick vote into two distinct concerns:

### 1. Lightweight Summary Query for the Entry Point

Reuse the leaderboard endpoint for the footer trigger query by requesting `unvoted_by_me=true` with `limit=1`.

- Does the viewer currently have quick-vote work to do?
- How many unvoted quick-vote submissions remain?
- How much voting power remains for this mode?
- What label should be used for that power?

The footer button should rely on this lightweight query only. It should not need to page through submissions just to render the count and remaining power.

The intended behavior is:

- Read `count` from the leaderboard response to determine how many unvoted submissions remain.
- If `count` is `0`, hide the quick-vote button and do not depend on a returned drop.
- If `count` is greater than `0`, use the first returned drop to derive the remaining voting power for this mode.
- If `count` is greater than `0`, use the first returned drop to derive the voting label for that power.

For memes quick vote, `unvoted_by_me=true` is treated as a confirmed match for the candidate set this flow needs. The first returned drop is treated as a safe, authoritative source for remaining voting power and the corresponding label.

### 2. Paginated Unvoted Stream for the Dialog

The dialog should stop treating the full submission history as its source of truth. Instead, it should build a working queue from paginated server results fetched from the leaderboard endpoint with `unvoted_by_me=true`, while hydrating only the item that is about to be shown.

The page endpoint is used to discover submission identifiers in server order. The client should use those pages mainly as a source of ids and order, not as the final truth for what is safe to show on screen.

With `unvoted_by_me=true`, the paginated stream should already exclude submissions the viewer has rated. That means quick vote no longer needs to scan a broader stream and then strip out already-voted items during page processing.

The actual item presented to the user should come from a separate single-item fetch. That single-item fetch becomes the freshness checkpoint for display. If the item is no longer present, no longer unvoted, no longer votable, or otherwise no longer usable for quick vote, it should be discarded before the user interacts with it.

For this refactor, the single-item endpoint is assumed to already expose the viewer-specific state required to decide whether the item is still safe to display and vote.

This keeps the network work bounded while still protecting the user from seeing stale skipped items or voting against outdated data.

## Queue Model

The queue should be treated as a rolling id buffer instead of a full in-memory history.

Recommended model:

- Load the first page of submission ids when quick vote opens.
- Build a working client queue from the server-returned unvoted ids, after removing ids that are already deferred in local skip storage.
- Treat the active queue depth as the number of usable non-skipped ids only. Deferred skipped ids do not count toward replenishment thresholds.
- Hydrate only the current item to render, and prefetch the next item so normal progression feels instant.
- After each vote or skip, advance to the next hydrated item immediately when available.
- When the remaining usable unvoted id buffer reaches 5 or fewer items, prefetch the next page of ids in the background.
- Keep at most one page-pagination request in flight at a time.
- Merge page results idempotently. An id that is already present in the active queue, already deferred, or already removed as handled or stale during this session must not be re-added.
- If a fetched page contributes no usable active ids because all returned ids are currently deferred as skipped, fetch the next page immediately when more pages remain.
- If the active usable queue still has 5 or fewer items after a page is merged, continue fetching subsequent pages one page at a time until the usable queue is replenished or the server reports no more pages.
- Do not request another page if the server has already indicated there are no more pages.
- If the user advances faster than the next item can be hydrated, show a loader until the next item is ready.
- Stop fetching when the server indicates there are no more pages.

This gives the user a fast first interaction while still avoiding full-history loading. It also lets the client protect the user from stale or deleted skipped items by validating the actual item only when it is about to matter.

## Handling Newly Stale or Newly Voted Submissions

The paginated endpoint should be called with `unvoted_by_me=true`, so the server stream is already narrowed to submissions the viewer has not rated yet.

The spec should therefore state this behavior explicitly:

- Already voted submissions should be excluded by the server before they reach quick-vote pagination.
- Already voted submissions must never enter the working queue.
- Already voted submissions must never enter the local skipped pool.
- If an item was unvoted when the page was fetched but is already voted by the time it is hydrated, the client should drop it and continue.

This keeps the queue aligned with the purpose of quick vote while still acknowledging that items can change state after page fetch.

## Skip Semantics

Skip should remain a local deferral mechanism, not a server-side rating state.

The intended behavior is:

- Skipping a submission moves it behind currently unskipped submissions.
- A skipped submission remains available later in the same session if it is still valid.
- Skipping does not change the user’s remaining voting power.
- Skipping does not count as completing work.

To preserve this with paginated loading:

- Keep skipped identifiers in local storage scoped to the viewer and the memes wave.
- Preserve skip order in local storage so deferred items return in a stable local order later.
- When unvoted ids arrive from paginated fetches, remove skipped ids from the immediate working queue and keep them in the deferred pool instead.
- When the user eventually gets back to deferred items, hydrate the actual item before showing it.
- If a deferred item is gone, already rated, or otherwise no longer valid when hydrated, remove it from both the working queue and local skip storage.

Queue exhaustion should work like this:

- First consume the normal paginated non-skipped queue in server order.
- When there are no more normal pages in the current pass, switch to deferred skipped items.
- When a skipped item is voted successfully, remove it from local skip storage immediately.
- When the deferred skipped pool is exhausted, restart paginated discovery from page `0`.
- If the new page-`0` pass yields valid non-skipped items, continue the normal queue again.
- If the new page-`0` pass yields no valid non-skipped items, fall back to deferred skipped items again if any still exist.
- Show the final "you are done" state only when a fresh page-`0` discovery pass yields no usable items and the deferred skipped pool is also empty.

This makes skip behave like a real local “not now” mechanism. Items the user does not want to see immediately should not keep jumping back to the front just because the server still sorts them first.

## Validity and Freshness Rules

The new design should assume queued ids can become stale at any time.

That means the system must handle all of these cleanly:

- a submission is deleted
- a submission becomes ineligible
- the voting window closes
- the user votes on the submission elsewhere
- remaining voting power changes unexpectedly

The safest rule is:

- the lightweight summary query owns entry-point truth
- paginated fetch owns server ordering
- single-item hydration owns display freshness
- vote response owns write-time truth

Implications:

- Summary values should always come from the leaderboard response fetched with `unvoted_by_me=true` and `limit=1`, not from locally counting buffered ids.
- If that response reports `count = 0`, the button should be hidden even if the client still has stale local quick-vote state.
- The page endpoint should be treated as a discovery source, not as a guarantee that the next item is still displayable.
- The paginated stream should be requested with `unvoted_by_me=true`, so page-fetch results can be treated as unvoted at fetch time.
- The item about to be shown should be hydrated individually before display whenever needed.
- A successful vote response should immediately update local queue state, clear local skip state for that id, and invalidate the same drop-related query family already refreshed by the current vote flow.
- In practice, this should follow the existing `invalidateDrops()` pattern so leaderboard-derived summary state, drop detail, and related drop feeds are refreshed together after each successful quick vote.
- Skip should not invalidate summary queries, because skipping does not change remaining voting power or complete any voting work.
- If hydration shows that the next item is gone, already voted, or no longer usable, the client should drop that id from the queue, remove it from local skip storage if present, and advance again.
- If the user advances faster than hydration completes, showing a loader is acceptable.
- If background prefetch returns fewer useful unvoted items than expected because items disappeared or were already handled elsewhere, that should be treated as normal.

## Data Responsibility Split

The refactor is cleaner if responsibilities are sharply separated.

Server responsibilities:

- compute remaining unvoted count
- compute remaining voting power
- return `count` for the leaderboard query used by the footer trigger
- return the first unvoted submission when `limit=1` and unvoted work exists
- return paginated submissions in stable server order
- apply `unvoted_by_me=true` so already-voted submissions are excluded from the quick-vote stream
- return fresh single-item data for the item being shown

Client responsibilities:

- show summary state
- hold the current working id buffer
- hydrate the current and next item
- persist and apply skip ordering locally
- persist recent quick-vote amounts locally
- handle optimistic UI movement after success
- dedupe ids across page merges and ignore late page results that no longer fit current queue state
- remove stale, deleted, or already-handled ids from local state when hydration exposes them
- recover smoothly from stale-item failures

## Proposed Rollout

### Phase 1: Footer Summary Query

Replace footer-button derivation with a lightweight leaderboard query using `unvoted_by_me=true` and `limit=1`. This gives immediate value because it removes the need to fetch the entire participatory set just to show the entry point.

Expected outcome:

- the button becomes cheap to render
- the button no longer waits on multi-page submission fetching
- the remaining count and remaining power become explicitly server-owned

### Phase 2: Paginated Queue

Refactor the dialog to use paginated discovery plus single-item hydration for the current and next item.

Expected outcome:

- opening quick vote becomes faster
- memory and network usage are bounded
- the client stops rebuilding the queue from full history
- the client no longer needs to filter already voted items out of paginated results
- skipped items no longer need to be blindly trusted when they come back later
- stale-item handling becomes simpler and more explicit

### Phase 3: Hardening

After the core shift is working, tighten the edge cases:

- confirm skip persistence behavior
- confirm restart-from-page-`0` behavior after deferred skipped items are exhausted
- confirm id-deduping and usable-queue replenishment behavior during background pagination

## Success Criteria

- The quick-vote button no longer requires full submission pagination.
- Opening the quick-vote dialog does not require loading the complete participatory history up front.
- Already voted submissions never become active quick-vote items.
- The queue continues to support skip without repeatedly surfacing deferred items at the front.
- Deleted, stale, or already-voted submissions are removed before or during display without breaking the flow.
- The user sees accurate remaining count and voting power throughout the session.

## Risks

- If vote-triggered invalidation misses one of the drop-related query groups already used elsewhere, footer summary and dialog state may drift until the next refetch.
- If page filtering against skipped ids is not applied before queue-depth checks, the client may stop fetching too early and surface skipped items before the normal pass is truly exhausted.
- If page-merge logic does not dedupe ids correctly across pagination passes and page-`0` restarts, the queue may resurface handled items or feel unstable.
- If skip ordering is applied too aggressively across newly fetched pages, the queue may feel unstable or surprising.
- If stale-item failures are not treated as normal, the flow will still feel brittle even with better pagination.
- If the server order is not stable enough, background prefetch may produce duplicates or confusing jumps.

## Open Questions

- Should skipped submissions persist across browser sessions exactly as they do today, or should skip reset more aggressively?
- How many hydrated items should be kept ahead at once beyond the immediate current and next item?
