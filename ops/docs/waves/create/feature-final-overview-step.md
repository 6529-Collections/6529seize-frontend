# Wave Creation Final Overview

## Overview

`Overview` is the final, read-only step when creating a wave or subwave.
It follows `Description` for Chat, scheduled Rank, Perpetual Ranking, and
Approve waves. The first step is named `Setup`.

Review the configuration, then select `Confirm and create`. Use `Previous`
to return to Description or use completed steps in the desktop rail to edit
earlier settings. Description text, media, and attachments stay available when
moving backward and forward within the open wizard.

## Configuration Summary

The summary includes the wave name and picture, parent wave name for subwaves,
and the following settings:

- Wave type and access groups, with member inspection for restricted groups.
- Submission and voting schedules and winner announcement timing.
- Submission types, media, metadata, limits, and admin deletion permissions.
- Voting credits, scope, category, profile, card set, negative voting, vote
  limits, and time weighting.
- Approval threshold, hold time, maximum approved drops, and approval window.
- Outcomes visibility and count, plus each outcome's type, reward, category,
  total, per-winner distribution, or credit per approved drop.
- Author guidelines and rules requiring acceptance and wallet signatures.
- The description drop, including its title, formatted content, media, and
  attachment names.

Only applicable sections appear. Chat waves omit voting and outcomes.
Perpetual Ranking reports that outcomes are unavailable and does not display
stale outcome rewards from a saved configuration. No configuration fields can
be edited on this step.

## Confirmation and Recovery

- Description must contain a valid drop before `Next` opens Overview.
- Pending inline image uploads must finish first.
- Confirmation runs the existing authentication, group validation, and
  subwave parent-access warning checks before creating the wave.
- During submission, navigation and confirmation are disabled.
- A failed submission keeps the configuration and description available for
  correction or retry. No wave is created just by opening Overview.

## Related Pages

- [Wave Creation Index](README.md)
- [Setup](feature-overview-step.md)
- [Guidelines](feature-rules-step.md)
- [Description](feature-description-step.md)
