# Drop link preview localization fallback

`components/waves/drops/DropPreviewPlaceholder.tsx` resolves its loading,
unavailable, not-found, link and accessible-name copy through `useBrowserLocale`
and the `dropPreview.*` message keys. Missing translations in `en-GB`, `fr-FR`,
`es-ES` and `de-DE` currently fall back to `en-US`.

Readers can use every loading and recovery state, with English fallback copy.
The placeholder allows text wrapping and uses a minimum height rather than
clipping translated content.

Owner/follow-up: frontend Waves localization maintainers. Add reviewed
translations for all five keys, then verify visible and accessible names,
long-label wrapping and missing-key fallback before removing this record.
