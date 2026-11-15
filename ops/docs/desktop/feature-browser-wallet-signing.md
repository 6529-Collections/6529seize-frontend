# Sign with Your Browser Wallet in 6529 Desktop

Parent: [Desktop index](README.md)

## Overview

6529 Desktop cannot use browser extensions such as MetaMask or Rabby directly.
If you signed in with **Use a browser wallet**, 6529 Desktop sends the
signatures it needs to your web browser, where your browser wallet signs them,
and brings the answer back to the app. Only signatures are sent this way;
nothing that sends a transaction, moves funds or approves tokens is.

This works in 6529 Desktop builds that support it. In other builds the account
menu shows **Authorized only (wallet not connected)** and you connect a wallet
with **Scan with a phone wallet** instead.

## What Is Signed in the Browser

- Decision votes and entries.
- Signed drops, accepting a wave's terms, quorum proposals and curation drops.
- Turning on signed messages for this computer.
- Letting this computer send and read encrypted messages.
- Submitting to The Memes and publishing a profile site.

Market trades and validator sessions are not sent to the browser: those pages
show **Continue in your browser** and open the same page on the website, where
your browser wallet signs directly. Transactions such as minting, delegation or
a subscriptions top-up are not available with this connection either; do them
on the website in your browser.

## User Journey

1. In 6529 Desktop, start an action that needs a signature (for example, vote
   in a decision). A **Signature request** dialog opens with a request code such
   as `A1B-2C3`, and your browser opens a **Sign for 6529 Desktop** page.
2. In the browser, check that the page shows the same request code. The page
   shows what you are about to sign in plain words, and **Everything you sign**
   lists every signed field. For a drop or a decision the dialog and the page
   also show a **Content fingerprint** such as `2c26b46b…6266e7ae`; check that
   they match. When 6529 Desktop sends the content, the page shows it (the
   wave, the text, media, quoted drops, metadata and any wave terms; or your
   vote or entry) only after recomputing the fingerprint from it, with
   **Everything this signature commits to** and the message itself. When it
   does not, the page says the content is identified only by its fingerprint.
3. Connect the wallet of the account you are signed in with, and switch to the
   requested network if asked. Select **Sign in wallet** and approve in your
   wallet, or select **Decline**.
4. The browser opens 6529 Desktop again with the answer, and the action
   continues in the app. You can close the browser tab.

The request waits for two minutes. Use **Open the page again** in the dialog if
you closed the browser tab (up to three times), or **Cancel** to stop.

## Safety

- The browser page only shows requests that this run of 6529 Desktop signed. A
  link from anywhere else shows "did not get a valid request" and offers nothing
  to sign.
- The page refuses to ask your wallet to sign anything it cannot show in plain
  words, including any sign-in message. Sign in from 6529 Desktop instead.
- Content that does not match the fingerprint in the message is never shown:
  the page refuses the request.
- The **Signature request** dialog stays on top of any other window in the app
  (such as the Terms of Service), so you can always compare the code or cancel.
- 6529 never asks for your recovery phrase or password. Signing costs nothing.
- Switching to another profile or signing out cancels an open request.
  Signing out also stops offering browser signing to that profile until it
  signs in with a browser wallet again.

## Troubleshooting

- **The browser page says the request expired:** start the action again in
  6529 Desktop.
- **"Your wallet is connected as … Switch it to …":** select the signed-in
  account in your wallet extension.
- **"The browser page would not sign this request":** use **Continue in your
  browser**.
- **"The signature could not be checked against your account":** smart-contract
  wallets such as Safe cannot sign here. Use **Continue in your browser**.
- **"Another signature request is still open":** finish or cancel the open one
  first.

## Localization fallback debt

| Field                     | Current exception                                                                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route or component        | `/browser-connector` wallet requests (`BrowserWalletRequestPanel`), the in-app `DesktopWalletRequestDialog` and `ContinueInBrowserNotice`                            |
| Untranslated surface      | All `browserConnector.wallet.*` (including `.schema.*`, `.format.*`, `.refusal.*`) and `desktopWalletRequest.*` copy                                                 |
| Current fallback behavior | The copy exists only in the `en-US` source dictionary; other locales fall back to `en-US`                                                                            |
| User impact               | 6529 Desktop users with another locale see this signing flow in English; the signed messages themselves are not translated by design (they are signed byte for byte) |
| Owner or follow-up        | Frontend localization maintainers; add `en-GB`, `fr-FR`, `es-ES` and `de-DE` entries in the progressive i18n workstream when the new 6529 Desktop is released        |

## Related Areas

- [Get started](flow-getting-started.md)
- [Wallets, IPFS, updates, and logs](feature-wallets-ipfs-and-about.md)
- [Encrypted messages](../encrypted-messages.md)
