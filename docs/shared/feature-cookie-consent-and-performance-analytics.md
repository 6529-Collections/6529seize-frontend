# Cookie Consent and Performance Analytics

Parent: [Shared Index](README.md)

## Overview

This page covers the site-wide cookie consent banner and the current
performance-tracking behavior tied to that choice.

- Essential cookies stay enabled so the app can keep core session and policy
  state.
- Performance consent controls whether the site enables non-essential analytics
  tracking.
- The same preference also controls the toggle on `/about/cookie-policy`.

## Location in the Site

- Most app and about routes can read and apply this preference.
- The fixed consent banner can appear across the site when consent is still
  unresolved.
- The banner is suppressed on `/restricted` and `/access`.
- The banner `Learn more` action opens `/about/cookie-policy`.

## Entry Points

- Open the site for the first time in a browser with no consent cookies yet.
- Press `Accept` or `Reject Non-Essential` in the bottom banner.
- Open `/about/cookie-policy` directly or through the banner `Learn more` link.

## User Journey

1. The app reads `essential-cookies-consent` and
   `performance-cookies-consent`.
2. On first load, the app checks the visitor country through
   `policies/country-check`.
3. If the visitor is in the EU and both consent cookies are still missing, the
   banner stays visible until the user picks an option.
4. If the visitor is outside the EU, the app stores both consent cookies as
   `true` for 7 days and skips the banner.
5. `Accept` records consent, stores both cookies as `true` for 365 days, and
   closes the banner.
6. `Reject Non-Essential` keeps essential cookies enabled, stores performance
   consent as `false` for 365 days, closes the banner, and shows `Cookie
   preferences updated`.
7. When performance consent is `true`, the site enables performance analytics.
   Current production behavior includes Google tag loading and Mixpanel
   page-view tracking.
8. When a connected profile exists in a consented session, Mixpanel can
   identify the session with that profile ID.
9. If the connected profile is later cleared while performance consent stays
   enabled, the identified analytics session is reset and later page views can
   continue anonymously.
10. If performance consent is later turned off, analytics state is reset for
    the current browser session.

## Common Scenarios

- First EU visit: the banner is shown and no non-essential analytics start
  until the user accepts.
- First non-EU visit: the banner is skipped and performance analytics are
  enabled automatically.
- Returning visitor with `performance-cookies-consent=false`: the banner stays
  hidden and performance analytics stay disabled.
- `/about/cookie-policy` reuses the same accept/reject flows to enable or
  disable performance cookies after the initial choice.
- A connected user who has granted performance consent can be tracked across
  page changes with the current pathname and connected-profile presence.
- If that same user disconnects without revoking performance consent, later
  page views can still be tracked for the browser session without the prior
  profile identity attached.

## Edge Cases

- `/restricted` and `/access` do not render the banner even if consent is still
  unresolved.
- The performance toggle on `/about/cookie-policy` is disabled while the main
  consent banner is still waiting for the first decision.
- Clearing the connected profile after analytics identification resets the
  identified analytics session without turning off page-view tracking for the
  consented browser session.
- Browser cookie clearing can cause the country check and consent flow to run
  again on the next visit.

## Failure and Recovery

- If the country check fails before consent is established, the banner can stay
  hidden until a later successful page load.
- If the accept or reject request fails, the user sees `Something went wrong...`
  and the previous preference remains in effect.
- If analytics scripts are blocked by browser privacy settings or network
  policy, the site still works; only performance tracking fails.
- Users can recover by reloading the page and retrying the banner action or the
  `/about/cookie-policy` toggle.

## Limitations / Notes

- The banner offers only two performance choices: fully accept or reject
  non-essential tracking.
- This flow does not document legal-policy text; `/about/cookie-policy` remains
  the detailed policy page.
- Mixpanel tracking only runs on production deployments that have a public
  Mixpanel token configured.
- This page covers performance-consent behavior only. Other country-based UI
  rules that reuse the consent country are documented by their owning features.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Navigation Index](../navigation/README.md)
- [Open Data Hub](../open-data/feature-open-data-hub.md)
- [Profile Tabs](../profiles/navigation/feature-tabs.md)
