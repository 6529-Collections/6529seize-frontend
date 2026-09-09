# iOS purchasing visibility localization fallback debt

- Routes/components: `/join`, About navigation, and
  `/tools/subscriptions-report`.
- Untranslated surface: `join6529.faq.walletEth.restrictedAnswer`,
  `about.contents.groups.collections`, and `tools.subscriptionsReport.*`.
- Current fallback: the browser-locale message helpers use the reviewed
  `en-US` source for missing `en-GB`, `fr-FR`, `es-ES`, and `de-DE` translations.
  About navigation retains its existing source-locale behavior.
- User impact: affected visible and accessible labels remain functional
  English; purchasing visibility and route fallbacks are independent of locale.
- Adjacent debt: the rest of the report's table headings, download controls,
  and error messages remain in English pending report-wide localization.
- Owner/follow-up: frontend Join, About, and reporting localization owners.
- Remediation: add reviewed translations for these keys, migrate the remaining
  report copy, and verify wrapping and accessible names in all five locales.
