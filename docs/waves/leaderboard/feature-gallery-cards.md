# Wave Leaderboard Gallery Cards

## Overview

Gallery mode in wave leaderboards displays each drop as a compact card with media, identity, ranking, and vote information.

Users can quickly scan:

- artwork
- title (if provided)
- author
- rank badge
- current votes and projected votes
- optional vote actions

## Location in the Site

- Wave detail pages that include a `Leaderboard` tab.
- Leaderboard view mode set to gallery/grid (not list mode).
- Desktop and mobile contexts where cards render in a multi-column gallery.

## Entry Points

- Open a wave with a leaderboard.
- Select the `Leaderboard` tab.
- Switch to gallery layout.

## User Journey

1. Open a leaderboard card.
2. Read the image area and supporting metadata:
   - title text appears above the author handle when a title is present
   - author handle is a profile link
   - rank badge appears when ranking metadata is available
3. Check vote indicators in the footer area:
   - current score and projected score at decision time
   - raters count icon
   - optional "your vote" line if you have already voted
4. Use the `Vote` button when available to open the voting modal.
5. Tap/click a card image or call `open` action to view the drop detail.

## Common Scenarios

- Browsing many drops: cards prioritize media and title/author information, with vote metrics below.
- Returning to a wave after voting activity: cards keep the same layout and show updated vote numbers when ranking data refreshes.
- Empty / unrated drops: cards still render with available fields and omit missing optional metadata.
- Users with active voting ability:
  - see `Vote` in the card footer
  - can open the voting modal directly from the card.

## Edge Cases

- If a drop title is missing, only author and vote information are shown in the metadata row.
- If a rank is not present, the rank badge is omitted.
- If a user has not voted on a card, no personal vote line is shown.
- If voting is unavailable for a card, the `Vote` button is not shown.
- Desktop hover and animation behavior does not appear for touch-only devices; card transitions stay static on mobile-focused layouts.

## Failure and Recovery

- If leaderboard vote metadata is delayed or temporarily unavailable, the card still renders with available metadata and image content.
- If vote actions are blocked by current wave rules, users do not lose access to details: they can still open the drop and read the card metrics.
- If predicted vote values are unavailable, the projected vote area falls back to whatever values are provided by current leaderboard data for that card.

## Limitations / Notes

- The card is an adaptive gallery surface; list-mode layouts are documented separately under other leaderboard/drop actions documentation.
- Visual motion and hover effects are intentionally tuned per device class and can differ between desktop and touch-first views.
- This page describes current visible behavior and does not cover internal sorting implementation details.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Drop Actions: Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Vote Slider](../drop-actions/feature-vote-slider.md)
- [Docs Home](../../README.md)
