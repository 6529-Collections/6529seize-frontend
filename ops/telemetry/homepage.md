# Homepage tracking

The homepage reports answer three questions:

- Which sections reach people's screens?
- Which main links and buttons do they click?
- Which pages do they view next?

## What is counted

`Homepage section seen` counts a loaded section once during a homepage visit.
At least 10% of the section must be on screen for one continuous second while
the tab is visible. Scrolling away resets that second. Scrolling back does not
count the section again. Leaving and mounting the homepage again starts a new
visit. This measures an opportunity to see the section, not proof it was read.

Sections: Introduction, Get started, Latest drop, Next drop, About 6529,
Coming up, Boosted drops, and Explore waves. Loading placeholders and sections
that are absent are not counted. Latest drop and Next drop are separate labels
because the page can show either. The observer respects nested scroll containers.

`Homepage action clicked` counts activation of the labelled main controls:
network health, Get started, Connect wallet, artwork titles, artist links,
edition details, distribution plan, Mint, subscription actions, View all,
drop titles/open buttons, and wave cards/links. Keyboard activation and middle
clicks count too. Media player controls, embedded artwork, unlabelled links,
modals outside the homepage, and the surrounding navigation are outside this
click report. A click is an attempt, not a completed connection, mint, or visit.

Both events use these simple properties:

| Property         | Meaning                                                   |
| ---------------- | --------------------------------------------------------- |
| `section`        | Fixed English section name                                |
| `action`         | Fixed English action name, on clicks only                 |
| `screen_size`    | Small below 640 px, Medium below 1024 px, otherwise Large |
| `signed_in`      | Whether the wallet has valid authentication               |
| `is_native`      | Whether this is the native app                            |
| `layout_version` | Homepage measurement version, starting at `1`             |
| `logical_page`   | Always `home`                                             |

The existing Mixpanel wrapper still requires performance tracking consent,
a production build, and a configured token. The new events add no names,
wallet addresses, wave/drop IDs, form inputs, or raw URLs. Existing SDK default
properties and identity handling are unchanged. Autocapture and session
recordings remain disabled in the website setup.

## Saved reports and deployment

The saved Homepage board has **Homepage visitors** plus the three reports below.
The next-page report shows one following page view and hides other event types.
All four reports exclude labelled bots, scope URLs to `https://6529.io/`, and
use the last seven complete days. Refresh the board's data when
comparing reports across midnight in the project's timezone.

The section and click reports are saved in advance using the exact planned event
and property names. Their descriptions explain that they are waiting for the
website tracking update. Empty charts do not mean zero activity. These events
cannot provide historical data: verify real events arrive after release and
check both reports again. Do not send fake production events to populate them.

1. **Sections people see**: Insights, unique visitors for `Homepage section
seen`, broken down by `section`, shown as a bar chart.
2. **Clicks within sections**: Insights, unique visitors for `Homepage action
clicked`, broken down by `section` and `action`, shown as a bar chart.
3. **Where people go next**: Flows starting with `Page Viewed` filtered to
   `logical_page = home`. Show subsequent `Page Viewed` events, broken down by
   `logical_page`. This uses real page views. It includes departures through
   site navigation and does not claim a particular click caused the visit.

Use the same complete-day date range and production host scope as the visitor
report. Exclude events Mixpanel labels as bots. Unrecognised bots, team visits,
tracking blockers, and missing consent still affect counts. The current visitor
report scopes the web host; compare native app traffic separately.

To study a particular action, use an ordered funnel from `Homepage action
clicked` (chosen section/action) to `Page Viewed` (chosen destination family).
Choose a short conversion window, for example five minutes. This shows sequence,
not guaranteed direct navigation or successful use of the destination. Check
native, signed-out and signed-in visitors separately where helpful. Do not
divide clicks by section-seen counts as a precise click rate: fast clicks can
happen before the one-second section threshold.

## Verification

Hook tests cover consent, continuous exposure, background tabs, dynamic loading,
repeat scrolling, unmount cleanup, and safe click labels. The homepage smoke
suite also checks the observer in a real browser with nested scrolling and
content becoming ready. Existing homepage navigation and layout assertions
remain intact. A live release and received Mixpanel events are still required
to verify delivery and populate the two new-event reports.
