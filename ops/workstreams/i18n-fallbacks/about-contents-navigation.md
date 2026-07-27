# About Contents Navigation I18n Fallback Debt

## Scope

- Routes/components: `/about/{section}`, `/about/tech/{reportSlug}`,
  `/about/tech/wallet-authentication`, `components/about/About.tsx`, and the
  wallet authentication About Tech route.
- Untranslated surface: the new About Contents dropdown labels, accessible
  names, About document title, and wallet authentication page/metadata strings
  are message-backed but still use the migration default locale because the
  About route tree does not yet receive an active locale resolver.
- Current fallback: `DEFAULT_LOCALE` (`en-US`) is resolved during render for
  the About dropdown/title and at module initialization for wallet auth
  metadata. Missing non-source dictionaries fall back to `en-US` through
  `t()`.
- User impact: users in `en-GB`, `fr-FR`, `es-ES`, and `de-DE` contexts will
  see English copy on these About surfaces until locale routing/context is
  threaded through this route family.
- Owner/follow-up: Frontend i18n migration follow-up for the About route family.
- Remediation path: add the active locale source for the About App Router
  routes, pass that locale into `About`, `AboutContentsDropdown`, Tech report
  metadata, and wallet auth metadata/rendering, and remove module-level
  `DEFAULT_LOCALE` constants from touched About surfaces once a runtime locale
  is available.
