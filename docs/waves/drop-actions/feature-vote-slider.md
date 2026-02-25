# Wave Drop Vote Slider

## Overview

Wave drop voting supports slider input with a live value tooltip, signed
positive/negative range behavior, and a numeric-input toggle. The default
slider appearance uses a higher-contrast blue accent for non-medal ranks.

## Location in the Site

- Leaderboard drop voting controls in wave leaderboards
- Compact/mini vote controls where the same slider component is reused

## Entry Points

- Open a wave leaderboard and interact with drop voting controls.
- Use `Switch to slider` from numeric mode in vote controls.
- In mini voting layouts, toggle between slider and numeric input modes.

## User Journey

1. Open vote controls for a drop.
2. Drag the thumb or click/tap the track to set a value in range.
3. Read the floating tooltip for live formatted value and vote label.
4. Optionally switch to numeric mode and back to slider mode.
5. Submit the selected vote value.

## Common Scenarios

- Top-ranked drops use medal-themed slider styles; non-top-ranked drops use the
  default blue-accent style.
- Users drag within an expanded thumb hit area for easier pointer/touch input.
- Users switch to numeric mode for exact values, then back to slider.
- Tooltip updates continuously while the slider value changes.

## Edge Cases

- When min and max are both zero, the slider rests at center.
- Negative values fill progress from current position back toward zero marker.
- Near-left positions apply tooltip offset so text remains readable.
- Mini mode uses a compact layout with the same underlying value behavior.

## Failure and Recovery

- Changing slider value does not submit automatically; users can adjust again
  before submitting.
- If vote submission fails, users can keep or adjust the selected value and
  retry from the same control.
- If pointer/touch drag ends unexpectedly, the last selected value remains in
  the input.

## Limitations / Notes

- Slider bounds are constrained to the drop's allowed vote range.
- Voting controls appear only in contexts that allow voting for the viewer.
- The slider is one input mode; numeric mode remains available in the same
  control group.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Docs Home](../../README.md)
