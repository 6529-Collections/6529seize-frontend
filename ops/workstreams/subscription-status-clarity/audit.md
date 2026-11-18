# Subscription minting state audit

This is the final approved card review. It replaces the earlier copy proposals.
The app retains its existing layout, gradient, highlighted deadline box, full
UTC dates, counts, links, tooltip and funding flow. Changes are scoped to the
profile card. Backend classification, coverage calculations, settings, payment
operations and push notifications are unchanged.

## Production baseline

The production frontend checked for this review was commit
`f83d9e482ae06b3c2b018a4afac27351b52a0aaf`. Its coverage card matches the
announced release commit `4b607a04e6c94b41b2e2f4fff4c56d4bda21566c`.
The existing funded-count thresholds are 7+ Covered, 4–6 Plan a top up,
2–3 Running low and 0–1 Action required. The backend's default schedule horizon
is 24 drops, configurable up to 60; 24 is a forecast window, not a funding cap.

## Final states

| State                                         | Final owner presentation                                                                                                                    | Change from production                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Not set up                                    | Not set up; original setup explanation; Set up opens Minting settings                                                                       | Replace the main Top up action with Set up; no duplicate setup badge         |
| No current eligibility                        | Existing explanation, facts and optional Top up                                                                                             | Preserved                                                                    |
| No upcoming selections                        | Existing explanation; Choose drops, then quiet Top up                                                                                       | Preserved                                                                    |
| 8 funded                                      | Covered; 8 drops funded; Funded through                                                                                                     | Preserved; no added explanation                                              |
| 5 funded, later shortfall                     | Plan a top up; 5 drops funded; existing cutoff and quiet Top up                                                                             | Preserved; no added shortfall sentence                                       |
| 2 funded, later shortfall                     | Running low; 2 drops funded; existing cutoff and primary Top up                                                                             | Preserved; no added shortfall sentence                                       |
| 1 funded, later shortfall                     | Running low; 1 drop funded; existing funded-through and cutoff; primary Top up                                                              | Replace red Action required with amber Running low                           |
| Only one chosen drop, funded                  | Covered; 1 drop funded; Funded through; quiet optional Top up                                                                               | Replace Action required; no repeated selection explanation                   |
| Immediate drop uncovered                      | Action required; Today's mint isn't covered on its UTC mint day, otherwise The Memes #N isn't covered                                       | Replace the zero-count headline with the identified shortfall                |
| Immediate partial coverage                    | Action required; Today's mint isn't fully covered, or the named Meme off-day; cutoff names the remaining unfunded editions                  | Explain the missing editions inside the existing deadline box only           |
| Uncovered, no supplied cutoff                 | Same uncovered headline; Next unfunded names the Meme and full mint date; Top up                                                            | No missing/unknown/unavailable-deadline sentence is added                    |
| Authoritative cutoff passed, confirmed unpaid | Grey Deadline passed; named uncovered Meme; Top-up deadline: full supplied cutoff; View history; quiet Top up for future drops              | Add a neutral expired-cutoff presentation without claiming a failed delivery |
| Matching subscription already paid            | Subscription paid; exact Meme/date; funded count remains a remaining-balance fact; optional Top up                                          | Avoid demanding payment twice; does not claim the airdrop is complete        |
| Payment check loading                         | Neutral loading state and facts; no urgent action                                                                                           | Wait for the existing read before claiming a shortfall                       |
| Payment check failed                          | Coverage unavailable; brief check failure explanation and optional Top up                                                                   | Do not claim verified non-payment                                            |
| 24 funded                                     | Covered; Next 24 drops funded; unchanged Funded through                                                                                     | Add Next only at exactly 24; no limit note or at least wording               |
| Coverage UNKNOWN                              | Existing unavailable state, explanation and facts                                                                                           | Preserved                                                                    |
| Initial loading                               | Existing loading heading and fact skeletons; no actions                                                                                     | Preserved                                                                    |
| Initial coverage read failed                  | Existing unavailable state, balance and recovery controls                                                                                   | Preserved                                                                    |
| Failed refresh retaining a snapshot           | Grey Last known coverage; existing count and funded-through; Last updated [full timestamp UTC]. May be out of date.; owner Refresh coverage | Replace urgent stale-snapshot conclusions with dated facts                   |

Deadline instructions retain **Top up by [full cutoff] to receive The Memes #N.**
For partial coverage, the same box says **to receive the remaining [N] edition(s)**.
No duplicate owner sentence is added above it. Counts come from the API's funded
and missing editions, never from raw ETH or mint capacity.

