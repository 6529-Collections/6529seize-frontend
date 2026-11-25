# Identities Move to the 6529 Network

## Overview

Profiles, handles, ratings, consolidations and delegations move from 6529.io's
database to the 6529 Network. 6529.io stops taking changes at the freeze, and
the 6529 Network takes them about 24 hours later. From then on you change them
on the 6529 Network, through this site.

The build setting `NEXT_PUBLIC_IDENTITY_FREEZE_AT` names the freeze as a UTC
instant (for example `2026-11-26T00:00:00Z`). Without it nothing below applies.

## Location in the Site

- The notice: every profile route under `/{user}`, above the profile tabs.
- Paused controls: the profile header, Identity statements and wallets, Rep and
  NIC, the Proxy tab, profile creation, and group bulk ratings on the Network
  page (`/network`).

## The Notice

| When | What it says |
| --- | --- |
| Before the freeze | Profiles, handles, ratings, consolidations and delegations move to the 6529 Network. From Thursday 26 November 00:00 UTC you can't change them for about 24 hours. From Friday you change them on the 6529 Network, through this site. |
| The 24 hours from the freeze | They are moving. You can't change them until the switch-on time (Friday 27 November 00:00 UTC). |
| After the switch-on | They moved to the 6529 Network. You can't change them on this site yet. |

Dates and times are shown in UTC. The notice changes at the freeze and at the
switch-on while the page stays open.

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

## Changing the Date

The instant is baked into each build. Postponing the freeze means changing
`NEXT_PUBLIC_IDENTITY_FREEZE_AT` in the build workflows, then building and
deploying again before the old instant passes; removing it calls the move
off. The 6529.io API reads its own `IDENTITY_FREEZE_AT`, and both must name
the same instant. The browser's checks are a convenience; the API's freeze
decides what it accepts.

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
