# EMMA entry and help locale fallback

- Routes: `/emma`, `/emma/help`, and the `/emma/plans` header.
- Source: `i18n/messages/emma.en-US.json`; visible copy and accessible names use
  the shared message system with `DEFAULT_LOCALE`.
- `en-GB`, `fr-FR`, `es-ES`, and `de-DE` use the English fallback. There is no
  locale switcher on these surfaces. Existing plan/editor controls remain English.
- User impact: all routes remain readable in English; translations are pending.
- Owner: frontend localization maintainers. Follow-up: add reviewed translations
  and replace the `DEFAULT_LOCALE` call sites with the resolved user/request locale, then verify wrapping and accessible labels in all
  supported locales. The original help copy, including TDH threshold wording,
  is preserved pending a separate policy-copy review.
