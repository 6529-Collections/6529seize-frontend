# Encrypted messages

## Overview

Encrypted messages are end-to-end encrypted direct messages and group chats.
Only the people in a chat can read it: messages are encrypted on the sender's
device and decrypted on each member's device. 6529.io delivers the encrypted
data and orders group changes, but it cannot read messages, group names or the
member list inside a chat, and it cannot add a device to a chat.

Chats use the MLS protocol (RFC 9420) through a WebAssembly build of OpenMLS
that runs in the browser or app. Keys are agreed with a hybrid post-quantum
method: the MLS ciphersuite is 0x004F (X-Wing, which combines ML-KEM-768 with
X25519). Recorded messages stay confidential as long as either part holds,
so a future quantum computer that breaks X25519 alone cannot read them.
Messages use AES-128-GCM. Device signatures use Ed25519, which is not
post-quantum; they protect who sent a message, not its secrecy. 0x004F is a
draft code point; if it changes before it is final, each device sets up
encrypted messages again (one more wallet signature) and chats are started
again.

Existing direct messages are not end-to-end encrypted, and 6529 deletes
them from its servers, backups included, on **1 December 2026**, except
anything 6529 is legally required to keep (see
[Unencrypted direct messages](#unencrypted-direct-messages)). Until then you
can export them or move them into an encrypted chat.

## Availability

- Staging only. The feature is behind the `NEXT_PUBLIC_E2EE_DM_ENABLED` build
  flag, which the staging build turns on. Production builds leave it off: the
  encrypted routes return 404 and none of the controls below appear.
- A signed-in profile with a connected wallet is required.
- Not available while acting as a proxy. Encrypted chats belong to your own
  profile; the pages explain this and show nothing else.
- The browser needs WebAssembly, IndexedDB and Web Crypto. Browsers without
  them see "This browser can’t use encrypted messages".
- Encrypted messages run in one tab at a time per profile. Other tabs show
  "Encrypted messages are open in another tab." with **Use here**, which moves
  them to that tab and pauses the first one. Closing the tab that has them
  lets a waiting tab take over.

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
  side pane on the web and on the app's Messages screen.
- A plaintext direct message shows **Not end-to-end encrypted** in its header
  with **Start encrypted chat**. In the app, tap the open-lock button next to
  the chat name.

## Turning it on

The first time you open encrypted messages on a device, a card explains what
happens:

- One wallet signature lets this device send and read encrypted messages for
  180 days.
- The signature cannot move funds, change your profile or act as an admin. It
  creates no transaction and costs no gas.
- 6529 cannot read your encrypted messages.
- Your history is stored on your devices. If you lose all of them or clear
  this browser's data, you lose it, unless you turn on encrypted backup in
  Devices (see [Encrypted backup](#encrypted-backup)).

Select **Turn on encrypted messages (one signature)** and approve the signature
in your wallet. Cancelling the signature changes nothing.

If you signed in on this browser with the combined sign-in message (it
mentions end-to-end encrypted messages and an encrypted messages key; see
[Signed messages](waves/drop-actions/feature-signed-messages.md)), that one
sign-in signature already turned encrypted messages on: this device finishes
setting up in the background and the card does not ask again. If 6529 cannot
use that sign-in grant (for example it was revoked), the card asks for the
separate signature as usual. Revoking the device under **Devices that can
post as you** also revokes it for encrypted messages, and revoking it here
also stops its signed messages.

On Safari, the site's data can be deleted if you do not open 6529 for 7 days;
the card says so on Safari.

In the last 14 days of a device's 180 days, a **Renew (one signature)** prompt
appears on the chats list and above an empty composer. Encrypted messages
never ask for a signature per message.

## Starting a chat

1. Open `/messages/encrypted` and select **New encrypted chat**.
2. Search for people and add them. Each person shows whether they can receive
   encrypted messages:
   - **Can receive encrypted messages**
   - **Doesn’t accept messages from you**: their direct-message setting does
     not allow you.
   - **Blocked**: one of you blocked the other.
   - **Hasn’t turned on encrypted messages yet**: they have no device yet.
3. Choose **Direct message** (one other person) or **Group** (several people,
   optional name that only members can see).
4. Select **Start encrypted chat**.

If you already have an encrypted direct message with that person, the page
offers **Open chat** instead.

From a plaintext direct message, **Start encrypted chat** opens this page with
the same people already chosen. Earlier messages are not copied.

## In a chat

- Write in the composer and press Enter to send; Shift+Enter starts a new line.
- Type `@` to mention a member.
- Attach up to 10 files of up to 25 MB each; they are encrypted on your
  device like messages. Images show inline and other files are downloads.
  The server can switch attachments off as a kill switch; while it is off
  there is no attach control and chats are text only.
- Open a message's menu to react, reply, or edit or delete your own messages.
  On someone else's message the menu also offers **Mute on this device** (the
  same switch as in **Chat info**: the chat stops counting toward the Messages badge and shows a muted
  mark), **Block** the sender (they can't start new chats with you or add you
  to encrypted chats; chats you already share stay until you leave them),
  **Choose who can message you** (Preferences) and, last, **Report illegal or
  severe harm**.
- Search in the header looks only through messages on this device.
- **Chat info** lists members (with admin badges and their devices), the
  safety code, report help and **Leave chat**. In groups, admins can add and
  remove people, make or remove admins, and rename the group.
- The timeline shows notices such as people joining, leaving or being removed,
  new or removed devices, renames, admin changes and safety-code changes.

### Safety code

The safety code in **Chat info** is the same for everyone who sees the same
chat. Compare it with the other members in person or in another app you
trust. If everyone sees the same code, no one has been added to the chat
without your knowledge. **Chat info** also explains the encryption (MLS with
hybrid post-quantum key exchange) and has **Mute on this device**.

### Banners

- **Group changes are delayed. Messages will send once the change goes
  through.** A required change (for example removing a revoked device) has not
  been accepted yet. Sending resumes on its own.
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

## Devices

`/messages/encrypted/devices` lists every device of your profile that can read
your encrypted messages, marks **This device**, and shows each device's
platform, when it was added, last seen and when it expires, and whether its
wallet signature was verified on this device. You can rename this device and
revoke any device, including this one. A new device is named after its
browser or app and OS family (for example "Chrome on Windows" or "6529 app on
iPhone"); devices added earlier keep their name. A profile can have up to 10
active devices; at the limit, the new device lists the profile's devices and
asks you to revoke one from a device you already use, then turn it on.

When another device of yours is turned on, your other devices show which
device was added and when, that it can read your encrypted messages, and
**Revoke** or **This was me**. Your own device changes are not repeated in
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
  changed, about 30 seconds later. **Back up now** uploads immediately. The
  section shows when the device last backed up and how much of the 256 MB
  backup storage is used.
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
- The backup's encrypted pieces are linked in order, so 6529 cannot reorder,
  replay or remove pieces from the middle of your history. If the restore
  finds a piece missing, out of place or altered, it says "Part of the backup
  couldn’t be read. Nothing was restored." and imports nothing. If two
  devices back up at exactly the same moment, the next backup run uploads a
  fresh full copy and removes the overlapping pieces; a restore attempted in
  between also stops without importing anything.
- **Create new recovery code** shows a new code and uploads a fresh copy of
  your history. Your old code stops working once the new backup finishes
  uploading. Do this after you revoke a device that had backup on: the
  section reminds you when a device was revoked after the backup was set up.
- **Turn off backup** deletes the encrypted backup from 6529. Your recovery
  code stops working; messages on your devices stay.
- Attachments themselves are not copied into the backup. A restored
  attachment downloads only after this device has been added back to the
  chat, and only while the encrypted file is still stored (one year).
- Only one recovery method exists today (the recovery code). Passkeys and
  other methods may come later.

## Notifications

- Unread and mention counts appear on encrypted chats and count toward the
  Messages badge.
- Phone push notifications say only "New encrypted message" (or that you were
  added to an encrypted chat). They carry no sender, chat or text, and open
  `/messages/encrypted`.
- The desktop app does not show a local notification for encrypted messages
  yet.

## Reporting

Reporting is for illegal or severe harm only: child sexual abuse material, a
credible threat of violence, intimate images shared without consent, or
doxxing (exposed personal data). The dialog requires one of these and explains
what is shared:

- Only the selected message is shared, with proof that its sender's device sent
  it.
- It goes to 6529's trust and safety team, not to wave moderators or the
  moderation queue, and never to an AI service.
- Nothing else in the conversation is revealed.

Everything else is handled with blocking, muting and the "who can message you"
setting. Reports are kept for 180 days unless trust and safety holds them.

## Unencrypted direct messages

Direct messages started before encrypted chats are stored by 6529 in plain
text. Every such conversation shows a notice above the message box:
**Not end-to-end encrypted. This history will be deleted from 6529’s servers
on Dec 1, 2026, unless we’re legally required to keep it.** (the date follows
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
  author and time with the label **Imported, not verified**: 6529 held these
  messages unencrypted, so the encrypted chat cannot prove who wrote them.
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

## Limitations

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
- **You cancelled the signature**: select the button again and approve the
  wallet signature.
- **That recovery code doesn't open this backup**: the code is from an older
  backup or another profile. Use the code shown when backup was last turned
  on or when the current recovery code was created.
- **Backup was turned off or replaced on another device**: restore with the
  current recovery code to back up this device too, or start a new backup.
- **Your backup storage is full**: select **Create new recovery code** to
  replace the backup with a compact copy.
- **Too many devices**: revoke a device you no longer use, then select
  **Turn on this device**.
- **Encrypted messages are open in another tab.**: select **Use here** to move
  them to this tab, or keep using the other tab.
