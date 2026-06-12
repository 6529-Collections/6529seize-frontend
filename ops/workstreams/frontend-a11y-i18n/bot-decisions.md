# Bot Decisions

Record review-bot and CI decisions here for this workstream.

| Date       | PR    | Bot or Check | Finding                                                                   | Decision                             |
| ---------- | ----- | ------------ | ------------------------------------------------------------------------- | ------------------------------------ |
| 2026-06-11 | #2603 | SonarCloud   | Quality Gate passed with 0 new issues                                     | Accept                               |
| 2026-06-11 | #2603 | Snyk         | No manifest changes detected                                              | Accept                               |
| 2026-06-11 | #2603 | Claude       | Review skipped because organization monthly code review cap was reached   | Treat as unavailable, not actionable |
| 2026-06-11 | #2603 | CodeRabbit   | No actionable comments generated                                          | Accept                               |
| 2026-06-11 | #2603 | Merge        | Branch protection allowed merge after green checks                        | Merged standards PR                  |
| 2026-06-11 | #2604 | Claude       | Review skipped because organization monthly code review cap was reached   | Treat as unavailable, not actionable |
| 2026-06-11 | #2604 | SonarCloud   | Flagged i18n default object parameters and interpolation character class  | Fixed                                |
| 2026-06-11 | #2604 | CodeRabbit   | Flagged Suspense, title i18n, locale matching, and exhaustive guards      | Fixed                                |
| 2026-06-12 | #2607 | SonarCloud   | Quality Gate passed with 0 new issues                                     | Accept                               |
| 2026-06-12 | #2607 | Snyk         | PR check passed                                                           | Accept                               |
| 2026-06-12 | #2607 | CodeRabbit   | Flagged dead `MemeTab.title` and duplicate `MEME_FOCUS_VALUES` guards     | Fixed                                |
| 2026-06-12 | #2607 | CodeRabbit   | Flagged hardcoded detail locale, metadata locale path, and focus docs     | Fixed                                |
| 2026-06-12 | #2622 | SonarCloud   | Flagged guide `role="region"` and month-cell cognitive complexity         | Fixed                                |
| 2026-06-12 | #2623 | SonarCloud   | Flagged 10.4% duplication on new code                                     | Fixed                                |
| 2026-06-12 | #2623 | CodeRabbit   | Suggested consolidating mint formatting and renaming card mint range data | Fixed                                |
| 2026-06-12 | #2624 | SonarCloud   | Flagged optional chaining, redundant list role, and placeholder img role  | Fixed                                |
