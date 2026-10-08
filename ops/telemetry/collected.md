# Collected tracking

Keep Collected reports on the **Profile** board. Use the tab filter
`profile_tab = Collected` for the two new events. Existing `Page Viewed` visits
use `logical_page = profile_collected` instead.

The labels follow **Profile → Collected → Section → Action**.
For example: **Collected → Collection summary → Details**.

## What we count

`Profile section seen` counts a ready section once per profile visit and viewer
identity. At least 10% of its small anchor must be on screen for one continuous
second while the browser tab is visible. Scrolling away resets that second.
Changing filters does not start a new visit. Leaving and returning does.
This means the section reached the screen; it does not prove someone read it.

| Section | What reaches the screen |
| --- | --- |
| Collection summary | Loaded collection counts and summary controls |
| Collection details | The first loaded details heading, after Details is opened |
| Filters | Collection, season, sort and address controls |
| Artwork | Any artwork card in the current list; still counted only once per visit |

Loading placeholders, absent sections and empty artwork lists do not count.
This is not a scroll-depth or per-artwork impression report.

`Profile action clicked` counts these actions:

| Section | Actions |
| --- | --- |
| Collection summary | Details, Hide details, Complete my set, Manage orders, Change collection, Change season, Show more seasons, Show fewer seasons |
| Filters | Change view, Change collection, Change season, Change sort, Change seized filter, Change address |
| Artwork | Open artwork, Change page |

Filter menus count a choice, rather than every opening of the menu. Summary
shortcuts and filter choices have different section labels. Automatic URL
corrections and initial address synchronization do not count as clicks.
Transfer selection does not count as opening artwork. Network artwork cards
have no artwork link, so they cannot send `Open artwork`.

Complete my set and Manage orders measure entry clicks. They do not prove a
purchase, order change or wallet connection completed. The report does not
record which address, artwork or individual collection someone selected.

## Simple reports

1. **Collected sections people see**: `Profile section seen`, unique people,
   broken down by `section`.
2. **Collected actions people use**: `Profile action clicked`, unique people,
   broken down by `section` and `action`. Use total events to see repeat use.
3. **What people do after opening Collected**: start with `Page Viewed`, filtered
   to `logical_page = profile_collected`, followed by `Profile action clicked`
   filtered to `profile_tab = Collected`, in the same session. Start with a
   simple next-action report; do not require everyone to follow one fixed path.

Keep the existing tab-visits report. New reports need deployed code and real
received events before they can show data. If the plan has no saved-report
slots, use an unsaved report or add capacity rather than removing another report.

Use `profile_viewer_context` on each step to separate:

- `self`: signed-in person viewing their own profile.
- `other`: signed-in person viewing someone else's profile.
- `anonymous`: person without a connected profile; this does not mean new user.

Use `platform` to compare `mobile_web`, `desktop_web`, `native` and
`desktop_app` for the two new events. Mobile web is the viewport bucket below
768px; it is not a verified device type. Native does not distinguish iOS from
Android. Existing page views do not receive this new platform property.

## Consent and privacy

Tracking starts only after Performance / analytics consent and after profile
identity loading has settled. Earlier actions are not replayed. Withdrawing
consent cancels pending visibility timers and prevents further events.
The existing Mixpanel wrapper also enforces the production and SDK gates and
keeps failures from interrupting the action. Blocked or rejected events are
not guaranteed to arrive; section counts are marked locally only when accepted.
While a section stays visible, rejected counts get up to three attempts, one
second apart, during the current observation period. Leaving the screen or
withdrawing consent cancels pending attempts.

Custom properties are fixed labels and route families. We do not scrape button
text or send profile handles, wallet addresses, artwork names, URLs or filter
values. The existing SDK identity still links consented events to its person
record. Automatic URL/referrer attribution remains stripped by the SDK privacy
boundary. This does not add bot detection or session recordings.
