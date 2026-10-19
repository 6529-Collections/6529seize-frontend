# Home Header and Mission Block

## Overview

The top of `/` shows the home headline and state-aware context before discovery
sections:

- Brand label and headline
- Compact newcomer actions for logged-out visitors
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
   - Brand label: `6529`, at 12px with medium weight and subtle letter spacing
   - Left-aligned headline: `Building a decentralized network state`, with
     `network state` on a separate line in the same color
3. Logged-out visitors see two actions beneath the main headline, aligned with
   its left edge:
   - `Start here`, which opens `/join-6529`
   - `Connect wallet`, which opens the wallet connection flow
   - Both actions keep the same rounded corners at every breakpoint. Below the
     medium breakpoint, they share an equal-width row with 48px touch targets;
     larger layouts use 44px buttons at the left edge.
4. The latest-drop slot follows the newcomer actions directly.
5. A heart shortcut is visible on `/`:
   - Larger layouts: fixed near the top-right of the hero area
   - Mobile/app small-screen layouts: in the top header actions
   - Accessible name: `Open network health dashboard`
   - Tooltip/title: `Network health`
6. The latest-drop slot resolves independently.
7. Below that slot, the mission block renders with:
   - Subtle blue-grey radial background glow
   - Heading: `6529 is a network society`, with medium weight and muted color
   - Muted mission paragraph, left-aligned at every screen size
   - Muted uppercase line: `The long-term goal is nation-scale positive impact.`,
     introduced by a green dot
   - Supporting region labeled `Mission statement`, with Montserrat text in a
     rounded box with a faint border and background. It is vertically centered
     beside the heading, paragraph, and goal on desktop, and sits below the goal
     on smaller screens.
8. Selecting the heart icon opens `/network/health`.

## Common Scenarios

- Desktop/tablet: health shortcut is visible near the top-right.
- Mobile/app small-screen: health shortcut is visible in the header action row.
- Logged-out or unauthenticated: the compact newcomer actions appear before
  the dashboard-style activity sections.
- Authenticated: the current dashboard-first layout remains unchanged and the
  newcomer actions are not shown.
- Latest-drop data unavailable: mission block still renders below the slot.

## Edge Cases

- The desktop homepage health shortcut stays still, with a subtle colour change
  on hover and a visible keyboard-focus ring.
- Action arrows move slightly on hover or keyboard focus. Reduced-motion
  settings keep arrows still and make colour changes immediate.
- While wallet state is initializing or connecting, the page does not assume
  the visitor is logged out. The newcomer actions appear once that state
  resolves.
- If a wallet is present but authentication is not valid, the newcomer
  actions remain available so the visitor can continue through onboarding.
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

- Home activity remains public; the visitor actions provide onboarding entry
  points rather than gating the dashboard content.
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
