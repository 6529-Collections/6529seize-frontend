# Cookie Consent and Performance Analytics

Parent: [Shared Index](README.md)

## Overview

This page covers the site-wide cookie consent banner and the current
performance-tracking behavior tied to that choice.

- Essential cookies stay enabled so the app can keep core session and policy
  state.
- Performance consent controls the consent-gated analytics: Google Analytics,
  Mixpanel and Amazon CloudWatch RUM performance monitoring (see Performance
  Monitoring Cookies below).
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
4. If the visitor is outside the EU, the banner is skipped. When no
   performance choice is stored yet, the app stores both consent cookies as
   `true` for 7 days. A stored accept or reject is never replaced by this
   default.
5. `Accept` records consent, stores both cookies as `true` for 365 days, and
   closes the banner.
6. `Reject Non-Essential` keeps essential cookies enabled, stores performance
   consent as `false` for 365 days, closes the banner, and shows `Cookie
   preferences updated`.
7. When performance consent is `true`, the site enables performance analytics.
   Current production behavior includes Google tag loading and Mixpanel
   page-view tracking. The Google tag is kept out of first load: it starts
   loading once the page has finished loading and the browser is idle, at the
   visitor's first tap, click, key press or mouse-wheel scroll, or 10 seconds
   after the consent decision, whichever comes first. Its first page view
   still reports the page the visitor was on when consent was decided, and a
   page change made before the tag was ready gets its own page view.
8. When a connected profile exists in a consented session, Mixpanel can
   identify the session with that profile ID.
9. If the connected profile is later cleared while performance consent stays
   enabled, the identified analytics session is reset and later page views can
   continue anonymously.
10. If performance consent is later turned off, analytics state is reset for
    the current browser session.

## Common Scenarios

- First EU visit: the banner is shown and Google Analytics, Mixpanel and RUM
  do not start, and no RUM cookies are set, until the user accepts.
- First non-EU visit: the banner is skipped and performance analytics are
  enabled automatically.
- Returning visitor with `performance-cookies-consent=false`, in or outside
  the EU: the banner stays hidden, the rejection is kept, and Google Analytics,
  Mixpanel and RUM stay disabled.
- Returning non-EU visitor with a stored acceptance: the acceptance is kept
  with its original expiry. The 7-day default is not extended by later visits;
  once it expires, the next non-EU visit applies it again.
- `/about/cookie-policy` reuses the same accept/reject flows to enable or
  disable the consent-gated analytics after the initial choice. Turning it off
  stops RUM in the open page and deletes `cwr_u` and `cwr_s`.
- A connected user who has granted performance consent can be tracked across
  page changes with the current pathname and connected-profile presence.
- If that same user disconnects without revoking performance consent, later
  page views can still be tracked for the browser session without the prior
  profile identity attached.
- Consented production sessions can also send product-health events for Waves
  feed loading and auth session refresh outcomes. These events use route
  families, status buckets, endpoint families, booleans, and counts; they do
  not include wallet addresses, profile handles, raw wave or drop IDs, tokens,
  or full request URLs.

## Edge Cases

- `/restricted` and `/access` do not render the banner even if consent is still
  unresolved.
- The performance toggle on `/about/cookie-policy` is disabled while the main
  consent banner is still waiting for the first decision.
- Clearing the connected profile after analytics identification resets the
  identified analytics session without turning off page-view tracking for the
  consented browser session.
- Turning performance consent off before the Google tag has started loading
  cancels the load. Once the tag has loaded, it stays loaded until the page is
  reloaded.
- A visit that ends before the Google tag starts loading is not recorded by
  Google Analytics.
- Browser cookie clearing can cause the country check and consent flow to run
  again on the next visit.
- After a completed country check the app also stores a layout-only marker in
  browser local storage (`6529:us-country-hint`, set when the country was US and
  removed for any other answer). It only lets the iOS app keep blank space for
  the Memes subscription row during the next check; it never enables
  purchasing UI, and the app works without it when storage is unavailable.

## Failure and Recovery

- If the country check fails before consent is established, the banner can stay
  hidden until a later successful page load.
- If the accept or reject request fails, the user sees `Something went wrong...`
  and the previous preference remains in effect.
- If analytics scripts are blocked by browser privacy settings or network
  policy, the site still works; only performance tracking fails.
