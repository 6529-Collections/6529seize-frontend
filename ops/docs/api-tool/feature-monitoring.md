# Monitoring

Parent: [API Tool Index](README.md)

`/tools/monitoring` is a private overview for the 6529 Dev Team. Open it by
direct URL; it is omitted from public navigation and search indexing.

Sign in with a wallet belonging to a Dev Team identity. The backend verifies
the saved group on every request, including requests for a cached snapshot.
Proxy sessions cannot enter. Signed-out users see **Sign in required**, and
other users see **Access restricted**.

The Sentry panel opens with three summaries across the configured projects:

- **Needs attention** counts unresolved high-priority issues active in the last
  24 hours. Expand it to see matching frontend and backend issues.
- **What changed** counts issues first seen in 24 hours, plus active issues that
  Sentry currently marks as returned or spiking. Those states may have started
  before the current window. Expand it to inspect each category by project.
- **Captured events · 24h** compares event volume with the preceding 24 hours.
  It includes warning-level events and resolved or archived issues. It measures
  recorded events, not affected users or confirmed outages.

The production overview includes `6529-frontend` and all production services in
`seize-backend`, excluding staging and local events. Counts cover matching issues
beyond the five displayed rows. When a full count is unavailable it says
**At least**; an incomplete daily comparison is shown as unavailable.

Expand **All issue details** for each project's up to five newly seen errors and
five most frequent unresolved errors. Each issue also shows Sentry severity,
priority and state. High priority is a triage label, not a confirmed outage.
Event counts and first/last event times belong to that window; times
are displayed in UTC. A note indicates when additional matching issues exist.
The collection time is shown, and snapshots are cached for five minutes.
Opening an issue takes you to Sentry and requires access there.

**Daily history · 30 days** charts the last 30 completed UTC days by project.
Switch between **Error occurrences** (including repeated errors) and
**Distinct issues** (different problems active on each day). Resolved and
archived issues still contribute to the days when their events occurred.
Today's incomplete day is excluded, so it cannot appear artificially quiet.
Expand **Daily counts** for exact values in each project's table; the tables
also provide a keyboard and screen-reader alternative to chart tooltips.

History loads separately from the current overview and refreshes every 15
minutes. Failed or incomplete days appear as chart gaps and **Unavailable**
table cells, rather than zero. If history fails, its **Try again** action
leaves the overview available. Counts reflect data retained by Sentry;
these charts do not measure outages or affected users.

If the source has not been configured, approved members see **Sentry is not
connected yet.** This state does not claim that there are no errors. A successful
snapshot with no matching issues says **No matching errors in this window.**

While the snapshot and access are checked, the page shows **Checking access…**.
If either is unavailable, select **Try again**. Changing wallets or a failed
access recheck hides the previous snapshot. There are no operational controls.
