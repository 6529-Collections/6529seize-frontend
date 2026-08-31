# Network Levels

Parent: [Network Index](README.md)

## Overview

`/network/levels` is the reference page for Level thresholds.
It maps combined `TDH + Rep` to Levels and shows the full threshold table.
The current table covers Level `0` through `100` (max threshold `25,000,000`).
When a signed-in active profile is available, the page also summarizes that
profile's current Level and progress toward the next Level.

## Location in the Site

- Route: `/network/levels`
- Sidebar path: `Network -> Metrics -> Levels`
- Linked from:
  `/network/tdh` (`View Levels`),
  `/network/tdh/historic-boosts` (`Levels`),
  `/network/definitions` (`Levels`)

## Entry Points

- Open `Network -> Metrics -> Levels` from the sidebar.
- Open `/network/levels` directly.
- Click `View Levels` on `/network/tdh`.
- Click `Levels` in the bottom links on `/network/tdh/historic-boosts`.
- Click `Levels` in the bottom links on `/network/definitions`.
- Click an interactive `Level` badge where available; it opens
  `/network/levels` in a new tab.

## What You See

- A `TDH + Rep` progression chart across Levels.
- Explanatory text that defines how Levels work.
- For a signed-in active profile, a compact `Your Level` summary with the
  current Level, combined `TDH + Rep`, next Level, and additional amount needed,
  positioned directly above the table.
- A full-width table with all `Level` and `TDH + Rep` thresholds.
- Table headings that remain visible while the table is scrolled.

## User Journey

1. Open `/network/levels`.
2. Review the `TDH + Rep` progression chart for trend and scale.
3. Review the explanatory text above the threshold table.
4. If signed in, review the active profile's `Your Level` summary directly
   above the table. When a profile proxy is active, the summary reflects that
   proxy profile.
5. Use the table for exact thresholds by Level (`0` through `100`). Pointer
   users can also hover chart points for threshold tooltips.

## Common Scenarios

- Confirm the minimum `TDH + Rep` threshold for a target Level.
- Compare nearby Level jumps before setting progression targets.
- Verify Level requirements referenced in other routes.

## Route Behavior

- No query params, filters, sorting, or pagination.
- Thresholds are static app data (no route-level API request).
- No route-level loading, empty, or retry state.
- Signed-out users see the normal chart, explanation, and complete reference
  table without a personalized empty state or sign-in prompt.
- The `Your Level` summary uses profile data already loaded by the app. It is
  omitted while profile data is loading or unavailable.
- An active profile proxy takes precedence over the connected wallet profile.
- The current Level is the active profile's assigned Level. The next target and
  remaining amount use the reference thresholds shown on the page.
- The chart uses a logarithmic y-axis to handle wide threshold ranges.
- The chart has an accessible description, and every exact threshold is also
  available in the semantic table rather than only through hover or color.
- If reduced motion is enabled in OS/browser settings, chart animation is
  disabled.

## Edge Cases

- A real Level `0` profile is shown as Level `0`; loading or missing data does
  not produce a placeholder Level.
- At Level `100`, the summary reports that the profile has reached the highest
  Level instead of showing a nonexistent next Level.
- On touch or no-hover devices, use the table for exact chart values.
- On narrow screens, the chart, summary, explanation, and table remain in one
  vertical page flow. The table container can scroll when needed.
- If a `Level` indicator is rendered as plain text in a surface, it will not
  open this route.

## Failure and Recovery

- If navigation fails, reopen from sidebar navigation or open
  `/network/levels` directly.
- If a `Level` badge did not open a new tab as expected, open
  `/network/levels` directly.

## Limitations / Notes

- The page does not accept manual scores or simulate Levels. Personalized
  progress is shown only from a real signed-in active profile.
- Threshold changes require an app deploy with an updated Level table.

## Related Pages

- [Network Index](README.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [Network Definitions](feature-network-definitions.md)
