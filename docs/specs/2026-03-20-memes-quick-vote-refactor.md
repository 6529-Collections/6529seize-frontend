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

### 1. Lightweight Summary for the Entry Point

Introduce a dedicated summary endpoint whose only job is to answer the footer trigger question:

- Does the viewer currently have quick-vote work to do?
- How many unrated quick-vote submissions remain?
- How much voting power remains for this mode?
- What label should be used for that power?

This endpoint should be cheap, stable, and independent from full queue retrieval. The footer button should rely on this summary only. It should not need to page through submissions just to render the count and remaining power.

### 2. Paginated Discovery Stream for the Dialog

The dialog should stop treating the full submission history as its source of truth. Instead, it should build a working queue from paginated server results ordered by the viewer’s current vote state, while hydrating only the item that is about to be shown.

The page endpoint is used to discover submission identifiers in server order. The client should use those pages mainly as a source of ids and order, not as the final truth for what is safe to show on screen.

The page endpoint is expected to be sorted by the viewer’s own vote from lowest to highest. That means unrated items should appear first, but already voted items may still appear later in the stream. Those already voted items should not become quick-vote queue entries.

The actual item presented to the user should come from a separate single-item fetch. That single-item fetch becomes the freshness checkpoint for display. If the item is no longer present, no longer unrated, no longer votable, or otherwise no longer usable for quick vote, it should be discarded before the user interacts with it.

This keeps the network work bounded while still protecting the user from seeing stale skipped items or voting against outdated data.

## Queue Model

The queue should be treated as a rolling id buffer instead of a full in-memory history.

Recommended model:

- Load the first page of submission ids when quick vote opens.
- From each fetched page, immediately ignore entries that are already voted by the viewer.
- Build a working client queue only from ids that are still unrated at page-fetch time, after removing ids that are already deferred in local skip storage.
- Hydrate only the current item to render, and prefetch the next item so normal progression feels instant.
- After each vote or skip, advance to the next hydrated item immediately when available.
- When the remaining usable unrated id buffer reaches 5 or fewer items, prefetch the next page of ids in the background.
- Keep at most one page-pagination request in flight at a time.
- Do not request another page if the server has already indicated there are no more pages.
- If the user advances faster than the next item can be hydrated, show a loader until the next item is ready.
- Stop fetching when the server indicates there are no more pages.

This gives the user a fast first interaction while still avoiding full-history loading. It also lets the client protect the user from stale or deleted skipped items by validating the actual item only when it is about to matter.

## Handling Already Voted Submissions

The paginated endpoint is ordered by the viewer’s vote state, not limited to only unrated submissions. The spec should therefore state this behavior explicitly:

- Submissions with zero viewer vote are eligible to enter quick-vote discovery.
- Submissions with non-zero viewer vote should be ignored immediately during page processing.
- Already voted submissions must never enter the working queue.
- Already voted submissions must never enter the local skipped pool.
- If an item was unrated when the page was fetched but is already voted by the time it is hydrated, the client should drop it and continue.

This keeps the queue aligned with the purpose of quick vote even though the discovery endpoint itself contains a broader stream.

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
- When unrated ids arrive from paginated fetches, remove skipped ids from the immediate working queue and keep them in the deferred pool instead.
- When the user eventually gets back to deferred items, hydrate the actual item before showing it.
- If a deferred item is gone, already rated, or otherwise no longer valid when hydrated, remove it from both the working queue and local skip storage.

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

- the summary endpoint owns summary truth
- paginated fetch owns server ordering
- single-item hydration owns display freshness
- vote response owns write-time truth

Implications:

- Summary values should always come from the dedicated summary response, not from locally counting buffered ids.
- The page endpoint should be treated as a discovery source, not as a guarantee that the next item is still displayable.
- Entries that are already voted at page-fetch time should be discarded before they enter any local quick-vote state.
- The item about to be shown should be hydrated individually before display whenever needed.
- A successful vote response should immediately update local queue state, clear local skip state for that id, and trigger a lightweight refresh of summary data.
- If hydration shows that the next item is gone, already voted, or no longer usable, the client should drop that id from the queue, remove it from local skip storage if present, and advance again.
- If the user advances faster than hydration completes, showing a loader is acceptable.
- If background prefetch returns fewer useful unrated items than expected because items disappeared or were already handled elsewhere, that should be treated as normal.

## Data Responsibility Split

The refactor is cleaner if responsibilities are sharply separated.

Server responsibilities:

- compute remaining unrated count
- compute remaining voting power
- return paginated submissions in stable server order
- return fresh single-item data for the item being shown

Client responsibilities:

- show summary state
- hold the current working id buffer
- hydrate the current and next item
- discard already voted items during page processing
- persist and apply skip ordering locally
- persist recent quick-vote amounts locally
- handle optimistic UI movement after success
- remove stale, deleted, or already-handled ids from local state when hydration exposes them
- recover smoothly from stale-item failures

## Proposed Rollout

### Phase 1: Summary Endpoint

Replace footer-button derivation with a dedicated summary endpoint. This gives immediate value because it removes the need to fetch the entire participatory set just to show the entry point.

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
- already voted items are filtered out before they pollute quick-vote state
- skipped items no longer need to be blindly trusted when they come back later
- stale-item handling becomes simpler and more explicit

### Phase 3: Hardening

After the core shift is working, tighten the edge cases:

- confirm skip persistence behavior
- confirm empty-state transitions after the last valid item
- confirm how aggressively summary data should be refreshed after votes, skips, and dialog open

## Success Criteria

- The quick-vote button no longer requires full submission pagination.
- Opening the quick-vote dialog does not require loading the complete participatory history up front.
- Already voted submissions never become active quick-vote items.
- The queue continues to support skip without repeatedly surfacing deferred items at the front.
- Deleted, stale, or already-voted submissions are removed before or during display without breaking the flow.
- The user sees accurate remaining count and voting power throughout the session.

## Risks

- If summary and queue endpoints are not aligned on what “unvoted” means, the button count and dialog contents will drift.
- If the single-item endpoint does not expose enough viewer-specific state, the client cannot safely decide whether an item is still quick-voteable.
- If page processing does not filter out already voted items early enough, the local queue and skip state will accumulate invalid ids.
- If skip ordering is applied too aggressively across newly fetched pages, the queue may feel unstable or surprising.
- If stale-item failures are not treated as normal, the flow will still feel brittle even with better pagination.
- If the server order is not stable enough, background prefetch may produce duplicates or confusing jumps.

## Open Questions

- Should skipped submissions persist across browser sessions exactly as they do today, or should skip reset more aggressively?
- Is the single-item endpoint guaranteed to include the viewer-specific state needed to decide whether the item is still safe to display and vote?
- Should the summary endpoint refresh only after successful votes, or also after dialog open and other visibility events?
- How many hydrated items should be kept ahead at once beyond the immediate current and next item?
