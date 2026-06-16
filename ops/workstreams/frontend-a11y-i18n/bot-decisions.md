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
| 2026-06-12 | #2624 | CodeRabbit   | Flagged missing top-level `nft.animation` video fallback                  | Fixed                                |
| 2026-06-13 | #2625 | CodeRabbit   | Manual review found no issues                                             | Accept                               |
| 2026-06-13 | #2625 | SonarCloud   | Flagged object literal fallback in Meme Lab test helper                   | Fixed                                |
| 2026-06-13 | #2625 | SonarCloud   | Quality Gate passed with 0 new issues after follow-up                     | Accept                               |
| 2026-06-13 | #2625 | Snyk         | PR check passed                                                           | Accept                               |
| 2026-06-13 | #2626 | CodeRabbit   | Flagged missing explicit list role for Safari/VoiceOver list semantics    | Fixed                                |
| 2026-06-13 | #2626 | CodeRabbit   | Flagged outdated collected-surface tracker wording                        | Fixed                                |
| 2026-06-13 | #2626 | SonarCloud   | Flagged explicit list role as redundant after CodeRabbit requested it     | Kept with Safari/VO prop rationale   |
| 2026-06-13 | #2626 | SonarCloud   | Quality Gate passed with 0 new issues after follow-up                     | Accept                               |
| 2026-06-13 | #2626 | Snyk         | PR check passed                                                           | Accept                               |
| 2026-06-13 | #2626 | CodeRabbit   | Latest head passed with all review threads resolved                       | Accept                               |
| 2026-06-13 | #2627 | SonarCloud   | Quality Gate passed with 0 new issues                                     | Accept                               |
| 2026-06-13 | #2627 | Snyk         | PR check passed                                                           | Accept                               |
| 2026-06-13 | #2627 | CodeRabbit   | Latest head passed with no review threads                                 | Accept                               |
| 2026-06-13 | #2628 | SonarCloud   | Flagged explicit `status` role in favor of native `<output>`              | Fixed                                |
| 2026-06-13 | #2628 | CodeRabbit   | Flagged repetitive active-context wording                                 | Fixed                                |
| 2026-06-13 | #2628 | SonarCloud   | Quality Gate passed with 0 new issues after follow-up                     | Accept                               |
| 2026-06-13 | #2628 | Snyk         | PR check passed                                                           | Accept                               |
| 2026-06-13 | #2628 | CodeRabbit   | Latest head passed with no review threads                                 | Accept                               |
| 2026-06-13 | #2629 | SonarCloud   | Quality Gate passed with 0 new issues                                     | Accept                               |
| 2026-06-13 | #2629 | Snyk         | PR check passed                                                           | Accept                               |
| 2026-06-13 | #2629 | CodeRabbit   | Latest head passed with no review threads                                 | Accept                               |
| 2026-06-13 | #2630 | DCO          | Signed commits check passed                                               | Accept                               |
| 2026-06-13 | #2630 | SonarCloud   | Quality Gate passed with 0 new issues                                     | Accept                               |
| 2026-06-13 | #2630 | Snyk         | No manifest changes detected                                              | Accept                               |
| 2026-06-13 | #2630 | CodeRabbit   | Manual review completed with no review threads                            | Accept                               |
| 2026-06-13 | #2631 | SonarCloud   | Flagged 13.8% duplication on new message dictionary lines                 | Fixed                                |
| 2026-06-13 | #2631 | DCO          | Signed commits check passed                                               | Accept                               |
| 2026-06-13 | #2631 | SonarCloud   | Quality Gate passed with 0 new issues and 0.0% duplication after fix      | Accept                               |
| 2026-06-13 | #2631 | Snyk         | No manifest changes detected                                              | Accept                               |
| 2026-06-13 | #2631 | CodeRabbit   | Latest head passed with no review threads                                 | Accept                               |
| 2026-06-13 | #2638 | CodeRabbit   | Flagged Distributions loading text remaining in the accessibility tree    | Fixed                                |
| 2026-06-13 | #2638 | DCO          | Signed commits check passed                                               | Accept                               |
| 2026-06-13 | #2638 | SonarCloud   | Quality Gate passed with 0 new issues after follow-up                     | Accept                               |
| 2026-06-13 | #2638 | Snyk         | No manifest changes detected                                              | Accept                               |
| 2026-06-13 | #2638 | CodeRabbit   | Latest head passed with the loading-label thread resolved                 | Accept                               |
| 2026-06-13 | #2639 | DCO          | Signed commits check passed                                               | Accept                               |
| 2026-06-13 | #2639 | SonarCloud   | Quality Gate passed with 0 new issues                                     | Accept                               |
| 2026-06-13 | #2639 | Snyk         | No manifest changes detected                                              | Accept                               |
| 2026-06-13 | #2639 | CodeRabbit   | Latest head passed with no review threads                                 | Accept                               |
| 2026-06-13 | #2640 | DCO          | Signed commits check passed                                               | Accept                               |
| 2026-06-13 | #2640 | SonarCloud   | Quality Gate passed with 0 new issues                                     | Accept                               |
| 2026-06-13 | #2640 | Snyk         | No manifest changes detected                                              | Accept                               |
| 2026-06-13 | #2640 | CodeRabbit   | Manual review completed with no review threads                            | Accept                               |
