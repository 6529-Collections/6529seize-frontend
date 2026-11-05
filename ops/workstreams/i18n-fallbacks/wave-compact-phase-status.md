# Compact Wave Phase Status I18n Fallback Debt

## Scope

- Surface: single-decision leaderboard schedule sections in
  `CompactDroppingPhaseCard`, `CompactVotingPhaseCard`, and `CompactPhaseStatus`.
- Untranslated source keys under `waves.leaderboard.phase`: `submissionsClosed`,
  `submissionsOpenIn`, `submissionsCloseIn`, `votingClosed`, `votingOpensIn`,
  `votingClosesIn`, and the existing `droppingOngoing`, `votingOngoing`,
  and `noEndDate` statuses.
- Current fallback: browser locale with missing translations resolved from
  `en-US`. Dates and countdown numbers use locale-aware formatters.
- User impact: untranslated statuses appear in English; all states retain the
  same layout, with wrapping for longer text.
- Owner/follow-up: frontend i18n migration for wave leaderboard timing.
- Remediation: translate these keys in each supported dictionary and verify
  the compact inline phone layout with longer translated statuses.
