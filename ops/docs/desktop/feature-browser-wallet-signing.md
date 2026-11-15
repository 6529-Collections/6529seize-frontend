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
   lists every signed field.
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
- 6529 never asks for your recovery phrase or password. Signing costs nothing.
- Switching to another profile or signing out cancels an open request.

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

## Related Areas

- [Get started](flow-getting-started.md)
- [Wallets, IPFS, updates, and logs](feature-wallets-ipfs-and-about.md)
- [Encrypted messages](../encrypted-messages.md)
