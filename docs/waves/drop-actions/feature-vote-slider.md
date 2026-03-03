# Wave Drop Vote Slider

## Overview

This page covers vote value entry controls: slider mode and numeric mode.
Both modes edit one shared value for the same drop.
The value uses each drop's `min_rating` and `max_rating` bounds and shows the
wave credit label (`TDH`, `XTDH`, `TDH + XTDH`, or `Rep`).

## Location in the Site

- Vote modal/sheet (`Vote for this artwork`) opened from:
  - leaderboard drop cards
  - participation drop footers
  - single-drop vote summary strips
- Mini inline vote card in artist active-submission cards.
- Route contexts:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}`
  - single-drop overlay from thread context (`?drop={dropId}`)

## Entry Points

- Select `Vote` on an eligible drop surface to open modal/sheet voting.
- In active submissions, use the inline mini vote card.
- Switch entry mode with:
  - `Switch to slider`
  - `Switch to numeric`
  - mini-card mode toggle icon

## User Journey

1. Open voting controls from modal/sheet or mini card.
2. Choose slider mode or numeric mode.
3. Set the value:
   - slider drag
   - numeric text input
   - `%` quick buttons (normal numeric mode)
   - `+` and `-` step buttons (normal numeric mode)
4. Review the live value and vote-credit label.
5. Select `Vote` to submit.

## Common Scenarios

- Normal voting opens in slider mode; mini voting opens in numeric mode.
- Slider mode uses larger hit areas and logarithmic mapping so low and high
  values are easier to reach.
- Quick percentage buttons in normal numeric mode:
  - mobile: `-75`, `-50`, `-25`, `25`, `50`, `75`
  - desktop: `-100`, `-75`, `-50`, `-25`, `25`, `50`, `75`, `100`
- Holding `+` or `-` in normal numeric mode accelerates step size over time:
  `1`, then `10`, then `100`, then `1000`.
- Hold-to-step snaps when crossing memetic values
  (`±69`, `±420`, `±6529`, `±42069`, `±69420`) and pauses briefly before
  continuing.
- Pressing `Enter` in numeric input submits immediately.

## Edge Cases

- When min and max are both zero, the slider rests at center.
- Positive and negative values share one range, with slider fill split around
  zero.
- Numeric typed and stepped values are clamped to each drop's bounds.
- Mini numeric mode has text input only (no `%` quick buttons, no `+`/`-`
  step buttons).
- Long-press stepping repeats every `100ms` while pressed.
- Vote controls are hidden for: not logged in, no profile handle, proxy,
  ineligible drop/group, winner drops, voting not started, and voting ended.
- `No credit` still shows vote controls, but `max_rating` can be zero and
  submit can fail.

## Failure and Recovery

- Changing slider or numeric input does not submit automatically.
- Submit always runs an auth check first; canceling auth keeps controls open.
- If vote submission fails, users stay in place, see an error toast, and can
  retry with the same value.
- In modal/sheet flows, successful submit closes the modal/sheet after the
  success state.
- In mini active-submission cards, successful submit refreshes submission/drop
  queries and keeps users in the same list.

## Limitations / Notes

- This page covers value-entry controls. Vote summary strip and modal container
  behavior are documented in
  [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md).
- This page does not document clap/rate controls in thread cards.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Wave Drop Artist Preview Modal](feature-artist-preview-modal.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Docs Home](../../README.md)
