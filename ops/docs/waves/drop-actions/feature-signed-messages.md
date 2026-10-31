# Signed Messages

## Overview

Signed messages let a browser sign your drops so anyone can check that a post,
edit, delete, or reaction came from your wallet, without trusting 6529.io.
The one exception is a contract wallet whose sign-in signature the reader's
browser cannot check on Ethereum: that step rests on 6529.io's check at
sign-in. Your wallet signs once; that signature lets a key held only by this
browser sign for you for 180 days. Chat does not change: messages still
appear at once, there is no wallet prompt per message, and anything that
cannot be signed is sent unsigned exactly as before.

Signed messages are on for the website in production and staging. They
are controlled by the `NEXT_PUBLIC_FEATURE_SIGNED_MESSAGES` build flag; a
build with the flag off shows none of the controls below and leaves writes
unchanged.

## Location in the Site

- Wave composer on `/waves/{waveId}` and `/messages/{waveId}`: the
  signed-messages notice.
- Drop menus (desktop `More`, touch drop menu): `Signature`.
- Drop headers in chat, feed cards, participation drops and the single-drop
  view: the **Signed by its author** seal beside the timestamp.
- Preferences: `/preferences?tab=devices` (the **Devices** tab).

## Entry Points

- **Sign in.** On a web browser that supports Ed25519 keys, the ordinary
  wallet sign-in also turns on signed messages for that wallet when the
  browser has no grant (or its grant ends within 14 days). The sign-in
  message then reads, for the default scopes: "Sign in to 6529 and turn on
  signed messages on this device until 29 Apr 2027. This device will sign
  your posts, edits, deletes and reactions so anyone can verify they came
  from your wallet. It can't move funds, change your handle, add devices or
  act as an admin. No transaction, no gas, no token approvals. (Device key
  65942d9f...d8128d49)". The date is the grant's expiry as a UTC calendar
  date; the exact expiry time is only in the device-grant resource line. If
  the wallet declines or cannot sign that message, or the sign-in fails, the
  next sign-in on the same page uses the ordinary message without a grant.
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
   The browser checks the wallet, key, scopes, expiry and exact statement in
   the message before the wallet is asked to sign; otherwise it signs in
   without a grant. Grants signed over the earlier statement ("Sign in to
   6529 and let this device post as you until ...") still verify, and a
   challenge that still uses it is still signed.
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

**Devices that can post as you** lists the grants of the profile's wallets,
newest first. It shows at most the 100 newest grants, including expired and
revoked ones, so an older grant can be missing from a long list. Each row
shows the device label (for example "Chrome on macOS"), a **This device**
marker, scopes, wallet, when it was added, when it expires (or expired or was
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
control. The first list a browser sees for a wallet is its baseline, so a
grant that already exists then never raises the alert; review the **Devices**
tab for existing grants.

## Checking a Drop's Signature

Select **Signature** in a drop menu. The browser fetches the drop's signed
events and verifies them itself: it recomputes each event id from the stored
fields and canonical body, checks the Ed25519 signature with the device key,
and checks the wallet's sign-in signature on the grant. The dialog shows:

- **Signed by its author** with the wallet, device key fingerprint, grant
  expiry, the wallet-signature check, and whether the current content is the
  signed version. A contract wallet whose sign-in signature the browser
  cannot check on Ethereum shows **Contract wallet: verified by 6529.io at
  sign-in**, and the description says 6529.io, not the browser, checked that
  wallet signature.
- **Not signed by its author** for drops sent without a device signature.
  Drops whose content moderation hides from you and anonymous competition
  entries also read this way: their signed events are not shared.
- **The signature could not be verified** when stored signatures do not
  match.
- **Couldn't check the signature right now.** with **Try again** when the
  signed events or the author's wallets cannot be loaded. A temporary failure
  is never reported as **The signature could not be verified**.

## Signed-By-Author Seal

A drop whose current content is the version its author signed shows a small
shield-check seal right after its timestamp. Its accessible name and tooltip
are **Signed by its author**. Clicking it, or focusing it and pressing Enter
or Space, opens the same **Signature** dialog, so the browser checks the
signature itself; the seal only reflects what 6529.io reports.

- The seal is positive only. Unsigned drops show nothing: posts from the
  native and desktop apps, older posts, and any drop edited without a
  signature look exactly as before.
- It appears in the drop header of chat rows, feed cards, participation
  drops, the minimal identity row and the single-drop view. On grouped chat
  rows, which have no header, a static seal appears beside the timestamp
  revealed on hover or swipe; use the drop menu's **Signature** item there.
- A signed edit keeps the seal; an unsigned edit or a delete removes it.
- The seal is hidden while the signed messages flag is off, for drops still
  being sent, and when the content is hidden by moderation or the author is
  anonymous.
- Other viewers' open chats may show the seal on a freshly signed post only
  after that post is next loaded; the author's own view shows it when the
  post is confirmed.

## Availability and Edge Cases

- Web only. 6529 Mobile and 6529 Desktop sign in exactly as before.
- Turning signed messages on never blocks sign-in: a wallet that declines or
  cannot sign the grant message can sign in again with the ordinary message.
- Proxy sessions never sign and never request a grant.
- Browsers without Ed25519 support in WebCrypto never request a grant.
- Grants are per wallet and per browser; each wallet signed in on a browser
  has its own key.

## Turning On When the Wallet Is Not Ready

**Turn on**, **Renew** and **Turn on signed messages in this browser** run the
same steps from one click and show a status line under the button.

- **No live wallet connection.** A locked browser wallet, an expired
  WalletConnect session or a wallet that did not reconnect after a reload
  leaves the profile signed in without a wallet that can sign. The click opens
  the wallet connection ("Connect your wallet to continue. If it's locked,
  unlock it first."); once the same wallet connects, the signature request
  follows without another click. Closing the connection without connecting
  shows "Your wallet didn't connect. Unlock it and try again." While the wallet
  is still reconnecting after a page load, "Reconnecting your wallet…" shows
  for up to 8 seconds first.
- **Another account.** If the wallet is connected to a different signed-in
  account, the status names the account to switch to (for example "Switch it
  to 0x1234…abcd to continue.") and offers **Reconnect wallet**. Switching the
  account in the wallet within 2 minutes continues by itself.
- **Unsupported network.** The wallet is asked to switch to the first
  supported network (Ethereum). If the switch is declined or fails, the status
  names the network to switch to.
- **Waiting for the signature.** "Check your wallet to sign", then after 8
  seconds "Open your wallet to finish signing. It may be locked."
- **WalletConnect (a wallet app on a phone).** "Open your wallet app on your
  phone and approve the signature", after 8 seconds "Don't see it? Open the
  wallet app on your phone. If nothing is waiting there, reconnect your
  wallet.", and after 20 seconds **Reconnect wallet**. Reconnecting pairs the
  wallet again (QR code or deep link) and asks for the signature again once it
  is connected. A WalletConnect session or relay error, or a phone wallet that
  returns no signature, also offers **Reconnect wallet**.
- **Results.** A declined signature shows a calm note and changes nothing.
  Other failures name the cause: the sign-in challenge could not be fetched,
  this browser could not prepare its key, the wallet could not sign, or the
  sign-in did not finish after the wallet signed.
- Progress lines use a polite live region; failures are alerts. Each step and
  failure is recorded for monitoring with a reason code only, never an address
  or key.

## Limitations / Notes

- Votes and ratings are not signed in this step.
- Copy is available in en-US; other locales fall back to en-US until
  translations are added.

## Localization exceptions

### Wallet-signed grant statement

| Field                     | Current exception                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route or component        | Sign-in challenge built by the backend and checked in `lib/device-signing/grant-message.ts` (`renderDeviceGrantStatement`, `renderLegacyDeviceGrantStatement`, `buildDeviceGrantUrn`) |
| Untranslated surface      | The statement the wallet shows ("Sign in to 6529 and turn on signed messages on this device until ...", or the earlier "let this device post as you" wording) and the resource line   |
| Current fallback behavior | Always English, with a fixed UTC date in the form `29 Apr 2027` (earlier wording: `2027-04-29 00:30 UTC`), in every locale                                                            |
| User impact               | Wallet users in other locales read the grant statement in English                                                                                                                     |
| Owner or follow-up        | Frontend and backend maintainers jointly; the text is a signed commitment that both sides render and compare byte for byte, so it is not translatable through the message system      |
| Expected remediation      | If localized statements are wanted, add them as new versioned statement templates on both sides (with vectors), never by interpolating translated copy into the current one           |

### Signed messages UI

| Field                     | Current exception                                                                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route or component        | `components/device-signing/SignedMessagesNotice.tsx`, Preferences Devices tab (`/preferences?tab=devices`), `components/waves/drops/signature/DropSignatureDialog.tsx`, `components/waves/drops/signature/DropAuthorSignedMarker.tsx` |
| Untranslated surface      | All copy in `i18n/messages/signed-messages.ts` (notice, Devices tab, signature dialog, signed-by-author seal)                                                           |
| Current fallback behavior | Keys exist only in `en-US`; other locales fall back to `en-US`. Dates and lists already use `formatDate` and `formatList`                                              |
| User impact               | Users of other locales see English copy for this feature                                                                                                               |
| Owner or follow-up        | Frontend localization maintainers; translations are outstanding now that the feature is on in production                                                               |
| Expected remediation      | Add en-GB, fr-FR, es-ES and de-DE entries for the `signedMessages.*` and `preferences.tabs.devices` keys with fallback tests                                           |

## Related Pages

- [Profile Privacy and Notification Preferences](../../notifications/feature-profile-preferences.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Drop Actions Index](README.md)
- [Docs Home](../../README.md)
