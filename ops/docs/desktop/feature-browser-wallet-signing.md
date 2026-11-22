# Sign with Your Browser Wallet in 6529 Desktop

Parent: [Desktop index](README.md)

## Overview

6529 Desktop cannot use browser extensions such as MetaMask or Rabby directly.
If you signed in with **Use a browser wallet**, 6529 Desktop sends the
signatures it needs to your web browser, where your browser wallet signs them,
and brings the answer back to the app. In builds that support it, a short list
of 6529 contract transactions (listed below), including transfers of your 6529
NFTs, is sent the same way. Nothing that approves tokens or trades is.

This works in 6529 Desktop builds that support it. In other builds the account
menu shows **Authorized only (wallet not connected)** and you connect a wallet
with **Scan with a phone wallet** instead.

## What Is Signed in the Browser

- Decision votes and entries.
- Signed drops, accepting a wave's terms, quorum proposals and curation drops.
- Turning on signed messages for this computer.
- Letting this computer send and read encrypted messages.
- Submitting to The Memes and publishing a profile site.

## Transactions Sent from the Browser

In 6529 Desktop builds that send transactions, these are sent to your browser
wallet:

- Delegations: register, update and revoke (also as a delegation manager),
  batches of up to five, and collection or use-case locks.
- Minting The Memes (also for another wallet) and NextGen.
- Topping up your Memes subscription balance (up to 10 ETH).
- Transferring your 6529 NFTs (The Memes, Meme Lab, 6529 Gradient, NextGen) from
  your collection: up to 50 different The Memes or Meme Lab tokens (and up to
  10,000 copies each) per collection at a time; 6529 Gradient and NextGen
  tokens go one transaction each. Plain ETH sends are not supported.
- 6529 Provenance publishing on the pinned Sepolia test registries: opening a
  release, publishing records into it (up to 20 records per transaction; 15 of
  any size always fit) and sealing it.

Market trades and validator sessions are not sent to the browser: those pages
show **Continue in your browser** and open the same page on the website, where
your browser wallet signs directly. NextGen burn-to-mint, a transfer of more than 50
different The Memes or Meme Lab tokens of one collection, and a transfer to your
own signed-in address, show **Continue in your browser**
in place of their send button. In a 6529 Desktop build that does not send these
transactions, the mint, top-up, delegation, consolidation and transfer buttons
show "Update 6529 Desktop, or continue in your browser" instead. Any other
action that would send a transaction opens a **Transaction** dialog with the
same choice.

For a transaction, the browser page shows:

- What it does, the contract name with its full address (linked to
  Etherscan), the network (the Sepolia test network is highlighted), the number
  of cards or tokens, and the amount in ETH plus the network fee your wallet
  sets.
- Everything the transaction sends: every decoded value and the call data.
- A check that the transaction would go through now. If it would fail, Send is
  not offered; use **Check again** (mint windows open on time). If the check
  cannot run, you can **Check again** or **Send anyway**.
- For a mint, whether the amount matches the current price; if it does not,
  Send is not offered.
- For a high-impact transaction (a delegation that lets another wallet act for
  you, acting as a delegation manager, minting for another wallet, a top-up
  over 1 ETH), what it changes and an **I understand** box you tick before
  **Send in wallet**.
- For an NFT transfer, the recipient's full address in groups of four
  characters, the 6529 profile it belongs to (from 6529 profile data, not part
  of the transaction), a warning when the address is a contract, and a box
  ("I checked that this is the right recipient. Transfers cannot be undone.")
  you tick before **Send in wallet**.
- For provenance publishing, the release and every record (subject, record
  type, schema, content hash, CID, the version it follows, with 0 marked as a
  new subject, and the effective time the publisher states), the release header
  when opening, or the expected record count when sealing; and a check that your
  wallet is a publisher or the owner of the registry. If it is neither, Send is
  not offered.

The request waits for five minutes. With less than 45 seconds left, Send is not
offered; start again from 6529 Desktop. After you send, the page shows the
transaction with a link to Etherscan and returns to 6529 Desktop, which checks
the transaction on chain before it reports success.

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

A signature request waits for two minutes, a transaction five minutes. Use
**Open the page again** in the dialog if
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
- **"6529 Desktop does not send this transaction to your browser wallet":** use
  **Continue in your browser** and finish on the website.
- **"Update 6529 Desktop, or continue in your browser":** this 6529 Desktop
  build does not send transactions. Update it, or finish on the website.
- **"Your wallet reports it sent the transaction … could not confirm it yet":**
  do not send it again. Open it with **View on Etherscan** and wait for it.
- **"The transaction … on chain is not the one 6529 Desktop asked for":** check
  the transaction on Etherscan and in your wallet.
- **"A transaction you approved after its request ended was sent":** it was
  sent even though the request had ended. Check it on Etherscan before you try
  again.
- **"The signature could not be checked against your account":** smart-contract
  wallets such as Safe cannot sign here. Use **Continue in your browser**.
- **"Another signature request is still open":** finish or cancel the open one
  first.

## Localization fallback debt

| Field                     | Current exception                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route or component        | `/browser-connector` wallet requests (`BrowserWalletRequestPanel`), the in-app `DesktopWalletRequestDialog`, `ContinueInBrowserNotice` and `DesktopWalletTransactionGate` |
| Untranslated surface      | All `browserConnector.wallet.*` (including `.schema.*`, `.format.*`, `.refusal.*`) and `desktopWalletRequest.*` copy                                                      |
| Current fallback behavior | The copy exists only in the `en-US` source dictionary; other locales fall back to `en-US`                                                                                 |
| User impact               | 6529 Desktop users with another locale see this signing flow in English; the signed messages themselves are not translated by design (they are signed byte for byte)      |
| Owner or follow-up        | Frontend localization maintainers; add `en-GB`, `fr-FR`, `es-ES` and `de-DE` entries in the progressive i18n workstream when the new 6529 Desktop is released             |

## Related Areas

- [Get started](flow-getting-started.md)
- [Wallets, IPFS, updates, and logs](feature-wallets-ipfs-and-about.md)
- [Encrypted messages](../encrypted-messages.md)
