# Profile Identity Statements

## Overview

Identity statements are managed inside the combined `Identity` tab on `/{user}`.
This surface includes:
- `Consolidated Addresses`
- `Social Media Accounts`
- `NFT Accounts`
- `Contact`
- `Social Media Verification Posts`

## Location in the Site

- Canonical route: `/{user}`
- Legacy route: `/{user}/identity` (permanent redirect to `/{user}` with query
  parameters preserved)
- Desktop: right-side NIC card in the combined `Rep` + `Identity` layout
- Mobile: `Identity` subview after selecting the `NIC` score card

## Entry Points

- Open `/{user}` directly.
- Open `/{user}/identity` (redirects to `/{user}`).
- On mobile, switch from `Total Rep` to `NIC`.

## User Journey

1. Open `/{user}` and show the `Identity` surface.
2. Review `Consolidated Addresses` and statement sections.
3. If `Add` is visible, open the add-statements modal.
4. Pick a group, pick a type, enter a value, select `Save`.
5. Use statement row actions: `Open` (URL types only), `Copy`, `Delete`.
6. On non-primary wallet rows, use `Set Primary` when available.

## Statement Types in Add Modal

- `Social Media Accounts`: `X`, `Facebook`, `LinkedIn`, `Instagram`, `TikTok`,
  `GitHub`, `Reddit`, `Weibo`, `Substack`, `Medium`, `Mirror.xyz`, `YouTube`,
  `Linktree`
- `NFT Accounts`: `SuperRare`, `Foundation`, `MakersPlace`, `KnownOrigin`,
  `Pepe.wtf`, `OpenSea`, `Art Blocks`, `Deca Art`, `OnCyber`, `The Line`,
  `Manifold`, `Transient`
- `Contact`: `Discord`, `Telegram`, `WeChat`, `Phone`, `Email`, `Website`
- `Social Media Verification Posts`: `Link`

## Visibility and Behavior Rules

- `Add` is shown only when all are true:
  - connected wallet belongs to the viewed profile
  - no proxy profile is active
  - profile has a handle
- `Delete` and `Set Primary` are shown only when:
  - connected wallet belongs to the viewed profile
  - no proxy profile is active
- Consolidated wallets are sorted with primary first, then remaining wallets by
  TDH.
- Each consolidated wallet row shows `Etherscan`, `OpenSea`, and `Copy`
  actions.
- `Primary` badge marks the active primary wallet.
- `Wallet Checker` link is always shown.
- `Delegation Center` link is shown only when the connected wallet appears in
  at least one consolidation relationship for that profile.
- Statement rows are grouped by section and sorted newest first in each section.
- `Open` appears only for URL-capable types (for example hidden for `Discord`,
  `Telegram`, `WeChat`, `Phone`, `Email`).
- `Copy` briefly changes the displayed value to `Copied!`.
- While IME composition is active, input text is not rewritten; repeated URL
  protocol prefixes are normalized after composition ends.
- Empty sections show explicit copy (for example `No Contact added yet`).

## Loading, Errors, and Recovery

- Statement sections show skeleton loaders while data is loading.
- If statement fetch fails, sections can render as empty lists (no dedicated
  error panel). Refresh to retry.
- Save and delete require auth confirmation before the API request.
- Save success: success toast, modal closes.
- Save failure: error toast, modal stays open.
- Delete success: warning toast, statement is removed after the profile update.
- Delete failure: error toast, statement stays visible.
- `Set Primary` starts a wallet transaction and shows progress text (`Confirm
  in your wallet...`, then confirmation or error). On success, a success toast
  is shown.

## Limitations / Notes

- All statements are optional.
- All statements are fully and permanently public.
- Seize does not connect to social media accounts or verify posts.
- The community rates statement accuracy.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Identity Tab](feature-identity-tab.md)
- [Delegation Wallet Checker](../../delegation/feature-wallet-checker.md)
- [Delegation Center Layout and Sections](../../delegation/feature-delegation-center-layout-and-section-navigation.md)
- [Legacy Profile Route Redirects](../navigation/feature-legacy-profile-route-redirects.md)
- [Profiles Tabs Index](README.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
