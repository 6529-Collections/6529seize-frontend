# Wave Drop Vote Slider

## Overview

Wave voting supports two input modes that share one rating model:
slider and numeric. The control remains bounded by drop-specific min/max range,
supports signed values, and shows a live tooltip with formatted value plus the
current voting-credit label (for example `TDH`, `TDH + XTDH`, `Rep`, or `XTDH`).

## Location in the Site

- Leaderboard drop voting controls in wave leaderboards
- Single-drop voting controls in the modal/sheet
- Compact/mini vote controls where the same control group is reused

## Entry Points

- Open a ranked or approved drop with voting enabled.
- Open the `Vote` modal/sheet from the single-drop summary.
- In any vote control, use:
  - `Switch to slider`
  - `Switch to numeric`
- In numeric mode, use the small `%` quick buttons and `+` / `-` buttons.

## User Journey

1. Open a voting control.
2. Pick slider mode or switch from it to numeric mode.
3. Set a value:
   - drag or tap the slider,
   - click a quick percentage button,
   - or use `+` / `-` controls.
4. Watch the tooltip/update text while the value changes.
5. Submit the selected value from the same control group.

## Common Scenarios

- Users in slider mode can drag smoothly in an expanded hit area.
- Users in numeric mode can enter exact values, then switch back to slider mode.
- Quick percentage buttons:
  - compact on mobile (`-75`, `-50`, `-25`, `25`, `50`, `75`)
  - full set on desktop (`-100`, `-75`, `-50`, `-25`, `25`, `50`, `75`, `100`)
- Holding `+` or `-` buttons:
  - starts with small jumps,
  - speeds up after sustained press,
  - and supports high-velocity jumps for long-press intent.
- Values snap cleanly to significant memetic values used in this voting system
  when those thresholds are crossed (for example `69`, `420`, `6529`).

## Edge Cases

- When min and max are both zero, the slider rests at center.
- Negative and positive values share the same range rules, with visual fill
  direction changing around zero.
- Very small or large values are clamped to the drop's allowed range.
- Mini mode uses a compact layout and a reduced quick-percent preset set.
- A 100ms button repeat loop can continue to fire while the pointer is held down
  until release.

## Failure and Recovery

- Changing slider or numeric input does not submit automatically.
- If vote submission fails, users can keep the existing value, retry, and submit
  again from the same control.
- If a pointer/touch action stops unexpectedly, the last selected value remains
  in the control for immediate retry.
- If a numeric entry is outside allowed bounds, the value is constrained back into
  range.

## Limitations / Notes

- Voting controls appear only in contexts where voting is currently allowed for
  the viewer.
- The slider and numeric mode are the same control with shared validation.
- These controls do not change wave-wide scoring rules by themselves; they only
  collect the viewer's selected vote.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Docs Home](../../README.md)
