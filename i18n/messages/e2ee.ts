/**
 * End-to-end encrypted DMs and groups (D109). Source copy (en-US); other
 * locales fall back to these strings until translated. The engine returns
 * codes only; every user-visible string lives here.
 */
export const E2EE_MESSAGES = {
  "e2ee.badge.encrypted": "End-to-end encrypted",
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
    "There is no backup in this version. If you lose all your devices or clear this browser’s data, you lose this history.",
  "e2ee.enroll.safari":
    "Safari can delete this site’s data if you don’t open 6529 for 7 days. Visit regularly, or use another browser or the 6529 app, to keep your history.",
  "e2ee.enroll.button": "Turn on encrypted messages (one signature)",
  "e2ee.enroll.waiting": "Waiting for your wallet signature…",
  "e2ee.enroll.rejected": "You cancelled the signature. Nothing was turned on.",
  "e2ee.enroll.failed": "Couldn’t turn on encrypted messages. Try again.",

  "e2ee.deviceLimit.title": "Too many devices",
  "e2ee.deviceLimit.body":
    "Your profile already has the maximum number of devices for encrypted messages. Revoke one you no longer use, then turn on this device.",
  "e2ee.deviceLimit.retry": "Turn on this device",

  "e2ee.renew.body":
    "This device’s access to encrypted messages ends on {date}.",
  "e2ee.renew.button": "Renew (one signature)",

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
    "{label} can now read your encrypted messages. Not you? Revoke.",
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
  "e2ee.list.unread.one": "{count} unread message",
  "e2ee.list.unread.other": "{count} unread messages",
  "e2ee.list.mentions.one": "{count} mention",
  "e2ee.list.mentions.other": "{count} mentions",
  "e2ee.list.status.invalid": "Paused",
  "e2ee.list.muted": "Muted",
  "e2ee.list.status.left": "You left",
  "e2ee.list.status.removed": "Removed",
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
  "e2ee.conversation.timelineLabel": "Messages",
  "e2ee.conversation.newMessage": "New message from {name}",
  "e2ee.conversation.titleMore": "{names} and {count} more",
  "e2ee.conversation.members.one": "{count} member",
  "e2ee.conversation.members.other": "{count} members",

  "e2ee.banner.delayed":
    "Group changes are delayed. Messages will send once the change goes through.",
  "e2ee.banner.splitView":
    "Possible split view detected: compare safety codes.",
  "e2ee.banner.splitViewAction": "Compare safety codes",
  "e2ee.banner.invalid": "This chat is paused because of an invalid change.",
  "e2ee.banner.restart": "Start a new encrypted chat with the same people",
  "e2ee.banner.restartFailed": "Couldn’t start a new chat. Try again.",
  "e2ee.banner.left": "You left this chat.",
  "e2ee.banner.removed": "You were removed from this chat.",

  "e2ee.message.undecryptable": "Couldn’t decrypt this message",
  "e2ee.message.deleted": "Message deleted",
  "e2ee.message.edited": "edited",
  "e2ee.message.pending": "Sending…",
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
  "e2ee.message.mute": "Mute this chat",
  "e2ee.message.unmute": "Unmute this chat",
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

  "e2ee.notice.created": "{actor} started this encrypted chat",
  "e2ee.notice.joined": "{targets} joined",
  "e2ee.notice.added": "{actor} added {targets}",
  "e2ee.notice.left": "{actor} left",
  "e2ee.notice.removed": "{actor} removed {targets}",
  "e2ee.notice.removedNoActor": "{targets} is no longer in the chat",
  "e2ee.notice.deviceAdded": "{name} added a device",
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
  "e2ee.composer.hint": "Enter to send, Shift+Enter for a new line",
  "e2ee.composer.mentions.label": "Mention someone",

  "e2ee.info.title": "Chat info",
  "e2ee.info.close": "Close chat info",
  "e2ee.info.members": "Members",
  "e2ee.info.admin": "Admin",
  "e2ee.info.devices.one": "{count} device",
  "e2ee.info.devices.other": "{count} devices",
  "e2ee.info.memberDevices": "Devices of {name}",
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
    "Compare this code with the others in the chat; if it matches, nobody is intercepting.",
  "e2ee.info.report": "Report",
  "e2ee.info.reportHelp":
    "To report a message, open its menu and choose Report. The report includes that message so moderators can verify who sent it.",
  "e2ee.info.actionFailed": "Couldn’t complete that. Try again.",
  "e2ee.info.kind.dm": "Direct message",
  "e2ee.info.kind.group": "Group",
  "e2ee.info.encryptedNote":
    "Messages in this chat are end-to-end encrypted. 6529 delivers them but can’t read them.",

  "e2ee.report.title": "Report illegal or severe harm",
  "e2ee.report.description":
    "Only this message is shared, with proof that its sender sent it. It goes to 6529’s trust and safety team. Nothing else in the conversation is revealed.",
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
} as const;