- If Waves feed or auth refresh telemetry is blocked, product behavior is
  unchanged; the app simply loses that diagnostic signal.
- Users can recover by reloading the page and retrying the banner action or the
  `/about/cookie-policy` toggle.

## Wallet SDK Telemetry (Not Consent-Gated)

The wallet libraries load only when a visitor opens the connect dialog or
returns with a stored wallet session. Their telemetry does not read the
performance consent choice. Measured on `@reown/appkit` 1.8.19 and
`@base-org/account` 2.4.0; re-check after either version changes.

- Reown AppKit runs with its optional analytics off
  (`features.analytics: false`), so modal events such as opening, closing,
  network switches and disconnects are not reported. AppKit still sends these to
  `pulse.walletconnect.org`, and no setting in this version turns them off:
  - `INITIALIZE`, once AppKit starts: the full page URL and the app's AppKit
    settings.
  - `WALLET_IMPRESSION_V2`, while the wallet list is shown: wallet names,
    ranks and list position, with the full page URL.
  - `CONNECT_SUCCESS`, after a wallet connects: the connected wallet address
    and the full page URL.
  - SDK error reports (`/e`): error name, message, stack trace and the full
    page URL.
- The Base Account (Coinbase) wallet option is registered with the SDK's
  telemetry turned off. Our pages make no requests to Coinbase's analytics
  endpoint (`cca-lite.coinbase.com`), even when that option is chosen. The
  Base Account window that option opens is Coinbase's own site.
- Wallet RPC reads (for example the homepage mint status) go to Reown's RPC
  endpoint, which sees the visitor's IP address.

## Limitations / Notes

- The banner offers only two performance choices: fully accept or reject
  non-essential tracking.
- This flow does not document legal-policy text; `/about/cookie-policy` remains
  the detailed policy page.
- Mixpanel tracking only runs on production deployments that have a public
  Mixpanel token configured.
- The Mixpanel SDK is not part of the initial page download. The browser
  fetches it only after performance consent is `true`, so visitors without
  that consent never download it. Page-view and profile identification resume
  as soon as it arrives.
- The [first-party collector](../developer/first-party-telemetry.md), on in
  staging only for now, sets no cookies or storage and runs without the
  performance choice. It reads the consent country only to leave out its daily
  `fp` hash for EU/EEA, UK and unknown countries.
- This page covers performance-consent behavior only. Other country-based UI
  rules that reuse the consent country are documented by their owning features.

## Performance Monitoring Cookies (Amazon CloudWatch RUM)

- Production deployments that have an AWS RUM app monitor configured load
  Amazon CloudWatch RUM for a sample of browser sessions whose performance
  consent is accepted. It measures page load speed, browser errors and failed
  requests and sends them to the 6529 Amazon Web Services account.
- The sample rate is the public `AWS_RUM_SAMPLE_RATE` setting
  (`config/env.schema.ts`), which the production build workflows fill from
  the `AWS_RUM_SAMPLE_RATE` GitHub Actions secret. When it is unset or invalid,
  `DEFAULT_SAMPLE_RATE` (0.2, so 20% of sessions) in
  `components/monitoring/AwsRumProvider.tsx` applies. The sampling decision is
  made once per browser tab session, after consent and before the RUM code
  downloads.
- Sampled sessions set two first-party cookies on `.6529.io`:
  - `cwr_u`: a random visitor ID kept for 30 days.
  - `cwr_s`: the current session, kept for 30 minutes after the last
    activity.
- `/about/cookie-policy` lists both cookies in the Performance Cookies table,
  with their purpose, provider and lifespan. The note below the table explains
  the sampling and that the cookies are set only with performance consent.
- Consent: RUM follows the performance choice like Google Analytics and
  Mixpanel. With no stored choice (EU visitors before the banner choice) it
  does not start. Outside the EU the 7-day default acceptance starts it. A
  rejection, from the banner or the `/about/cookie-policy` toggle, stops RUM
  in the open page and deletes `cwr_u` and `cwr_s`; a stored rejection also
  deletes any RUM cookies left from earlier visits.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Navigation Index](../navigation/README.md)
- [Open Data Hub](../open-data/feature-open-data-hub.md)
- [Profile Tabs](../profiles/navigation/feature-tabs.md)
