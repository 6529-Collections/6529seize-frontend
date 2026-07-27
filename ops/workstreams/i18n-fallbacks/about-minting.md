# Minting Meme Cards localization fallback debt

- Route/component: `/about/minting`; `AboutMinting` and
  `AboutMintingReference`.
- Untranslated surface: the canonical long-form body copy, including list
  content, callout bodies, and link-adjacent prose. Page, section, card, and
  expandable-panel titles are message-backed under `about.minting`.
- Current fallback: the About route does not yet expose an active locale and
  resolves message-backed labels with `DEFAULT_LOCALE` (`en-US`). The remaining
  canonical body copy renders directly in source-locale English.
- User impact: users cannot select another locale for this route yet, but the
  complete page remains functional and readable in English.
- Owner/follow-up: frontend About-page localization follow-up.
- Remediation path: define the rich-message pattern for copy containing links
  and emphasis, externalize the remaining canonical copy without changing its
  wording, thread the active locale through the About route, add reviewed
  entries to each supported locale dictionary, verify wrapping and accessible
  labels, then remove this debt record.
