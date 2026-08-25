# Native iOS EULA Consent

Parent: [Shared Index](README.md)

## Overview

The native iOS app requires acceptance of the current End User License
Agreement before any application providers or page content can start. The
current agreement version is `2026-08-24`, and an acceptance is valid for 365
days.

Android and ordinary web sessions do not use this gate.

## User Journey

1. On native iOS launch, the app checks the `eula-consent` cookie for the exact
   current version.
2. If the cookie is missing or stale, the app checks for a current, unexpired
   acceptance saved for the native device ID.
3. A valid device acceptance restores the versioned cookie through its
   original expiration date and opens the app.
4. Otherwise, the app shows only the mandatory EULA dialog. The agreement
   cannot be dismissed with Escape or a backdrop press.
5. The user must scroll through the agreement before `Agree` becomes available.
6. The app sends the device ID, native platform, and accepted EULA version to
   the API. It opens the application only after that request succeeds.

Changing the current EULA version makes prior cookies and device records stale,
so the agreement is shown again.

## Consent Receipt Trust Model

The current, unexpired versioned cookie is intentionally the installed app's
local consent receipt. It allows an ordinary returning iOS session to open
without a network round trip. The app creates that receipt only after the API
successfully persists acceptance, and the cookie expiration enforces the local
365-day validity period.

The cookie is not an authentication or security boundary; like all client-side
state, a device owner can modify it outside the normal app flow. The backend
record provides the durable acceptance copy used to restore the receipt after
reinstall. When no valid local receipt exists, missing, stale, expired, or
differently versioned backend acceptance cannot unlock the app.

## Failure and Recovery

- While the consent check is running, application content is not mounted.
- If the device check fails without a valid current cookie, the app remains
  blocked and offers `Retry`.
- If saving acceptance fails, the EULA remains visible and explains that the
  user can try again.
- Reinstalling the iOS app can restore a current, unexpired device acceptance;
  missing, expired, unversioned, or differently versioned records cannot.

## Content Safety Wording

The agreement describes zero tolerance for objectionable content and abusive
users, narrowly defined safety controls before distribution, in-app reporting
and blocking, and report review with appropriate action within 24 hours. It
also explains that profanity, criticism, satire, political opinions, and
merely offensive opinions are not automatically prohibited. Support is
available at `support@6529.io`.

The agreement does not claim that every message undergoes AI analysis or broad
abusiveness scanning.

## Localization Fallback Debt

The gate's operational status, error, control, and accessible-name strings are
message-backed and fall back through `en-US`. The legal agreement clauses remain
English-only because translating binding legal text requires a dedicated legal
review workflow. The affected surface is `components/eula/EULAModal.tsx` and
its `EULA*Sections.tsx` legal-copy components; the impact is that non-English
iOS users read the agreement in English. The 6529 Legal/Product owners should
establish reviewed locale-specific agreements before enabling translated legal
copy. Remediation requires a version bump plus legal approval for every
translated agreement.

## Related Pages

- [Shared Index](README.md)
- [Cookie Consent and Performance Analytics](feature-cookie-consent-and-performance-analytics.md)
- [Content Moderation](../content-moderation.md)
