# Public contract review localization fallback debt

- Route/components: reusable public contract review pages, active and immutable
  version feedback ledgers, audience reading paths, source range controls,
  `PublicReviewFeedbackComposer`, and `PublicReviewLedger`.
- Untranslated surface: all public-review feedback fields, validation and
  connection states, ledger filters, lifecycle/deployment/audit status messages,
  record labels, and
  accessible names, keyboard skip actions, table-region labels, and dynamic
  source-integrity announcements.
- Current fallback: the complete `en-US` messages under `publicReview.*` are
  resolved through `t()`. The supported `en-GB`, `fr-FR`, `es-ES`, and `de-DE`
  locales fall back to `en-US` for these new keys.
- User impact: users of non-source locales can use the full review and feedback
  workflow, but see English copy until reviewed translations are added.
- Owner/follow-up: frontend public-review localization follow-up.
- Remediation path: add reviewed `publicReview.*` entries to each supported
  locale dictionary, verify responsive wrapping and accessible announcements,
  then remove this debt record.
