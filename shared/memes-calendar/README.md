# Shared Memes calendar

The canonical pure TypeScript module lives in the frontend at `shared/memes-calendar`.
The backend bundles a byte-identical copy in `src/memes-calendar`. Calendar
calculation requires no network, frontend availability, or package registry.
Craft uses it to resolve a claim's season, retaining the database creation-window check.
Backend subscription coverage and Help Bot calendar answers also use this module
locally. Shared next/current/status queries back the existing frontend API; no
backend calendar consumer depends on that HTTP service.

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

Sync removes obsolete files only when the previous destination manifest owns them
and their content still matches that manifest. It preserves unrelated files and
refuses to discard local edits or accept paths outside the managed directory.
Calendar numbering applies future skips, extras and reschedules consistently in
both lookup directions; skips take precedence if both overrides name a day.
The existing date-based model counts each eligible UTC day once. Moving a mint
onto an already eligible date removes the source day without adding a second mint
on the destination day. Scheduling two distinct mints on one day would require a
different event model; an extra-day override does not provide that behavior.

## Core renderer compatibility

The normal frontend subtree sync includes this module under
`renderer/shared/memes-calendar`, so Core bundles the same calendar locally.
Consumers use relative imports: Core reserves `@/shared/*` for its Electron shared
folder outside the renderer. Keep that alias unchanged and do not use it for
calendar imports. Existing calendar helper paths remain compatibility re-exports.
The regression test resolves those consumers with both frontend and Core-style
path mappings; a real Core subtree sync/build remains a separate release step.

## Calendar consumers and year-round checks

Craft resolves seasons locally; subscription coverage projects strictly future
mint dates; Help Bot calculates next/current/specific-mint answers locally. The
existing frontend API endpoints retain their response shapes and use the same
query functions. Current windows include opening and exclude closing; next means
strictly future, including at an exact opening instant. A skip changes the next
mint date but never extends an earlier mint past 17:00 Athens on its next day.
Standalone override input files are maintained only in this canonical directory;
unused copies of their former component paths have been removed.

Regression coverage spans all twelve months, both DST transitions, midnight
carry-over, exact mint boundaries, year/season rollover, leap day, historical
reschedules and different host timezones. A five-year sweep checks every regular
mint date and Athens phase window from 2026 through 2030. Timezone rules use the
runtime's IANA data; runtime updates remain necessary if timezone law changes.
See the paired backend guide for the existing services to redeploy and retired
calendar network settings.

Consecutive extra mint days remain valid: there is at most one mint per eligible
date, and each window closes at 17:00 Athens the next day before that day's 17:40
opening. The current mint is therefore the date-derived ordinal or its immediate
predecessor. Adjacent-extra-day regressions cover that bound and the closing gap.
