# Wave Submission Access I18n Fallback Debt

## Scope

- Routes/components: `/waves/{waveId}`, competition Groups and Review steps,
  `WaveAccessPreview`, `WaveSubmissionAccessDetails`, and
  `WaveHeaderRestrictionButton`.
- Untranslated surface: `waves.access.*` messages for submission audiences,
  signing requirements, loading/unavailable details, rules navigation, and the
  chat-versus-submission audience summary. All submission cards use the same
  compact group row, with `waves.access.otherRules` as supporting text for
  public groups while submissions remain open. Ended submission cards also use
  `waves.dropEligibility.ended`, `waves.access.closedOn`, and
  `waves.access.publicGroup`; closing dates use the viewer's locale.
- Current fallback: the components use the browser locale; missing translations
  resolve to the complete `en-US` source dictionary.
- User impact: supported non-source locales see English access explanations.
  Group names remain user-authored content and are not translated.
- Owner/follow-up: Frontend i18n migration follow-up for wave submission access;
  tracked with this record and PR #4563.
- Remediation path: translate these keys in each supported locale dictionary,
  preserve interpolation and accessible names, and verify the access card and
  organizer summaries with longer translated strings on desktop and phone.
