# Your Identity on the 6529 Network

## Overview

From the switch-on, identities, handles, profiles, wallets, REP, NIC and
delegations change on the 6529 Network. `/network/identity` shows the
connected wallet's identity there and makes each change: the site asks 6529's
chain gateway for a draft of the transaction, checks it, the wallet signs it,
and the site sends it. Fees are paid in $fake6529.

The page exists only in builds with `NEXT_PUBLIC_FEATURE_CHAIN_IDENTITY` set
to `true` and `NEXT_PUBLIC_CHAIN_GATEWAY_URL` set to the gateway's https
origin. Profile pages use the chain for REP and NIC, and link here, once the
switch-on has passed (`NEXT_PUBLIC_IDENTITY_FREEZE_AT` plus 24 hours).

## Location in the Site

- `/network/identity`
- The notice above the profile tabs links here once identities have moved.
- The Delegation Center landing page (`/safe-collecting`) shows
  `Delegations on the 6529 Network`.

## What You Can Do

| Section | What happens | Who pays the fee |
| --- | --- | --- |
| Create your identity | The wallet becomes the first wallet of a new identity, with an optional handle | The wallet |
| $fake6529 for fees | 6529 sends some $fake6529 once per wallet and identity; the wallet signs a message, which costs nothing | No one |
| Move to identity | Sends $fake6529 from the wallet to its identity | The wallet |
| Handle | Claims a free handle in place of the current one | The identity |
| Profile | Saves classification, about, website, picture URL and banner colors as a new profile document | The identity |
| Chain actions on this browser | The wallet signs once to give this browser a key for 30 days that rates REP and NIC and saves the profile without a wallet prompt | The identity, within the budget shown |
| Wallets | Removes a wallet (not the last), or adds one: this wallet signs, then the new wallet signs on the same page after the wallet app switches to it | The identity |
| Delegations | Registers and revokes delegations with the Delegation Center's collections and use cases, for the identity or one wallet | The identity, or the wallet for its own |

Before any wallet prompt the page shows the most the change can cost, and
then waits until the 6529 Network has made the change final.

The profile site builder saves its site's place in the same profile document.
It changes only the site's own fields and keeps every other field. It signs with this
browser's key when there is one, without a wallet prompt, and otherwise asks
the wallet. If someone saved the profile in the meantime, it applies the
site change to the newer document. It never saves over a profile document it
can't read.

## Rules to Know

- A handle is 3 to 15 characters: a to z, 0 to 9 and _.
- A removed wallet can't join or create another identity for 30 days.
- An identity holds at most 16 wallets.
- The key for chain actions stays in this browser and can't be copied out.
  Turn it off on this page to end it on the 6529 Network.
- An added wallet's first signature waits in this browser for an hour.

## Troubleshooting

- `Not enough $fake6529 to pay the fee.`: get $fake6529 for fees, and move
  some to your identity for its own changes.
- `Switch your wallet to … and try again.`: the wallet app is on another
  account than the one that must sign.
- `The 6529 Network is still importing identities.`: the import runs for
  about an hour after the switch-on; try again later.
- `Your imported profile isn't in 6529's document store yet`: the profile
  can't be changed until the store has the imported document; try again
  later.
- `Your current profile on the 6529 Network can't be read`: save the profile
  once on this page, then publish the site again.

## Related Pages

- [Identities Move to the 6529 Network](feature-identity-move-to-6529-network.md)
- [Profiles Index](README.md)
- [Delegation Index](../delegation/README.md)
