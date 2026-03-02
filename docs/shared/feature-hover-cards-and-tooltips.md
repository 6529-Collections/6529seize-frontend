# Hover Cards and Tooltip Positioning

Parent: [Shared Index](README.md)

## Overview

`CustomTooltip` powers shared hover cards and helper tooltips in multiple areas.
It opens on hover and on keyboard focus (when the trigger is focusable), renders
in a portal, and repositions to stay visible in the viewport.

## Location in the Site

- Profile hover cards on identity triggers in wave feeds, leaderboard/winner
  rows, and notifications across routes such as `/discover`,
  `/waves/{waveId}`, `/messages?wave={waveId}`, and `/notifications`.
- Wave mention hover cards on `#wave` links inside drop content on
  `/waves/{waveId}` and `/messages?wave={waveId}`.
- Helper tooltips in xTDH stat and grant-action surfaces (for example
  `/{user}/xtdh` and group xTDH grant setup screens).
- Helper tooltips in network health metric cards in the Network area.

## Entry Points

- Hover a supported trigger.
- Focus a supported link or button.
- Move the pointer into the open tooltip card to keep it open.
- Leave both trigger/card, or blur the trigger, to close.

## User Journey

1. Hover or focus a supported trigger.
2. After the show delay, the tooltip card opens near the trigger.
3. Placement is chosen (`top`, `bottom`, `left`, `right`) and can flip to stay
   on-screen.
4. While open, position updates on scroll, resize, and trigger/content resize.
5. Leaving the trigger/card (or blurring) closes the tooltip shortly after.

## Common Scenarios

- Profile hover cards show avatar, handle/display name, CIC/level, profile
  descriptor, bio snippet (when present), summary stats, and follow/unfollow
  when the viewed profile is not the signed-in user.
- `Top Rep` appears only when rep-category data exists. It shows up to 3
  categories, sorted by rating then contributor count.
- `Top Rep` rating color is green for positive values and red for zero/negative
  values.
- Wave mention hover cards show wave name, picture, author handle/address,
  drops count, joined count, and last-drop recency.
- If wave data is partial, the card falls back to mention name, then
  `Wave {waveId}`; author falls back to primary address; image falls back to
  contributor collage, then gradient art.
- xTDH and network helper tooltips show short explanatory labels.

## Edge Cases

- Touch-capable devices skip profile/wave hover wrappers and render trigger
  content without the hover card.
- If the preferred side does not fit, placement flips and then clamps to
  viewport padding.
- If pointer leaves before the show delay completes, no tooltip opens.
- Keyboard opening depends on the trigger being focusable.

## Failure and Recovery

- Tooltip triggers remain usable even when profile/wave fetch data is missing.
- Wave mention cards show a compact loading placeholder until wave metrics are
  ready.
- Follow/unfollow errors in profile cards show an error toast; users can retry
  from the same card.
- Reopening the tooltip uses normal query re-fetch behavior for stale or
  missing data.

## Limitations / Notes

- This is a hover/focus model, not a tap-first model.
- Profile/wave wrappers use `delayShow=500ms`; other `CustomTooltip` adopters
  use component defaults unless overridden.
- Only `CustomTooltip` adopters follow this behavior; tooltips built with other
  components may differ.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Wave Mentions](../waves/composer/feature-wave-mentions.md)
- [Wave Drop Content Display](../waves/drop-actions/feature-content-display.md)
- [Brain Wave List Name Tooltips](../waves/sidebars/feature-brain-list-name-tooltips.md)
- [Notifications Feed](../notifications/feature-notifications-feed.md)
- [Profile xTDH Tab](../profiles/tabs/feature-xtdh-tab.md)
- [Profile xTDH Granted View](../profiles/tabs/feature-xtdh-granted-view.md)
- [Network Health Dashboard](../network/feature-health-dashboard.md)
