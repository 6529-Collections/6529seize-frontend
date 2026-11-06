# Sign a Validator Authorization on Another Device

## Overview

Use the wallet on your phone or another computer to authorize a validator
without importing that wallet onto the validator computer. The signing page
reads the authorization on your device, shows what it authorizes, and requests
one wallet signature. It does not submit that signature to the network.

## Location in the Site

Open `/validator/sign`. It uses the same tester password access as the other
Validator pages and stays out of search engines.

## Entry Points

- Choose **Sign authorization** in the Validator pages navigation.
- On `/validator`, use **Wallet on another device? → Sign a validator authorization**.

## User Journey

The file chooser includes **How do I get grant.json?**, an expandable three-step
guide. It keeps export and transfer instructions available without interrupting
the signing flow.

1. On the validator computer, open **Authorize → Another device or a signing
   tool**. Enter the wallet address and select **Save the message**.
2. Transfer the resulting `grant.json` file to the device where you keep your wallet.
3. Open `/validator/sign` there and choose the file, or expand **Or paste the
   file contents** and paste the JSON.
4. Check the wallet address, every validator key code, and each key's share
   against your Validator app. Public keys and technical details can be expanded.
5. Check the confirmation box. Connect the wallet named in the authorization,
   then select **Sign authorization** and review the request in your wallet.
6. Copy the verified signature, or download it as `validator-signature.txt`.
7. On the validator computer, paste the signature into the same authorization's
   signature field and select **Send the signature**. The Validator app verifies
   and publishes it and tells you when it takes effect.

## Common Scenarios

On a phone, use the wallet's browser or select your wallet from the existing
6529 connection window. There is no need to install a wallet or enter a seed
phrase on the validator computer. Connecting here does not require signing in
or creating a 6529 profile.

The file stays in browser memory; it is not uploaded or saved by the page.
Your wallet receives the typed authorization when you request the signature.
The page does not need a validator private key or wallet seed phrase.

## Edge Cases

- The connected wallet must match the address in the file. Select **Change
  wallet** or change the account in your wallet if it does not match.
- Multiple keys are all displayed. Their percentages are proportional to their
  shares. Signing replaces the prior authorization from that wallet when it
  takes effect, so confirm every key you intend to retain.
- An empty key list is a revocation. The page explicitly identifies it and
  requires confirmation to revoke before offering **Sign revocation**.
- Safe and other smart contract wallets are not supported. The validator needs
  a standard 65-byte Ethereum signature that recovers to the named wallet.

## Failure and Recovery

- Invalid or oversized files, different networks, altered message types or
  purposes, duplicate keys, and invalid shares are refused. Export a fresh
  `grant.json` from your Validator app.
- Canceling a wallet request submits nothing. You can try again.
- The live wallet is checked immediately before signing and again after the
  request completes. A changed or disconnected wallet cannot produce a result
  on the page. The returned signature must also recover to the file's address.
- If copying fails, select the signature text and copy it manually or download it.
- **Use a different message** clears the loaded authorization and signature.
  Use the signature with the exact draft you exported; do not generate a
  different draft between signing and submission.

## Limitations / Notes

Only 6529 Validator main-network authorizations are accepted. The page checks
the message format and signer, not Ethereum block canonicality, key possession
proofs, account eligibility, or the latest authorization version. Those checks
remain with the Validator app and network. A signature being ready is not a
confirmation that the node is authorized or has signed a daily result.

### Translation follow-up

- Surface: `/validator/sign`, its Validator navigation and download-page entry
  point, and page metadata.
- Current behavior: English source copy is used through the site's `en-US`
  fallback for `en-GB`, `fr-FR`, `es-ES`, and `de-DE`. Validator navigation and
  server-rendered entry points currently render the source locale.
- Owner: frontend maintainers (`6529seize-maintainers`).
- Remediation: translate the `validator-sign` namespace in those locale
  dictionaries, thread locale selection through server-rendered entry points
  and metadata, and verify long labels and percentages across the five locales.

## Related Pages

- [Validator downloads and tester guide](validator-download-page.md)
- [Documentation index](README.md)
