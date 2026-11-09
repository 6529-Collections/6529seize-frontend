// en-US source strings for Preferences → Devices & security: devices,
// their permissions (signed posts, encrypted DMs) and encrypted backup.
// Other locales fall back to en-US.
export const DEVICES_SECURITY_MESSAGES = {
  "preferences.tabs.security": "Devices & security",
  "devicesSecurity.tab.backupOff": "backup is off",
  "devicesSecurity.proxy":
    "Switch to your own profile to manage devices and backup.",
  "devicesSecurity.localUnreadable":
    "This browser couldn’t read its own keys, so it can’t tell which device below is this one. Check names and dates before you revoke.",
  "devicesSecurity.loading": "Loading devices",
  "devicesSecurity.error": "Couldn’t load your devices.",
  "devicesSecurity.retry": "Try again",

  "devicesSecurity.devices.title": "Devices",
  "devicesSecurity.devices.description":
    "Devices that can post as you or read your encrypted DMs. Each one was turned on with a wallet signature and stays on for 180 days unless you revoke it.",
  "devicesSecurity.permissions.title": "What these permissions mean",
  "devicesSecurity.permissions.posts":
    "Signed posts: the device signs your posts, edits, deletes and reactions, so anyone can check they came from you.",
  "devicesSecurity.permissions.dms":
    "Encrypted DMs: the device can send and read your end-to-end encrypted messages. 6529 delivers them but can’t read them.",
  "devicesSecurity.permissions.safety":
    "Neither permission can move funds or change your profile, and turning one on costs no gas.",

  "devicesSecurity.chip.posts": "Signed posts",
  "devicesSecurity.chip.dms": "Encrypted DMs",
  "devicesSecurity.chip.postsOff": "Signed posts off",
  "devicesSecurity.chip.dmsOff": "Encrypted DMs off",
  "devicesSecurity.setUp": "Set up {date}",
  "devicesSecurity.labelWithCount": "{label} · {count}",
  "devicesSecurity.labelWithPermissions": "{label} · {permissions}",
  "devicesSecurity.unverified": "Couldn’t check its wallet signature",

  "devicesSecurity.thisDevice.label": "This device",
  "devicesSecurity.thisDevice.none":
    "This browser has no permissions yet. Turn them on with one wallet signature.",
  "devicesSecurity.thisDevice.rename": "Rename",
  "devicesSecurity.thisDevice.renameTitle": "Rename this device",
  "devicesSecurity.thisDevice.more": "More actions for this browser",
  "devicesSecurity.thisDevice.revoke": "Revoke this browser…",

  "devicesSecurity.others.title": "Other devices",
  "devicesSecurity.others.empty":
    "No other devices. To add one, open 6529 there and turn on signed posts and encrypted DMs. It takes one wallet signature.",
  "devicesSecurity.revokeUnavailable":
    "Open encrypted DMs in this browser to revoke this device here.",
  "devicesSecurity.blocked.loading":
    "Checking encrypted DMs in this browser. Revoke appears in a moment.",
  "devicesSecurity.blocked.elsewhere":
    "Encrypted DMs are open in another 6529 tab. Use them here to revoke this device.",
  "devicesSecurity.blocked.failed":
    "Encrypted DMs couldn’t start in this browser. Try again to revoke this device.",
  "devicesSecurity.blocked.needsDms":
    "Turn on encrypted DMs in this browser to revoke this device here, or revoke it from a device that has them on.",
  "devicesSecurity.blocked.deviceLimit":
    "This browser can’t add encrypted DMs while you have 10 devices. Revoke this one from a device that has them on.",
  "devicesSecurity.blocked.unsupported":
    "This browser can’t use encrypted DMs. Revoke this device from one that can.",
  "devicesSecurity.blocked.noWallet":
    "Connect the wallet for this profile to revoke this device.",
  "devicesSecurity.rename.title": "Rename {label}",
  "devicesSecurity.row.more": "More actions for {label}",
  "devicesSecurity.row.rename": "Rename…",

  "devicesSecurity.earlier.title": "Earlier setups of this browser",
  "devicesSecurity.earlier.body":
    "These have the same name as this browser and haven’t been active since it was set up again. That usually means the browser cleared its saved keys, so they can’t be used. They still count toward your 10 devices for encrypted DMs.",
  "devicesSecurity.earlier.cleanUp": "Clean up…",

  "devicesSecurity.cleanUp.title": "Clean up earlier setups",
  "devicesSecurity.cleanUp.body":
    "Revoked devices can’t post as you or read new encrypted messages. If one is a device you still use, you can turn it back on there with one wallet signature.",
  "devicesSecurity.cleanUp.listLabel": "Devices to revoke",
  "devicesSecurity.cleanUp.confirm.one": "Revoke {count} device",
  "devicesSecurity.cleanUp.confirm.other": "Revoke {count} devices",
  "devicesSecurity.cleanUp.done.one": "{count} device revoked.",
  "devicesSecurity.cleanUp.done.other": "{count} devices revoked.",
  "devicesSecurity.cleanUp.failed":
    "Couldn’t revoke {labels}. The others were revoked. Try again.",

  "devicesSecurity.revoke.title": "Revoke {label}?",
  "devicesSecurity.revoke.both":
    "It will stop posting as you and stop receiving encrypted DMs. The encrypted chats saved on it are deleted the next time it opens 6529.",
  "devicesSecurity.revoke.posts": "It will stop posting as you.",
  "devicesSecurity.revoke.dms":
    "It will stop receiving encrypted DMs. The encrypted chats saved on it are deleted the next time it opens 6529.",
  "devicesSecurity.revoke.after":
    "Posts it already signed stay verifiable. To use it again, turn it back on there with one wallet signature.",
  "devicesSecurity.revoke.done": "{label} revoked.",

  "devicesSecurity.history.title": "Revoked or expired in the last 30 days",
  "devicesSecurity.history.revoked": "Set up {setUp} · Revoked {ended}",
  "devicesSecurity.history.expired": "Set up {setUp} · Expired {ended}",
  "devicesSecurity.history.note":
    "Revoked devices can’t post as you or read new encrypted messages. Posts they signed earlier stay verifiable.",

  "devicesSecurity.backup.pill.on": "On",
  "devicesSecurity.backup.pill.off": "Off",
  "devicesSecurity.backup.pill.available": "Not on this device",
  "devicesSecurity.backup.pill.uploading": "Backing up",
  "devicesSecurity.backup.pill.unknown": "Unknown",
  "devicesSecurity.backup.pill.unavailable": "Not available",
  "devicesSecurity.backup.off.body":
    "Your encrypted messages are saved only on your devices. Browsers sometimes clear a site’s data on their own. If that happens and no other device has your chats, they’re gone for good.",
  "devicesSecurity.backup.off.stepsLabel": "How backup works",
  "devicesSecurity.backup.off.step1.title": "Save a recovery code",
  "devicesSecurity.backup.off.step1.body":
    "Keep it in a password manager. It’s the only key to your backup.",
  "devicesSecurity.backup.off.step2.title": "Backs up by itself",
  "devicesSecurity.backup.off.step2.body":
    "New messages are added while 6529 is open in this browser.",
  "devicesSecurity.backup.off.step3.title": "Restore anywhere",
  "devicesSecurity.backup.off.step3.body":
    "On a new device, enter the code to bring your chats back.",
  "devicesSecurity.backup.off.note":
    "About a minute. 6529 stores only encrypted data and can’t read it or recover your code.",
  "devicesSecurity.backup.needsDms":
    "Backup covers encrypted DMs. Turn them on in this browser first.",
  "devicesSecurity.backup.elsewhere":
    "Encrypted messages and backup run in one tab at a time. They’re open in another 6529 tab.",
  "devicesSecurity.backup.failed":
    "Couldn’t check your backup. Your messages on this device aren’t affected.",

  "devicesSecurity.newDevice.title": "New device: {label}",
  "devicesSecurity.newDevice.both":
    "It can now post as you and read your encrypted DMs. Set up on {date}. If this wasn’t you, revoke it.",
  "devicesSecurity.newDevice.posts":
    "It can now post as you. Set up on {date}. If this wasn’t you, revoke it.",
  "devicesSecurity.newDevice.dms":
    "It can now read your encrypted DMs. Set up on {date}. If this wasn’t you, revoke it.",
  "devicesSecurity.newDevice.itWasMe": "It was me",
} as const;
