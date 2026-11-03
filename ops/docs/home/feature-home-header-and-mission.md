# Home Header and Mission Block

## Overview

The top of `/` shows the home headline and state-aware context before discovery
sections:

- Brand label and headline
- Compact newcomer actions and a What is 6529? explanation for logged-out visitors
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
2. The Montserrat hero shows a small `6529` label, the headline
   `Building a decentralized network state`, and the subtitle
   `A decentralized, permissionless global network that funds, builds, and coordinates public-goods work across art, science, culture, and technology.`
   The hero is a single left-aligned typography block without artwork or
   illustration. The headline scales with the available width, and the
   subtitle has a readable line length. No space is reserved for hero images.
3. Logged-out visitors see two actions beneath the subtitle, in this order:
   - `Connect wallet`, the primary action, opens the existing wallet connection flow.
   - `Start here`, the secondary action, opens `/join-6529`.
   - Mobile uses two equal-width buttons with 48px touch targets; larger layouts
     keep the actions together beneath the copy.
4. Logged-out visitors see `What is 6529?` between the hero and latest-drop slot:
   - `Art with purpose`: `Browse The Memes` opens `/the-memes`.
   - `Where the network coordinates`: “Waves are open spaces to discuss, create,
     and vote together.” `Browse Waves` opens `/waves`.
   - `A real say`: “Vote on what 6529 funds, builds, and mints next.”
     `Explore Main Stage` opens The Memes - Main Stage Wave at
     `/waves/b6128077-ea78-4dd9-b381-52c4eadb2077`.
   - Desktop and tablet use three open columns with subtle vertical dividers.
     Mobile stacks the topics with horizontal dividers and keyboard-accessible
     text links. The artwork, wave tiles, and voting bars are decorative; they
     do not show live vote totals or individual wave presence. The four wave
     tiles use fixed local thumbnails of The Memes Main Stage, Memes-Chat,
     maybe’s dive bar, and 6529 Tech Feedback.
5. A heart shortcut is visible on `/`:
   - Larger layouts: fixed near the top-right of the hero area
   - Mobile/app small-screen layouts: in the top header actions
   - Accessible name: `Open network health dashboard`
   - Tooltip/title: `Network health`
6. The latest-drop slot resolves independently.
7. Logged-out visitors see `How to start` after the latest-drop slot, with the
   introduction “Four steps into 6529.” The steps appear in this order:
   - `Connect wallet`: “Your wallet is your sign-in.” Opens the same wallet flow
     as the hero button.
   - `Create profile`: “Add a name, avatar, and bio.” Opens
     `/join-6529#join-step-profile` to continue the existing onboarding flow.
   - `Join a Wave`: “Chat, post, and vote.” Opens `/waves`.
   - `Collect or create`: “Hold Meme Cards to earn voting weight, or submit your
     own art.” The heading is plain text. Within the unchanged sentence,
     `Hold Meme Cards` links to `/the-memes` and `submit your own art` links to
     `/about/apply`, which explains eligibility and the nomination path for new
     artists. There are no separate buttons below the description.
   - The first three step headings are actions, with an arrow beside each title.
     The community link keeps its `Browse Waves` hover title.
   - `Read the full guide` opens `/join-6529`.
   - Desktop shows four numbered columns. Mobile shows a vertical timeline.
   - The collection/submission description is omitted during server rendering
     and on restricted native iOS (outside the US or unknown country). Those
     visitors see a browsing/community description without the two inline links.
     Collection browsing remains available through `Browse The Memes` above.
8. The mission block shows `6529 is a network society` beside the Bitcoin and
   Ethereum sentence, with `human coordination itself,` emphasized. On mobile
   the paragraph follows the heading. The long-term goal appears beneath it
   in a quiet outlined label. The hero already contains the public-goods
   definition, so it is not repeated here.
9. Selecting the heart icon opens `/network/health`.

## Common Scenarios

- Desktop/tablet: health shortcut is visible near the top-right.
- Mobile/app small-screen: health shortcut is visible in the header action row.
- Logged-out or unauthenticated: the compact newcomer actions appear before
  the activity sections; How to start follows the latest-drop slot.
- Authenticated: the same typography-only hero remains visible; the newcomer
  actions, What is 6529? explanation, and How to start are not shown. The
  hero and latest-drop sections keep their own spacing when the explanation
  is absent.
- Latest-drop data unavailable: mission block still renders below the slot.

## Edge Cases

- The desktop homepage health shortcut stays still, with a subtle colour change
  on hover and a visible keyboard-focus ring.
- Reduced-motion settings make button colour changes immediate.
- While wallet state is initializing or connecting, the page does not assume
  the visitor is logged out. The newcomer actions, explanation, and steps appear once that state
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
  `Coming up` and Waves).

## Related Pages

- [Home Index](README.md)
- [Home Landing and Section Navigation Flow](flow-home-landing-and-section-navigation.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Home Waves Discovery](feature-home-discovery-grids.md)
- [Home Route and Section Visibility Troubleshooting](troubleshooting-home-route-and-section-visibility.md)
- [Network Health Dashboard](../network/feature-health-dashboard.md)
- [Docs Home](../README.md)

## Localization

Hero, What is 6529?, How to start, and mission copy use the message dictionary.
The approved English copy currently falls back unchanged for en-GB, fr-FR,
es-ES, and de-DE. The homepage localization follow-up owns translation review
and layout verification for these headings, descriptions, and link labels.
