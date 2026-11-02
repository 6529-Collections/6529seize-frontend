/**
 * End-to-end encrypted DMs and groups (D109). Source copy (en-US); other
 * locales fall back to these strings until translated. The engine returns
 * codes only; every user-visible string lives here.
 */
export const E2EE_MESSAGES = {
  "e2ee.badge.encrypted": "End-to-end encrypted",
  "e2ee.badge.encryptedShort": "Encrypted",
  "e2ee.title": "Encrypted messages",
  "e2ee.section.encrypted": "Encrypted",
  "e2ee.section.plaintext": "Direct messages",
  "e2ee.action.newChat": "New encrypted chat",
  "e2ee.action.devices": "Devices",
  "e2ee.action.retry": "Try again",
  "e2ee.action.cancel": "Cancel",
  "e2ee.action.close": "Close",
  "e2ee.action.dismiss": "Dismiss",
  "e2ee.loading": "Loading encrypted messages…",
  "e2ee.you": "You",
  "e2ee.youObject": "you",
  "e2ee.someone": "Someone",
  "e2ee.unknownMember": "Unknown member",

  "e2ee.gate.proxy.title": "Not available while acting as a proxy",
  "e2ee.gate.proxy.body":
    "Encrypted messages belong to your own profile. Switch back to your profile to use them.",
  "e2ee.gate.unsupported.title": "This browser can’t use encrypted messages",
  "e2ee.gate.unsupported.body":
    "Encrypted messages need WebAssembly, IndexedDB and Web Crypto. Try an up-to-date browser or the 6529 app.",
  "e2ee.gate.error.title": "Encrypted messages couldn’t start",
  "e2ee.gate.error.body":
    "Something went wrong while loading encrypted messages on this device.",
  "e2ee.gate.error.code": "Error code: {code}",
  "e2ee.gate.elsewhere.title": "Encrypted messages are open in another tab.",
  "e2ee.gate.elsewhere.body":
    "They run in one tab at a time so your chats stay in sync. Use them here and the other tab will pause.",
  "e2ee.gate.elsewhere.action": "Use here",
  "e2ee.signOut.title": "Sign out",
  "e2ee.signOut.titleAll": "Sign out of all profiles",
  "e2ee.signOut.body":
    "Your encrypted messages stay saved in this browser unless you remove them.",
  "e2ee.signOut.remove.label": "Remove encrypted messages from this browser",
  "e2ee.signOut.remove.help":
    "Deletes the encrypted chats, attachment keys, unsent messages and encryption keys saved here for this profile. Your history is lost unless backup is on.",
  "e2ee.signOut.remove.helpAll":
    "Recommended on a shared computer. Deletes the encrypted chats, attachment keys, unsent messages and encryption keys saved here for every profile. Your history is lost unless backup is on.",
  "e2ee.signOut.confirm": "Sign out",
  "e2ee.signOut.removeFailed":
    "Couldn’t remove encrypted messages from this browser. Close any other 6529 tabs and try again. You’re still signed in.",
  "e2ee.enroll.identity": "You’ll sign as {name} with {wallet}.",
  "e2ee.enroll.identityUnknown":
    "You’ll sign with the wallet connected to this profile.",
  "e2ee.enroll.manage":
    "You can turn this device off at any time from the Devices page in encrypted messages.",
  "e2ee.gate.noWallet":
    "Connect the wallet for this profile to use encrypted messages.",

  "e2ee.enroll.title": "Turn on encrypted messages",
  "e2ee.enroll.intro":
    "Encrypted chats can be read only by the people in them.",
  "e2ee.enroll.point.signature":
    "One wallet signature lets this device send and read encrypted messages for 180 days.",
  "e2ee.enroll.point.noFunds":
    "The signature can’t move funds or change your profile, and it costs no gas.",
  "e2ee.enroll.point.privacy":
    "6529 cannot read your encrypted messages. It only delivers them.",
  "e2ee.enroll.point.noBackup":
    "Your history is stored on your devices. If you lose all of them or clear this browser’s data, you lose it, unless you turn on encrypted backup in Devices.",
  "e2ee.enroll.safari":
    "Safari can delete this site’s data if you don’t open 6529 for 7 days. Visit regularly, or use another browser or the 6529 app, to keep your history.",
  "e2ee.enroll.button": "Turn on encrypted messages (one signature)",
  "e2ee.enroll.waiting": "Waiting for your wallet signature…",
  "e2ee.enroll.rejected": "You cancelled the signature. Nothing was turned on.",
  "e2ee.enroll.failed": "Couldn’t turn on encrypted messages. Try again.",

  "e2ee.deviceLimit.title": "Too many devices",
  "e2ee.deviceLimit.body":
    "Your profile already has the maximum of {max} devices for encrypted messages. On a device you already use, open Devices and revoke one you no longer need, then turn on this device.",
  "e2ee.deviceLimit.listTitle": "Devices on your profile",
  "e2ee.deviceLimit.signature":
    "Turning on this device is one wallet signature. It moves no funds and costs nothing.",
  "e2ee.deviceLimit.retry": "Turn on this device",

  "e2ee.renew.body":
    "This device’s access to encrypted messages ends on {date}. After that it can’t send or read them until you renew. Renewing is one wallet signature; it moves no funds and costs nothing.",
  "e2ee.renew.button": "Renew (one signature)",
  "e2ee.renew.rejected":
    "You cancelled the signature. This device keeps access until {date}.",
  "e2ee.renew.failed": "Couldn’t renew access. Try again.",

  "e2ee.devices.title": "Devices for encrypted messages",
  "e2ee.devices.description":
    "Every active device listed here can read your encrypted messages. Revoke any device you don’t recognize.",
  "e2ee.devices.thisDevice": "This device",
  "e2ee.devices.platform.web": "Browser",
  "e2ee.devices.platform.desktop": "6529 Desktop",
  "e2ee.devices.platform.phone": "6529 app",
  "e2ee.devices.created": "Added {date}",
  "e2ee.devices.lastSeen": "Last seen {date}",
  "e2ee.devices.lastSeenNever": "Not seen yet",
  "e2ee.devices.expires": "Expires {date}",
  "e2ee.devices.expired": "Expired {date}",
  "e2ee.devices.revokedOn": "Revoked {date}",
  "e2ee.devices.verified": "Verified",
  "e2ee.devices.unverified": "Not verified",
  "e2ee.devices.verifiedHint":
    "Its wallet signature was checked on this device.",
  "e2ee.devices.unverifiedHint":
    "Its wallet signature couldn’t be checked on this device.",
  "e2ee.devices.revoke": "Revoke",
  "e2ee.devices.revokeAria": "Revoke {label}",
  "e2ee.devices.revokeConfirmTitle": "Revoke {label}?",
  "e2ee.devices.revokeConfirmBody":
    "It will stop receiving encrypted messages and be removed from all your encrypted chats.",
  "e2ee.devices.revokeThisConfirmBody":
    "This device will stop receiving encrypted messages. To use them here again, you’ll need to turn them on with a new signature.",
  "e2ee.devices.revokeConfirm": "Revoke device",
  "e2ee.devices.revokeFailed": "Couldn’t revoke the device. Try again.",
  "e2ee.devices.revokeDone": "Device revoked.",
  "e2ee.devices.empty": "No devices yet.",
  "e2ee.devices.revokedSection": "Revoked devices",
  "e2ee.devices.rename.label": "Name for this device",
  "e2ee.devices.rename.save": "Save name",
  "e2ee.devices.rename.saved": "Device name saved.",
  "e2ee.devices.rename.failed": "Couldn’t save the name. Try again.",
  "e2ee.devices.newDevice":
    "New device added {date}: {label} ({platform}). It can read your encrypted messages. If this wasn’t you, revoke it.",
  "e2ee.devices.newDeviceConfirm": "This was me",
  "e2ee.devices.newDeviceRevoke": "Revoke {label}",
  "e2ee.devices.open": "Devices for encrypted messages",

  "e2ee.list.subtitle": "End-to-end encrypted chats on this device.",
  "e2ee.list.empty.title": "No encrypted chats yet",
  "e2ee.list.empty.body":
    "Start an encrypted chat with one person or a group. Only the people in the chat can read it.",
  "e2ee.list.preview.attachment": "Attachment",
  "e2ee.list.preview.deleted": "Message deleted",
  "e2ee.list.preview.undecryptable": "Couldn’t decrypt",
  "e2ee.list.preview.none": "No messages yet",
  "e2ee.list.preview.from": "{name}: {text}",
  "e2ee.list.unread.one": "{count} unread message",
  "e2ee.list.unread.other": "{count} unread messages",
  "e2ee.list.mentions.one": "{count} mention",
  "e2ee.list.mentions.other": "{count} mentions",
  "e2ee.list.status.invalid": "Paused",
  "e2ee.list.muted": "Muted",
  "e2ee.list.status.left": "You left",
  "e2ee.list.status.removed": "Removed",
  "e2ee.list.status.restored": "From backup",
  "e2ee.list.entry": "Encrypted messages",
  "e2ee.list.entryHint": "End-to-end encrypted chats",
  "e2ee.list.viewAll": "All encrypted chats",
  "e2ee.list.label": "Encrypted chats",

  "e2ee.new.title": "New encrypted chat",
  "e2ee.new.description":
    "Choose who to chat with. Only the people in the chat can read it.",
  "e2ee.new.searchLabel": "Search people",
  "e2ee.new.selected": "People in this chat",
  "e2ee.new.noneSelected": "No one selected yet.",
  "e2ee.new.remove": "Remove {name}",
  "e2ee.new.self": "You’re already in this chat.",
  "e2ee.new.kindLegend": "Chat type",
  "e2ee.new.kind.dm": "Direct message",
  "e2ee.new.kind.dmHint": "You and one other person.",
  "e2ee.new.kind.group": "Group",
  "e2ee.new.kind.groupHint":
    "Several people. Admins can add and remove people.",
  "e2ee.new.nameLabel": "Group name (optional)",
  "e2ee.new.nameHint": "Only people in the group can see the name.",
  "e2ee.new.eligibility.checking": "Checking…",
  "e2ee.new.eligibility.OK": "Can receive encrypted messages",
  "e2ee.new.eligibility.POLICY": "Doesn’t accept messages from you",
  "e2ee.new.eligibility.POLICY.peopleIFollowOnly":
    "Only accepts messages from people they follow",
  "e2ee.new.eligibility.POLICY.groupMembersOnly":
    "Only accepts messages from members of a group they chose",
  "e2ee.new.eligibility.BLOCKED": "You blocked them. Unblock to message.",
  "e2ee.new.eligibility.NO_DEVICES": "Hasn’t turned on encrypted messages yet",
  "e2ee.new.eligibility.error": "Couldn’t check. Try again.",
  "e2ee.new.notEligibleSummary":
    "Remove the people who can’t receive encrypted messages to continue.",
  "e2ee.new.dmNeedsOne":
    "A direct message is with exactly one other person. Choose Group for more.",
  "e2ee.new.create": "Start encrypted chat",
  "e2ee.new.creating": "Starting…",
  "e2ee.new.createFailed": "Couldn’t start the encrypted chat. Try again.",
  "e2ee.new.existingDm": "You already have an encrypted chat with {name}.",
  "e2ee.new.openExisting": "Open chat",
  "e2ee.new.fromDm":
    "Starting from a direct message. Earlier messages aren’t copied; the encrypted chat starts empty.",

  "e2ee.conversation.loading": "Loading chat…",
  "e2ee.conversation.notFound.title": "Chat not found on this device",
  "e2ee.conversation.notFound.body":
    "This encrypted chat isn’t on this device. Devices only receive chats they were added to.",
  "e2ee.conversation.back": "Back to encrypted messages",
  "e2ee.conversation.info": "Chat info",
  "e2ee.conversation.search.open": "Search this chat",
  "e2ee.conversation.search.label": "Search messages on this device",
  "e2ee.conversation.search.close": "Close search",
  "e2ee.conversation.search.results.one": "{count} result",
  "e2ee.conversation.search.results.other": "{count} results",
  "e2ee.conversation.search.noResults": "No messages found.",
  "e2ee.conversation.search.localNote": "Search runs only on this device.",
  "e2ee.conversation.search.failed": "Search failed. Try again.",
  "e2ee.conversation.empty": "No messages yet. Say hello.",
  "e2ee.conversation.intro.encrypted":
    "Messages in this chat are end-to-end encrypted. Only the people in it can read them.",
  "e2ee.conversation.intro.deviceHistory":
    "This device shows messages from when it joined the chat. There’s no message backup yet, so earlier messages stay on the devices that received them.",
  "e2ee.conversation.day.today": "Today",
  "e2ee.conversation.day.yesterday": "Yesterday",
  "e2ee.conversation.jumpToLatest": "New messages",
  "e2ee.conversation.skipToComposer": "Skip to message composer",
  "e2ee.conversation.timelineLabel": "Messages",
  "e2ee.conversation.newMessage": "New message from {name}",
  "e2ee.conversation.titleMore": "{names} and {count} more",
  "e2ee.conversation.members.one": "{count} member",
  "e2ee.conversation.members.other": "{count} members",

  "e2ee.banner.delayed":
    "Group changes are delayed. Messages will send once the change goes through.",
  "e2ee.banner.splitView":
    "Security check needed: this device may not see the same chat as everyone else. Compare safety codes before sharing anything sensitive.",
  "e2ee.banner.splitViewAction": "Compare safety codes",
  "e2ee.banner.invalid": "This chat is paused because of an invalid change.",
  "e2ee.banner.untrustedNewWallet":
    "{name} has a device signed by a new wallet {wallet}.",
  "e2ee.banner.untrustedNewWalletSelf":
    "You have a device signed by a new wallet {wallet}.",
  "e2ee.banner.untrustedUnverified":
    "{name} has a device signed by wallet {wallet}, and this device couldn’t check that signature.",
  "e2ee.banner.untrustedUnverifiedSelf":
    "You have a device signed by wallet {wallet}, and this device couldn’t check that signature.",
  "e2ee.banner.untrustedHelp":
    "It can’t read this chat unless you add it. Add it only if you know whose wallet this is.",
  "e2ee.banner.addDevice": "Add device",
  "e2ee.banner.addDeviceAria": "Add device signed by wallet {wallet}",
  "e2ee.banner.ignoreDevice": "Ignore",
  "e2ee.banner.ignoreDeviceAria": "Ignore device signed by wallet {wallet}",
  "e2ee.banner.deviceActionFailed": "Couldn’t update the device. Try again.",
  "e2ee.banner.restart": "Start a new encrypted chat with the same people",
  "e2ee.banner.restartFailed": "Couldn’t start a new chat. Try again.",
  "e2ee.banner.left": "You left this chat.",
  "e2ee.banner.removed": "You were removed from this chat.",
  "e2ee.banner.restored":
    "Restored from your backup. New messages appear here once someone in this chat adds this device.",

  "e2ee.message.undecryptable": "Couldn’t decrypt this message",
  "e2ee.message.undecryptableHint":
    "It couldn’t be read on this device. Ask {name} to send it again if you need it.",
  "e2ee.message.undecryptableSender": "A member",
  "e2ee.message.deleted": "Message deleted",
  "e2ee.message.edited": "edited",
  "e2ee.message.pending": "Sending…",
  "e2ee.message.pendingSlow": "Waiting for connection. Will keep trying.",
  "e2ee.message.unverified": "Signature not verified",
  "e2ee.message.replyTo": "Reply to {name}",
  "e2ee.message.replyUnavailable": "Original message unavailable",
  "e2ee.message.actions": "Message actions",
  "e2ee.message.reactions": "Reactions",
  "e2ee.message.reactWith": "React with {reaction}",
  "e2ee.message.reactionSummary": "{reaction}: {count}. Reacted by {names}",
  "e2ee.message.reply": "Reply",
  "e2ee.message.edit": "Edit",
  "e2ee.message.delete": "Delete",
  "e2ee.message.report": "Report illegal or severe harm",
  "e2ee.message.mute": "Mute on this device",
  "e2ee.message.unmute": "Unmute on this device",
  "e2ee.message.block": "Block {name}",
  "e2ee.message.messageSettings": "Choose who can message you",
  "e2ee.message.deleteConfirmTitle": "Delete this message?",
  "e2ee.message.deleteConfirmBody":
    "It will show as “Message deleted” for everyone in the chat.",
  "e2ee.message.deleteConfirm": "Delete message",
  "e2ee.message.actionFailed": "Couldn’t complete that. Try again.",
  "e2ee.message.attachment.download": "Download {name}",
  "e2ee.message.attachment.loading": "Loading attachment…",
  "e2ee.message.attachment.failed": "Couldn’t load {name}",
  "e2ee.message.attachment.imageAlt": "Image: {name}",
  "e2ee.message.attachment.unnamed": "file",
  "e2ee.message.attachment.tooLarge": "Too large to preview",

  "e2ee.notice.created": "{actor} started this encrypted chat",
  "e2ee.notice.joined": "{targets} joined",
  "e2ee.notice.added": "{actor} added {targets}",
  "e2ee.notice.left": "{actor} left",
  "e2ee.notice.removed": "{actor} removed {targets}",
  "e2ee.notice.removedNoActor": "{targets} is no longer in the chat",
  "e2ee.notice.deviceAdded": "{name} added a device",
  "e2ee.notice.deviceAddedWallet":
    "{name} added a device signed by wallet {wallet}",
  "e2ee.notice.deviceRemoved": "{name} removed a device",
  "e2ee.notice.renamed": "{actor} renamed the chat to “{name}”",
  "e2ee.notice.renamedNoName": "{actor} renamed the chat",
  "e2ee.notice.adminsChanged": "{actor} changed the admins",
  "e2ee.notice.safetyCodeChanged": "The safety code changed",

  "e2ee.composer.label": "Encrypted message",
  "e2ee.composer.placeholder": "Write an encrypted message",
  "e2ee.composer.send": "Send",
  "e2ee.composer.attach": "Attach files",
  "e2ee.composer.removeAttachment": "Remove {name}",
  "e2ee.composer.attachments": "Attachments",
  "e2ee.composer.tooManyFiles": "You can attach up to {max} files.",
  "e2ee.composer.fileTooLarge": "{name} is larger than {max} MB.",
  "e2ee.composer.replyingTo": "Replying to {name}",
  "e2ee.composer.cancelReply": "Cancel reply",
  "e2ee.composer.editing": "Editing message",
  "e2ee.composer.cancelEdit": "Cancel edit",
  "e2ee.composer.saveEdit": "Save",
  "e2ee.composer.tooLong": "Messages can be up to {max} characters.",
  "e2ee.composer.blocked":
    "Sending is paused until the group change goes through.",
  "e2ee.composer.unavailable": "You can’t send messages in this chat.",
  "e2ee.composer.sendFailed": "Couldn’t send. Try again.",
  "e2ee.composer.uploading.one": "Encrypting and sending {count} file…",
  "e2ee.composer.uploading.other": "Encrypting and sending {count} files…",
  "e2ee.composer.dropped.body": "This message couldn’t be sent.",
  "e2ee.composer.dropped.quote": "“{text}”",
  "e2ee.composer.dropped.restore": "Edit and resend",
  "e2ee.composer.hint": "Enter to send, Shift+Enter for a new line",
  "e2ee.composer.mentions.label": "Mention someone",

  "e2ee.info.title": "Chat info",
  "e2ee.info.close": "Close chat info",
  "e2ee.info.members": "Members",
  "e2ee.info.admin": "Admin",
  "e2ee.info.devices.one": "{count} device",
  "e2ee.info.devices.other": "{count} devices",
  "e2ee.info.memberDevices": "Devices of {name}",
  "e2ee.info.deviceLine": "{device} · {status} · signed by wallet {wallet}",
  "e2ee.info.deviceLineNoWallet": "{device} · {status}",
  "e2ee.info.addPeople": "Add people",
  "e2ee.info.addSearch": "Search people to add",
  "e2ee.info.addSubmit": "Add to chat",
  "e2ee.info.addFailed": "Couldn’t add people. Try again.",
  "e2ee.info.addSkipped": "Some people couldn’t be added:",
  "e2ee.info.addSkippedItem": "{name}: {reason}",
  "e2ee.info.remove": "Remove",
  "e2ee.info.removeAria": "Remove {name} from the chat",
  "e2ee.info.removeConfirmTitle": "Remove {name}?",
  "e2ee.info.removeConfirmBody":
    "They won’t receive new messages in this chat.",
  "e2ee.info.makeAdmin": "Make admin",
  "e2ee.info.removeAdmin": "Remove admin",
  "e2ee.info.makeAdminAria": "Make {name} an admin",
  "e2ee.info.removeAdminAria": "Remove {name} as admin",
  "e2ee.info.rename": "Rename",
  "e2ee.info.renameLabel": "Group name",
  "e2ee.info.renameSave": "Save name",
  "e2ee.info.leave": "Leave chat",
  "e2ee.info.leaveConfirmTitle": "Leave this chat?",
  "e2ee.info.leaveConfirmBody":
    "You’ll stop receiving messages. You can rejoin only if someone adds you again.",
  "e2ee.info.safetyCode": "Safety code",
  "e2ee.info.safetyCodeAria": "Safety code: {code}",
  "e2ee.info.safetyCodeHelp":
    "Compare this code with the other members in person or in another app you trust. If everyone sees the same code, everyone sees the same people and devices in this chat. Check the wallet shown with each device to know whose it is.",
  "e2ee.info.mute": "Mute on this device",
  "e2ee.info.unmute": "Unmute on this device",
  "e2ee.info.muteHelp":
    "Muted chats don’t show unread counts or notify you here.",
  "e2ee.info.notifications": "Notifications",
  "e2ee.info.report": "Report",
  "e2ee.info.reportHelp":
    "Reports are only for illegal or severe harm. Open the message’s menu and choose Report: only that message goes to 6529’s trust and safety team, with proof of who sent it. For anything else, block or mute instead.",
  "e2ee.info.encryption.title": "About this encryption",
  "e2ee.info.encryption.mls":
    "Built on Messaging Layer Security (MLS), the IETF standard for end-to-end encrypted group chats.",
  "e2ee.info.encryption.postQuantum":
    "Keys are agreed with hybrid post-quantum key exchange, designed to keep messages private even if quantum computers can one day break today’s classical encryption.",
  "e2ee.info.encryption.devices":
    "Each of your devices holds its own keys. A new device sees only messages sent after it joins; there’s no history backup yet.",
  "e2ee.info.actionFailed": "Couldn’t complete that. Try again.",
  "e2ee.info.kind.dm": "Direct message",
  "e2ee.info.kind.group": "Group",
  "e2ee.info.encryptedNote":
    "Messages in this chat are end-to-end encrypted. 6529 delivers them but can’t read them.",

  "e2ee.report.title": "Report illegal or severe harm",
  "e2ee.report.description":
    "Only this message is shared, with proof that its sender sent it. It goes to 6529’s trust and safety team. Nothing else in the conversation is revealed.",
  "e2ee.report.preview.heading": "What this report sends",
  "e2ee.report.preview.message": "The message",
  "e2ee.report.preview.edited": "The message as edited, the version you see",
  "e2ee.report.preview.original": "The original, before it was edited",
  "e2ee.report.preview.noText": "No text",
  "e2ee.report.preview.attachments": "Attachments: {names}",
  "e2ee.report.preview.unavailable":
    "This message can’t be reported from this device.",
  "e2ee.report.includeOriginal": "Also send the original message",
  "e2ee.report.includeOriginalHint":
    "This message was edited, and its attachments belong to the original. Include the original if it or its attachments showed the harm.",
  "e2ee.report.categoryLegend": "What does this message contain?",
  "e2ee.report.category.CHILD_SEXUAL_ABUSE_MATERIAL":
    "Child sexual abuse material",
  "e2ee.report.category.CREDIBLE_THREAT_OF_VIOLENCE":
    "A credible threat of violence",
  "e2ee.report.category.NON_CONSENSUAL_INTIMATE_IMAGERY":
    "Intimate images shared without consent",
  "e2ee.report.category.DOXXING": "Doxxing or exposed personal data",
  "e2ee.report.chooseCategory": "Choose what the message contains.",
  "e2ee.report.otherTools":
    "For anything else, block the sender, mute the chat or choose who can message you from the message menu.",
  "e2ee.report.submit": "Send report",
  "e2ee.report.success": "Report sent to 6529’s trust and safety team.",
  "e2ee.report.failed": "Couldn’t send the report. Try again.",

  "e2ee.block.title": "Block {name}?",
  "e2ee.block.description":
    "They won’t be able to start new chats with you or add you to encrypted chats. Chats you’re already in together stay until you leave them. You can unblock them in Preferences.",
  "e2ee.block.confirm": "Block",
  "e2ee.block.done": "{name} is blocked.",
  "e2ee.block.failed": "Couldn’t block. Try again.",

  "e2ee.composer.attachmentsUnavailable":
    "Attachments aren’t available in encrypted chats yet.",

  "e2ee.plaintext.label": "Not end-to-end encrypted",
  "e2ee.plaintext.start": "Start an encrypted chat with the same people",
  "e2ee.plaintext.startShort": "Start encrypted chat",
  "e2ee.plaintext.iconAction":
    "Not end-to-end encrypted. Start an encrypted chat with the same people",
  "e2ee.plaintext.failed": "Couldn’t load the people in this chat. Try again.",
  "e2ee.backup.title": "Encrypted backup",
  "e2ee.backup.description":
    "Keep an encrypted copy of your message history so you can restore it on a new device with a recovery code. 6529 stores only encrypted data: it can’t read your messages or recover your code.",
  "e2ee.backup.status.loading": "Checking your backup…",
  "e2ee.backup.status.off":
    "Backup is off. If you lose all your devices or clear this browser’s data, you lose this history.",
  "e2ee.backup.status.available":
    "You have an encrypted backup from another device. Enter its recovery code to restore your messages here and back up this device too.",
  "e2ee.backup.status.on": "Backup is on.",
  "e2ee.backup.status.uploading": "Backing up your history…",
  "e2ee.backup.status.lastBackup": "Last backed up {time}.",
  "e2ee.backup.status.usage": "{used} of {quota} used",
  "e2ee.backup.status.error": "Couldn’t check your backup.",
  "e2ee.backup.action.turnOn": "Turn on backup",
  "e2ee.backup.action.restore": "Restore messages",
  "e2ee.backup.action.replace": "Start a new backup",
  "e2ee.backup.action.backupNow": "Back up now",
  "e2ee.backup.action.newCode": "Create new recovery code",
  "e2ee.backup.action.turnOff": "Turn off backup",
  "e2ee.backup.action.retry": "Try again",
  "e2ee.backup.backedUp": "Backed up",
  "e2ee.backup.revokedWarning":
    "You removed a device after this backup was set up. Create a new recovery code so the backup key that device held stops working.",
  "e2ee.backup.code.title": "Save your recovery code",
  "e2ee.backup.code.newTitle": "Save your new recovery code",
  "e2ee.backup.code.description":
    "This code is the only way to restore your messages on a new device. Store it somewhere safe, like a password manager. It’s shown only once, and 6529 can’t recover it for you.",
  "e2ee.backup.code.replaceNote":
    "Your current recovery code stops working once the new backup finishes uploading.",
  "e2ee.backup.code.label": "Recovery code",
  "e2ee.backup.code.copy": "Copy code",
  "e2ee.backup.code.copied": "Recovery code copied.",
  "e2ee.backup.code.copyFailed":
    "Couldn’t copy. Select the code and copy it, or download it.",
  "e2ee.backup.code.download": "Download as text file",
  "e2ee.backup.code.fileName": "6529-encrypted-messages-recovery-code.txt",
  "e2ee.backup.code.fileHeading": "6529 encrypted messages: recovery code",
  "e2ee.backup.code.fileNote":
    "Keep this private. With this code, anyone who can sign in to your 6529 profile can read your backed-up messages.",
  "e2ee.backup.code.saved": "I saved my recovery code somewhere safe",
  "e2ee.backup.code.confirm": "Turn on backup",
  "e2ee.backup.code.confirmNew": "Use the new code",
  "e2ee.backup.restore.title": "Restore messages",
  "e2ee.backup.restore.description":
    "Enter the recovery code you saved when you turned on backup. Restored chats are read-only until someone in each chat adds this device.",
  "e2ee.backup.restore.label": "Recovery code",
  "e2ee.backup.restore.submit": "Restore",
  "e2ee.backup.restore.done.one": "Restored {count} message from your backup.",
  "e2ee.backup.restore.done.other":
    "Restored {count} messages from your backup.",
  "e2ee.backup.restore.doneNothing":
    "Restore finished. This device already had every message in the backup.",
  "e2ee.backup.turnOff.title": "Turn off backup?",
  "e2ee.backup.turnOff.body":
    "This deletes your encrypted backup from 6529 and your recovery code stops working. Messages on your devices stay.",
  "e2ee.backup.error.codeFormat":
    "That doesn’t look like a recovery code. Check for typos and try again.",
  "e2ee.backup.error.wrongCode": "That recovery code doesn’t open this backup.",
  "e2ee.backup.error.none": "There’s no backup to restore.",
  "e2ee.backup.error.corrupt":
    "Part of the backup couldn’t be read. Nothing was restored.",
  "e2ee.backup.error.replaced":
    "Backup was turned off or replaced on another device. To back up this device too, restore with the current recovery code.",
  "e2ee.backup.error.quota":
    "Your backup storage is full. Create a new recovery code to start a compact backup.",
  "e2ee.backup.error.notReady":
    "Set up encrypted messages on this device first.",
  "e2ee.backup.error.rateLimited": "Too many backup requests. Try again later.",
  "e2ee.backup.error.generic":
    "Something went wrong with your backup. Try again.",

  "e2ee.imported.badge": "Imported, not verified",
  "e2ee.imported.detail":
    "Moved from an unencrypted DM. The author and time come from 6529’s server copy and can’t be verified.",
  "e2ee.imported.mediaMissing.one": "{count} image or file wasn’t moved.",
  "e2ee.imported.mediaMissing.other": "{count} images or files weren’t moved.",
  "e2ee.imported.reactions": "Reactions on the original: {reactions}",
  "e2ee.imported.movedBy": "Moved by {name}",
  "e2ee.imported.unknownAuthor": "Unknown",

  // Unencrypted DMs are deleted from 6529's servers on a fixed date (D146).
  "e2ee.legacy.banner.label": "Not end-to-end encrypted.",
  "e2ee.legacy.banner.deletion":
    "This history will be deleted from 6529’s servers on {date}, unless we’re legally required to keep it.",
  "e2ee.legacy.banner.closed":
    "This unencrypted chat is closed. Its history was deleted from 6529’s servers on {date}, except anything we’re legally required to keep.",
  "e2ee.legacy.region": "Unencrypted chat notice",
  "e2ee.legacy.action.export": "Export history",
  "e2ee.legacy.action.openEncrypted": "Open encrypted chat",
  "e2ee.legacy.readOnly":
    "This chat is read-only. Your new messages go to the encrypted chat.",

  "e2ee.legacy.export.title": "Export this chat",
  "e2ee.legacy.export.description":
    "Download the messages you can see here, with who sent them and when. The file is made in your browser and stays on your device.",
  "e2ee.legacy.export.media":
    "Images and files are listed as links. The links stop working on {date}, so save anything you want to keep before then.",
  "e2ee.legacy.export.start": "Prepare export",
  "e2ee.legacy.export.progress.one": "Read {count} message…",
  "e2ee.legacy.export.progress.other": "Read {count} messages…",
  "e2ee.legacy.export.ready.one": "{count} message ready.",
  "e2ee.legacy.export.ready.other": "{count} messages ready.",
  "e2ee.legacy.export.html": "Download readable page (HTML)",
  "e2ee.legacy.export.json": "Download data (JSON)",
  "e2ee.legacy.export.failed":
    "Couldn’t read the whole chat. Check your connection and try again.",
  "e2ee.legacy.export.retry": "Try again",

  "e2ee.legacy.create.unencrypted": "Send unencrypted instead",
  "e2ee.legacy.create.warning":
    "An unencrypted DM isn’t end-to-end encrypted, and 6529 deletes it from its servers on {date}, unless we’re legally required to keep it.",
  "e2ee.legacy.action.move": "Move history",
  "e2ee.legacy.import.title": "Move history to the encrypted chat",
  "e2ee.legacy.import.intro":
    "This copies the messages you can see here into your encrypted chat with the same people, oldest first, with their images and files when they can be moved.",
  "e2ee.legacy.import.label":
    "Each copied message shows who wrote it and when, marked “Imported, not verified”. 6529 held these messages unencrypted, so the encrypted chat can’t prove who wrote them.",
  "e2ee.legacy.import.audience":
    "Only the people and devices in the encrypted chat now will see them. 6529’s unencrypted copy is still deleted on {date}, unless we’re legally required to keep it.",
  "e2ee.legacy.import.keepOpen":
    "Keep this page open while it runs. You can stop and continue later; nothing is copied twice.",
  "e2ee.legacy.import.start": "Start moving",
  "e2ee.legacy.import.continue": "Continue",
  "e2ee.legacy.import.stop": "Stop",
  "e2ee.legacy.import.progressLabel": "Moving history",
  "e2ee.legacy.import.progress": "{done} of {total} moved",
  "e2ee.legacy.import.media":
    "Images and files moved: {moved}. Too large to move: {tooLarge}. Not moved: {notMoved}.",
  "e2ee.legacy.import.done":
    "Done. {sent} moved, {skipped} were already in the encrypted chat.",
  "e2ee.legacy.import.failedSome.one":
    "{count} message couldn’t be moved. Continue to try it again.",
  "e2ee.legacy.import.failedSome.other":
    "{count} messages couldn’t be moved. Continue to try them again.",
  "e2ee.legacy.import.paused":
    "Paused: today’s limit for encrypted uploads is reached. Continue tomorrow to move the rest with their images.",
  "e2ee.legacy.import.pausedStorage":
    "Paused: your space for encrypted images and files is full. Continue later, or move the rest without images and files.",
  "e2ee.legacy.import.continueWithoutMedia": "Continue without images",
  "e2ee.legacy.import.cancelled":
    "Stopped. Continue any time; what was moved stays.",
  "e2ee.legacy.import.error":
    "Couldn’t read this chat. Check your connection and try again.",

  "e2ee.legacy.file.title": "6529 DM: {name}",
  "e2ee.legacy.file.notice":
    "Copied from an unencrypted 6529.io DM by {handle} on {date}. 6529 deletes its server copies on {deletionDate}, except anything it is legally required to keep. This copy is not encrypted and not authenticated: anyone with the file can read it, and it does not prove who wrote what.",
  "e2ee.legacy.file.participants": "People",
  "e2ee.legacy.file.exportedAt": "Exported {date}",
  "e2ee.legacy.file.replyTo": "reply",
  "e2ee.legacy.file.edited": "edited",
  "e2ee.legacy.file.media": "Files",
  "e2ee.legacy.file.unknownAuthor": "Unknown",
} as const;
