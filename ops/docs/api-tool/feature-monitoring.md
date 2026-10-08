# Monitoring

Parent: [API Tool Index](README.md)

`/tools/monitoring` is a private overview for the 6529 Dev Team. Open it by
direct URL; it is omitted from public navigation and search indexing.

Sign in with a wallet belonging to a Dev Team identity. The backend verifies
the saved group on every request, including requests for a cached snapshot.
Proxy sessions cannot enter. Signed-out users see **Sign in required**, and
other users see **Access restricted**.

The Sentry panel shows the latest 24-hour snapshot in separate sections for each
configured project. The production overview includes `6529-frontend` and all
production services in `seize-backend`, excluding staging and local events.
Each project shows up to five newly seen errors and its five most frequent
unresolved errors, so frontend volume cannot hide backend failures.
Event counts and first/last event times belong to that window; times
are displayed in UTC. A note indicates when additional matching issues exist.
The collection time is shown, and snapshots are cached for five minutes.
Opening an issue takes you to Sentry and requires access there.

If the source has not been configured, approved members see **Sentry is not
connected yet.** This state does not claim that there are no errors. A successful
snapshot with no matching issues says **No matching errors in this window.**

While the snapshot and access are checked, the page shows **Checking access…**.
If either is unavailable, select **Try again**. Changing wallets or a failed
access recheck hides the previous snapshot. There are no operational controls.
