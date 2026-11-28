# Identities Move to the 6529 Network

## Overview

Profiles, handles, ratings, consolidations and delegations move from 6529.io's
database to the 6529 Network. 6529.io stops taking changes at the freeze, and
the 6529 Network takes them at the switch-on. From then on you change them on
the 6529 Network, through this site.

The build setting `NEXT_PUBLIC_IDENTITY_FREEZE_AT` names the freeze as a UTC
instant (for example `2026-01-01T00:00:00Z`). Without it nothing below applies.
The switch-on is the freeze plus 24 hours, unless the build setting
`NEXT_PUBLIC_IDENTITY_SWITCH_ON_AT` names a later UTC instant.

## Location in the Site

- The notice: every profile route under `/{user}`, above the profile tabs.
- Paused controls: the profile header, Identity statements and wallets, Rep and
  NIC, the Proxy tab, profile creation, and group bulk ratings on the Network
  page (`/network`).

## The Notice

| When | What it says |
| --- | --- |
| Before the freeze | Profiles, handles, ratings, consolidations and delegations move to the 6529 Network. From [the freeze's day and time] UTC you can't change them for about [the hours to the switch-on] hours. From [the switch-on's weekday] you change them on the 6529 Network, through this site. |
| From the freeze to the switch-on | Profiles, handles, ratings, consolidations and delegations are moving to the 6529 Network. You can't change them until [the switch-on's day and time] UTC. From then you change them on the 6529 Network, through this site. |
| After the switch-on | They are on the 6529 Network. Change yours there, through this site. A link goes to your identity on the 6529 Network (`/network/identity`). Without the 6529 Network flows on (they need `NEXT_PUBLIC_FEATURE_CHAIN_IDENTITY` set to `true` and a valid `NEXT_PUBLIC_CHAIN_GATEWAY_URL`), it says instead that they moved on the switch-on day and you can't change them on this site yet. |

Bracketed words stand for what the notice fills in from the build settings,
in UTC. The notice changes at the freeze and at the switch-on while the page
stays open.

## What Is Paused From the Freeze

- `Edit profile` (name, classification, picture, banner, About) is hidden.
- `Add statement` and statement removal are hidden.
- `Set primary` and `Add wallet` in the wallet list are hidden: both register on
  NFTDelegation, which stops counting for 6529.
- Rep and NIC rating, editing ratings you gave, and group bulk Rep and NIC show
  `Paused for the move to the 6529 Network.` or no edit control.
- `Assign Proxy` and adding a proxy action are hidden: every action the form
  offers (Allocate Rep, Allocate NIC) gives ratings. Existing proxies stay
  listed and can still be accepted, rejected, revoked or edited.
- `Create profile` prompts are hidden.
- Any of these requests sent anyway is stopped in the browser with
  `Paused for the move to the 6529 Network.`: every write under the API's
  `profiles` routes (profile wave included), `ratings`, `bulk-rep`, and new
  Allocate Rep or Allocate NIC proxy actions. The 6529.io API refuses the same
  set (`423 IDENTITY_FROZEN`).

Wave and drop ratings, follows, artwork alerts, profile preferences and the
profile website studio are not affected.

## Delegation Center and NextGen

Every Delegation Center page under `/safe-collecting`, the consolidation
builder included, shows from the time the setting is present:

> From [the freeze's day and time] UTC, new delegations and consolidations on
> NFTDelegation don't count for 6529. Your delegations and consolidations as of
> that time moved to the 6529 Network. Make changes there, on this site.

NFTDelegation registrations keep working on Ethereum. The NextGen Minter
contract still reads them, so the NextGen mint form says under `Mint For`:
`NextGen mints still read delegations from NFTDelegation, not from the 6529
Network.`

## After the Switch-On

In builds with the 6529 Network flows on, REP and NIC go to the 6529 Network
from the switch-on, the notice links to `/network/identity`, and the
Delegation Center lists and changes delegations there. See
[Your Identity on the 6529 Network](feature-identity-on-6529-network.md).

## Changing the Date

The instant is baked into each build. Postponing the freeze means changing
`NEXT_PUBLIC_IDENTITY_FREEZE_AT` in the build workflows, then building and
deploying again before the old instant passes; removing it calls the move
off. The 6529.io API reads its own `IDENTITY_FREEZE_AT`, and both must name
the same instant. The browser's checks are a convenience; the API's freeze
decides what it accepts.

A longer freeze keeps the freeze and sets `NEXT_PUBLIC_IDENTITY_SWITCH_ON_AT`
in both build workflows to the later switch-on, as a UTC instant, then builds
and deploys again before the old switch-on passes. The notice, its dates and
everything on 6529.io that waits for the switch-on follow it. The switch-on
never comes sooner than the freeze plus 24 hours: an earlier, malformed or
missing value means the freeze plus 24 hours. Both settings are written as
UTC instants in both build workflows, never as repository variables. The
help record `profiles.network-move` gives the dates in words, so it changes
in the same commit as the workflows; a test checks it against the production
workflow. This page gives no dates. The 6529.io API's own
`IDENTITY_SWITCH_ON_AT` must name the same instant. A page opened before the
new build keeps the old switch-on until it is reloaded.

## Localization

The notice and the paused line are in en-US only. Other locales fall back to
en-US until `identityMove.*` is added to their dictionaries.

## Troubleshooting

- The notice is missing: the build does not set
  `NEXT_PUBLIC_IDENTITY_FREEZE_AT`, or it is not a UTC instant ending in `Z`.
- The notice shows the wrong state: the device clock decides the phase; check
  that it is correct.

## Related Pages

- [Profiles Index](README.md)
- [Profile Header Summary](navigation/feature-header-summary.md)
- [Profile Identity Tab](tabs/feature-identity-tab.md)
- [Profile Proxy Tab](tabs/feature-proxy-tab.md)
