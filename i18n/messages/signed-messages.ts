// en-US source strings for signed messages (device-key signed drop writes).
// Other locales fall back to en-US while the feature is staged.
export const SIGNED_MESSAGES_MESSAGES = {
  "preferences.tabs.devices": "Devices",
  "signedMessages.enable.unavailable":
    "Couldn't turn on signed messages. Please try again.",
  "signedMessages.enable.reconnectWallet":
    "Reconnect the wallet for this profile and try again.",
  "signedMessages.enable.reconnect": "Reconnect wallet",
  "signedMessages.enable.status.reconnecting": "Reconnecting your wallet…",
  "signedMessages.enable.status.connecting":
    "Connect your wallet to continue. If it's locked, unlock it first.",
  "signedMessages.enable.status.switchingNetwork":
    "Approve the switch to {network} in your wallet.",
  "signedMessages.enable.status.waiting": "Check your wallet to sign",
  "signedMessages.enable.status.slow":
    "Open your wallet to finish signing. It may be locked.",
  "signedMessages.enable.status.waitingRemote":
    "Open your wallet app on your phone and approve the signature",
  "signedMessages.enable.status.slowRemote":
    "Don't see it? Open the wallet app on your phone. If nothing is waiting there, reconnect your wallet.",
  "signedMessages.enable.status.stalled":
    "Still nothing on your phone? Reconnect your wallet to pair it again. You'll be asked to sign again once it reconnects.",
  "signedMessages.enable.status.rejected":
    "Signature canceled. Nothing changed, and you can try again any time.",
  "signedMessages.enable.status.notConnected":
    "Your wallet didn't connect. Unlock it and try again.",
  "signedMessages.enable.status.networkSwitchCanceled":
    "Network switch canceled. Switch your wallet to {network} to continue.",
  "signedMessages.enable.error.wrongAccount":
    "Your wallet is on a different account. Switch it to {address} to continue.",
  "signedMessages.enable.error.wrongNetwork":
    "Switch your wallet to {network}, then try again.",
  "signedMessages.enable.error.connectFailed":
    "Couldn't open your wallet. Please try again.",
  "signedMessages.enable.error.deviceKey":
    "This browser couldn't prepare its signing key. Please try again.",
  "signedMessages.enable.error.challengeFailed":
    "Couldn't reach 6529.io to start signing. Check your connection and try again.",
  "signedMessages.enable.error.signatureFailed":
    "Your wallet couldn't sign. Unlock it and try again.",
  "signedMessages.enable.error.walletConnectSession":
    "Couldn't reach the wallet app on your phone. Reconnect your wallet to pair it again, then approve the signature.",
  "signedMessages.enable.error.signInFailed":
    "Your wallet signed, but signed messages didn't turn on. Please try again.",
  "signedMessages.enable.error.contextChanged":
    "Your wallet or network changed while signing. Please try again.",
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
  "signedMessages.marker.withLabel": "{label}, signed by its author",
  "signedMessages.signature.menuItem": "Signature",
  "signedMessages.signature.title": "Signature",
  "signedMessages.signature.close": "Close",
  "signedMessages.signature.loading": "Checking the signature…",
  "signedMessages.signature.error": "Couldn't check the signature right now.",
  "signedMessages.signature.retry": "Try again",
  "signedMessages.signature.signed": "Signed by its author",
  "signedMessages.signature.unsigned": "Not signed by its author",
  "signedMessages.signature.invalid": "The signature could not be verified",
  "signedMessages.signature.unverifiable":
    "Couldn't verify this signature right now",
  "signedMessages.signature.signedDescription":
    "Your browser checked this signature itself, without relying on 6529.io.",
  "signedMessages.signature.unsignedDescription":
    "This post was sent without a device signature.",
  "signedMessages.signature.invalidDescription":
    "The stored signature does not match this post. Treat its authorship with caution.",
  "signedMessages.signature.unverifiableDescription":
    "This signature couldn't be checked right now, so this post isn't shown as signed. Try again later.",
  "signedMessages.signature.wallet": "Wallet",
  "signedMessages.signature.deviceKey": "Device key",
  "signedMessages.signature.grantExpires": "Grant expires",
  "signedMessages.signature.walletSignature": "Wallet signature",
  "signedMessages.signature.walletVerified": "Verified in your browser",
  "signedMessages.signature.contractWalletVerified":
    "Contract wallet: verified on Ethereum in your browser",
  "signedMessages.signature.currentContent": "Current content",
  "signedMessages.signature.currentSigned": "The signed version",
  "signedMessages.signature.currentUnsigned": "Changed without a signature",
  "signedMessages.group.all.one": "{count} post signed by its author",
  "signedMessages.group.all.other": "All {count} posts signed by their author",
  "signedMessages.group.partial.one":
    "{signed} of {count} post signed by its author",
  "signedMessages.group.partial.other":
    "{signed} of {count} posts signed by their author",
  "signedMessages.group.title": "Signatures in this group",
  "signedMessages.group.description":
    "Select a post to check its signature in your browser.",
  "signedMessages.group.listLabel": "Posts in this group",
  "signedMessages.group.postWithoutText": "Post without text",
  "signedMessages.prompt.title.post": "Couldn't sign this post",
  "signedMessages.prompt.title.edit": "Couldn't sign this edit",
  "signedMessages.prompt.title.delete": "Couldn't sign this deletion",
  "signedMessages.prompt.title.react": "Couldn't sign this reaction",
  "signedMessages.prompt.failed":
    "Nothing has been sent yet. This browser couldn't finish signing it. Try again, or send it without your signature.",
  "signedMessages.prompt.rejected":
    "Nothing has been sent yet. 6529.io didn't accept this browser's signature. Try again, or send it without your signature.",
  "signedMessages.prompt.grantUnusable":
    "Nothing has been sent yet. Signed messages are no longer on in this browser because its permission was revoked or has expired. Turn them back on with one wallet signature, or send this without your signature.",
  "signedMessages.prompt.failedShort":
    "This browser couldn't sign it. Nothing has been sent yet.",
  "signedMessages.prompt.rejectedShort":
    "6529.io didn't accept the signature. Nothing has been sent yet.",
  "signedMessages.prompt.grantUnusableShort":
    "Signed messages are no longer on in this browser. Nothing has been sent yet.",
  "signedMessages.prompt.retry": "Try again",
  "signedMessages.prompt.sendUnsigned": "Send unsigned",
  "signedMessages.prompt.saveUnsigned": "Save unsigned",
  "signedMessages.prompt.doUnsigned": "Do it unsigned",
  "signedMessages.prompt.enable": "Turn on signed messages",
  "signedMessages.prompt.enableFailed":
    "Couldn't turn on signed messages. Try again, or continue unsigned.",
  "signedMessages.prompt.cancel": "Cancel",
} as const;
