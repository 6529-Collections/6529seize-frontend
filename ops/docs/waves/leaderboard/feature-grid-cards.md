# Wave Leaderboard Grid Cards

## Overview

Non-memes wave leaderboards offer `Grid` and `Content only` card views for
scanning drops. Both views use the same stable card frame, keep submitted media
in a square preview, and provide explicit actions instead of making the entire
card clickable.

## Location in the Site

- `/waves/{waveId}` and `/messages/{waveId}` when `Leaderboard` is available.
- `Leaderboard` with `Grid` or `Content only` selected on a non-memes wave.

## Entry Points

- Open a non-memes wave that has a leaderboard.
- Select `Leaderboard`.
- Switch the view to `Grid` or `Content only`.
- Use the active sort and filters to change which drops are shown.

## User Journey

1. Open `Grid` or `Content only` view.
2. Scan the square preview at the top of each card:
   - submitted media remains contained in the square media frame
   - a drop without media shows a bounded plain-text preview
3. Review the drop title, author profile link, and any identity submission
   details in the card footer.
4. In `Grid`, review labeled voting information:
   - rank waves show `Current`, `Projected`, and `Your vote`
   - approval waves show `Reached`, `Required`, `Votes now`, `Your vote`, and
     `Status`
5. Select `Open` to view the full drop, select the voters control for voting
   details, or select `Vote` when voting is available.

## Common Scenarios

- Long markdown submissions are reduced to a short plain-text preview. Links
  and embedded content do not become interactive controls inside the preview.
- The title appears once in the footer even when the submission begins by
  repeating the title.
- Cards in the same row stretch to a common height so titles, metrics, and
  actions remain aligned.
- Mobile uses a single card column. Wider layouts use additional columns when
  there is enough card width.
- Desktop grid layouts leave space beside the rightmost cards for the floating
  Quick DM control.
- On touch devices, long-pressing a `Content only` card opens its action sheet
  for available actions such as opening, copying the drop link, or voting.

## Edge Cases

- Missing media and missing text show `No preview available.` in the square
  preview area.
- Missing titles use `Untitled drop` so the card and its `Open` action still
  have a useful name.
- Negative vote values use a distinct warning color while retaining their
  minus sign.
- `Open` is unavailable for chat drops.
- `Vote` is hidden when voting is closed, locked, or unavailable to the current
  viewer.
- `Content only` keeps the common title and action footer but omits rank and
  voting-summary metrics.

## Failure and Recovery

- The first load shows square card placeholders while leaderboard data is
  loading.
- If no drops match the current view or filters, the leaderboard shows
  `No drops to show`.
- If an earlier or later leaderboard page fails to load, use the retry control
  shown near that page boundary.
- If voting fails, the voting surface remains the place to review the error and
  retry.

## Limitations / Notes

- The card preview is intentionally a summary. Select `Open` to read the full
  formatted submission and use its links or embedded content.
- Media dimensions are not changed between `Grid` and `Content only`; both use
  the established square leaderboard media frame.
- Memes waves use a separate media-first gallery card layout.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Wave Leaderboard Gallery Cards](feature-gallery-cards.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Sort and Price Filters](feature-sort-and-group-filters.md)
- [Drop Actions: Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Docs Home](../../README.md)
