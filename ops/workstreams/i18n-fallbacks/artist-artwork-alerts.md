# Artist artwork alerts localization fallback debt

- Routes/components: profile actions (`useArtistArtworkAlert`) and `/notifications`
  (`NotificationArtistArtwork` and `NotificationsCauseFilter`).
- Untranslated surface: all `artworkAlerts.*` labels, On/Off and pending states,
  Main Stage description, authentication guidance, errors, retry, toast messages,
  notification sentence, untitled artwork fallback, and filter label.
- Current fallback: `t()` and `tRich()` use the browser locale; missing keys in
  `en-GB`, `fr-FR`, `es-ES`, and `de-DE` resolve to the reviewed `en-US` copy.
  Artist handles and authored artwork/competition titles stay in their original language.
- User impact: this surface remains English in non-source locales. Notification
  time uses the shared locale-aware timestamp component.
- Owner/follow-up: frontend profile and notifications maintainers, alongside the
  frontend i18n migration workstream.
- Remediation path: add reviewed translations for these keys, then verify all five
  supported locales for wrapping, menu state, accessible names, and notification links.
