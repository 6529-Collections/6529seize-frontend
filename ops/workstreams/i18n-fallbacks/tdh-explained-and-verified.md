# TDH Explained and Verified I18n Fallback Debt

## Scope

- Routes/components: `/network/tdh/how-it-works`, `/network/tdh/specification`,
  `/network/tdh/formal`, `/network/tdh/implementations`,
  `/network/tdh/verification`, `/network/tdh/verification/{cycleDay}`, and the
  new overview sections (`TDH in a minute`, `Verified daily`, `Go deeper`)
  under `app/network/tdh/`.
- Untranslated surface: all copy is message-backed in the `network.tdh.shared`,
  `network.tdh.how`, `network.tdh.spec`, `network.tdh.formal`,
  `network.tdh.impl` and `network.tdh.verify` namespaces, with `en-US` source
  text only. Formulas, hashes, addresses and rule blocks are not translated.
- Current fallback: the sub-pages are Server Components rendered with
  `DEFAULT_LOCALE` (`en-US`), so numbers and dates use `en-US` formatting; the
  overview keeps its client `useBrowserLocale` path. Missing dictionaries fall
  back to `en-US` through `t()`.
- User impact: users in `en-GB`, `fr-FR`, `es-ES` and `de-DE` contexts see
  English copy and `en-US` number formatting on these pages.
- Owner/follow-up: frontend i18n migration for the Network reference pages.
- Remediation path: add the active locale source for the Network App Router
  routes, pass it to the TDH sub-pages instead of `DEFAULT_LOCALE`, and add
  translated dictionaries for the six namespaces.
