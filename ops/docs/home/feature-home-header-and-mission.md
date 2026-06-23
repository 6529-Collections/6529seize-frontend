# Home Header and Mission Block

## Overview

The top of `/` shows static context before discovery sections:

- Brand label and headline
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
3. A heart shortcut is visible on `/`:
   - Larger layouts: fixed near the top-right of the hero area
   - Mobile/app small-screen layouts: in the top header actions
   - Accessible name: `Open network health dashboard`
   - Tooltip/title: `Network health`
4. The latest-drop slot resolves independently.
5. Below that slot, the mission block renders with:
   - Heading: `6529 is a network society`
   - Supporting mission paragraph
   - Uppercase line: `The long-term goal is nation-scale positive impact.`
   - Quote-card region labeled `Mission statement`
6. Selecting the heart icon opens `/network/health`.

## Common Scenarios

- Desktop/tablet: health shortcut is visible near the top-right.
- Mobile/app small-screen: health shortcut is visible in the header action row.
- Latest-drop data unavailable: mission block still renders below the slot.

## Edge Cases

- On reduced-motion settings, heart animation is disabled.
- The mission block has no interactive controls or outbound links.

## Failure and Recovery

- If the health shortcut is missing, verify:
  - You are on `/`
  - You are checking the correct placement for your layout (hero area on larger layouts, header action row on small/mobile layouts)
- If the shortcut is still unavailable, open `/network/health` directly.
- If copy appears stale, refresh `/` and retry.

## Limitations / Notes

- This surface is static content with no loading, empty, or error variants.
- No auth, wallet, or permission gate applies to this content.
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
