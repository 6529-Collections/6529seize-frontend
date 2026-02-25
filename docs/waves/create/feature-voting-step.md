# Wave Creation Voting Configuration

## Overview

The `Voting` step in wave creation configures how drops are ranked and whether
votes can be negative in `Rank` and `Approve` waves.

## Location in the Site

- Full-page flow: `/waves/create`
- Create-wave modal flow on desktop discover/waves/messages shells
- `Voting` step for non-chat wave types (`Rank`, `Approve`)

## Entry Points

- Open a non-chat wave creation flow and continue from `Drops` to `Voting`.
- Reopen `Voting` from the step rail while creating or editing before submitting.
- Open the create modal and use the same sequence if the modal is active.

## User Journey

1. Open the wave type and navigate to the `Voting` step.
2. Choose one of the available vote modes:
   - `By TDH + XTDH` (default)
   - `By TDH`
   - `By Rep`
3. If `By Rep` is selected, complete:
   - voting category
   - profile identifier
4. For `By TDH` and `By TDH + XTDH`, keep voting category and profile empty.
5. For `Rank` and `Approve` waves, toggle negative voting as needed.
6. For `Rank` waves, optionally enable and tune time-weighted voting intervals.
7. Continue to the next step (`Outcomes` for rank waves, `Approval` for approve
   waves).

## Common Scenarios

- New `Rank` and `Approve` waves default to `By TDH + XTDH`.
- Use `By Rep` when votes should be tied to a specific reputation profile context.
- Use `By TDH` or `By TDH + XTDH` for score methods that do not require
  Rep inputs.
- `XTDH` is not shown as a selectable vote mode in wave creation.
- `Time weighted voting` remains available under the `Rank` path only.

## Edge Cases

- Existing rep values are cleared when switching from `By Rep` to a TDH mode.
- If `By Rep` is selected, missing category or profile input blocks step
  progression.
- If a TDH mode is selected and category/profile values are present, validation
  errors are shown until those fields are removed.
- Chat waves do not include the `Voting` step.

## Failure and Recovery

- If required Rep fields are missing, keep the vote mode on `By Rep` until fields
  are completed, then continue.
- If unexpected validation errors appear after changing the mode, switch back to
  the target mode, correct the visible required fields, and retry navigation.
- If submission fails after configuring voting, retry from the modal or full-page
  flow while preserving your selected mode and settings.

## Limitations / Notes

- `By TDH + XTDH`, `By TDH`, and `By Rep` labels are the creator-facing options
  in the creation UI.
- The step enforces mode-specific validation only (`Rep` requires category and
  profile; TDH methods do not).
- Existing waves may still surface other credit-type values in leaderboard and
  drop metadata views.

## Related Pages

- [Wave Creation Index](../README.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Wave Drop Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Docs Home](../../README.md)
