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

Existing direct messages are not changed. They stay where they are, are not
moved into encrypted chats, and their header now says **Not end-to-end
encrypted**.

## Availability

- Staging only. The feature is behind the `NEXT_PUBLIC_E2EE_DM_ENABLED` build
  flag, which the staging build turns on. Production builds leave it off: the
  encrypted routes return 404 and none of the controls below appear.
- A signed-in profile with a connected wallet is required.
- Not available while acting as a proxy. Encrypted chats belong to your own
  profile; the pages explain this and show nothing else.
- The browser needs WebAssembly, IndexedDB and Web Crypto. Browsers without
  them see "This browser can’t use encrypted messages".

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
- There is no backup in this version. If you lose all your devices or clear
  this browser's data, you lose this history.

Select **Turn on encrypted messages (one signature)** and approve the signature
in your wallet. Cancelling the signature changes nothing.

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
  On someone else's message the menu also offers **Mute this chat** (on this
  device: the chat stops counting toward the Messages badge and shows a muted
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
revoke any device, including this one. A profile can have up to 10 active
devices; at the limit, revoke one before turning on a new device.

When another device of yours is turned on, your other devices show which
device was added and when, that it can read your encrypted messages, and
**Revoke** or **This was me**. Your own device changes are not repeated in
each chat's timeline.

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

## Limitations

- No backup or history transfer: a new device sees only messages sent after
  it joins a chat.
- Retention on the delivery service is limited (messages 90 days); history
  lives on your devices.
- Search is local to the device.
- Plaintext direct messages are not migrated.

## Troubleshooting

- **Encrypted messages couldn’t start**: select **Try again**. The error code
  under the message helps the team diagnose staging issues.
- **Chat not found on this device**: devices only receive chats they were
  added to. Open the chat on a device that was in it, or ask a member to add
  your new device (it is added automatically after you turn it on).
- **You cancelled the signature**: select the button again and approve the
  wallet signature.
- **Too many devices**: revoke a device you no longer use, then select
  **Turn on this device**.
