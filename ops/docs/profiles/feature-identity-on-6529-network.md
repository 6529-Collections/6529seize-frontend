# Your Identity on the 6529 Network

## Overview

From the switch-on, identities, handles, profiles, wallets, REP, NIC and
delegations change on the 6529 Network. `/network/identity` shows the
connected wallet's identity there and makes each change: the site asks 6529's
chain gateway for a draft of the transaction, checks it, the wallet signs it,
and the site sends it. Fees are paid in $fake6529.

The page exists only in builds with `NEXT_PUBLIC_FEATURE_CHAIN_IDENTITY` set
to `true` and `NEXT_PUBLIC_CHAIN_GATEWAY_URL` set to the gateway's https
origin. It takes changes, and profile pages use the chain for REP and NIC and
link here, once the switch-on has passed (`NEXT_PUBLIC_IDENTITY_FREEZE_AT`
plus 24 hours). Before that the page says when changes open.

## Location in the Site

- `/network/identity`
- The notice above the profile tabs links here once identities have moved.
- The Delegation Center landing page (`/safe-collecting`) shows
  `Delegations on the 6529 Network`.

## What You Can Do

| Section                     | What happens                                                                                                                                               | Who pays the fee                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Create your identity        | The wallet becomes the first wallet of a new identity, with an optional handle                                                                             | The wallet                              |
| $fake6529 for fees          | 6529 sends some $fake6529 once per wallet and identity; the wallet signs a message, which costs nothing                                                    | No one                                  |
| Move to identity            | Sends $fake6529 from the wallet to its identity                                                                                                            | The wallet                              |
| Handle                      | Claims a free handle in place of the current one                                                                                                           | The identity                            |
| Profile                     | Saves classification, about, website, picture URL and banner colors as a new profile document                                                              | The identity                            |
| REP and NIC                 | Shows the REP and the NIC left to give: your TDH less what you have given in each. REP and NIC are given on profile pages                                  | No fee to look                          |
| Wallets                     | Removes a wallet (not the last), or adds one: this wallet signs, and 6529.io holds its signature until the new wallet signs in on any device and signs too | The identity                            |
| Requests to add this wallet | Shown to a wallet with no identity, signed in to 6529.io, that an identity's wallet asked to add: review, sign or decline                                  | The asking identity                     |
| Sign on this browser        | The wallet signs once to give this browser a key for 30 days that signs REP, NIC and profile changes without a wallet prompt                               | The identity, within the budget shown   |
| Delegations                 | Registers and revokes delegations with the Delegation Center's collections and use cases, for the identity or one wallet                                   | The identity, or the wallet for its own |

Before any wallet prompt the page shows the most the change can cost, and
then waits until the 6529 Network has made the change final.

The profile site builder saves its site's place in the same profile document
of the signed-in profile's identity. It changes only the site's two fields
and keeps every other field. It signs with this browser's key when there is
one, without a wallet prompt, and otherwise asks a wallet of that identity
to sign twice. Each save costs a $fake6529 fee from the identity's balance,
as a profile save on this page does, but the site builder doesn't show the
fee before the wallet asks. If someone saved the profile in the meantime,
the chain refuses the save and still takes its fee; the builder then tries
once more on the newer document. It never saves over a profile document it
can't read.

## Rules to Know

- A handle is 3 to 15 characters: a to z, 0 to 9 and \_.
- Your TDH is the most REP you can give across everyone, and the most NIC.
  You can always lower a rating. The REP and NIC forms on profile pages show
  what is left, read from the 6529 Network.
- A removed wallet can rejoin its identity at any time, but waits before it
  can join a different identity or create one. The wait is the 6529
  Network's rule; the page shows its end date before you sign, and when you
  check a wallet to add.
- The 6529 Network caps how many wallets an identity holds.
- The browser's key stays in this browser and can't be copied out. Turn it
  off on this page to end it on the 6529 Network.
- An added wallet has 24 hours to sign. 6529.io holds the first signature
  until then. A wallet starts one join at a time.

## Troubleshooting

- `Not enough $fake6529 to pay the fee.`: get $fake6529 for fees, and move
  some to your identity for its own changes.
- `Switch your wallet to … and try again.`: the wallet app is on another
  account than the one that must sign.
- `The 6529 Network is still importing identities.`: the import runs after
  the switch-on; try again once it is done.
- `That is more than your TDH lets you give.`: lower another rating first, or
  give less.
- A request to add a wallet doesn't show: sign in to 6529.io with the wallet
  being added, then open `/network/identity`.
- `Your imported profile isn't in 6529's document store yet`: the profile
  can't be changed until the store has the imported document; try again
  later.
- `Your current profile on the 6529 Network can't be read`: save the profile
  once on this page, then publish the site again.

## Related Pages

- [Identities Move to the 6529 Network](feature-identity-move-to-6529-network.md)
- [Profiles Index](README.md)
- [Delegation Index](../delegation/README.md)
