# Home Header and Mission Block

## Overview

The top of `/` shows the home headline and state-aware context before discovery
sections:

- Brand label and headline
- A compact newcomer introduction for logged-out visitors
- A network-health shortcut on home layouts
- A mission block below the latest-drop slot

## Location in the Site

- Route: `/`
- Health shortcut route: `/network/health`
- Health shortcut visibility:
  - Desktop/tablet: fixed heart icon near the top-right of home content
  - Mobile/app small-screen layouts: heart icon in the header actions when the current route is `/`

## Entry Points

- Open `/` directly.
- Use app Home navigation to return to `/`.

## User Journey

1. Open `/`.
2. The header shows:
   - Label: `6529`
   - Headline: `Building a decentralized network state`
3. Logged-out visitors see one plain-language sentence beneath the main
   headline and two actions:
   - `Start here`, which opens `/join-6529`
   - `Connect wallet`, which opens the wallet connection flow
4. A compact `Explore what's happening` divider introduces the public activity
   sections before the latest-drop slot.
5. A heart shortcut is visible on `/`:
   - Larger layouts: fixed near the top-right of the hero area
   - Mobile/app small-screen layouts: in the top header actions
   - Accessible name: `Open network health dashboard`
   - Tooltip/title: `Network health`
6. The latest-drop slot resolves independently.
7. Below that slot, the mission block renders with:
   - Heading: `6529 is a network society`
   - Supporting mission paragraph
   - Uppercase line: `The long-term goal is nation-scale positive impact.`
   - Quote-card region labeled `Mission statement`
8. Selecting the heart icon opens `/network/health`.

## Common Scenarios

- Desktop/tablet: health shortcut is visible near the top-right.
- Mobile/app small-screen: health shortcut is visible in the header action row.
- Logged-out or unauthenticated: the compact newcomer introduction appears
  before the dashboard-style activity sections.
- Authenticated: the current dashboard-first layout remains unchanged and the
  newcomer introduction is not shown.
- Latest-drop data unavailable: mission block still renders below the slot.

## Edge Cases

- On reduced-motion settings, heart animation is disabled.
- While wallet state is initializing, the page does not assume the visitor is
  logged out. The newcomer introduction appears once that state resolves.
- If a wallet is present but authentication is not valid, the newcomer
  introduction remains available so the visitor can continue through onboarding.
- The mission block has no interactive controls or outbound links.

## Failure and Recovery

- If the health shortcut is missing, verify:
  - You are on `/`
  - You are checking the correct placement for your layout (hero area on larger layouts, header action row on small/mobile layouts)
- If the shortcut is still unavailable, open `/network/health` directly.
- If copy appears stale, refresh `/` and retry.
- If `Connect wallet` cannot open the wallet chooser, the page shows an error
  and the action remains available to retry.

## Limitations / Notes

- Home activity remains public; the visitor introduction changes orientation and
  entry actions rather than gating the dashboard content.
- Core interactive actions for home continue in sections below (`Latest Drop`,
  `Coming up`, `Boosted Drops`, and `Most active waves`).

## Related Pages

- [Home Index](README.md)
- [Home Landing and Section Navigation Flow](flow-home-landing-and-section-navigation.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Home Boosted Drops and Most Active Waves](feature-home-discovery-grids.md)
- [Home Route and Section Visibility Troubleshooting](troubleshooting-home-route-and-section-visibility.md)
- [Network Health Dashboard](../network/feature-health-dashboard.md)
- [Docs Home](../README.md)
