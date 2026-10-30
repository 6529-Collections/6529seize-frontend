# Profile hover-card REP localization fallback debt

- Component: `components/user/utils/profile/UserProfileTooltipTopRep.tsx`, used
  by shared profile hover cards on chat handles and other profile links.
- Untranslated surface: the existing `Top Rep` heading and signed REP number
  formatting through `formatNumberWithCommas`.
- Current fallback: the heading stays English and scores use comma grouping
  for every locale. Category names remain user-authored content.
- User impact: non-English viewers see the English heading and English-style
  number separators. Values, signs, and positive/negative/zero colors remain
  available in every locale.
- Scope decision: PR #4487 changes category ranking only. The requested change
  preserves existing number presentation and labels, so locale wiring and
  formatting migration are deferred together to the profile localization work.
- Owner/follow-up: frontend profile maintainers and the i18n migration workstream.
- Remediation path: move the heading into the message dictionaries, resolve the
  active locale at the hover-card boundary, and use `formatInteger`. Verify
  `en-US`, `en-GB`, `fr-FR`, `es-ES`, and `de-DE`, including missing-message
  fallback, long labels, signed scores, keyboard access, and hydration.
- Ranking contract: equal magnitudes use case-sensitive category comparison
  deliberately, matching the API's deterministic ordering. Preserve this
  ranking independently of translated labels and locale-specific formatting.
