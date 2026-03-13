# Wave Creation Voting Configuration

## Overview

The `Voting` step configures how drops are scored in `Rank` wave creation.
Users choose a voting credit mode, optional Rep filters, and optional
time-weighted voting settings.

## Location in the Site

- Full-page flow: `/waves/create`
- Create-wave modal flow on desktop discover/waves/messages shells
- `Voting` step in `Rank` wave creation

## Entry Points

- Open a `Rank` wave creation flow and continue from `Drops` to `Voting`.
- Reopen `Voting` from the step rail while creating before submission.
- Use the same step sequence when create-wave is opened as a desktop modal.

## User Journey

1. Open `Voting` in a rank-wave create flow.
2. Choose one voting mode:
   - `By TDH + XTDH` (default)
   - `By TDH`
   - `By Rep`
3. If `By Rep` is selected, complete:
   - voting category
   - profile identifier
4. For `By TDH` and `By TDH + XTDH`, keep voting category/profile empty.
5. Review `Allow Negative Votes`:
   - the toggle is shown but currently disabled in create-wave.
6. Optionally configure `Time weighted voting` interval.
7. Continue to `Outcomes`.

## Common Scenarios

- New rank waves default to `By TDH + XTDH`.
- Use `By Rep` when votes should be tied to reputation context.
- Use TDH-based modes for score methods that do not require Rep inputs.
- `XTDH` is not shown as a standalone selectable vote mode.

## Edge Cases

- Existing Rep values are cleared when switching from `By Rep` to TDH modes.
- If `By Rep` is selected, missing category/profile blocks progression.
- If a TDH mode is selected while category/profile values remain, validation
  errors appear until those values are cleared.
- Chat waves do not include the `Voting` step.

## Failure and Recovery

- If required Rep fields are missing, keep mode on `By Rep`, fill required
  fields, then continue.
- If validation errors appear after mode changes, reselect the target mode,
  correct visible fields, and retry.
- If submit fails later, reopen flow and retry with the same voting settings.

## Limitations / Notes

- `By TDH + XTDH`, `By TDH`, and `By Rep` are the creator-facing options.
- Time-weighted voting appears on rank-wave creation only.
- `Allow Negative Votes` is currently non-interactive in create-wave and does
  not change the submitted wave configuration.
- The `Approve` type is currently shown as disabled in `Overview`, so users do
  not reach an approve-specific voting path.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Creation Outcomes Setup](feature-outcomes-step.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Wave Drop Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Docs Home](../../README.md)
