# About Cookie Policy localization fallback debt

- Route/component: `/about/cookie-policy`; `AboutCookiePolicy`.
- Untranslated surface: the page title, the "Cookie List" heading and intro,
  both section headings and descriptions, the Performance Cookies toggle
  state labels, the cookie name and provider cells of the existing rows, and
  the Retention Policy section are hard-coded English in JSX.
- Message-backed, `en-US` only (every other supported locale falls back to
  `en-US`):
  - `about.cookiePolicy.lastUpdated`: the "Last Updated" line. The date
    itself is formatted for the browser locale.
  - `about.cookiePolicy.table.*`, `about.cookiePolicy.firstParty` and
    `about.cookiePolicy.lifespan.*`: the table headers, "First Party" and
    lifespan cells shared by both tables.
  - `about.cookiePolicy.cookieWithProvider` and `about.cookiePolicy.awsRum.*`
    (provider, purpose and lifespan): the Amazon CloudWatch RUM rows.
  - `about.cookiePolicy.awsRum.sampling`: the paragraph under the Performance
    Cookies table that explains RUM sampling and consent. The cookie names
    are interpolated (`{userIdCookie}`, `{sessionCookie}`). Its wording
    changed when RUM started following performance consent: it now says the
    cookies are set only with accepted performance cookies and are deleted
    when they are turned off, replacing the earlier "set whether or not you
    accept" text. Translations must use the current `en-US` wording.
- User impact: the page reads in English for every locale, with dates
  formatted for the browser locale.
- Owner/follow-up: frontend About-page localization follow-up.
- Remediation path: move the remaining copy to `about.cookiePolicy.*`
  messages, add reviewed entries for every `about.cookiePolicy.*` key
  (including the sampling paragraph) to each supported locale dictionary,
  check that the table cells and the sampling paragraph wrap in the longer
  locales and that the toggle keeps its accessible name, then remove this debt
  record.