Visitors see factual headings and counts, including the partial-edition count,
but no setup/funding instructions, deadlines or owner actions. iOS continues to
hide and redirect the complete tab. Android and web retain their controls.

## Time and payment safeguards

- Today uses the actual current UTC date rather than the snapshot calculation date.
- Only a supplied authoritative cutoff can produce Deadline passed. The label
  waits for a fresh final-subscription read after crossing that cutoff.
- A matching collection/token payment covering every requested edition takes
  priority over expiry, including after the mint day. A partial or unrelated
  payment does not mark the whole request paid. The first cutoff read must finish
  before trusting cached unpaid data; later background reads keep the resolved
  card visible, and an offline-paused first read remains neutral.
- Failed/paused payment reads remain neutral. Failed coverage refreshes retain
  dated facts and suppress urgent time-based conclusions from that snapshot.
- The visible card clock updates date/cutoff presentation without polling coverage.

## Final app screenshots

These captures use the real profile route and a local read-only synthetic API.
The fixed sample date is 16 November 2026. No real top ups, settings saves,
subscription changes or transactions were performed.

| State                       | Desktop                                                   | Phone                                                    |
| --------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| Immediate uncovered         | [Capture](evidence/approved-desktop-zero-funded.png)      | [Capture](evidence/approved-mobile-zero-funded.png)      |
| One funded, later shortfall | [Capture](evidence/approved-desktop-one-funded.png)       | [Capture](evidence/approved-mobile-one-funded.png)       |
| Only one chosen and funded  | [Capture](evidence/approved-desktop-zoku-manual.png)      | [Capture](evidence/approved-mobile-zoku-manual.png)      |
| No supplied cutoff          | [Capture](evidence/approved-desktop-no-deadline.png)      | [Capture](evidence/approved-mobile-no-deadline.png)      |
| Partial editions            | [Capture](evidence/approved-desktop-partial-editions.png) | [Capture](evidence/approved-mobile-partial-editions.png) |
| Deadline passed             | [Capture](evidence/approved-desktop-deadline-passed.png)  | [Capture](evidence/approved-mobile-deadline-passed.png)  |

The older comparison grids in this directory remain historical evidence. Their
before columns show the original implementation; their after columns predate
the final approved copy and must not be treated as the final result.

## Validation

- 385 focused subscription/profile Jest tests across 24 suites passed.
- 100 translation, dictionary and calendar-date tests across five suites passed.
- Changed-source lint, explicit coverage-source lint, application and Playwright
  type checks, selector policy, manifest consistency, debt ratchet, Help Bot sync and
  documentation links passed. React Doctor scored 99/100, with structural
  warnings for the existing state-heavy subscriptions page and its component size.
- The updated browser audit checks all 19 fixture states plus stale/recovery,
  payment reads, cutoff transitions, setup/history navigation, dialog focus,
  top-up option selection without submitting, tooltips, responsive overflow and
  scoped axe checks. All eight owner/visitor project cases passed across the
  focused runs. The Android trace identified a fixed bottom-navigation overlap
  in the test; the card is now scrolled into view before input checks.
- Browser maintenance follows the approved changes: remove duplicated explanation
  assertions, retain the named Next unfunded fact, require Set up navigation,
  preserve primary Running low funding, and verify neutral expiry/payment handling.
  Existing ownership, quantities, allocation, purchasing gates and transaction
  confirmation guarantees remain intact. The registered subscription sandbox
  pack is selected by PR CI for these sources; the remote read-only profile pack
  was inspected and maintained but not executed against staging in this revision.
- Physical devices, real payments and a production build were not run for this
  draft revision. Native evidence uses browser shell simulations. Earlier staging
  captures are historical evidence, not new validation of the final revision.

## Review decisions and delivery boundary

- Keep the exact 24-count rule requested by the user. Replacing it with a dynamic
  horizon rule would alter other counts and requires a separate product decision.
- Preserve supplied later deadlines for funded forecasts; a planning reminder
  does not mean the currently funded drops are uncovered. The user explicitly
  kept Plan a top up at five funded and the existing deadline block.
- Remove the proposed extra shortfall and missing-deadline strings. New messages
  use the existing catalog and locale-aware formatters; untranslated locale
  fallback debt is recorded in the subscriptions product documentation.
- The requester subsequently authorized completion through GitHub review, staging,
  merge and production. Include current main; wait for every required staging
  validation linked to the deployment, including browser/E2E, to finish green
  before using the authorized maintainer bypass and promoting to production.
