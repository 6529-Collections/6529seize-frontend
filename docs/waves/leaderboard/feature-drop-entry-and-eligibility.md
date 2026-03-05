# Wave Leaderboard Drop Entry and Eligibility

## Overview

This page explains who can start a leaderboard submission and where the start
control appears.

Entry behavior differs by wave type:
- standard rank waves
- curation waves
- memes waves

## Location in the Site

- Wave thread route: `/waves/{waveId}`
- Legacy wave route: `/waves?wave={waveId}` redirects to `/waves/{waveId}` and
  keeps other query params
- Direct-message wave route: `/messages?wave={waveId}` (there is no
  `/messages/{waveId}` route)
- Entry controls appear in leaderboard header, leaderboard empty states, meme
  tabs header, or curation `Drop Artwork` modal entry actions

## Entry Surfaces

- Open a wave and select `Leaderboard`.
- Standard waves:
  - Header `Drop` is shown only when logged in and eligible.
  - Empty list shows `Drop` in the `No drops to show` card.
- Curation waves:
  - Eligible users can use header `Drop Art`.
  - Empty curation lists can show `Drop`.
  - Both entry points open the curation `Drop Artwork` modal.
- Memes waves:
  - Desktop (non-compact header mode): use `Submit Work to The Memes` in the
    meme tabs header.
  - Mobile leaderboard: use header `Drop` when logged in and eligible.

## User Journey

1. Open leaderboard content.
2. The app checks:
   - login
   - proxy mode
   - participation eligibility
   - submission window (`NOT_STARTED`, `ACTIVE`, `ENDED`)
   - per-user submission limits
3. The app renders the wave-specific entry control.
4. If blocked, the UI uses one of these states:
   - hidden controls
   - disabled button states
   - empty-state restriction message

## Common Scenarios

- Standard empty state can show disabled `Drop` with explicit messages, such as:
  - `Please log in to make submissions`
  - `Proxy users cannot make submissions`
  - `You don't have permission to submit in this wave`
  - `You have reached the maximum number of drops allowed`
  - `Submissions haven't started yet`
  - `Submission period has ended`
- Curation empty state shows `No curated drops yet` and can show restriction
  messaging.
- Curation entry opens a `Drop Artwork` modal with URL-only submission controls.
- When curation eligibility fails specifically on level requirement, the helper
  card can show:
  - `Curation wave submissions require at least Level 10.`
  - `Learn more about Network Levels` link
- Memes entry on desktop can show disabled submit states (for example
  `Not Eligible to Submit`, `Submission Limit Reached`, or closed/open timing
  states).
- Memes desktop submit labels are responsive:
  - compact desktop widths can show short labels (for example `Submit Work`,
    `Closed`, `Opens {countdown}`, `Not Eligible`, `Limit Reached`)
  - extra-wide desktop can show full labels (`Submit Work to The Memes`,
    `Submissions Closed`, `Submissions Open {countdown}`, and full limit text)
- If voting has ended, `Leaderboard` is removed from available tabs, so
  leaderboard entry controls are no longer available.

## Edge Cases

- Curation header action label is `Drop Art` (not `Drop`) when shown.
- On narrow curation layouts, entry actions can collapse to icon-only controls.
- Eligible curation users can still have both header and empty-state entry
  controls, depending on current list state.
- Curation empty-state helper messaging appears only when the leaderboard list is
  empty; populated lists can hide restriction text.
- The curation helper link to Network Levels appears only for the Level 10
  restriction case.
- In non-empty leaderboards, blocked users may see no restriction text; the
  entry controls can simply be absent.
- Memes entry surfaces differ by viewport (`Submit Work to The Memes` on
  desktop tabs header vs leaderboard `Drop` on mobile).
- Memes desktop urgency/remaining badges are visible only on extra-wide desktop;
  compact desktop still keeps submit-state tooltip guidance.
- Memes leaderboard empty state does not show a submit button; submission starts
  from the header/tabs controls.

## Failure and Recovery

- If entry is blocked, use the restriction message to recover (log in, disable
  proxy, wait for submission window, or free submission capacity).
- If curation `Drop Artwork` modal closes accidentally, reopen from header
  `Drop Art` or empty-state `Drop`.
- If a create panel/modal opens but submit fails, retry from the same surface.
- If wave timing or eligibility changed while viewing, refresh leaderboard to
  re-evaluate entry controls.

## Limitations / Notes

- This page owns entry gating and start controls only.
- Full submit format and validation rules live in curation and memes submission
  pages.
- Restriction helper text is most explicit in empty states; populated lists can
  show fewer inline prompts.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Sort and Group Filters](feature-sort-and-group-filters.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Curation URL Submissions](../composer/feature-curation-url-submissions.md)
- [Memes Submission Workflows](../memes/feature-memes-submission.md)
- [Docs Home](../../README.md)
