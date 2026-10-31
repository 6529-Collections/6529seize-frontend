// en-US source strings for signed messages (device-key signed drop writes).
// Other locales fall back to en-US while the feature is staged.
export const SIGNED_MESSAGES_MESSAGES = {
  "preferences.tabs.devices": "Devices",
  "signedMessages.enable.unavailable":
    "Couldn't turn on signed messages. Please try again.",
  "signedMessages.notice.ariaLabel": "Signed messages",
  "signedMessages.notice.dismiss": "Dismiss",
  "signedMessages.notice.enable.title":
    "Turn on signed messages (one signature)",
  "signedMessages.notice.enable.body":
    "Your wallet signs once. This browser then signs your posts, edits, deletes and reactions for 180 days, so anyone can verify they came from you.",
  "signedMessages.notice.enable.action": "Turn on",
  "signedMessages.notice.renew.title": "Signed messages end on {date}",
  "signedMessages.notice.renew.body":
    "Renew with one signature to keep signing your messages in this browser.",
  "signedMessages.notice.renew.action": "Renew",
  "signedMessages.notice.expired.title":
    "Signed messages have ended in this browser",
  "signedMessages.notice.expired.body":
    "Your messages are sent unsigned until you renew with one signature.",
  "signedMessages.notice.newDevice.message":
    "{label} can now post as you. Not you?",
  "signedMessages.notice.newDevice.revoke": "Revoke",
  "signedMessages.notice.enabled": "Signed messages are on in this browser.",
  "signedMessages.revoke.success": "{label} can no longer post as you.",
  "signedMessages.revoke.error":
    "Couldn't revoke this device. Please try again.",
  "signedMessages.devices.title": "Devices that can post as you",
  "signedMessages.devices.description":
    "With signed messages on, a browser holds a key that signs your posts, edits, deletes and reactions. It cannot move funds, change your handle, add devices or act as an admin.",
  "signedMessages.devices.listLabel": "Devices",
  "signedMessages.devices.thisDevice": "This device",
  "signedMessages.devices.scopes": "Can {scopes}",
  "signedMessages.devices.scope.post": "post",
  "signedMessages.devices.scope.edit": "edit",
  "signedMessages.devices.scope.delete": "delete",
  "signedMessages.devices.scope.react": "react",
  "signedMessages.devices.scope.vote": "vote",
  "signedMessages.devices.wallet": "Wallet {address}",
  "signedMessages.devices.granted": "Added {date}",
  "signedMessages.devices.expires": "Expires {date}",
  "signedMessages.devices.expiredOn": "Expired {date}",
  "signedMessages.devices.revokedOn": "Revoked {date}",
  "signedMessages.devices.lastUsed": "Last used {date}",
  "signedMessages.devices.neverUsed": "Not used yet",
  "signedMessages.devices.status.active": "Active",
  "signedMessages.devices.status.expired": "Expired",
  "signedMessages.devices.status.revoked": "Revoked",
  "signedMessages.devices.revoke": "Revoke",
  "signedMessages.devices.revokeLabel": "Revoke {label}",
  "signedMessages.devices.revokeConfirm":
    "This device will no longer sign your messages. Its earlier signatures stay verifiable.",
  "signedMessages.devices.cancel": "Cancel",
  "signedMessages.devices.empty": "No device can post as you yet.",
  "signedMessages.devices.loading": "Loading devices",
  "signedMessages.devices.error": "Couldn't load your devices.",
  "signedMessages.devices.retry": "Try again",
  "signedMessages.devices.enable": "Turn on signed messages in this browser",
  "signedMessages.devices.proxy":
    "Switch to your own profile to manage devices.",
  "signedMessages.marker.label": "Signed by its author",
  "signedMessages.signature.menuItem": "Signature",
  "signedMessages.signature.title": "Signature",
  "signedMessages.signature.close": "Close",
  "signedMessages.signature.loading": "Checking the signature…",
  "signedMessages.signature.error": "Couldn't load the signature details.",
  "signedMessages.signature.retry": "Try again",
  "signedMessages.signature.signed": "Signed by its author",
  "signedMessages.signature.unsigned": "Not signed by its author",
  "signedMessages.signature.invalid": "The signature could not be verified",
  "signedMessages.signature.signedDescription":
    "Your browser checked this signature itself, without relying on 6529.io.",
  "signedMessages.signature.unsignedDescription":
    "This post was sent without a device signature.",
  "signedMessages.signature.invalidDescription":
    "The stored signature does not match this post. Treat its authorship with caution.",
  "signedMessages.signature.wallet": "Wallet",
  "signedMessages.signature.deviceKey": "Device key",
  "signedMessages.signature.grantExpires": "Grant expires",
  "signedMessages.signature.walletSignature": "Wallet signature",
  "signedMessages.signature.walletVerified": "Verified in your browser",
  "signedMessages.signature.contractWallet":
    "Contract wallet: verified by 6529.io at sign-in",
  "signedMessages.signature.currentContent": "Current content",
  "signedMessages.signature.currentSigned": "The signed version",
  "signedMessages.signature.currentUnsigned": "Changed without a signature",
} as const;
