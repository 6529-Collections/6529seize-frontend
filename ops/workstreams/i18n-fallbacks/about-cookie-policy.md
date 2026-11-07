# About Cookie Policy localization fallback debt

- Route/component: `/about/cookie-policy`; `AboutCookiePolicy`.
- Untranslated surface: the page title, the "Cookie List" heading and intro,
  both section headings and descriptions, the Performance Cookies toggle
  state labels, the cookie name and provider cells of the existing rows, and
  the Retention Policy section are hard-coded English in JSX.
- Message-backed today: the "Last Updated" line (with a locale-formatted
  date), the table headers, the "First Party" and lifespan cells, and the
  Amazon CloudWatch RUM rows and note (`about.cookiePolicy.*`). These exist
  only in `en-US`, so every other supported locale falls back to `en-US`.
- User impact: the page reads in English for every locale, with dates
  formatted for the browser locale.
- Owner/follow-up: frontend About-page localization follow-up.
- Remediation path: move the remaining copy to `about.cookiePolicy.*`
  messages, add reviewed entries to each supported locale dictionary, check
  that the table cells wrap in the longer locales and that the toggle keeps
  its accessible name, then remove this debt record.
