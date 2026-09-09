# Minting The Memes localization fallback debt

- Route/component: `/about/minting`; `AboutMinting` and
  `AboutMintingReference`.
- Untranslated surface: the complete page is message-backed under
  `about.minting`, but only the `en-US` source copy is currently available.
- Current fallback: the About route does not yet expose an active locale and
  resolves the page with `DEFAULT_LOCALE` (`en-US`). Supported non-source
  locales therefore receive the repository's normal English fallback.
- User impact: users cannot select another locale for this route yet, but the
  complete page remains functional and readable in English.
- Owner/follow-up: frontend About-page localization follow-up.
- Remediation path: thread the active locale through the About route, add
  reviewed entries to each supported locale dictionary, verify wrapping and
  accessible labels, then remove this debt record.
- Last verified: 2026-08-18.
