# Wave Drop Curation Actions

## Overview

Eligible users can add a post to one or more named Curations, remove it later,
or create a Curation while managing the post.

This named-Curation workflow is separate from the specialized leaderboard
`Curate` / `Curated` toggle used by eligible Rank and participation surfaces.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Leaderboard list cards
- Leaderboard compact grid cards
- Leaderboard content-only grid cards (inline overlay actions and touch
  long-press action sheet)
- Participation drop cards (ongoing and ended views)

Not shown on:

- Direct-message thread drops: `/messages/{waveId}`
- Leaderboard gallery cards (including memes gallery-style cards)

## Entry Points

- Open `/waves/{waveId}`.
- Go to leaderboard or participation content.
- On a standard Wave post, open its desktop or touch action menu. Use
  `Add to {Curation name}` for the preferred Curation, or select
  `Manage Curations` to choose, remove, or create.
- While viewing a Curation tab, use `Remove from {Curation name}` in the same
  post action menu to remove the post from the active Curation.
- On specialized eligible leaderboard cards, use the separate `Curate` /
  `Curated` toggle.

## User Journey

1. Open `/waves/{waveId}` and find a post.
2. Open the post action menu.
3. If `Add to {Curation name}` is shown, select it to add the post immediately
   and receive a confirmation.
4. Select `Manage Curations` to open the complete membership dialog.
5. The dialog lists named Curations in that source Wave that your account can
   manage. Curations already containing the post are listed first.
6. Select `Add` or `Remove`. The membership action blocks repeat input while
   pending and the dialog stays open for further changes.
7. Use the separated `Create new Curation` action below the list. If no
   manageable Curation exists, select `Create first curation`, choose a
   name and management Group, and the site creates the Curation and adds the
   post in one continuation.

## Common Scenarios

- Leaderboard list cards show curation next to voting actions.
- Compact leaderboard grid cards show curation in the footer action row.
- Content-only leaderboard grid cards show curation in the hover/tap action
  cluster; touch users can use long-press and choose `Curate drop`.
- Participation cards show curation near voting and reaction controls.
- Standard desktop post menus and mobile action sheets offer a direct
  `Add to {Curation name}` action when there is one clear preferred Curation.
- The direct action targets the selected Curation tab, the profile Curation in
  the current profile Wave, or the only manageable Curation when the choice is
  unambiguous. It is hidden when that Curation already contains the post.
- `Manage Curations` lists every manageable Curation for explicit add and
  remove actions.
- On an active Curation tab, `Remove from {Curation name}` replaces the
  separate floating remove control and removes only that Curation membership.
- Creating a Curation from a post adds the post and keeps the user on the
  current page.
- Profile Curation cards expose `Open original Wave`, author-only `Edit post`,
  and confirmed `Remove from Curation` actions.

## Edge Cases

- Named Curation rows are shown only when
  `authenticated_user_can_curate` is true for the current account.
- If Curations exist but none are manageable, the dialog explains that state
  and offers creation when allowed.
- If a drop is not curatable for your account, specialized leaderboard
  curation controls are not shown.
- Temporary drops (`temp-*`) cannot be curated.
- If wallet connection is missing when action runs, users see
  `Please connect your wallet to curate drops`.
- While a curate/uncurate request is pending, repeat taps are blocked for that
  action control.
- Profile-card removal requires confirmation and does not delete the original
  post from its Wave.

## Failure and Recovery

- If named membership update fails, the dialog stays available and the same
  action can be retried.
- If Curation creation succeeds but adding the post fails, the Curation is
  preserved and the dialog reports the partial success instead of creating a
  duplicate.
- If the specialized curate/uncurate toggle fails, curation state returns to
  the previous value.
- Failures show an error toast with the failure reason.
- Retry by selecting the same curation action again.
- Successful changes refresh drop data so leaderboard and participation views
  resync.

## Limitations / Notes

- Named Curation membership and specialized leaderboard curation are
  independent from voting; neither action submits a vote.
- Curation toggles are not available in gallery-card layouts.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Leaderboard Sort and Price Filters](../leaderboard/feature-sort-and-group-filters.md)
- [Wave Right Sidebar Group and Curation Management](../sidebars/feature-right-sidebar-group-management.md)
- [Wave Leaderboard Gallery Cards](../leaderboard/feature-gallery-cards.md)
- [Docs Home](../../README.md)
