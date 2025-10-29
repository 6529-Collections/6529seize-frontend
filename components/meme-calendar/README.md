# Meme Calendar Helpers

This module centralizes all date math, numbering, and calendar link logic that powers the Meme Calendar UI. The table below summarizes the primary exported helpers and the responsibilities they cover.

## Mint schedule overrides

The default mint cadence (Monday/Wednesday/Friday, plus a handful of historic exceptions) is declared in [`meme-calendar.overrides.ts`](./meme-calendar.overrides.ts). Add future skips, bonus mint days, or one-off reschedules there without touching the helpers themselves.

- Append ISO dates (e.g. `"2025-10-21"`) to `CUSTOM_SKIPPED_MINT_DAYS` to cancel a scheduled mint.
- Append ISO dates to `CUSTOM_EXTRA_MINT_DAYS` to force an additional mint even if it falls on a non-standard weekday.
- Use `CUSTOM_RESCHEDULED_MINTS` when a numbered mint simply moves to a different date. Each entry automatically skips the original day and whitelists the new day:

  ```ts
  export const CUSTOM_RESCHEDULED_MINTS: MintRescheduleOverride[] = [
    {
      mintNumber: 415,
      from: "2025-10-20", // original Monday slot
      to: "2025-10-21",   // new Tuesday slot
      note: "Delayed one day for artist schedule",
    },
  ];
  ```

These overrides feed into the eligibility logic used by all calendar utilities, so views, countdowns, and mint-number lookups stay in sync automatically.

## Mint Day & Window Calculations

| Helper                                        | Summary                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `nextMintDateOnOrAfter(date: Date)`           | Scans forward from the provided day until it finds the next mintable UTC date, respecting historic skips and off-schedule mints.        |
| `mintStartInstantUtcForMintDay(utcDay: Date)` | Converts a mintable UTC day into the precise UTC timestamp when the mint opens (10:40 ET with automatic DST handling).                  |
| `getNextMintStart(now?: Date)`                | Returns the UTC timestamp for the very next mint start instant relative to `now`, including today if it has not started yet.            |

## Mint Numbering & Identification

| Helper                                 | Summary                                                                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `getMintNumberForMintDate(date: Date)` | Calculates the ordinal mint number that occurs on the given mintable UTC day, accounting for historic breaks and the continuous schedule. |
| `dateFromMintNumber(n: number)`        | Inverse lookup that returns the mint start timestamp for a specific mint number, including SZN1 historical data.                          |
| `getMintTimelineDetails(n: number)`    | Bundles the mint's UTC start/end, season index, displayed SZN/Year/Epoch/Period/Era/Eon numbers, and the exact date ranges for each division. |

## Mint Activity & Remaining Supply

| Helper                                                     | Summary                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isMintingActive(now?: Date)`                              | Indicates whether `now` falls within any active mint window (from start through the Eastern cutoff defined above).                                                                                                          |
| `getCardsRemainingUntilEndOf(zoom: ZoomLevel, now?: Date)` | Counts how many mints remain from the next mint day through the end of the selected division (season, year, epoch, period, era, eon), automatically rolling into the next division if the current one has finished minting. |

## Calendar Link Helpers

| Helper                                                               | Summary                                                                                                           |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `printCalendarInvites(dateOrInstant, mintNumber, fontColor?, size?)` | Produces the HTML snippet that renders download links for both the ICS file and Google Calendar entry for a mint. |

## Range & Display Utilities

| Helper                                                      | Summary                                                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `getRangeDatesByZoom(zoom: ZoomLevel, seasonIndex: number)` | Returns the UTC start and end bounds for the selected timeline division (season → eon) so views can share consistent date math. |
| `getRangeLabel(start: Date, end: Date)`                     | Formats a human-friendly “Memes #X - #Y” label using mint numbers that fall inside the provided date range.                     |
| `formatMint(n: number)` / `formatFullDateTime(date, mode)`  | Formatting helpers used across the calendar to keep mint numbers and timestamps consistent.                                     |
