# Shared Memes calendar

The canonical pure TypeScript module lives in the frontend at `shared/memes-calendar`.
The backend bundles a byte-identical copy in `src/memes-calendar`. Calendar
calculation requires no network, frontend availability, or package registry.
Craft uses it to resolve a claim's season, retaining the database creation-window check.
Other existing calendar API consumers are unchanged by this foundation.

## Updating the calendar

1. Edit the canonical frontend module, including skips/reschedules there.
2. Bump `MEMES_CALENDAR_VERSION` for any behavior change.
3. From that checkout run `./bin/6529 run calendar:refresh`, then
   `./bin/6529 run calendar:sync <backend-checkout>`.
4. Run focused calendar tests in both repositories and commit both copies together.

`./bin/6529 run calendar:check` verifies the pinned SHA-256 manifest. Frontend build preparation and backend build/test preparation also run it. Do not edit the vendored source directly.
Both repositories must carry the same version and manifest in paired changes;
the check detects local drift but cannot inspect an unmerged remote repository.

## Time policy

Mint dates retain the existing Monday/Wednesday/Friday cadence, history, and overrides.
All launch wall times are defined in `Europe/Athens` using IANA timezone data:
Phase 0 17:40–18:20, Phase 1 18:30–18:50, Phase 2 19:00–19:20, then public
19:20 until the next calendar day at 17:00. Preview is 17:15 and post-mint work
18:00 on that closing day. UTC offsets change with DST; no fixed UTC offset or
24-hour approximation determines the next day's closing time.

The launch integration must save the version, timezone and exact UTC phase times
when accepting a launch. A future calendar update must not move an accepted launch.
