# Signed Posts

## Overview

Signed Posts let a browser or supported app sign your drops so anyone can check that a post,
edit, delete, or reaction came from your wallet, without trusting 6529.io.
A contract wallet's sign-in signature is checked on Ethereum by the reader's
browser; when that check cannot run, the drop is not shown as signed. Your
wallet signs once; that signature lets a key held only by this browser sign
for you for 180 days. Messages still appear at once and there is no wallet
prompt per message. Without a grant, writes are sent unsigned exactly as
before; with one, a write that cannot be signed waits for your choice
instead of going out unsigned (see
[When a Write Cannot Be Signed](#when-a-write-cannot-be-signed)).

Signed messages are on for the website in production and staging. They
are controlled by the `NEXT_PUBLIC_FEATURE_SIGNED_MESSAGES` build flag; a
build with the flag off shows none of the controls below and leaves writes
unchanged. In 6529 Mobile and 6529 Desktop they also need the
`NEXT_PUBLIC_FEATURE_APP_DEVICE_GRANTS` build flag and a compatible released app.
In the website's **Connect Device** dialog, choose **Connect only** to sign in
without granting device permissions. For secure setup, choose **Connect with
Post Signing & DM Encryption**. Mobile uses a QR code. Desktop uses a private
app link and requires 6529 Desktop v0.4.0 or later (see
[In 6529 Mobile and 6529 Desktop](#in-6529-mobile-and-6529-desktop)).

## Location in the Site

- Wave composer on `/waves/{waveId}` and `/messages/{waveId}`: the
  signed-messages notice.
- Drop menus (desktop `More`, touch drop menu): `Signature`.
- Drop headers in chat, feed cards, participation drops and the single-drop
  view: the **Signed by its author** seal beside the timestamp.
- Embedded drops: link previews of 6529 drop links, quoted drops, and the
  author lines of leaderboard, winner, Memes and quick-vote cards also show
  the seal by the timestamp.
- Any page with a pending signed write: the **Couldn't sign this ...**
  prompt.
- Preferences: `/preferences?tab=devices` (the **Device Permissions** tab).

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
- **Combined web sign-in.** Where encrypted messages are
  on, the same signature can also turn them on for this browser: the
  message then grants a second key (the browser's encrypted-messages key)
  with the same expiry, adds "It will also encrypt (send) and decrypt (read)
  your end-to-end encrypted messages, which 6529.io cannot read." after the
  sentence about signing, and ends "(Device key ..., encrypted messages key
  ...)". The browser checks that the
  message grants exactly its two keys before the wallet is asked. If the
  server does not offer the combined message, or the browser cannot prepare
  the second key within two seconds, the sign-in grants signed messages only
  and encrypted messages keep their own one-signature prompt. Revoking the
  combined grant here also turns off its encrypted messages. Separate grants
  retain separate revocation.
- **Turn on signed posts.** A signed-in user without a grant sees the notice
  above an empty composer. When encrypted DMs can be turned on in the same
  signature, it reads **Turn on signed posts and encrypted DMs** ("One wallet
  signature, no gas. Lasts 180 days in this browser."), matching the dialog it
  opens. **Turn on** opens the shared permission dialog before any wallet
  request. Dismissing the setup notice
  hides it for 30 days per wallet; it does not revoke anything.
- **Account menu and Device Permissions.** When both permissions are missing,
  **Turn on signed posts and encrypted DMs** opens a dialog with Signed Posts
  first and the full Encrypted DMs explanation second. If only one is missing,
  it shows **Turn on signed posts** or **Turn on encrypted DMs**. The **Sign** button
  explicitly names both or the remaining permission. The action is absent when
  both are on. `/messages/encrypted` uses the same consent content inline.
  No device-setup popup opens automatically after sign-in.
- **Connection sharing.** Supported receiving apps can sign in and enroll from
  one browser-approved secure link, without connecting a wallet in the app.
  Connect-only sharing does not enable permissions. See
  [Connect Device](../../navigation/feature-share-modal.md#connect-device).

Combined setup uses distinct signing and encryption keys with one authorization.
Explicit signing-only and encryption-only setup remain supported. If combined
setup cannot complete, the user sees the result and explicit fallback choices;
there is no silent switch to another requested permission. If signing succeeds
but encryption registration fails, signing remains on while encryption is retried.

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
   browser carries a device signature. The key and grant are loaded ahead of
   time (when a composer or the editor opens or gains focus, and when the tab
   becomes visible again), so signing normally adds no noticeable delay. The
   pending drop shows immediately while it is signed.
4. With a grant, a write is never sent unsigned without your choice. See
   [When a Write Cannot Be Signed](#when-a-write-cannot-be-signed).

## When a Write Cannot Be Signed

This applies only when this browser (or app) holds an active grant for the
signed-in wallet. Without a grant, and in proxy sessions and browsers without
Ed25519, writes are sent unsigned exactly as before.

- A write waits up to 10 seconds for its signature. The pending drop stays
  visible meanwhile.
- If signing does not finish in time, or IndexedDB, the cross-tab key lock or
  WebCrypto fails, the write stays pending and a prompt asks what to do:
  - Posts and edits: a dialog titled **Couldn't sign this post** (or
    **Couldn't sign this edit**) says nothing has been sent yet and offers
    **Try again** and **Send unsigned** (**Save unsigned** for edits). It has
    no dismiss action, so the post only continues by your choice.
  - Reactions and deletes: a small prompt titled **Couldn't sign this
    reaction** (or **Couldn't sign this deletion**) offers **Try again**,
    **Do it unsigned** and **Cancel**; Escape also cancels. A cancelled
    reaction or delete is not sent.
- If 6529.io rejects the signature, the write is not resent by itself. The
  same prompt says 6529.io didn't accept the signature; **Try again** signs
  again with a fresh sequence number.
- If the rejection shows the grant can no longer sign (unknown, revoked,
  expired, missing the scope, not owned by the acting profile, or a signature
  that does not verify), the grant is forgotten locally and the prompt says
  signed messages are no longer on in this browser. It offers **Turn on
  signed messages** (one wallet signature, then the write is signed and
  sent) and **Send unsigned**. If turning them on fails, the prompt stays
  with **Couldn't turn on signed messages. Try again, or continue
  unsigned.**
- If 6529.io does not accept device signatures at all (for example a
  backend rollback to a version without signed writes), the write is still
  never resent unsigned by itself: the same prompt says 6529.io didn't
  accept the signature, and the grant is kept.
- Several prompts are shown one at a time, oldest first.
- Each fallback is recorded for monitoring with a reason code (timeout,
  lock, storage-error, crypto-error, rejected, grant-unusable or
  unsupported), the signing phase and timings only: never content, keys,
  signatures, grant ids or wallet addresses.

## Renewal and Expiry

- Grants normally last 180 days. During the last 14 days the avatar status names
  the permission's expiry and renewal reminders appear in the relevant area:
  signing-only in Waves, encryption-only in Messages, and combined grants in both.
  Messages includes the inbox and selected chats, with the reminder above the input.
- Renewal requires another wallet signature. Renewing an existing encryption
  device preserves its keys and history; expiry alone does not erase local history.
- Signing grants are not used in their last minute. After they become unusable,
  writes go unsigned as without a grant until renewed. The status identifies the
  permission as expired once its expiry is reached.
- `?showRenewal=true` previews reminder layout only in Waves or Messages. When
  no permission is due, preview copy and disabled renewal actions make that clear.

## Device Permissions

Preferences → **Device Permissions** lists **Authorized devices** with signing,
encryption or combined permissions. It shows device names, **This device**,
wallets, added/expiry/last-used dates and **Active**, **Expired** or **Revoked**
status. Signing history includes at most the newest 100 grants, so older grants
can be absent from a long list. Proxies cannot manage devices.

If this browser cannot read its own keys (for example when its site storage is
unavailable), no entry is marked **This device**: the page says so, and the
revoke confirmation warns that the permission may be this browser's own.

Rename any unrevoked device you own from an authenticated browser or app. This
updates the existing server name, reflected on other devices when their lists
refresh; linked signing and encryption entries share it. It is not a local nickname.
Generating a secure connection QR alone creates no active device entry: the
receiving app must accept and register it.

**Revoke** confirms exactly which permissions will stop. A combined grant revokes
both Signed Posts and Encrypted DMs; a separate grant revokes only its permission.
You cannot revoke half of a combined grant. Earlier post signatures remain
verifiable. Revoking this encryption device clears its local encrypted keys and
history, unlike renewal. Re-enabling does not restore deleted history without an
encrypted backup. See [Encrypted messages](../../encrypted-messages.md#renewal-and-revocation).

## New-Device Alert

The browser checks the profile's grants when a wave opens, when the app
returns to focus, and every 10 minutes while visible. An active grant for
another device can raise a notice above the composer. Choose **Got it**
to clear that notice across devices as their grant lists refresh. Choose
**Revoke** to remove the device's permission. The first list a browser sees
for a wallet is its baseline. If the browser loses its local signing key but
still remembers its grant, that grant does not trigger a new-device notice.
Set up Signed Posts again to sign from that browser. Review existing grants in
**Device Permissions**.

## Checking a Drop's Signature

Select **Signature** in a drop menu. The browser fetches the drop's signed
events and verifies them itself: it recomputes each event id from the stored
fields and canonical body, checks the Ed25519 signature with the device key,
and checks the wallet's sign-in signature on the grant. The dialog shows:

- **Signed by its author** with the wallet, device key fingerprint, where the
  device was authorized (**Authorized from**), grant expiry, the
  wallet-signature check, and whether the current content is the signed
  version. The content shown must be the signed content: title and text,
  media (by URL), attachments (by id), a quoted drop when one is shown, the
  reply target when one is shown, and for an edit, that the edit names this
  drop. A contract wallet's sign-in signature counts only when
  the wallet has contract code on Ethereum and its EIP-1271 check accepts
  the signature; the row then reads **Contract wallet: verified on Ethereum
  in your browser**.
- **Couldn't verify this signature right now** with a neutral icon, never
  the signed seal, when the sign-in signature needs that contract-wallet
  check on Ethereum and it cannot run (no Ethereum connection, a failed
  read, or a grant signed on another chain). The same neutral state names
  the origin when a 6529 Mobile or Desktop grant was authorized from
  anywhere other than a 6529 site host or **6529 Desktop**. An ordinary
  wallet whose signature does not match reads **The signature could not be
  verified**.
- **Not signed by its author** for drops sent without a device signature.
  Drops whose content moderation hides from you and anonymous decision
  entries also read this way: their signed events are not shared.
- **The signature could not be verified** when stored signatures do not
  match, or when the wallet signed the grant anywhere but the 6529 app
  (exactly 6529.io; staging also accepts staging.6529.io; other 6529.io
  hosts, such as the IPFS and media gateways, never count). Signed messages
  are not turned on from a sign-in challenge for any other host.
- **Couldn't check the signature right now.** with **Try again** when the
  signed events or the author's wallets cannot be loaded. A temporary failure
  is never reported as **The signature could not be verified**.

## Signed-By-Author Seal

A drop that 6529.io marks as signed by its author shows a small seal right
after its timestamp. When the seal comes into view, the browser fetches the
drop's signed events and verifies them itself, as the **Signature** dialog
does. Only drops 6529.io marks as signed are checked, at most three at a
time; a check still waiting when its seal scrolls away is dropped and
queued again if the seal returns. Verdicts are kept in memory for the page
session, and a check that fails to load or times out is not retried by
itself (open the **Signature** dialog to try again). The seal's accessible
name, tooltip and shape follow that check:

- **Checking the author's signature**: a faint outlined shield, until the
  check finishes.
- **Signed by its author**: the filled shield-check, only after the browser
  verified the signature over the content shown.
- **Signed, not yet verified**: a question mark, when the browser cannot
  verify it here (a contract wallet, whose check on Ethereum runs only in the
  dialog; an unrecognized origin; part of the signed post that cannot be
  read with certainty; or a lookup that failed).
- **Signed by a wallet that is not on this profile**: a person with a minus
  sign, neutral, when the signing wallet is not one of the author's wallets
  now (for example, it was removed from the profile), so the signature
  cannot be attributed to this author. The dialog names the wallet.
- **The signature doesn't match this post**: a shield with an exclamation
  mark, when the signature does not verify or covers other content.

Clicking the seal, or focusing it and pressing Enter or Space, opens the
**Signature** dialog; its verdict, including a contract wallet checked on
Ethereum, also updates the seal.

- The seal is positive only. Unsigned drops show nothing: posts from the
  apps without an active signing grant, older posts, and any drop edited
  without a signature look exactly as before.
- It appears in the drop header of chat rows, feed cards, participation
  drops (including ended ones), the minimal identity row and the single-drop
  view, and by the timestamp of embedded drops: link previews of 6529 drop
  links and serial-number links, quoted drops, and leaderboard, winner,
  Memes and quick-vote cards. Activating it there opens the dialog without
  opening the linked or quoted drop.
- Message search results and decision entry cards are single buttons, so
  they show a static seal and add the drop's signed status to the button's
  name: ", signed by its author" only once this browser verified it,
  otherwise ", signed, not yet verified".
- Reply-to lines and the composer's reply or quote preview show no
  timestamp and no seal.
- On grouped chat rows, which have no header, a static seal appears beside
  the timestamp revealed on hover or swipe and follows the same check. Use
  the drop menu's **Signature** item there.
- A signed edit keeps the seal; an unsigned edit or a delete removes it. Live
  edits update the recipient's author-signature status along with the content,
  without requiring a reload.
- The seal is hidden while the signed messages flag is off, for drops still
  being sent, and when the content is hidden by moderation or the author is
  anonymous.
- Other viewers' open chats may show the seal on a freshly signed post only
  after that post is next loaded; the author's own view shows it when the
  post is confirmed.

### Grouped Chat Posts

When consecutive chat posts by the same author render under one header (the
chat's usual grouping), the header's seal stands for the whole group:

- Every post verified by this browser: the full seal, named for example
  **All 3 posts signed by their author**.
- Some posts verified: an outlined seal (a different shape, not only a
  different color), named for example **2 of 3 posts signed by their
  author**.
- While posts are being checked: **Checking the signatures in this group**.
  When a post's signature does not match: **A signature in this group
  doesn't match its post**. When a post was signed by a wallet that is not
  on the author's profile: **A post in this group was signed by a wallet
  that is not on this profile**. When none could be verified here: **Signed
  posts, not yet verified**.
- No post marked signed: no seal on the header.
- Activating the header seal opens **Signatures in this group**, which lists
  each post with its time, the first line of its text (or **Post without
  text**) and this browser's status for it. Opening a row shows that post's
  full Signature details, exactly like the single-drop dialog.
- Each grouped row keeps its own static seal beside its hover or swipe
  timestamp.
- The count follows the group live: a new post joining the group or an
  unsigned edit updates it.
- A header with no grouped posts behaves like any single drop.

## In 6529 Mobile and 6529 Desktop

Ordinary app sign-in uses its own session message, not the website's
Sign-In with Ethereum message, and does not itself enable Signed Posts. A secure
connection-sharing link can sign in and enroll a compatible app together. Direct
setup and renewal can request one app grant instead: an EIP-712 typed-data signature (domain "6529 Device Grant")
that the wallet shows as structured fields with this statement:

- "Turn on signed messages on this device until 29 Apr 2027. This device will
  sign your posts, edits, deletes and reactions so anyone can verify they
  came from your wallet. It can't move funds, change your handle, add devices
  or act as an admin. No transaction, no gas, no token approvals. (Device key
  65942d9f...d8128d49)"
- When encrypted messages are on and the wallet has a profile, the same
  signature also turns them on for the app: the statement adds "It will also
  encrypt (send) and decrypt (read) your end-to-end encrypted messages, which
  6529.io cannot read." and ends "(Device key ..., encrypted messages key
  ...)". The encrypted-messages key then registers in the background without
  another prompt.

The existing wallet wording is retained for this rollout. The grant's origin is
"6529 Desktop" in the desktop app and the site host (6529.io) in the phone
app. App grants last 180 days, appear under **Device Permissions**
like any other grant (labelled, for example, "6529 Mobile on iPhone"), sign
writes exactly as above, and anyone can verify them: the drop's
**Signature** dialog checks the wallet's typed-data signature, or a contract
wallet's EIP-1271 check on Ethereum. Revoking a combined app grant turns off both permissions. A separate grant
revokes only its own permission.

App wallets sign the grant inside the app. WalletConnect wallets receive an
`eth_signTypedData_v4` request, so the wallet app must support typed-data
signing (most do).

Signed messages need WebCrypto Ed25519 keys: iOS 17 or later in 6529 Mobile
(earlier iOS versions send writes unsigned exactly as before), or sufficiently recent Android WebView support. A pending Desktop
implementation is not evidence that a released app supports it. Encrypted messages in 6529 Mobile need iOS
16.4 or later.

## Availability and Edge Cases

- On the website, signing in turns signed messages on (see
  [Entry Points](#entry-points)); in the apps, **Turn on signed messages**
  asks for an app grant (see
  [In 6529 Mobile and 6529 Desktop](#in-6529-mobile-and-6529-desktop)).
- Turning signed messages on never blocks sign-in: a wallet that declines or
  cannot sign the grant message can sign in again with the ordinary message.
- Proxy sessions never sign and never request a grant.
- Browsers without Ed25519 support in WebCrypto never request a grant.
- Grants are per wallet and per browser; each wallet signed in on a browser
  has its own key.

## Turning On When the Wallet Is Not Ready

**Turn on** and the Device Permissions setup action first open the consent
dialog. After you choose its **Sign** button, setup connects the matching wallet
if needed and continues automatically to signing. **Renew** also uses that wallet
connection/signing flow. Progress appears below the relevant action.

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

| Field                     | Current exception                                                                                                                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route or component        | Sign-in challenge built by the backend and checked in `lib/device-signing/grant-message.ts` (`renderDeviceGrantStatement`, `renderLegacyDeviceGrantStatement`, `buildDeviceGrantUrn`); the app grant statement in `lib/device-signing/app-grant.ts` |
| Untranslated surface      | The statement the wallet shows ("Sign in to 6529 and turn on signed messages on this device until ...", or the earlier "let this device post as you" wording) and the resource line                                                                 |
| Current fallback behavior | Always English, with a fixed UTC date in the form `29 Apr 2027` (earlier wording: `2027-04-29 00:30 UTC`), in every locale                                                                                                                          |
| User impact               | Wallet users in other locales read the grant statement in English                                                                                                                                                                                   |
| Owner or follow-up        | Frontend and backend maintainers jointly; the text is a signed commitment that both sides render and compare byte for byte, so it is not translatable through the message system                                                                    |
| Expected remediation      | If localized statements are wanted, add them as new versioned statement templates on both sides (with vectors), never by interpolating translated copy into the current one                                                                         |

### Signed messages UI

| Field                     | Current exception                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route or component        | `components/device-signing/SignedMessagesNotice.tsx`, `components/device-signing/SignedWriteDecisionHost.tsx`, Preferences Device Permissions tab (`/preferences?tab=devices`), `components/waves/drops/signature/DropSignatureDialog.tsx`, `components/waves/drops/signature/DropGroupSignatureDialog.tsx`, `components/waves/drops/signature/DropAuthorSignedMarker.tsx` |
| Untranslated surface      | All copy in `i18n/messages/signed-messages.ts` (notice, Device Permissions tab, signature dialogs, signed-by-author seals, "Couldn't sign" prompts); plural forms use `.one` and `.other` keys                                                                                                                                                                             |
| Current fallback behavior | Keys exist only in `en-US`; other locales fall back to `en-US`. Dates and lists already use `formatDate` and `formatList`                                                                                                                                                                                                                                                  |
| User impact               | Users of other locales see English copy for this feature                                                                                                                                                                                                                                                                                                                   |
| Owner or follow-up        | Frontend localization maintainers; translations are outstanding now that the feature is on in production                                                                                                                                                                                                                                                                   |
| Expected remediation      | Add en-GB, fr-FR, es-ES and de-DE entries for the `signedMessages.*` and `preferences.tabs.devices` keys with fallback tests                                                                                                                                                                                                                                               |

## Related Pages

- [Profile Privacy and Notification Preferences](../../notifications/feature-profile-preferences.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Drop Actions Index](README.md)
- [Docs Home](../../README.md)

## Connection sharing and status

The Connect Device modal offers source-browser approval for receiving-app signing
and encryption keys. A compatible Desktop build uses a private app link and
Mobile uses a QR code. Both sign in and set up permissions without connecting
the receiving wallet. Working receiver keys and
history are preserved; source history is not copied. See
[Encrypted messages](../../encrypted-messages.md#setup-through-connection-sharing).

The avatar shield describes this device's two permissions independently of wallet
connection. Its shared desktop tooltip includes connection status and Signed Posts /
Encrypted DMs states; mobile prints the same information in the sidepanel. See
[Device Status](../../navigation/feature-wallet-account-controls.md#device-status).

The sign-in dialog retains **Cancel** and Escape without a top-right close button
or SIWE/auth-version explanation. Backdrop clicks do not dismiss it. Canceling an
unsigned second account during Add Account preserves the first account's session.

The legacy DM warning keeps **Export history** and **Start encrypted chat** as
buttons. Its deletion deadline applies to unencrypted DM history, not to Signed
Posts. See [Unencrypted direct messages](../../encrypted-messages.md#unencrypted-direct-messages).

### Edit availability

Ordinary message Edit actions disappear five minutes after the message was
last updated (or created, if never edited), matching the API deadline. This
also updates while the action remains mounted. Wave description drops retain
the API’s exception to that deadline.
