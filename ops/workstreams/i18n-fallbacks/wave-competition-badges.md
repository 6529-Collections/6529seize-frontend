# Wave competition badges localization fallback debt

- Route/components: wave chat, submission, and winner drop author badges;
  `WaveCompetitionPreviewModalContent`, `WaveCompetitionEntries`, and
  `WaveCompetitionBadges`.
- Untranslated surface: the wave-scoped participant/winner badge tooltips and
  competition-entry preview modal labels, loading/error states, entry labels,
  and accessible names.
- Current fallback: the complete `en-US` messages under
  `waves.competitionBadges` are resolved through `t()`. The supported `en-GB`,
  `fr-FR`, `es-ES`, and `de-DE` locales fall back to `en-US` for these new keys.
- User impact: users of non-source locales see functional English copy on this
  surface until reviewed translations are added.
- Owner/follow-up: frontend wave UI localization follow-up.
- Remediation path: add reviewed `waves.competitionBadges` entries to each
  supported locale dictionary, verify wrapping and accessible labels, then
  remove this debt record.
