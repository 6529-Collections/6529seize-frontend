# Signed Messages

## Overview

Signed messages let a browser sign your drops so anyone can check that a post,
edit, delete, or reaction came from your wallet, without trusting 6529.io.
Your wallet signs once; that signature lets a key held only by this browser
sign for you for 180 days. Chat does not change: messages still appear at
once, there is no wallet prompt per message, and anything that cannot be
signed is sent unsigned exactly as before.

Signed messages are currently staged behind the
`NEXT_PUBLIC_FEATURE_SIGNED_MESSAGES` flag (on for staging, off in
production). With the flag off none of the controls below are shown and
writes are unchanged.

## Location in the Site

- Wave composer on `/waves/{waveId}` and `/messages/{waveId}`: the
  signed-messages notice.
- Drop menus (desktop `More`, touch drop menu): `Signature`.
- Preferences: `/preferences?tab=devices` (the **Devices** tab).

## Entry Points

- **Sign in.** On a web browser that supports Ed25519 keys, the ordinary
  wallet sign-in also turns on signed messages for that wallet when the
  browser has no grant (or its grant ends within 14 days). The sign-in
  message then says the browser may post as you until a date, names the
  device key, and lists what it may do.
- **Turn on signed messages (one signature).** A logged-in user without a
  grant in this browser sees this notice above the composer while the
  composer is empty. **Turn on** asks for one wallet signature. The notice
  can be dismissed for 30 days per wallet.
- **Devices tab.** Preferences > Devices offers **Turn on signed messages in
  this browser** when this browser can hold a key and has no grant.

## What Happens

1. The browser creates a non-extractable Ed25519 key for the wallet and keeps
   it in IndexedDB.
2. The sign-in message carries a device-grant resource for exactly that key.
   The browser checks the wallet and key in the message before the wallet is
   asked to sign; otherwise it signs in without a grant.
3. After sign-in, each drop create, edit, delete, and reaction from this
   browser carries a device signature. Signing never delays the write; if it
   cannot finish quickly the write is sent unsigned.
4. If 6529.io rejects a signature, the write is resent once unsigned. A grant
   that is unknown, revoked, expired, missing the scope, not owned by the
   acting profile, or whose signature does not verify is forgotten locally.

## Renewal and Expiry

- In a grant's last 14 days the composer notice reads **Signed messages end
  on {date}** with **Renew** (one signature).
- After expiry, writes go unsigned and the notice offers renewal.

## Devices Tab

**Devices that can post as you** lists every grant of the profile's wallets:
device label (for example "Chrome on macOS"), a **This device** marker,
scopes, wallet, when it was added, when it expires (or expired or was
revoked), when it was last used, and its status (**Active**, **Expired**,
**Revoked**). **Revoke** asks for confirmation; earlier signatures stay
verifiable. The tab shows loading, empty (**No device can post as you yet.**)
and error (**Couldn't load your devices.** with **Try again**) states.
Proxies see **Switch to your own profile to manage devices.**

## New-Device Alert

The browser checks the profile's grants when a wave opens and at most every
10 minutes while the tab is visible. When an active grant appears that this
browser has not seen and that is not one of its own keys, the composer notice
shows **{label} can now post as you. Not you?** with **Revoke** and a dismiss
control. The first list a browser sees for a wallet is its baseline, so older
devices do not raise the alert.

## Checking a Drop's Signature

Select **Signature** in a drop menu. The browser fetches the drop's signed
events and verifies them itself: it recomputes each event id from the stored
fields and canonical body, checks the Ed25519 signature with the device key,
and checks the wallet's sign-in signature on the grant. The dialog shows:

- **Signed by its author** with the wallet, device key fingerprint, grant
  expiry, the wallet-signature check, and whether the current content is the
  signed version. Contract wallets that cannot be recovered in the browser
  show **Contract wallet: verified by 6529.io at sign-in**.
- **Not signed by its author** for drops sent without a device signature.
- **The signature could not be verified** when stored signatures do not
  match.

Signed drops carry no badge in the feed.

## Availability and Edge Cases

- Web only. The native and desktop apps sign in exactly as before.
- Proxy sessions never sign and never request a grant.
- Browsers without Ed25519 support in WebCrypto never request a grant.
- Grants are per wallet and per browser; each wallet signed in on a browser
  has its own key.

## Limitations / Notes

- Votes and ratings are not signed in this step.
- Copy is available in en-US; other locales fall back to en-US while the
  feature is staged.

## Related Pages

- [Profile Privacy and Notification Preferences](../../notifications/feature-profile-preferences.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Drop Actions Index](README.md)
- [Docs Home](../../README.md)
