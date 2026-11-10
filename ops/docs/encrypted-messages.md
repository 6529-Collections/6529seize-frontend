# Encrypted messages

## Overview

Encrypted messages are end-to-end encrypted direct messages and group chats.
Only the people in a chat can read it: messages are encrypted on the sender's
device and decrypted on each member's device. 6529.io delivers the encrypted
data and orders group changes, but it cannot read messages, group names or the
member list inside a chat. It does say which profile a device belongs to, so
members' devices add a person's new device on their own only when a wallet
already trusted for that person signed it and the signature checks out on
their device (see [Device trust](#device-trust)).

Chats use the MLS protocol (RFC 9420) through a WebAssembly build of OpenMLS
that runs in the browser or app. Keys are agreed with a hybrid post-quantum
method, X-Wing, which combines ML-KEM-768 with X25519. Recorded messages stay
confidential as long as either part holds, so a future quantum computer that
breaks X25519 alone cannot read them. Chats have used the MLS ciphersuite
0x004F, with AES-128-GCM messages and SHA-256 hashes. They are moving to
0x004E (AES-256-GCM, SHA-384). Once a device has confirmed the upgrade, the
chats it starts use 0x004E, and chats started before stay readable but
read-only; each can be continued (see
[Moving to stronger encryption](#moving-to-stronger-encryption)). Device
signatures use Ed25519, which is not post-quantum; they protect who sent a
message, not its secrecy. Both suites are draft code points; if the one in
use changes before it is final, each device sets up encrypted messages again
(one more wallet signature).

Existing direct messages are not end-to-end encrypted, and 6529 deletes
them from its servers, backups included, on **1 December 2026**, except
anything 6529 is legally required to keep (see
[Unencrypted direct messages](#unencrypted-direct-messages)). Until then you
can export them or move them into an encrypted chat.

## Names that temporarily show as Unknown member

"Unknown member" means this device cannot currently resolve the person's name;
it does not by itself mean they left. Known names and device owners are retained
when a lookup fails. Temporary lookup failures are retried a limited number of
times, with increasing delays and the server's rate-limit cooldown. Reopening a
chat or returning online can resume eligible lookups. Older messages with a
recoverable missing author are corrected as their history is opened, without
resetting encryption or deleting messages. A person who cannot be resolved can
continue to appear as Unknown member.

## Availability

- On in production and staging, behind the `NEXT_PUBLIC_E2EE_DM_ENABLED`
  build flag. A build with the flag off returns 404 on the encrypted routes
  and shows none of the controls below.
- A signed-in own profile is required. Setup may connect a wallet for approval, or use a source-browser-approved connection-sharing link in the apps. Once enrolled, a live wallet connection is not needed.
- Not available while acting as a proxy. Encrypted chats belong to your own
  profile; the pages explain this and show nothing else.
- The browser needs WebAssembly, IndexedDB and Web Crypto. Browsers without
  them see "This browser can’t use encrypted messages".
- 6529 Mobile and 6529 Desktop: see
  [In 6529 Mobile and 6529 Desktop](#in-6529-mobile-and-6529-desktop).
- Encrypted messages run in one tab at a time per profile. Other tabs show
  "Encrypted messages are open in another tab." with **Use here**, which moves
  them to that tab and pauses the first one. Closing the tab that has them
  lets a waiting tab take over.

## Writing messages

Encrypted and ordinary messages use the same rich-text editor. Custom emoji
shortcodes render as inline images while composing and editing; encrypted drafts
keep their shortcode representation for encryption and sending. Encrypted chat
does not offer GIF, Poll or Storm actions.

Custom emojis also render inline in the encrypted chat list and sidebar message
previews, at a compact size that keeps each preview on one line.

The emoji button sits inside the right edge of the message input, with attachments
on the left and Send on the right. It uses the regular composer’s desktop emoji
popover and mobile slide panel. Encrypted emoji choices remain private and do not
update ordinary reaction history. Selecting an emoji preserves the draft and
inserts it at the caret. On desktop, the Send tooltip explains Enter to send and
Shift+Enter for a new line. Mobile web and the app use the Send button; Return
does not submit. With an empty input and no reply, edit or attachment in progress,
Arrow Up edits your latest eligible message. On mobile web and in the app,
an accepted send removes input focus and dismisses the keyboard. A failed send
restores the draft without deliberately dismissing the keyboard. A delayed send
does not remove focus from a new draft you have already started. Closing the
native keyboard removes focus and restores the normal bottom safe-area clearance.

## Signing out

When this browser holds encrypted messages, **Sign out** and **Sign Out All
Profiles** ask first whether to **Remove encrypted messages from this
browser**. It deletes the chats, attachment keys, unsent messages and
encryption keys saved here: for the profile you sign out of, or for every
profile with Sign Out All Profiles (where it is on by default). Without
encrypted backup that history cannot be recovered. If you keep them, they
stay saved in this browser for the next sign-in.

## Location in the site

- `/messages/encrypted`: your encrypted chats on this device.
- `/messages/encrypted/new`: start a direct message or a group.
- `/messages/encrypted/{chat}`: one chat. The address is a random chat handle.
- `/messages/encrypted/devices`: devices that can read your encrypted messages.
- The **Encrypted** section sits above **Direct messages** in the messages
  side pane on the web and on the app's Messages screen. Select the open chat
  again in the side pane to return to the encrypted inbox.
- A plaintext direct message shows **Not end-to-end encrypted** in its header
  with **Start encrypted chat**. In the app, tap the open-lock button next to
  the chat name.

## Turning it on

Open the setup action in the account menu, Preferences → **Device Permissions**,
or the composer notice. Each opens the same permission dialog. The initial
`/messages/encrypted` page presents the same explanation inline, without the
**Encrypted messages / End-to-end encrypted** header until encryption is ready.
Setup does not open automatically after sign-in.

The explanation and signature button name the permissions this device needs:

- Neither permission is on: **Turn on signed posts and encrypted DMs**, with
  separate **Signed Posts** and **Encrypted DMs** sections and **Sign to enable
  both**. The composer's first-time notice uses the same title, so it and the
  dialog it opens name the same permissions. Once signed posts have expired,
  the notice is titled **Signed posts have ended in this browser**; when
  encrypted DMs can be turned on too, its text says the same signature also
  turns them on, and **Renew** opens **Turn on signed posts and encrypted
  DMs**.
- Only signing is missing: **Turn on signed posts** and **Sign to enable Signed Posts**.
- Only encryption is missing: **Turn on encrypted DMs** and **Sign to enable Encrypted DMs**.
  This requests encryption alone and keeps the existing signing permission.

A device that used the earlier encryption sees **Upgrade encrypted messages**
instead of the first-time wording; see
[Moving to stronger encryption](#moving-to-stronger-encryption).

When encryption is included, the card explains all of the following:

- One wallet signature authorizes this device for 180 days, without a prompt
  per message.
- The signature cannot move funds, change your profile or act as an admin.
  It creates no transaction and costs no gas.
- Only chat members can read the messages; 6529 cannot read them.
- History lives on your devices. Losing every copy, or clearing the last
  device's data, loses that history unless you have an
  [encrypted backup](#encrypted-backup) and its recovery code.
- Permissions can be revoked in Preferences → **Device Permissions**.

Selecting a setup entry does not immediately open the wallet. Review the card,
then select its **Sign** button. A disconnected wallet is connected first and
signing resumes when the matching wallet connects. Canceling setup leaves you
signed in. The dialog keeps its heading and actions visible while the explanation
scrolls; on a phone it leaves space around the dialog and respects the safe area.

Ordinary web sign-in can itself include a combined grant. When that happens,
the encryption engine adopts it without another signature, including if the
setup page was already open. Signing and encryption still use separate keys.
If combined setup cannot finish, the page explains the result and offers explicit
next actions. It does not silently request a different permission. If signing
succeeds but encryption registration fails, signing stays on and encryption can
be retried separately. If encryption registration is still running after about
20 seconds, the card says signed posts are on and encrypted DMs are still
finishing setup; it closes once encryption is on and reports a failure only if
registration actually fails.

After a signing permission or an encryption device is stored, the site asks the
browser to keep its storage persistent. Some browsers decide this silently;
others ask. Browsers can otherwise remove site storage when space runs low,
which removes this browser's keys and its encrypted history.

On Safari, the site's data can be deleted if you do not open 6529 for 7 days;
the card says so on Safari.

### Renewal and revocation

A grant normally lasts 180 days. During its last 14 days, the avatar status shows
when the permission expires and a dismissible renewal reminder appears:

- Signing-only grants: in Waves.
- Encryption-only grants: in Messages, including the inbox and selected chats.
- A combined grant: in both Waves and Messages.

In a selected conversation, the reminder sits above the composer. Renewing an
existing encryption device keeps its keys and saved history. Expiry stops its
authorization; it does not erase saved history by itself. If local keys/data
were removed, renewal cannot recreate them: restore a backup where available.

Preferences → **Device Permissions** identifies each grant's permissions and
explains what **Revoke** will disable. Revoking a combined grant disables both
Signed Posts and Encrypted DMs; a separate grant disables only its own permission.
These are not separate revoke switches within a combined grant. Revoking this
encryption device clears its local encrypted history and keys. Reauthorizing
later creates a new device; it does not bring that deleted local history back.
Earlier Signed Posts remain verifiable after revocation.

To preview renewal layout, add `?showRenewal=true` to a `/messages` or `/waves`
URL. It has no effect on the homepage or other areas. When no grant is actually
due, this displays preview wording with renewal actions disabled, rather than
claiming your permissions are expiring.

## Starting a chat

In the 6529 app, the back arrow to the left of the chat avatar returns to the
encrypted messages list. It stays visible on iPad in portrait and landscape.

1. Open `/messages/encrypted` and select **New encrypted chat**.
2. Search for people and tap or click a result to add them. The search clears
   and the person appears in the selected list. Each person shows whether they
   can receive encrypted messages:
   - **Can receive encrypted messages**
   - **Doesn’t accept messages from you**: their direct-message setting does
     not allow you.
   - **Blocked**: one of you blocked the other.
   - **Hasn’t turned on encrypted messages yet**: they have no device yet.
3. Choose **Direct message** (one other person) or **Group** (several people,
   optional name that only members can see).
4. Select **Start encrypted chat**.

If you already have an encrypted direct message with that person, the page
offers **Open chat** instead. Your list and sidebar show one direct-message
entry per person, including when you have left an earlier chat or started a
replacement. Group chats remain separate.

**Chat history** above the timeline lets you open earlier chats with that
person, including imported messages kept in the earlier chat. Messages and
search stay within the selected history; histories are not copied together or
deleted. Old chat links still open their original history. **Open current chat**
returns to the active conversation. If no usable chat remains, **Continue
encrypted chat** starts a replacement with that person (subject to their current
message preferences and device availability).

Two participants or devices can still start chats at the same time. They share
one list entry once this device knows both chats, and both histories remain
selectable. This does not impose a global server-side limit on MLS groups.

From a plaintext direct message, **Start encrypted chat** opens this page with
the same people already chosen. Earlier messages are not copied.

## Moving to stronger encryption

Encrypted chats are moving from the MLS ciphersuite 0x004F (AES-128-GCM) to
0x004E (AES-256-GCM). When the move reaches 6529.io, each device confirms it
once; your decrypted history, attachments and chat threads stay on the
device. Until then, chats keep using 0x004F and none of the steps below
appear.

- **Confirming on a device.** A device that used the earlier encryption shows
  **Upgrade encrypted messages** in place of the first-time setup card:
  "Encrypted messages are moving to stronger encryption. Confirm once in your
  wallet to continue; your messages stay on this device." It also says how
  many existing conversations stay readable. **Sign to upgrade Encrypted DMs**
  asks for one wallet signature. If Signed Posts are also off, the card keeps
  **Sign to enable both**, and a combined sign-in can carry the upgrade
  without another prompt. The card shows "Couldn’t upgrade encrypted messages.
  Try again." if the upgrade fails. The setup dialog, the account-menu entry
  and the Preferences → **Device Permissions** button also read **Upgrade
  encrypted messages** while the upgrade is pending.
- **Earlier conversations.** Chats started before the move are read-only:
  their messages stay readable and searchable, but you can’t send, edit, react,
  rename, change members or leave them. The list labels them **Read-only**,
  and the composer is replaced by "This conversation moved to stronger
  encryption. Its messages stay readable here, but you can’t send new ones."
  A keyboard **Skip to the end of this conversation** link jumps past the
  messages to the action. If a chat turns read-only while you are typing in
  it, focus moves to the action; otherwise screen readers hear the change once.
- **Continuing a direct message.** Select **Continue the conversation**. It
  opens the current session with that person, or starts one on the new
  encryption. Both sessions stay in one list entry, and **Chat history**
  switches between them. If the other person hasn’t confirmed the upgrade
  yet, the page says they will be reachable once they open 6529.io and
  confirm the upgrade. Their direct-message preferences and blocks apply as
  when starting a new chat.
- **Continuing a group.** Select **Start again with the same members**. It
  creates the new group once, with the same name and you as its admin, and
  opens it. Once this device has the new group, the action reads **Open the
  new conversation**. Members
  whose devices haven’t confirmed the upgrade are left out: the page names
  them and offers **Open the new conversation** instead of opening it
  directly. Add them later from **Chat info** once they open 6529.io and
  confirm the upgrade. If nobody else can be added yet, the page says the
  other members will be reachable once they do.
- **The new conversation.** Its timeline opens with "This conversation moved
  to stronger encryption. Earlier messages are kept in the previous
  conversation." and **View earlier messages**, which opens the read-only
  chat when this device has it.
- **Messages that had not gone out yet.** A message of yours that was still
  waiting to send when the chat moved stays in the read-only chat, marked "Not
  sent: this chat was upgraded". It is kept on this device only and is never
  sent by itself. **Resend in the upgraded chat** sends a copy (text, mentions
  and attachments; not the reply it answered) in the conversation that
  continues it, starting that conversation if needed. **Delete** removes it
  from this device after you confirm. Either way the page says what happened
  and moves focus to the continue action. If the other person hasn’t
  confirmed the upgrade yet, resending says so and keeps the message.

## In a chat

- In a direct chat, select the person's name or avatar in the header or chat
  introduction to open their profile. Group titles stay as group titles.
- Message authors have the same profile links, level, artist badges and
  profile-wave badge as ordinary messages, where those apply. Hover over a
  name or avatar on desktop for the profile card. Select a profile-wave badge
  for the usual wave navigation or mobile preview.
- Select a highlighted member mention to open that person's profile. If a
  profile cannot be resolved, its unavailable details are omitted; messages
  remain readable on this device.
- On desktop, Enter sends and Shift+Enter starts a new line. On mobile, Return
  starts a line and the Send button submits; see [Writing messages](#writing-messages).
- Type `@` to mention a member.
- Select **Add emoji** inside the message box to open the emoji board. Search
  or browse standard emojis, skin tones, and the **6529** custom collection.
  The selection replaces highlighted text or goes at the cursor. You can also
  use the board while editing. Custom emojis render as inline images while composing, editing and reading.
  Their `:name:` shortcodes are preserved in the encrypted message text.
- In a message's menu, choose a quick reaction or **More reactions** to open
  the full emoji board, including custom emojis. Select an existing reaction
  to add or remove yours. Emoji choices in encrypted chats do not enter the
  ordinary chats' frequently-used emoji history.
- Custom emojis load together as one public collection, independently of the
  messages in a chat. If the collection cannot load, the board keeps standard
  emojis available and offers **Try again**. Custom emojis in messages remain
  readable as `:name:` until available; older apps may also show this text.
- Attach up to 10 files of up to 25 MB each; they are encrypted on your
  device like messages. Drop files anywhere over the chat or message input to add
  them to the draft, with the same drop overlay as ordinary chat. Dropping does
  not send them: use Send when ready. Drops use the same count and size limits
  and are blocked while editing, while the chat is paused, or when attachments
  are switched off. Images show inline and other files are downloads.
  Tap or click an image to open the regular image popup, with zoom and download
  controls. Desktop hover also reveals the regular full-screen, open-in-new-tab
  and download actions. In the app, use the popup's download action to save or
  share the decrypted image; local image links cannot open in an external browser.
  Decrypted previews stay on your device and do not go through a public image proxy.
  Expandable images use the same magnifying cursor and focus outline as ordinary
  chats and Waves. The popup can move between previewable images in the same message
  as they finish loading. **Retry** fetches and decrypts a failed image again.
  An image larger than about 50 megapixels shows as a file to download
  (**Too large to preview**) instead, and only a few images load at once.
  File names are shown and saved without path separators, control or
  right-to-left override characters, and at most 120 characters long.
  The server can switch attachments off as a kill switch; while it is off
  the attach control is disabled and chats are text only.
- Paste images (Ctrl+V or Cmd+V) into the composer to attach them, with the
  same limits as the attach control. Text copied together with an image is
  pasted into the message as well. Pasting attaches images only while the
  attach control is enabled, so not while you edit a message.
- Open a message's menu to react, reply, or edit or delete your own messages.
  On someone else's message the menu also offers **Mute on this device** (the
  same switch as in **Chat info**: the chat stops counting toward the Messages badge and shows a muted
  mark), **Block** the sender (they can't start new chats with you or add you
  to encrypted chats; chats you already share stay until you leave them),
  **Choose who can message you** (Preferences) and, last, **Report illegal or
  severe harm**.
- Search in the header looks only through messages on this device.
- **Chat info** lists members (with admin badges and their devices, each with
  the short wallet address that signed it), the safety code, report help and
  **Leave chat**. In groups, admins can add and
  remove people, make or remove admins, and rename the group.
- The timeline shows notices such as people joining, leaving or being removed,
  new devices (with the wallet that signed them) or removed devices, renames,
  admin changes and safety-code changes.

### Browsing saved history

A chat opens at its newest saved messages. **Load older messages** reads the
previous part of this device's history; **Load newer messages** moves forward
again. **New messages** returns to the latest messages. Incoming messages do
not move you away from older history you are reading.

Photos load when you approach them while scrolling. Moving away can release
them from memory; returning to a photo may download it again. This does not
remove its message or attachment keys from your saved history.

Search covers all messages saved on this device, including older messages
outside the current view. Use **Previous results** and **Next results** to
browse a long result list. Replies and search results can open that older
history. Encrypted backups also include the complete saved history.

A device catching up after being offline still needs to process the messages
it has not received yet. Opening already synced history does not repeat that
work. Keep the app open while a large import catches up.

### Safety code

The safety code in **Chat info** is the same for everyone who sees the same
chat. Compare it with the other members in person or in another app you
trust. If everyone sees the same code, everyone sees the same people and
devices in the chat. It cannot show whether each device really belongs to the
person it is listed under: that rests on [device trust](#device-trust) and the
wallets shown in **Chat info**. **Chat info** also explains the encryption
(MLS with hybrid post-quantum key exchange) and has **Mute on this device**.

### Device trust

A device's own proof is a wallet signature, and that signature does not name a
profile; 6529.io says which profile the device belongs to. So encrypted
messages use trust on first use. The first time your device sees a person (you
start or join a chat with them, or, for chats from before this check, the next
time the chat is maintained), it remembers the wallets that signed that
person's devices. Later devices of that person are added automatically only
when one of those wallets signed them and this device could check the
signature.

When a member has a device signed by a wallet your device has not seen for
them, it is not added and the chat shows **{name} has a device signed by a new
wallet 0x1234…abcd.** (for your own profile: **You have a device signed by a
new wallet …**). A device whose contract-wallet signature (for example a Safe)
this device could not check shows a similar notice. **Add device** trusts that
wallet for the person and adds the device; **Ignore** keeps it out and hides
the notice. Add it only if you know whose wallet it is, for example because
they told you they set up a new one.

A revoked device is removed only when the revocation comes from that device
itself or from a device signed by a wallet trusted for its owner.

Trust on first use cannot catch a wrong device that is already there the first
time your device sees someone. Compare safety codes and check the wallets in
**Chat info** when that matters.

### Banners

- **Group changes are delayed. Messages will send once the change goes
  through.** A required change (for example removing a revoked device) has not
  been accepted yet. The composer reads "Sending is paused until the group
  change goes through." Sending resumes on its own.
- **Messages aren’t sending right now. We’ll keep retrying, and you can keep
  writing.** Sending has failed for about 20 seconds while the chat itself is
  fine (for example the delivery service is overloaded). The composer stays
  available, and what you type is kept. New messages stay pending (see
  [Message states](#message-states)) and go out in order once a retry
  succeeds; retries continue every few seconds.
- **Security check needed: this device may not see the same chat as everyone
  else.** Members may be seeing different versions of the chat. Compare
  safety codes before sharing anything sensitive.
- **Restored from your backup. New messages appear here once someone in this
  chat adds this device.** The chat came from your encrypted backup and is
  read-only until a member's device adds this device (this happens
  automatically when the other people in the chat are online).
- **This chat is paused because of an invalid change.** A change failed
  validation, so the chat stops. Select **Start a new encrypted chat with the
  same people** to continue in a fresh chat.

### Message states

- **Sending…**: not yet delivered. After about 10 seconds without a
  connection it reads **Waiting for connection. Will keep trying.**
- **This message couldn’t be sent.**: the delivery service refused it. A
  banner above the composer offers **Edit and resend**.
- **(edited)**: changed by its sender.
- **Message deleted**: removed by its sender.
- **Couldn’t decrypt this message**: this device could not read it; ask the
  sender to send it again.
- **Signature not verified**: the sender's signature did not check out.
- **Sender’s device signature verified** appears in the message actions menu
  for verified messages received from other participants.

## Devices

`/messages/encrypted/devices` lists every device of your profile that can read
your encrypted messages, marks **This device**, and shows each device's
platform, when it was added, when it was last active (**Active now** for this
device), the date it expires, and whether its wallet signature was verified on
this device. You can rename any unrevoked
device belonging to your profile from any authenticated browser or app. The name
is saved on the server and appears on your other devices after their lists refresh;
linked signing and encryption entries share that name. You can also revoke any
device, including this one. Revoking this device opens its own
**Revoke this browser?** dialog: it names the browser you're using, says what
stops, and with backup on says that only messages included in your last
backup can be restored. With backup off it warns
that the encrypted chats in this browser can't be restored afterwards and
offers **Set up backup first**. Revoking it removes its encrypted messages and
keys from this browser right away and shows the card to turn encrypted
messages on again. A new device is named after its
browser or app and OS family (for example "Chrome on Windows" or "6529 Mobile on
iPhone"); devices added earlier keep their name. A profile can have up to 10
active devices; at the limit, the new device lists the profile's devices and
asks you to revoke one from a device you already use, then turn it on.

When another device of yours is turned on, your other devices show which
device was added and when, that it can read your encrypted messages, and
**Revoke** or **This was me**. Devices that already existed when this device
was set up, such as an earlier setup of this browser found again after its
data was cleared, are never announced as new. Your own device changes are not repeated in
each chat's timeline.

## Encrypted backup

The **Encrypted backup** section on `/messages/encrypted/devices` keeps an
encrypted copy of your message history so you can restore it on a new device.

- **Turn on backup** shows a recovery code once: 14 groups of 4 letters and
  numbers. Select **Copy code** or **Download as text file**, store it
  somewhere safe (for example a password manager), tick **I saved my recovery
  code somewhere safe**, then select **Turn on backup**. Closing the dialog
  before that turns nothing on and discards the code.
- What is backed up: messages you have on this device (text, edits,
  deletions, reactions, notices), the chat names and members needed to show
  them, and references to attachments with their keys. Never the device's
  encryption state; a new device always joins chats as a new device.
- Backups are incremental: after a change the device uploads only what
  changed, about 30 seconds later. **Back up now** uploads immediately and
  then shows "Backup is up to date." in the status line for a few seconds.
  The section shows when the device last backed up and how much of the
  256 MB backup storage is used (in kB below 1 MB).
- 6529 stores only encrypted data. It cannot read your messages, contact
  list or chat names, and cannot recover your recovery code. It can see that
  you have a backup, its size and when it changes.
- **Restore messages** appears on a device that has encrypted messages turned
  on while a backup from another device exists. Enter the recovery code
  (spaces, dashes and lowercase are fine). A mistyped code says
  "That doesn't look like a recovery code"; a valid code that belongs to
  another backup says "That recovery code doesn't open this backup" and
  restores nothing. Restored chats show **From backup** in the list and are
  read-only until someone in the chat adds this device; then new messages
  continue below the restored ones. After a restore the device also keeps the
  same backup up to date.
- **Lost your recovery code?** sits next to **Restore messages**. It first asks
  **Start a new backup without restoring?**: starting over deletes the
  existing backup, including messages that aren't on this browser, and can't
  be undone. Only **Delete old backup and start over** shows a new code.
- The backup's encrypted pieces are linked in order, so 6529 cannot reorder,
  replay or remove pieces from the middle of your history. If the restore
  finds a piece missing, out of place or altered, it says "Part of the backup
  couldn’t be read. Nothing was restored." and imports nothing. If two
  devices back up at exactly the same moment, the next backup run uploads a
  fresh full copy and removes the overlapping pieces; a restore attempted in
  between also stops without importing anything.
- **Replace recovery code** shows a new code and uploads a fresh copy of
  your history from this browser. Your old code stops working once the new
  backup finishes uploading, and messages that are in the backup but not on
  this browser aren't in the new one. When you revoke a device after the
  backup was set up, the section shows **Replace your recovery code**: if that
  device ever restored the backup, it may still hold its key. One device is
  named; several (for example after a clean-up) are counted in one warning,
  with one **Replace recovery code** action.
- **Turn off backup…** is in the section's **More backup options** menu.
  After confirmation it deletes the encrypted backup from 6529. Your recovery
  code stops working; messages on your devices stay, but can't be restored if
  this browser clears its data later.
- Attachments themselves are not copied into the backup. A restored
  attachment downloads only after this device has been added back to the
  chat, and only while the encrypted file is still stored (one year).
- Only one recovery method exists today (the recovery code). Passkeys and
  other methods may come later.

## Notifications

- Unread and mention counts appear on encrypted chats and count toward the
  Messages badge.
- Phone message pushes use title **New encrypted message** and body
  **Open 6529 Mobile to view** in production or **Open 6529 Staging to view**
  on staging. Invitation pushes say that you were added to an encrypted chat.
  Pushes carry no sender, chat name or message text, and open
  `/messages/encrypted`. The phone refreshes the encrypted chat list and
  stays there so the recipient can choose which chat to open.
- 6529 Desktop shows a local notification, "New encrypted message", when a
  chat gets a message from someone else, unless the chat is muted or open in
  the focused window. Like phone push it names no sender, chat or text.
  Selecting it opens that chat. It is raised on the computer from the chats
  the app already decrypted, so nothing about the chat leaves the device.
  Chats that already had unread messages when the app started and imported
  history do not notify. Incoming messages can notify while an outgoing
  message is still pending, including when older history is being viewed.

## In 6529 Mobile and 6529 Desktop

- **Turning it on.** Supported apps use the same permission-aware setup card as
  the website. Direct wallet setup uses an app grant (EIP-712 typed data) where
  supported; encryption-only setup uses its own encryption grant. Alternatively,
  source-browser-approved [connection sharing](#setup-through-connection-sharing)
  signs in and enrolls the receiving app without connecting a wallet there.
  Ordinary app sign-in alone does not grant these permissions. Secure setup
  requires a compatible app build with cryptographic support. The web
  **6529 Desktop** secure setup button shows **Coming soon**. Desktop users
  can choose **Connect only**.

- **Phones.** 6529 Mobile needs iOS 16.4 or later (earlier iOS versions cannot
  run the current site at all) or a current Android System WebView. Signed
  messages additionally need iOS 17 or later. Keys and history live in the
  app's own storage, which iOS and Android keep until the app is deleted;
  unlike Safari, the app is not subject to the 7-day storage limit.
- **Desktop.** 6529 Desktop keeps keys and history in the app's storage for
  its local address; it reuses the same local port on every start, so the
  device survives restarts.
- **Wallets.** App wallets sign inside the app. WalletConnect wallets get a
  typed-data (`eth_signTypedData_v4`) request in the wallet app.

## Reporting

Reporting is for illegal or severe harm only: child sexual abuse material, a
credible threat of violence, intimate images shared without consent, or
doxxing (exposed personal data). The dialog requires one of these and explains
what is shared:

- Only the selected message is shared, with proof that its sender's device sent
  it. Under **What this report sends** the dialog shows that message's text
  and attachment names.
- For an edited message, the report sends the edited version you see. The
  original goes along only if you tick **Also send the original message**.
  An edit changes only the text, so attachments belong to the original and
  are shared only with it.
- It goes to 6529's moderators, who review it in the **Encrypted reports** tab
  of WatchTower (`/content-moderation/encrypted-reports`). It never goes to
  wave moderators or to an AI service.
- Nothing else in the conversation is revealed.

Everything else is handled with blocking, muting and the "who can message you"
setting. Reports are kept for 180 days unless a moderator places them on
hold.

## Unencrypted direct messages

Quick Chat hides this migration notice and its actions. Use **Open conversation**
to access them in the full DM view. Old conversations still become read-only
when an encrypted equivalent exists, or when unencrypted DMs close.

Direct messages started before encrypted chats are stored by 6529 in plain
text. The full view of each conversation shows a notice above the message box:
**Not end-to-end encrypted. 6529 deletes this history from its servers on
Dec 1, 2026 unless legally required to keep it.** (the date follows
your language settings). The notice
offers:

- **Export history**: reads every message you can see in the conversation
  and downloads it from your browser as a readable page (HTML) or as data
  (JSON). Images and files are listed as links, which stop working on the
  deletion date. The file is made on your device and is not encrypted.
- **Start encrypted chat**: opens a new encrypted chat with the same people.
- **Open encrypted chat** and **Move history**, once an encrypted chat with
  exactly the same people exists on this device. **Move history** copies the
  messages you can see, oldest first, into that chat, with their images and
  files when they can be moved. Each copied message shows its original
  author and time with the label **Imported, not verified** and **Moved by**
  the member who moved it: 6529 held these messages unencrypted, so the
  encrypted chat cannot prove who wrote them. The author is named from the
  chat's members; one who is not a member shows as **Unknown**, and the
  original time is never shown as later than the move.
  Keep the page open while it runs; you can stop and continue later, and
  nothing is copied twice, even if another member also moves the history.
  Copied messages reach only the people and devices in the encrypted chat at
  that time, and do not notify anyone. They appear in their original order,
  after anything already sent in the encrypted chat.

The conversation becomes read-only once an encrypted chat with the same
people exists on your device; new messages go to the encrypted chat. From
1 December 2026 every unencrypted conversation is closed and its history is
deleted from 6529's servers, except anything 6529 is legally required to
keep. Copies 6529 cannot recall stay where they are: your
own exports, push notification previews already delivered to phones, and
attachments that were published to public IPFS.

Encrypted uploads are limited per day, so moving a long history with many
images may pause; continue the next day to move the rest. If your space for
encrypted images and files is full, it also pauses, and offers **Continue
without images**. Images and files too large for one encrypted attachment
(about 25 MB) are listed as too large to move.

## Limitations / Notes

- Without encrypted backup a new device sees only messages sent after it
  joins a chat. With backup on, restore past history with the recovery code.
- Losing every device and the recovery code loses the history; 6529 cannot
  recover it.
- Retention on the delivery service is limited (messages 90 days); history
  lives on your devices.
- Search is local to the device.
- Moved history is labelled as imported and is not verified. Members and
  devices that join the encrypted chat later do not see it.

## Troubleshooting

- **Encrypted messages couldn’t start**: select **Try again**. The error code
  under the message helps the team diagnose staging issues.
- **Chat not found on this device**: devices only receive chats they were
  added to. Open the chat on a device that was in it, or ask a member to add
  your new device (it is added automatically after you turn it on).
- **This conversation moved to stronger encryption**: the chat is read-only.
  Select **Continue the conversation** (direct message) or **Start again with
  the same members** (group); see
  [Moving to stronger encryption](#moving-to-stronger-encryption).
- **You cancelled the signature**: select the button again and approve the
  wallet signature.
- **That recovery code doesn't open this backup**: the code is from an older
  backup or another profile. Use the code shown when backup was last turned
  on or when the current recovery code was created.
- **Backup was turned off or replaced on another device**: restore with the
  current recovery code to back up this device too, or start a new backup.
- **Your backup storage is full**: select **Replace recovery code** to
  replace the backup with a compact copy.
- **Too many devices**: revoke a device you no longer use, then select
  **Turn on this device**.
- **Encrypted messages are open in another tab.**: select **Use here** to move
  them to this tab, or keep using the other tab.

## Setup through connection sharing

In the browser account menu, open **Connect Device**. Confirm the avatar,
handle and full wallet address, then select **6529 Mobile** or **6529 Desktop**.
Choose **Connect only** for an additional signed-in app session, or
**Connect with Post Signing & DM Encryption** to approve those permissions too.
The source browser does not need encryption enabled on itself to approve the
receiving app. Proxy sessions cannot authorize secure setup.

The **6529 Desktop** secure option is disabled and shows **Coming soon**.
Choose **Connect only** to sign in on Desktop.

For Mobile secure setup, approve the wallet signature in the browser, then scan
one QR or open its private link in the receiving app. The regular **Scan QR Code**
flow accepts it; you do not have to start from the encryption page. A device
camera can hand the link to the app when its link handler supports that URL.
If you use **Scan Connection QR** from the upgrade prompt, a valid scan closes
the prompt and opens the incoming connection for approval.
The receiving screen identifies the account and lists **Signed Posts** and
**Encrypted DMs** above **Accept and enable both**. A Connect-only link keeps
**Accept connection** and does not list or enable these permissions.

One secure link signs in and enrolls the app; a second connection-only scan is
unnecessary. Generating or viewing a QR does not register an active device.
Registration happens when the receiving app accepts and completes setup.

After a successful acceptance, the receiving app opens Home. A new device
may still be registering for Encrypted DMs. If secure setup fails after
sign-in, the app keeps you signed in and shows how to try again with a fresh
secure link. You can choose **Take me home** from that screen.

The Mobile QR fills the available width. Below it, the link field has a copy
icon and separate refresh icon. **Back** returns to the app and connection
choices. Connect-only refresh creates a new code directly; secure refresh clears
the old displayed link, returns to the signing state and requests a fresh wallet
signature. The dialog changes height smoothly, with scrolling for short screens.
The Desktop handoff uses the 6529 logo and **Open in 6529 Desktop**, rather than
a QR, followed by the same link controls.

Links expire shortly and work once. Use them only on a device you own. Existing
source keys and history are not copied. Working keys and registered encrypted
history already on the receiving app are preserved. A new device needs an
encrypted-backup restoration for past history and must join a chat for future
messages. If sign-in succeeds but setup fails, the app reports that distinction
and asks for a new link; it does not claim the permissions are enabled.

## Encrypted in-app notifications and device status

Encrypted messages create entries in the bell inbox and Notifications feed,
including on authenticated devices without local encryption keys. These follow
the existing **Direct messages and wave activity** notification preference; there
is no additional encrypted-message setting and no 60-second in-app cooldown.
Phone push throttling is separate. Deploying notification support does not
backfill entries for messages whose notifications were never created.

When the sender is known, the row uses the usual clickable avatar, handle,
level and applicable badges. An older entry without sender details uses a lock
and **New encrypted message**. The server entry may store sender identity, an
opaque chat identifier and the exact message sequence, never the plaintext.

A ready device previews that exact message only if it exists and can be read in
its local history. The preview retains a lock indicator. Without setup the
entry offers **Set up Encrypted DMs**; with setup but without that message it
offers **Open encrypted chat**. Enabling encryption on a new device does not
make earlier history available there. Old notifications without an exact message
reference also remain generic. Opening an unavailable chat can show **Chat not
found on this device**; use an existing device or restore an encrypted backup.

The avatar shield and its status text describe this device, not all your devices.
Green means both permissions are on with no renewal due; amber means a permission
is missing or renewal is due; neutral covers off, unavailable or unresolved states.
The desktop account tooltip combines wallet-connection status with **Signed Posts**
and **Encrypted DMs**, with bold on/off states and expiry detail when due. It
opens after a short hover delay. Mobile prints the same information in its
sidepanel: a connection indicator on its own row, then a shield beside permission
states above the TDH information. Connected-profile avatars also show appropriately
sized shields. A disconnected wallet does not by itself disable stored grants.

See [Wallet and Account Controls](navigation/feature-wallet-account-controls.md)
and [Notifications Feed](notifications/feature-notifications-feed.md).

## Touch shortcuts

On a touch layout, swipe left on an available message to start a reply on release.
Reverse below the reply threshold before release, or release a short swipe, to
leave the composer unchanged. Message timestamps and the visible message-actions
menu remain available. Pending, unsent, deleted and unreadable messages, notices,
and read-only conversations do not offer swipe to reply. Links, media controls and text selection keep their own interactions.

In the native app, swipe right across conversation content to return to the
Encrypted messages list, or use the existing Back control. Reverse below the
gesture threshold before release to cancel the return. Vertical scrolling
and multi-touch do not trigger the shortcut. Reduced motion removes the added
settling animation.
