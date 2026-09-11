# About The Memes localization fallback debt

- Route/component: `/about/the-memes`; `About` and `AboutMemes`.
- Untranslated surface: all visible copy and accessible names on the dedicated
  About The Memes page.
- Current fallback: the complete `en-US` messages under `about.memes` are
  resolved through `t()`. The About route does not yet expose an active locale,
  so this surface currently renders the source locale.
- User impact: users cannot select another locale for this route yet, but the
  complete message-backed surface remains functional in English.
- Owner/follow-up: frontend About-page localization follow-up.
- Remediation path: expose the active locale from the About route, pass it
  through `About` and `AboutMemes`, add reviewed entries to each supported
  locale dictionary, verify wrapping and accessible labels, then remove this
  debt record.
