# Profile Identity Statements

## Overview

Identity statements are managed inside the combined `Identity` tab on `/{user}`.
This surface includes:

- `Consolidated Addresses`
- `Social Media Accounts`
- `NFT Accounts`
- `Contact`
- `Social Media Verification Posts`

On mobile, selecting the `ID Statements` score card opens a compact statements
card without repeating the profile heading or description. Owners who can edit
see a compact `Add` action at the right of the `Consolidated Addresses` header.
Desktop keeps the statements heading and surface in the right side of the
combined Identity layout.

## Location in the Site

- Canonical route: `/{user}`
- Legacy route: `/{user}/identity` (permanent redirect to `/{user}` with query
  parameters preserved)
- Desktop: right side of the combined `Rep` + `Identity` layout
- Mobile: `ID Statements` subview after selecting the `ID Statements` score
  card

## Entry Points

- Open `/{user}` directly.
- Open `/{user}/identity` (redirects to `/{user}`).
- On mobile, switch from `Total Rep` or `NIC` to `ID Statements`.

## User Journey

1. Open `/{user}` and show the `ID Statements` surface.
2. Review `Consolidated Addresses` and statement sections.
3. If `Add` is visible, open the add-statements sheet on mobile or dialog on
   desktop.
4. Choose one of the four compact statement groups. On mobile, expand `About
identity statements` when the public-visibility notes are needed.
5. Choose a platform or statement type, enter a value, then select `Save`.
   For `Other` NFT accounts, enter both a short display name and a secure HTTPS
   URL.
   Use the sheet or dialog header's back button to choose a different group
   without closing the flow.
6. Close with the header button, backdrop, Escape key, or a swipe-down gesture
   on phones.
7. Select a URL-capable statement row to open its destination. Use the
   independent copy icon to copy its value; eligible owners can also delete it.
8. On non-primary wallet rows, use `Set primary` when available.

## Statement Types in Add Sheet or Dialog

- `Social Media Accounts`: `X`, `Facebook`, `LinkedIn`, `Instagram`, `TikTok`,
  `GitHub`, `Reddit`, `Weibo`, `Substack`, `Medium`, `Mirror.xyz`, `YouTube`,
  `Linktree`
- `NFT Accounts`: `SuperRare`, `Foundation`, `MakersPlace`, `KnownOrigin`,
  `Pepe.wtf`, `OpenSea`, `Art Blocks`, `Deca Art`, `OnCyber`, `The Line`,
  `Manifold`, `Transient`, `Ninfa`, `Other`
- `Contact`: `Discord`, `Telegram`, `WeChat`, `Phone`, `Email`, `Website`
- `Social Media Verification Posts`: `Link`

Platform choices appear in compact icon rows. Hovering or keyboard-focusing an
icon reveals its platform name, and assistive technology receives the same
name. The selected platform has a stronger outline and is exposed as the
pressed option. The value field receives focus when a group opens. Text inputs
disable automatic capitalization, correction, and spellchecking so handles,
URLs, and contact details are not rewritten by mobile keyboards.

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
- Each wallet row shows an ENS name when available and a shortened address.
- Opening a wallet row shows the full address and ENS name when available. Each
  dark value field is itself a copy control, and only one wallet row stays
  expanded at a time.
- On mobile, expanded wallet rows show labeled `Open on Etherscan` and `Open on
OpenSea` actions. Desktop retains compact external-link actions.
- `Primary` badge marks the active primary wallet.
- `Wallet Checker` link is always shown.
- `Delegation Center` link is shown only when the connected wallet appears in
  at least one consolidation relationship for that profile.
- Statement rows are grouped by section and sorted newest first in each section.
- Built-in NFT platforms appear before custom `Other` links. Newest links remain
  first within each of those groups.
- `Other` NFT links show the user's display name and destination hostname. The
  copy action still copies the full URL.
- New NFT account links must use HTTPS, cannot contain URL credentials, and are
  limited to 20 per profile. Ninfa links must use `ninfa.io` or one of its
  subdomains. Custom display names are trimmed, limited to 40 characters, and
  cannot copy a built-in platform name.
- URL-capable statement rows are links with a right-aligned external-link cue.
  Non-URL types (for example `Discord`, `Telegram`, `WeChat`, `Phone`, and
  `Email`) are not links and omit that cue.
- Copy remains an independent right-aligned control, so selecting it never opens
  the statement destination. Mobile keeps a touch-sized target while desktop
  uses the same compact icon treatment.
- `Copy` gives the icon a short active treatment, changes the displayed value
  briefly to `Copied!`, and announces the result to assistive technology.
- While IME composition is active, input text is not rewritten; repeated URL
  protocol prefixes are normalized after composition ends.
- On mobile web and Capacitor, the add flow uses a scrollable, keyboard-aware
  sheet so the focused field and Save/Cancel actions remain reachable above the
  software keyboard as it opens and closes.
- The mobile statement-group picker is content-sized at common phone heights,
  keeps its close action in the sheet header, and supports swipe-down dismissal
  without a decorative drag-handle stripe. Tablet and desktop keep the centered
  modal and multi-column card presentation.
- Empty statement groups are omitted after loading without showing a separate
  overall placeholder.

## Common Scenarios

- Visitors expand consolidated wallet rows, copy exact addresses or ENS names,
  and open the wallet on Etherscan or OpenSea without edit controls.
- Eligible profile owners see `Add`, `Delete`, and `Set primary` where those
  actions apply.
- Mobile users can complete the add flow inside a bottom sheet and return to the
  statement-group choices without closing it.
- Keyboard users can dismiss the add or delete dialog with standard dialog
  controls; focus returns to the control that opened it.

## Edge Cases

- Profiles without an ENS name show only the shortened address in the collapsed
  wallet row and omit the ENS field when expanded.
- Long addresses wrap inside the expanded wallet panel instead of overflowing
  the card.
- Long statement values use a single-line ellipsis instead of creating orphaned
  characters; the full value remains available through the row or copy action.
- Closing the add flow resets it to the statement-group choices for the next
  opening.
- While save or delete is pending, the submitting action shows progress. The
  delete confirmation cannot be dismissed until the request finishes.

## Loading, Errors, and Recovery

- Statement sections show skeleton loaders while data is loading.
- If statement fetch fails, a dedicated error panel replaces statement groups.
  Select `Retry` to request them again; consolidated addresses remain visible.
- Save and delete require auth confirmation before the API request.
- Save success: success toast, sheet or dialog closes and returns to the group
  choices for its next opening.
- Save failure: error toast, sheet or dialog stays open with the entered value.
- Duplicate NFT account URLs, unsafe URLs, invalid custom display names, and
  attempts above the 20-link limit are rejected without closing the form.
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
- The statements interface uses canonical `en-US` messages. Locales without
  translated statement keys currently show English fallback copy while the
  complete workflow remains functional.

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
