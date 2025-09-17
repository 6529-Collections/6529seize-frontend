# Meme Calendar Helpers

This module centralizes all date math, numbering, and calendar link logic that powers the Meme Calendar UI. The table below summarizes the primary exported helpers and the responsibilities they cover.

## Mint Day & Window Calculations

| Helper                                        | Summary                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `isMintDow(dow: number)`                      | Returns `true` when the supplied UTC day-of-week value (0–6) is an eligible mint weekday (Mon/Wed/Fri).                                 |
| `isMintDayDate(date: Date)`                   | Convenience wrapper that checks if a `Date` instance falls on a mintable UTC weekday.                                                   |
| `nextMintDateOnOrAfter(date: Date)`           | Scans forward from the provided day until it finds the next mintable UTC date, respecting historic skips and off-schedule mints.        |
| `prevMintDateOnOrBefore(date: Date)`          | Scans backward from the provided day to find the previous mintable UTC date, honoring the same historic overrides.                      |
| `mintStartInstantUtcForMintDay(utcDay: Date)` | Converts a mintable UTC day into the precise UTC timestamp when the mint opens (10:40 ET with automatic DST handling).                  |
| `mintEndInstantUtcForMintDay(utcDay: Date)`   | Converts a mintable UTC day into the Eastern-morning cutoff for that mint window (10:00 ET → 14:00 UTC in summer, 15:00 UTC in winter). |
| `immediatelyNextMintInstantUTC(now: Date)`    | Returns the UTC timestamp for the very next mint start instant relative to `now`, including today if it has not started yet.            |
| `getNextMintStart(now?: Date)`                | Public alias that forwards to `immediatelyNextMintInstantUTC` for convenience in components.                                            |

## Mint Numbering & Identification

| Helper                                 | Summary                                                                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `getMintNumberForMintDate(date: Date)` | Calculates the ordinal mint number that occurs on the given mintable UTC day, accounting for historic breaks and the continuous schedule. |
| `getMintNumber(date: Date)`            | Snap-to-mint convenience wrapper that accepts any `Date`, advances to the next mintable day if necessary, and returns its mint number.    |
| `getNextMintNumber(now?: Date)`        | Determines the mint number for the currently active window (if any) or the upcoming mint if no window is live.                            |
| `dateFromMintNumber(n: number)`        | Inverse lookup that returns the mint start timestamp for a specific mint number, including SZN1 historical data.                          |
| `getMintTimelineDetails(n: number)`    | Bundles the mint's UTC start/end, season index, displayed SZN/Year/Epoch/Period/Era/Eon numbers, and the exact date ranges for each division. |

## Mint Activity & Remaining Supply

| Helper                                                     | Summary                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isMintingActive(now?: Date)`                              | Indicates whether `now` falls within any active mint window (from start through the Eastern cutoff defined above).                                                                                                          |
| `getCardsRemainingUntilEndOf(zoom: ZoomLevel, now?: Date)` | Counts how many mints remain from the next mint day through the end of the selected division (season, year, epoch, period, era, eon), automatically rolling into the next division if the current one has finished minting. |

## Calendar Link Helpers

| Helper                                                                    | Summary                                                                                                           |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `createGoogleCalendarUrl(startInstantUtc, endInstantUtc, title, details)` | Builds a Google Calendar link with correctly formatted UTC timestamps for the mint window.                        |
| `createIcsDataUrl(startInstantUtc, endInstantUtc, title, description)`    | Generates an ICS data URL containing the mint event with the proper mint window and metadata.                     |
| `printCalendarInvites(dateOrInstant, mintNumber, fontColor?, size?)`      | Produces the HTML snippet that renders download links for both the ICS file and Google Calendar entry for a mint. |

## Eligibility Range Helpers

| Helper                                                            | Summary                                                                                                                 |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `firstEligibleInRange(startUtcDay, endUtcDay)`                    | Scans an inclusive UTC date window and returns the first day that actually mints (Mon/Wed/Fri plus overrides), or `null` if none exist. |
| `nthEligibleInRange(startEligibleUtcDay, nZeroBased, endUtcDay?)` | Starting from a known eligible mint day, steps forward `n` additional eligible days (optionally stopping before `endUtcDay`).          |

## Range & Display Utilities

| Helper                                                      | Summary                                                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `getRangeDatesByZoom(zoom: ZoomLevel, seasonIndex: number)` | Returns the UTC start and end bounds for the selected timeline division (season → eon) so views can share consistent date math. |
| `getRangeLabel(start: Date, end: Date)`                     | Formats a human-friendly “Memes #X - #Y” label using mint numbers that fall inside the provided date range.                     |
| `formatMint(n: number)` / `formatFullDateTime(date, mode)`  | Formatting helpers used across the calendar to keep mint numbers and timestamps consistent.                                     |
