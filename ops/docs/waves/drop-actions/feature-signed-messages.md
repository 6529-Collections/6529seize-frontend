# Signed Messages

## Overview

Signed messages let a browser sign your drops so anyone can check that a post,
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
unchanged.

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
- **Sign in with encrypted messages (staging).** Where encrypted messages are
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
  device here also turns off encrypted messages for it.
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
   browser carries a device signature. The key and grant are loaded ahead of
   time (when a composer or the editor opens or gains focus, and when the tab
   becomes visible again), so signing normally adds no noticeable delay. The
   pending drop shows immediately while it is signed.
4. With a grant, a write is never sent unsigned without your choice. See
   [When a Write Cannot Be Signed](#when-a-write-cannot-be-signed).

## When a Write Cannot Be Signed

This applies only when this browser holds an active grant for the signed-in
wallet. Without a grant, and in the apps, proxy sessions and browsers without
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

- In a grant's last 14 days the composer notice reads **Signed messages end
  on {date}** with **Renew** (one signature).
- Grants are not used in their last minute. After expiry the browser has no
  usable grant, so writes go unsigned as without a grant, and the notice
  offers renewal.

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
  signed version. A contract wallet's sign-in signature counts only when
  the wallet has contract code on Ethereum and its EIP-1271 check accepts
  the signature; the row then reads **Contract wallet: verified on Ethereum
  in your browser**.
- **Couldn't verify this signature right now** with a neutral icon, never
  the signed seal, when the sign-in signature needs that contract-wallet
  check on Ethereum and it cannot run (no Ethereum connection, a failed
  read, or a grant signed on another chain). An ordinary wallet whose
  signature does not match reads **The signature could not be verified**.
- **Not signed by its author** for drops sent without a device signature.
  Drops whose content moderation hides from you and anonymous competition
  entries also read this way: their signed events are not shared.
- **The signature could not be verified** when stored signatures do not
  match, or when the wallet signed the grant anywhere but the 6529 app
  (exactly 6529.io or staging.6529.io; other 6529.io hosts, such as the IPFS
  and media gateways, never count). Signed messages are not turned on from a
  sign-in challenge for any other host.
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
  drops (including ended ones), the minimal identity row and the single-drop
  view, and by the timestamp of embedded drops: link previews of 6529 drop
  links and serial-number links, quoted drops, and leaderboard, winner,
  Memes and quick-vote cards. Activating it there opens the dialog without
  opening the linked or quoted drop.
- Message search results and competition entry cards are single buttons, so
  they show a static seal and add ", signed by its author" to the button's
  name.
- Reply-to lines and the composer's reply or quote preview show no
  timestamp and no seal.
- On grouped chat rows, which have no header, a static seal appears beside
  the timestamp revealed on hover or swipe; use the drop menu's
  **Signature** item there.
- A signed edit keeps the seal; an unsigned edit or a delete removes it.
- The seal is hidden while the signed messages flag is off, for drops still
  being sent, and when the content is hidden by moderation or the author is
  anonymous.
- Other viewers' open chats may show the seal on a freshly signed post only
  after that post is next loaded; the author's own view shows it when the
  post is confirmed.

### Grouped Chat Posts

When consecutive chat posts by the same author render under one header (the
chat's usual grouping), the header's seal stands for the whole group:

- Every post author signed: the full seal, named for example **All 3 posts
  signed by their author**.
- Some posts signed: an outlined seal (a different shape, not only a
  different color), named for example **2 of 3 posts signed by their
  author**.
- No post signed: no seal on the header.
- Activating the header seal opens **Signatures in this group**, which lists
  each post with its time, the first line of its text (or **Post without
  text**) and its status. Opening a row checks that post's signature in the
  browser, exactly like the single-drop dialog; posts are checked only when
  their row is opened.
- Each grouped row keeps its own static seal beside its hover or swipe
  timestamp.
- The count follows the group live: a new post joining the group or an
  unsigned edit updates it.
- A header with no grouped posts behaves like any single drop.

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

| Field                     | Current exception                                                                                                                                                                                                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route or component        | `components/device-signing/SignedMessagesNotice.tsx`, `components/device-signing/SignedWriteDecisionHost.tsx`, Preferences Devices tab (`/preferences?tab=devices`), `components/waves/drops/signature/DropSignatureDialog.tsx`, `components/waves/drops/signature/DropGroupSignatureDialog.tsx`, `components/waves/drops/signature/DropAuthorSignedMarker.tsx` |
| Untranslated surface      | All copy in `i18n/messages/signed-messages.ts` (notice, Devices tab, signature dialogs, signed-by-author seals, "Couldn't sign" prompts); plural forms use `.one` and `.other` keys                                                                                                                                                                             |
| Current fallback behavior | Keys exist only in `en-US`; other locales fall back to `en-US`. Dates and lists already use `formatDate` and `formatList`                                                                                                                                                                                                                                       |
| User impact               | Users of other locales see English copy for this feature                                                                                                                                                                                                                                                                                                        |
| Owner or follow-up        | Frontend localization maintainers; translations are outstanding now that the feature is on in production                                                                                                                                                                                                                                                        |
| Expected remediation      | Add en-GB, fr-FR, es-ES and de-DE entries for the `signedMessages.*` and `preferences.tabs.devices` keys with fallback tests                                                                                                                                                                                                                                    |

## Related Pages

- [Profile Privacy and Notification Preferences](../../notifications/feature-profile-preferences.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Drop Actions Index](README.md)
- [Docs Home](../../README.md)
