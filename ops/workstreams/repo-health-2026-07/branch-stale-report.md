# Stale unmerged branch report — 2026-07-05 (Thread B)

Scope: remote branches not merged into `main` with last commit before 2026-06-04
(the 30-day cutoff relative to the 2026-07-04 census snapshot),
excluding protected branches (open-PR heads, <7d activity, `main`/`1a-staging`, campaign `ci/*`+`amnesty/*`, staging release candidates).
Deletion requires user sign-off — nothing in this report has been deleted.

## Summary

- Total stale unmerged: 739
- Ancient (pre-2025): 352 — recommend DELETE
- Old (2025): 248 — recommend DELETE unless recognized
- Recent-stale (2026-01-01..2026-06-04): 139 — recommend REVIEW (likely abandoned agent/experiment branches; delete after skim)
- Staged-only release candidates (merged to 1a-staging, not main) — NEVER delete: codex/mobile-dock-active-pill-centering, codex/my-votes-sort-desc, codex/video-click-pause
- Local unmerged branches (June 2026, under 30d — informational, untouched): ci/*, amnesty/*, codex/staging-* (13), codex/pr26xx bot-fix (4), codex/delegation-ipfs-staging, codex/fix-bootstrap-*, codex/rescue-pr2870-dock-clearance, codex/testing-critical-e2e-workflows, codex/wave-score-*, codex/polish-boosted-link-cards (Phase 2, deleted after landing)

## Branches (name | last commit | commits ahead of main | recent subjects | recommendation)

| Branch | Last commit | Ahead | Recent subjects | Rec |
| --- | --- | --- | --- | --- |
| allowlist-tool-builder | 2023-06-22 | 90 | feat: download results as json;wip | DELETE |
| allowlist-tool | 2023-07-04 | 104 | wip;WIP | DELETE |
| distribution-tool-phase-components | 2023-07-05 | 108 | WIP;Merge branch 'allowlist-tool' into distribution-plan-tool | DELETE |
| prxt-snapshot-test | 2023-07-13 | 1 | Snapshot test | DELETE |
| dev-nextgen | 2023-07-14 | 20 | Merge branch 'main' into dev-nextgen;Fix package dependencies | DELETE |
| dpt-2 | 2023-09-26 | 362 | main merge;wip | DELETE |
| dpt-fixed | 2023-09-26 | 362 | Merge branch 'main' into dpt-fixed;wip | DELETE |
| distribution-plan-tool | 2023-09-26 | 378 | Revert "Merge branch 'dev-user-pfp-2' into distribution-plan-tool-pfp";Merge branch 'dev-user-pfp-2' into distribution-plan-tool-pfp | DELETE |
| rep-init | 2023-10-10 | 9 | feat: commonapi;wip | DELETE |
| profile-settings-save | 2023-10-26 | 10 | Merge branch 'profile-init' into profile-settings-save;removed unused components | DELETE |
| profile-username-availability | 2023-10-26 | 10 | Merge branch 'profile-init' into profile-username-availability;removed unused components | DELETE |
| dev-load-s3-assets | 2023-10-31 | 4 | WIP;WIP | DELETE |
| profile-cleanup | 2023-11-03 | 7 | init;user page speed improvements | DELETE |
| dev-push-s3-assets | 2023-11-06 | 2 | Remove 'LOAD_S3' env var - use 'VERSION' env var;Add 'validate deployment' step | DELETE |
| userpage-speed-improvements | 2023-11-07 | 10 | Merge branch 'main' into userpage-speed-improvements;Merge branch 'main' into userpage-speed-improvements | DELETE |
| profile-level-button-fix | 2023-11-08 | 1 | bugfix: profile level button click handles | DELETE |
| tdh-fix | 2023-11-08 | 1 | bugfix: show boosted tdh in profile and increase margin between profile name and classification | DELETE |
| levels-page | 2023-11-08 | 24 | levels page;levels init | DELETE |
| profile-clean | 2023-11-08 | 32 | goodvibes;levels page | DELETE |
| dev-delegation-gnosis | 2023-11-09 | 1 | WIP | DELETE |
| profile-addresses-responsive | 2023-11-10 | 2 | added temporary staging ssr fix;profile page header mobile | DELETE |
| emma-manifold-download | 2023-11-14 | 1 | feat: manifold download migrated wallets | DELETE |
| snyk-upgrade-0c93e31278d48a1a8ee8cc56874ac0c8 | 2023-11-15 | 1 | fix: upgrade bootstrap from 5.2.3 to 5.3.2 | DELETE |
| snyk-upgrade-d21f2a9a4ffbdf37f4102847b97489c0 | 2023-11-15 | 1 | fix: upgrade next from 13.5.4 to 13.5.6 | DELETE |
| snyk-upgrade-776431d270759be1fc737f7f1bc7dbeb | 2023-11-15 | 1 | fix: upgrade react-bootstrap from 2.7.2 to 2.9.1 | DELETE |
| snyk-upgrade-a0c493f0f238c956cd249adb5f2b506b | 2023-11-15 | 1 | fix: upgrade sass from 1.59.3 to 1.69.4 | DELETE |
| snyk-upgrade-a60354f08a9dcf8b10f8f66a11296668 | 2023-11-15 | 1 | fix: upgrade viem from 1.4.2 to 1.16.6 | DELETE |
| profile-ssr-init | 2023-11-15 | 5 | Merge branch 'main' into profile-ssr-init;owned fix, consolidation table dont include last 24h owned | DELETE |
| web-royalties | 2023-11-16 | 28 | Fix rounding of number for royalties in activity;Fix Build | DELETE |
| dev-fix-rememes-pagination | 2023-11-16 | 4 | Merge branch 'main' into dev-fix-rememes-pagination;Re-Fix switching to 'all' on memes filter | DELETE |
| leaderboard-levels | 2023-11-16 | 5 | removed unused imports;moved tdh to level maping to backend | DELETE |
| user-activity-purchases-filter | 2023-11-17 | 1 | Add purchases filter in user activity | DELETE |
| royalties-note | 2023-11-17 | 1 | Royalties note for 6529 and 6529er | DELETE |
| dev-nextgen-profile | 2023-11-17 | 250 | Merge branch 'user-activity-purchases-filter' into dev-nextgen-profile;Add purchases filter in user activity | DELETE |
| snyk-upgrade-394dede86f5c6bc1d5e6f9ddeeb6b32a | 2023-11-20 | 1 | fix: upgrade alchemy-sdk from 2.9.2 to 2.10.1 | DELETE |
| snyk-upgrade-f216e1606dda040debc341d53a409118 | 2023-11-20 | 1 | fix: upgrade js-cookie from 3.0.1 to 3.0.5 | DELETE |
| snyk-upgrade-1baf787e4031933530d40c109e5c176b | 2023-11-20 | 1 | fix: upgrade multiple dependencies with Snyk | DELETE |
| snyk-upgrade-c27b5e68fa02bb163950895ca247f502 | 2023-11-20 | 1 | fix: upgrade sass from 1.59.3 to 1.69.5 | DELETE |
| snyk-upgrade-52180fa1fa622fec4980863d339d81bd | 2023-11-20 | 1 | fix: upgrade viem from 1.4.2 to 1.18.1 | DELETE |
| memelab-royalties | 2023-11-21 | 7 | WIP;WIP | DELETE |
| sonarcloud-20-11 | 2023-11-23 | 7 | Merge branch 'main' into sonarcloud-20-11;Update packages | DELETE |
| fix-package-lock-24-11 | 2023-11-24 | 1 | Fix package-lock | DELETE |
| meme-74-fix-frame-src | 2023-11-28 | 3 | Merge branch 'main' into meme-74-fix-frame-src;Repeat for https://*.ipfs.nftstorage.link | DELETE |
| redirect-extension-http-https | 2023-11-29 | 1 | Redirect extension for http to https | DELETE |
| sonarcloud-memelab-royalties-nextgen | 2023-12-05 | 172 | Merge branch 'dev-nextgen-2' into sonarcloud-memelab-royalties-nextgen;Add generator as frame src | DELETE |
| sonarcloud-memelab-royalties | 2023-12-05 | 52 | WIP;WIP | DELETE |
| meme-accounting-download-file-name | 2023-12-06 | 2 | Fix validation;WIP | DELETE |
| meme-lab-performance-07-12 | 2023-12-07 | 1 | Performance optimization for /meme-lab page | DELETE |
| dev-fix-nft-timeline | 2023-12-07 | 1 | WIP | DELETE |
| minting-page-link-memelab | 2023-12-08 | 1 | Fix Minting link for memelab | DELETE |
| dev-nextgen-2-artists | 2023-12-08 | 106 | WIP;Merge branch 'dev-nextgen-2' into dev-nextgen-2-artists | DELETE |
| fix-DownloadUrlWidget-file-name-fix-build | 2023-12-13 | 1 | Fix build | DELETE |
| fix-DownloadUrlWidget-file-name | 2023-12-13 | 4 | WIP;WIP | DELETE |
| ledger-quickfix | 2023-12-14 | 2 | Merge branch 'main' into ledger-quickfix;removed connect to avoid ledger drainer | DELETE |
| cic-status-color | 2023-12-15 | 1 | fix: cic status color | DELETE |
| profile-loading-improvements | 2023-12-15 | 1 | improved profile loading times | DELETE |
| revert-identity | 2023-12-15 | 1 | wip | DELETE |
| profile-identity | 2023-12-15 | 123 | wip;wip | DELETE |
| update-wagmi-1.4.12 | 2023-12-15 | 2 | WIP;Update wagmi to 1.4.12, use @web3modal/wagmi | DELETE |
| updated-header-links-18-12 | 2023-12-18 | 4 | WIP;WIP | DELETE |
| community-activity | 2023-12-18 | 8 | wip;wip | DELETE |
| stats-activity-distribution | 2023-12-19 | 3 | wip;Merge branch 'main' into stats-activity-distribution | DELETE |
| profile-cic-improvements | 2023-12-19 | 4 | ui fixes;wip | DELETE |
| profile-search | 2023-12-20 | 23 | Merge branch 'main' into profile-search;wip | DELETE |
| CIC-input-UI | 2023-12-20 | 3 | wip;wip | DELETE |
| index-activity-log | 2023-12-21 | 1 | changed communitu activity log limit 50 to 20 in index page | DELETE |
| main-community-activity | 2023-12-21 | 2 | wip;wip | DELETE |
| search-u-fixes | 2023-12-21 | 3 | wip;wip | DELETE |
| dev-szn6 | 2023-12-29 | 7 | Adjust html loading for community-metrics;Add boost to stats | DELETE |
| rep-6 | 2024-01-02 | 1 | bugfix log.profile_handle undefined | DELETE |
| rep-7 | 2024-01-02 | 1 | bugfix when profile handle is undefined | DELETE |
| rep-4 | 2024-01-02 | 1 | changed logs count | DELETE |
| rep-5 | 2024-01-02 | 4 | removed unused code;Merge branch 'main' into rep-5 | DELETE |
| sign-msg | 2024-01-03 | 1 | changed allowlist sign in method and did redirect tos to terms-of-service | DELETE |
| rep | 2024-01-03 | 37 | ui fixes;wip | DELETE |
| header-address-03-01 | 2024-01-03 | 6 | Add "Home";WIP | DELETE |
| remove-wallet-view-mode | 2024-01-04 | 4 | Merge branch 'main' into remove-wallet-view-mode;Removed unused VIEW_MODE_COOKIE cookie | DELETE |
| user-page-tdh-tank-05-02 | 2024-01-05 | 1 | Fix display of TDH and rank in user page | DELETE |
| rep-improve | 2024-01-05 | 11 | ui fixes;wip | DELETE |
| create-profile-cta | 2024-01-06 | 1 | wip | DELETE |
| collection-delegation-reorder | 2024-01-07 | 1 | reordered blocks | DELETE |
| dev-tdh-consolidations-rework-08-01 | 2024-01-08 | 3 | Merge branch 'main' into dev-tdh-consolidations-rework-08-01;WIP | DELETE |
| community-table-fix-profile-link | 2024-01-09 | 1 | Fix profile link in community table | DELETE |
| add-tags-back | 2024-01-09 | 1 | Readd tags in profile page | DELETE |
| setting-up-profile-refactor | 2024-01-09 | 22 | wip;Merge branch 'setting-up-profile-refactor-3' into setting-up-profile-refactor | DELETE |
| my-new-awesome-branch | 2024-01-10 | 1 | ui fixesx | DELETE |
| profile-preview | 2024-01-10 | 2 | removed unused import;added more data to link preview | DELETE |
| link-preview | 2024-01-10 | 2 | wip;wip | DELETE |
| activity-log-select-placement | 2024-01-11 | 1 | changed activity log filters placement | DELETE |
| search-redirect-and-more | 2024-01-11 | 15 | raters table path to fix;wip | DELETE |
| dev-fix-szn-5-tag | 2024-01-15 | 1 | Fix szn5 display value | DELETE |
| profile-about-me | 2024-01-18 | 19 | wip;wip | DELETE |
| profile-about-placement | 2024-01-19 | 3 | wip;ui fixes | DELETE |
| superrare-svg | 2024-01-22 | 1 | Superrare SVG | DELETE |
| profile-about-below-name | 2024-01-22 | 3 | Merge branch 'main' into profile-about-below-name;about ui fixes | DELETE |
| profile-stats-redesign | 2024-01-23 | 60 | wip;wip | DELETE |
| wallet-activity-icons | 2024-01-24 | 5 | wip;wip | DELETE |
| profile-lose | 2024-01-26 | 2 | removed period after period;changing profile losing text | DELETE |
| about-error-msg | 2024-01-26 | 5 | Merge branch 'main' into about-error-msg;error x icon | DELETE |
| profile-search-direct | 2024-01-29 | 2 | removed console.log;fixed profile rededirect path | DELETE |
| profile-burn-transaction-display | 2024-01-30 | 1 | Fix burn transaction display in profile | DELETE |
| ui-fixes | 2024-01-30 | 10 | wip;Merge branch 'null-address-wallet-activity' into ui-fixes | DELETE |
| null-address-wallet-activity | 2024-01-30 | 5 | wip;wip | DELETE |
| profile-page-identity-statement-fix | 2024-01-31 | 2 | wip;user page identity statements fixes | DELETE |
| dynamic-profile-pfp | 2024-02-01 | 3 | WIP;WIP | DELETE |
| profile-upcoming-mints | 2024-02-04 | 214 | Merge branch 'main' into profile-upcoming-mints;wip | DELETE |
| dev-content-width-profile-page | 2024-02-04 | 3 | profile page ui fixes;WIP | DELETE |
| profile-collected-refactor | 2024-02-05 | 111 | wip;wip | DELETE |
| dpt-path-to-emma | 2024-02-05 | 3 | wip;Merge branch 'main' into dpt-path-to-emma | DELETE |
| dev-content-width | 2024-02-05 | 4 | Merge branch 'main' into dev-content-width;Profile page ui fixes (#263) | DELETE |
| profile-page-pfp-fixes | 2024-02-06 | 2 | pfp size fixes;pfp size fix | DELETE |
| profile-page-collected-fixes | 2024-02-06 | 3 | wip;wip | DELETE |
| pebbles-distribution-plan | 2024-02-07 | 17 | WIP;WIP | DELETE |
| fe-path-header | 2024-02-07 | 228 | revert next changes;Send frontend path via api | DELETE |
| profile-mints-lint-fixes | 2024-02-07 | 240 | fixes;wip (#270) | DELETE |
| profile-page-table-scroll-fix | 2024-02-07 | 241 | Merge branch 'dev-nextgen-2' into profile-page-table-scroll-fix;wip (#270) | DELETE |
| font-changes | 2024-02-07 | 243 | communiti-activity-font-change;fixes (#273) | DELETE |
| font-changes-profile-page | 2024-02-07 | 252 | mints image fixes;font changes profile page | DELETE |
| collected-nextgen | 2024-02-07 | 264 | wip;wip | DELETE |
| dev-change-build-nextgen-chain | 2024-02-08 | 1 | Adjust Nextgen Chain ID | DELETE |
| fix-mint-0-count | 2024-02-08 | 1 | Fix mint count check | DELETE |
| remove-bundle-analyzer | 2024-02-08 | 1 | reverted bundle analyzer | DELETE |
| dev-bundle-analyzer | 2024-02-08 | 1 | WIP | DELETE |
| dev-fix-nextgen-admin | 2024-02-08 | 1 | WIP | DELETE |
| nextgen-distribution-fix-spots | 2024-02-08 | 1 | WIP | DELETE |
| dev-nextgen-dependencies | 2024-02-08 | 2 | Package lock;Fix Dependencies | DELETE |
| dev-nextgen-2 | 2024-02-08 | 262 | WIP;WIP | DELETE |
| nextgen-post-release-fix | 2024-02-09 | 1 | Post release fixes for Nextgen | DELETE |
| mobile-search-double-click | 2024-02-09 | 1 | wip | DELETE |
| nextgen-followup-12-02 | 2024-02-12 | 5 | WIP;WIP | DELETE |
| rememes-snow-crash | 2024-02-14 | 1 | Fix broken rememe image, adjust delegation center | DELETE |
| profile-page-tdh-display-precision | 2024-02-14 | 1 | Fix tdh precision | DELETE |
| nextgen-token-data-traits-2 | 2024-02-14 | 2 | WIP;WIP | DELETE |
| nextgen-token-data-traits | 2024-02-14 | 6 | WIP;Merge branch 'main' into nextgen-token-data-traits | DELETE |
| nextgen-collection-os-link | 2024-02-15 | 1 | Use collection opensea link if exists | DELETE |
| token-provenance-pagination | 2024-02-15 | 5 | Added token link in collection provenance;WIP | DELETE |
| h1-restructure | 2024-02-15 | 7 | WIP;Merge branch 'main' into h1-restructure | DELETE |
| nextgen-back-to-collection | 2024-02-16 | 2 | Merge branch 'main' into nextgen-back-to-collection;Fix nextgen back to collection links | DELETE |
| transaction-contract-filters-16-02 | 2024-02-16 | 2 | Revert Profile;Added contract filters for transactions in Activity and User Stats Signed-off-by: prxt <prxt@6529.io> | DELETE |
| nextgen-traits-art-fix-show-filters | 2024-02-19 | 1 | Fix show/hide filters in nextgen token art | DELETE |
| wallet-checker-accept-address | 2024-02-19 | 2 | WIP;Wallet Checker - accept address from url | DELETE |
| nextgen-traits-full | 2024-02-19 | 7 | Merge branch 'main' into nextgen-traits-full;WIP | DELETE |
| tdh-include-null | 2024-02-20 | 10 | Merge branch 'main' into tdh-include-null;Merge branch 'main' into tdh-include-null | DELETE |
| nextgen-listed | 2024-02-21 | 11 | WIP;WIP | DELETE |
| hide-countdown-index-page | 2024-02-27 | 1 | Hide Countdown if all minted | DELETE |
| nextgen-trait-sets | 2024-02-27 | 31 | Merge branch 'main' into nextgen-trait-sets;WIP | DELETE |
| use-manifold-claim | 2024-02-27 | 7 | WIP;WIP | DELETE |
| nextgen-token-provenance | 2024-02-28 | 1 | Rename titles in token provenance | DELETE |
| nextgen-redesign-featured-page | 2024-02-28 | 2 | WIP;WIP | DELETE |
| artist-seize-profile | 2024-02-28 | 4 | WIP;Merge branch 'main' into artist-seize-profile | DELETE |
| nextgen-render-center | 2024-02-28 | 9 | WIP;WIP | DELETE |
| 16k-mode-2 | 2024-02-29 | 3 | WIP;WIP | DELETE |
| 16k-mode | 2024-02-29 | 5 | Merge branch 'main' into 16k-mode;WIP | DELETE |
| index-rename-mint-btn | 2024-03-01 | 1 | Rename Mint button in home page | DELETE |
| community-table-refactor | 2024-03-01 | 22 | wip;wip | DELETE |
| community-table-refactor-v3 | 2024-03-01 | 22 | wip;wip | DELETE |
| nextgen-intermediate-zooms | 2024-03-04 | 12 | Merge branch 'main' into nextgen-intermediate-zooms;WIP | DELETE |
| nextgen-interim-display-center | 2024-03-04 | 2 | Sonar;WIP | DELETE |
| community-nerds-table | 2024-03-05 | 5 | Comma;wip | DELETE |
| nextgen-verbose-logs | 2024-03-06 | 14 | Merge branch 'main' into nextgen-verbose-logs;Merge branch 'main' into nextgen-verbose-logs | DELETE |
| font-fixes | 2024-03-06 | 2 | Merge branch 'main' into font-fixes;font changes ui | DELETE |
| fix-delegation-center-faq-links | 2024-03-07 | 1 | Fix Delegation Center FAQ Links | DELETE |
| boost-breakdown | 2024-03-07 | 4 | WIP;WIP | DELETE |
| boost-breakdown-quickfix | 2024-03-09 | 2 | wip;quickfix | DELETE |
| delegation-center-rework | 2024-03-12 | 39 | WIP;Back to mainnet | DELETE |
| profile-feed | 2024-03-14 | 57 | wip;wip | DELETE |
| mov-support | 2024-03-15 | 1 | Add support for MOV file type | DELETE |
| curation-sidebar-height-fix | 2024-03-15 | 1 | wip | DELETE |
| curation-sidebar-mobile-background | 2024-03-15 | 1 | wip | DELETE |
| community-sidebar-mobile | 2024-03-15 | 10 | wip;wip | DELETE |
| profile-enabled-info | 2024-03-15 | 5 | community sidebar ui;Merge branch 'community-sidebar-mobile' into profile-enabled-info | DELETE |
| sidebar-mobile | 2024-03-18 | 1 | wip | DELETE |
| artists-handle-split | 2024-03-22 | 1 | Split artist handles | DELETE |
| updated-cookie-policy | 2024-03-26 | 1 | Update Cookie Policy | DELETE |
| seasons-reworked | 2024-03-26 | 24 | Merge branch 'main' into seasons-reworked;WIP | DELETE |
| schema-rework-paths | 2024-03-28 | 1 | Fix Schema rework paths, update community stats days until | DELETE |
| boost-breakdown-totals-fix | 2024-03-29 | 1 | Fix totals for boost breakdown, fix font sources | DELETE |
| community-nerd-daily-change | 2024-03-29 | 1 | Fix values in daily change | DELETE |
| szn6-boost | 2024-03-29 | 7 | WIP;WIP | DELETE |
| hr-span-community-stats-memes | 2024-04-01 | 1 | Fix HR span | DELETE |
| stats-balance-quickfix | 2024-04-01 | 1 | quickfix for stats balance, bug still there | DELETE |
| szn-labels | 2024-04-01 | 1 | wip | DELETE |
| profile-activity-overview-memes-airdrops | 2024-04-01 | 2 | Merge branch 'main' into profile-activity-overview-memes-airdrops;Add airdrops in memes breakdown of profile activity overview | DELETE |
| schema-rework-followup | 2024-04-02 | 12 | WIP;WIP | DELETE |
| deploy-retries-delay-30 | 2024-04-03 | 1 | Increase delay for EB check retry to 30s | DELETE |
| the-memes-loading-fix | 2024-04-03 | 2 | WIP;Improve loading when switching accounts in the memes page | DELETE |
| nft-owners-routes | 2024-04-03 | 9 | WIP;WIP | DELETE |
| the-memes-sorting-fix | 2024-04-04 | 1 | Fix sorting in the memes page | DELETE |
| nfts-endpoints-sorting | 2024-04-04 | 1 | WIP | DELETE |
| distributions-reworked | 2024-04-04 | 5 | WIP;Fix user page | DELETE |
| distribution-fetching-fix | 2024-04-05 | 1 | Fix loading/fetching for distributions | DELETE |
| styling-updates-05-04 | 2024-04-05 | 2 | WIP;Styling changes on the memes page to fix broken css | DELETE |
| eth-price-latest-activity | 2024-04-08 | 1 | Add Eth price to latest activity | DELETE |
| acticity-swap-minted-seized | 2024-04-09 | 2 | WIP;Swap 'minted' to 'seized' | DELETE |
| fix-nft-imports | 2024-04-10 | 1 | Fix imports bug which made css not load | DELETE |
| rep-page-speed | 2024-04-10 | 1 | wip | DELETE |
| stats-refetch-on-profile-change | 2024-04-10 | 2 | fixed user stats overview bug;bugfix for stats refetch | DELETE |
| tdh-metrics-date-correction | 2024-04-11 | 1 | Fix dates in tdh metrics | DELETE |
| nextgen-public-phase-display | 2024-04-12 | 1 | Fix Public phase display in nextgen, adjust delegation form labels | DELETE |
| delegation-manager-reword-12-04 | 2024-04-12 | 2 | WIP;Adjust Delegation Center wording | DELETE |
| meme-subscriptions-about-2 | 2024-04-15 | 1 | Escape special chars in meme subscriptions about | DELETE |
| meme-subscriptions-about | 2024-04-15 | 4 | WIP;WIP | DELETE |
| meme-subscriptions | 2024-04-15 | 46 | WIP;WIP | DELETE |
| subs-docs | 2024-04-16 | 1 | Text-only revisions to subs docs and cal | DELETE |
| tabs-overflow-fix | 2024-04-16 | 2 | wip;tabs fix | DELETE |
| meme-subscriptions-2 | 2024-04-16 | 3 | WIP;WIP | DELETE |
| subs-proof | 2024-04-16 | 643 | Proof-read subs docs;Merge branch '1a-staging-branch' into subs-proof | DELETE |
| subscriptions-etherscan-link | 2024-04-17 | 1 | Fix transaction link | DELETE |
| subscriptions-show-ad-upcoming | 2024-04-17 | 1 | Show airdrop address in upcoming | DELETE |
| subscriptions-merged-download | 2024-04-17 | 2 | WIP;Also download merged Phase results | DELETE |
| subscriptions-show-airdrop-address-2 | 2024-04-18 | 1 | Wait for loading of airdrop address before showing "change" | DELETE |
| rabby-1 | 2024-04-18 | 1 | wip1 | DELETE |
| subscriptions-18-4-2 | 2024-04-18 | 2 | WIP;Undo require vault to change airdrop address | DELETE |
| subscriptions-18-4 | 2024-04-18 | 2 | WIP;Update Subscriptions airdrop logic | DELETE |
| subscriptions-show-airdrop-address | 2024-04-18 | 6 | WIP;WIP | DELETE |
| search-modal-memes | 2024-04-19 | 15 | WIP;Merge branch 'main' into search-modal-memes | DELETE |
| naka-threshold | 2024-04-19 | 713 | Merge branch '1a-staging-branch' into naka-threshold;Adds headers to Naka Threshold page... | DELETE |
| wagmi-1.4.13 | 2024-04-19 | 8 | Removed console log;Merge branch 'main' into wagmi-1.4.13 | DELETE |
| subscriptions-reworked-auto-logic | 2024-04-23 | 3 | WIP;WIP | DELETE |
| upcoming-drops-copyright | 2024-04-23 | 7 | WIP;WIP | DELETE |
| about-section-ssr | 2024-04-24 | 1 | Fix page title for about section | DELETE |
| onchain-primary-address-about | 2024-04-26 | 3 | WIP;WIP | DELETE |
| on-chain-primary-address-fix-profile-post | 2024-04-29 | 1 | Fix update profile form | DELETE |
| onchain-primary-address | 2024-04-29 | 6 | WIP;WIP | DELETE |
| auth-schema-change | 2024-05-08 | 1 | auth schema changes | DELETE |
| acting-as-proxy | 2024-05-09 | 19 | wip;wip | DELETE |
| waves | 2024-05-09 | 6 | waves ui;waves ui | DELETE |
| past-subscriptions-table | 2024-05-09 | 8 | WIP;WIP | DELETE |
| meme-230-manifold | 2024-05-10 | 2 | WIP;Custom Index warning for card 230 drop | DELETE |
| add-wallet-checker-link-mobile | 2024-05-15 | 1 | Add Wallet Checker link for mobile - Delegation Center | DELETE |
| logs-scroll-fix | 2024-05-16 | 1 | wip | DELETE |
| proxy | 2024-05-17 | 93 | wip;wip | DELETE |
| proxy-profile-logs-fix | 2024-05-20 | 1 | wip | DELETE |
| address-dropdown-responsive-fix | 2024-05-21 | 1 | fixed address selecting dropdown responsiveness | DELETE |
| nextgen-21-05 | 2024-05-21 | 3 | Merge branch 'main' into nextgen-21-05;Add blur support for nextgen listings | DELETE |
| profile-proxies-logs-fix | 2024-05-21 | 3 | Merge branch 'main' into profile-proxies-logs-fix;wip | DELETE |
| proxy-fixes | 2024-05-22 | 26 | wip;wip | DELETE |
| nextgen-info-bubble-mobile | 2024-05-22 | 3 | Merge branch 'main' into nextgen-info-bubble-mobile;WIP | DELETE |
| subscriptions-reset | 2024-05-22 | 4 | Merge branch 'main' into subscriptions-reset;WIP | DELETE |
| proxy-ui-fixes | 2024-05-22 | 9 | wip;proxy ui fixes | DELETE |
| api-docs-link-blank-target | 2024-05-23 | 3 | wip;wip | DELETE |
| create-profile-modal | 2024-05-23 | 4 | Merge branch 'main' into create-profile-modal;create-profile-btn-fix | DELETE |
| distribution-search-fix | 2024-05-27 | 1 | Fix distribution search when no results found | DELETE |
| community-nerd-daily-change-fix | 2024-05-28 | 1 | Fix daily change to be based on total tdh | DELETE |
| magic-eden-listings | 2024-05-29 | 3 | Merge branch 'main' into magic-eden-listings;Merge branch 'main' into magic-eden-listings | DELETE |
| subscriptions-report-utc-day | 2024-06-04 | 1 | Fix day display to show correct UTC date | DELETE |
| subscriptions-airdrops-unconsolidated | 2024-06-04 | 3 | WIP - subscriptions wording;WIP | DELETE |
| groups-tokens | 2024-06-04 | 7 | Merge branch 'main' into groups-tokens;wip | DELETE |
| cookie-policy | 2024-06-07 | 20 | WIP;WIP | DELETE |
| remove-cic-rep-all | 2024-06-14 | 1 | wip | DELETE |
| glb-support | 2024-06-14 | 4 | WIP;Merge branch 'main' into glb-support | DELETE |
| anyone-rep-cic | 2024-06-14 | 8 | Merge branch 'main' into anyone-rep-cic;wip | DELETE |
| groups-refactor | 2024-06-14 | 80 | wip;wip | DELETE |
| create-profile-fix | 2024-06-19 | 2 | wip;wip | DELETE |
| nft-timeline-add-animation | 2024-06-19 | 3 | WIP;WIP | DELETE |
| wagmi-update-bsae-endpoint | 2024-06-20 | 1 | Base Endpoint update | DELETE |
| wagmi-v2-upate-frame-src | 2024-06-20 | 1 | Update frame-src for wagmi v2 update | DELETE |
| wagmi-update-v2 | 2024-06-20 | 14 | WIP;Merge branch 'main' into wagmi-update-v2 | DELETE |
| drop-css-fix | 2024-06-21 | 334 | Headers css fix;wip | DELETE |
| subscriptions-no-tdh-2 | 2024-06-26 | 1 | Remove subscriptions sepolia chain | DELETE |
| szn-7-boost | 2024-06-26 | 3 | Merge branch 'main' into szn-7-boost;Merge branch 'main' into szn-7-boost | DELETE |
| wave-detailed | 2024-06-26 | 357 | wip;Merge branch 'main' into drop | DELETE |
| groups-wallets | 2024-06-26 | 5 | Merge branch 'main' into groups-wallets;wip | DELETE |
| subscriptions-no-tdh | 2024-06-26 | 7 | WIP;WIP | DELETE |
| prenodes-status-page | 2024-06-27 | 4 | WIP;WIP | DELETE |
| message-signing-tools | 2024-07-01 | 4 | WIP;WIP | DELETE |
| prenodes-updates-09-07 | 2024-07-09 | 1 | Prenode Updates | DELETE |
| groups-fixes | 2024-07-10 | 1 | wip | DELETE |
| pdf-viewer-fix | 2024-07-15 | 1 | PDF Viewer update | DELETE |
| fix-nft-image-18-07 | 2024-07-18 | 1 | Fix nft images | DELETE |
| minting-page-allow-no-ens | 2024-07-18 | 2 | WIP;Bug Fix to allow mint to wallets with no ens | DELETE |
| memes-manifold-minting | 2024-07-18 | 33 | WIP;WIP | DELETE |
| fix-nft-image-19-07 | 2024-07-19 | 1 | Fix nft image size | DELETE |
| fix-nft-image-19-07-2 | 2024-07-19 | 1 | More NFT images fixes | DELETE |
| minting-page-image | 2024-07-22 | 1 | Fix minting page image | DELETE |
| drops-correct-dont-change-2 | 2024-07-26 | 1 | . | DELETE |
| delegations-center-fix-26-07 | 2024-07-26 | 1 | Small fix in delegations center | DELETE |
| drop | 2024-07-26 | 1 | waves and drops init | DELETE |
| drop-2 | 2024-07-26 | 1 | waves and drops init | DELETE |
| drops-correct-dont-change | 2024-07-26 | 1501 | wip;wip | DELETE |
| drops-double | 2024-07-26 | 1501 | wip;wip | DELETE |
| drops-double-2 | 2024-07-26 | 1501 | wip;wip | DELETE |
| drops2 | 2024-07-26 | 1502 | waves and drops;wip | DELETE |
| drops-correct-dont-change-3 | 2024-07-26 | 2 | added level protection and warning about waves is alpha;waves and drops | DELETE |
| wave-info-txt-change | 2024-07-27 | 1 | vhanged info text level | DELETE |
| waves-level-30 | 2024-07-27 | 2 | changed latest to popular;reduced waves level protection to 30 | DELETE |
| nft-image-iframe-fix | 2024-07-29 | 1 | NFTImage iframe size fix | DELETE |
| waves-ui-fixes | 2024-08-01 | 3 | waves ui;waves ui fixes | DELETE |
| x-frame-options | 2024-08-07 | 1 | X-Frame-Options | DELETE |
| drops-external-links | 2024-08-09 | 1 | Drops - open external links in new tab | DELETE |
| burger-menu-z-index | 2024-08-09 | 1 | Fix burger menu z-index | DELETE |
| notifications-overlap-header-mobile-3 | 2024-08-09 | 1 | Fix notifications button and logo overlap in header | DELETE |
| followers-count | 2024-08-09 | 3 | level change;added loader | DELETE |
| desktop-app-page | 2024-08-14 | 10 | WIP;Refactor | DELETE |
| replies | 2024-08-14 | 29 | wip;Merge branch '14082024-1' into replies | DELETE |
| memes-minting-remove-beta | 2024-08-20 | 1 | Make Seize minting the default and manifold as backup | DELETE |
| minting-status-fix-20-08 | 2024-08-21 | 2 | Merge branch 'main' into minting-status-fix-20-08;Fix minting status | DELETE |
| duplicated-header-props | 2024-08-23 | 1 | removed duplicated header props | DELETE |
| fix-package-lock-26-08 | 2024-08-26 | 1 | Update package-lock | DELETE |
| app-capacitor-4 | 2024-08-26 | 2 | Merge branch 'main' into app-capacitor-4;Custom randomInt method | DELETE |
| app-capacitor-3 | 2024-08-26 | 2 | WIP;Revert previous change | DELETE |
| app-capacitor | 2024-08-26 | 20 | Merge branch 'main' into app-capacitor;WIP | DELETE |
| app-capacitor-2 | 2024-08-26 | 4 | WIP;WIP | DELETE |
| capacitor-share-fix | 2024-08-29 | 1 | Improve implementation of Capacitor share | DELETE |
| capacitor-share-fix-2 | 2024-08-29 | 1 | Only show custom share if Share is not implemented | DELETE |
| app-capacitor-5 | 2024-08-29 | 12 | Merge branch 'main' into app-capacitor-5;WIP | DELETE |
| emma-fixes | 2024-08-30 | 1 | Expands width for wide screens | DELETE |
| capacitor-scaling-swipe | 2024-08-30 | 10 | WIP;Merge branch 'main' into capacitor-scaling-swipe | DELETE |
| private-groups | 2024-09-02 | 1 | wip | DELETE |
| capacitor-video-autoplay | 2024-09-11 | 1 | Create new branch for capacitor video autoplay feature | DELETE |
| opensea-highest-bid | 2024-09-16 | 17 | WIP;WIP | DELETE |
| opensea-highest-bid-2 | 2024-09-17 | 1 | Highest offer - Bold values | DELETE |
| cb-test | 2024-09-18 | 17 | WIP;WIP | DELETE |
| openapi-fix | 2024-09-18 | 2 | Update package-lock;OpenAPI builds fix | DELETE |
| connect-auth | 2024-09-18 | 6 | WIP;Merge branch 'main' into connect-auth | DELETE |
| memes-calendar-1909 | 2024-09-19 | 2 | WIP;Implement Memes Seasonal Calendar page | DELETE |
| network-memebers-rename | 2024-09-27 | 1 | Rename dropdown item Network -> Members | DELETE |
| community-network-rename | 2024-09-27 | 13 | Merge branch 'main' into community-network-rename;Add back WaveOutcome.tsx | DELETE |
| cic-nic-community-top | 2024-09-30 | 3 | WIP;WIP | DELETE |
| tdh-rate-unit | 2024-10-02 | 1 | Add unit for NFTStats | DELETE |
| remove-nextgen-new | 2024-10-02 | 1 | Remove 'new' from nextgen | DELETE |
| mobile-push-notifications | 2024-10-03 | 54 | WIP;WIP | DELETE |
| capacitor-hide-widget-keyboard | 2024-10-04 | 1 | Hide widget when keyboard is open | DELETE |
| wave-improvements-3 | 2024-10-04 | 22 | wip;wip | DELETE |
| szn8-boosts | 2024-10-04 | 3 | WIP;WIP | DELETE |
| chat-reply-ui | 2024-10-06 | 4 | Merge branch 'main' into chat-reply-ui;chat reply multi-line fix | DELETE |
| remove-local-notifications | 2024-10-07 | 2 | WIP;Remove local notifications | DELETE |
| update-contact-us | 2024-10-10 | 1 | Update contact us | DELETE |
| lfg-slideshow | 2024-10-14 | 13 | Merge branch 'main' into lfg-slideshow;WIP | DELETE |
| lfg-slideshow-button-position | 2024-10-15 | 2 | WIP;LFG Slideshow button position | DELETE |
| lfg-all-collections | 2024-10-15 | 3 | WIP;WIP | DELETE |
| rank-approve | 2024-10-15 | 6 | wip;wip | DELETE |
| hide-footer | 2024-10-16 | 3 | WIP;WIP | DELETE |
| app-wave-ux-fixes | 2024-10-21 | 1 | app wave chat and about ux fixes | DELETE |
| syncing-models | 2024-10-29 | 2 | wip;wip | DELETE |
| 6529-apps-page | 2024-11-01 | 3 | WIP;WIP | DELETE |
| timezone-update-04-11 | 2024-11-04 | 1 | TZ update | DELETE |
| mobile-deep-link | 2024-11-04 | 31 | WIP;WIP | DELETE |
| qr-code-fix-06-11 | 2024-11-06 | 2 | Hide 'Mint on seize' button in iOS;Fix QR code label and close modal on escape | DELETE |
| timezone-fix-06-11 | 2024-11-06 | 2 | Merge branch 'main' into timezone-fix-06-11;Timezone fix | DELETE |
| minting-page-html | 2024-11-20 | 1 | Fix support of html on minting page | DELETE |
| s-6529 | 2024-11-21 | 3 | Removed 6529.io link from footer;Removed 6529.io link from footer | DELETE |
| minting-buttons | 2024-11-25 | 1 | Remove manifold minting button | DELETE |
| wp-migration | 2024-11-25 | 16 | WIP;WIP | DELETE |
| wp-migration-2 | 2024-11-25 | 2 | WIP;Remove wp public -  move to s3 | DELETE |
| next-sitemap | 2024-11-25 | 8 | WIP;Merge branch 'main' into next-sitemap | DELETE |
| 6529-new-header | 2024-11-27 | 7 | Merge branch 'main' into 6529-new-header;WIP | DELETE |
| rank-drops | 2024-12-08 | 197 | wip;wip | DELETE |
| memes-calendar-2025 | 2024-12-16 | 3 | WIP;WIP | DELETE |
| notification-reply-click-bugfix | 2024-12-17 | 2 | wip;wip | DELETE |
| feed-bottom-ip | 2024-12-18 | 4 | wip;wip | DELETE |
| ios-eula | 2024-12-27 | 7 | WIP;Merge branch 'main' into ios-eula | DELETE |
| wagmi-config-capacitor | 2025-01-02 | 1 | Wagmi Config capacitor | DELETE |
| ipfs-context-fix | 2025-01-03 | 1 | IPFS Context update | DELETE |
| szn9-boosts | 2025-01-03 | 1 | SZN9 BOOSTS | DELETE |
| ipfs-pfp-upload | 2025-01-03 | 14 | WIP;WIP | DELETE |
| ios-remove-subscriptions | 2025-01-05 | 2 | Merge branch 'main' into ios-remove-subscriptions;Remove subscriptions for iOS | DELETE |
| ipfs-media-src-fix | 2025-01-06 | 1 | Media Src fix - ipfs | DELETE |
| ios-marketplace-links | 2025-01-10 | 2 | WIP;Remove marketplaces links for ios | DELETE |
| mobile-app-wallets | 2025-01-10 | 25 | WIP;WIP | DELETE |
| capacitor-file-system | 2025-01-10 | 3 | WIP;WIP | DELETE |
| wallet-connect-fix-17-01 | 2025-01-17 | 12 | Merge branch 'main' into wallet-connect-fix-17-01;WIP | DELETE |
| single-drop-view-icon | 2025-01-24 | 8 | wip;Merge branch 'main' into single-drop-view-icon | DELETE |
| push-notifications-secure-storage | 2025-01-29 | 3 | Merge branch 'main' into push-notifications-secure-storage;WIP | DELETE |
| capacitor-qr-scanner | 2025-01-30 | 11 | WIP;WIP | DELETE |
| memelab-references-path-fix | 2025-02-03 | 2 | WIP;MemeLab References link path fix | DELETE |
| capacitor-disable-background | 2025-02-10 | 5 | WIP;Disable refetchIntervalInBackground if capacitor | DELETE |
| follow-btn-ui-fix | 2025-02-27 | 5 | modified spacings between posts;made code simplier | DELETE |
| create-wave-rolling | 2025-03-04 | 14 | wip;wip | DELETE |
| qr-modal_seize-conection | 2025-03-06 | 9 | WIP;WIP | DELETE |
| auth-cookies-10-03 | 2025-03-10 | 1 | Retry for redeem refresh token + cookie options | DELETE |
| wave-notification-settings | 2025-03-11 | 17 | WIP;WIP | DELETE |
| rolling-wave | 2025-03-11 | 93 | wip;wip | DELETE |
| electron-specific-updates | 2025-03-12 | 1 | Electron specific UI updates | DELETE |
| following-waves-fix-12-03 | 2025-03-12 | 1 | WIP | DELETE |
| footer-separator | 2025-03-12 | 1 | WIP | DELETE |
| qr-border-white | 2025-03-14 | 1 | Add border to qr modal | DELETE |
| push-notifications-read-all-delivered | 2025-03-14 | 3 | WIP;WIP | DELETE |
| mobile-scroll-seizure | 2025-03-17 | 1 | Fix: Respect user scroll intention after posting a new drop | DELETE |
| emoji-keyboard | 2025-03-18 | 19 | WIP;WIP | DELETE |
| android-optimizations-2 | 2025-03-18 | 2 | WIP;Android Opt 2 | DELETE |
| android-optimizations | 2025-03-18 | 20 | JWT Expiry;WIP | DELETE |
| emojis-extended | 2025-03-19 | 2 | WIP;Emoji order and custom category icon | DELETE |
| qol-20-03 | 2025-03-20 | 12 | WIP;WIP | DELETE |
| emoji-mobile-scroll-fix | 2025-03-21 | 1 | Fix emoji scolling on phone | DELETE |
| notification-filters-padding-fix | 2025-03-24 | 1 | Notification Filter padding fix | DELETE |
| notification-filters-padding-fix-2 | 2025-03-24 | 1 | Notifications filter padding on mobile | DELETE |
| szn10-boosts | 2025-03-24 | 1 | SZN10 Boosts | DELETE |
| notification-filters | 2025-03-24 | 11 | Merge branch 'main' into notification-filters;WIP | DELETE |
| direct-messages | 2025-03-24 | 17 | WIP;Merge branch 'main' into direct-messages | DELETE |
| drop-timestamp-locale-25-03 | 2025-03-25 | 5 | WIP;Drop header timestamp | DELETE |
| winners-drop-fix | 2025-03-25 | 5 | wip;wip | DELETE |
| 2604-7 | 2025-03-26 | 307 | wip;Merge branch 'rolling-wave-memes' into 2604-7 | DELETE |
| wave-count-bubbles-fix | 2025-03-27 | 1 | fixed sidebar waves bubbles count bug | DELETE |
| change-6529-dot-io | 2025-03-27 | 14 | WIP;Merge branch 'main' into change-6529-dot-io | DELETE |
| memes-wave-id-setting | 2025-03-27 | 2 | WIP;Memes Wave ID setting | DELETE |
| szn11-stream-ux-ui | 2025-03-27 | 6 | Merge branch 'scroll-wont-stop-bug' into szn11-stream-ux-ui;wip | DELETE |
| wave-drop-width-fix-28-03 | 2025-03-28 | 1 | Limit wave drop max width | DELETE |
| memes-wave-settings | 2025-03-28 | 1 | setting | DELETE |
| brain-fix-prxt-28-03 | 2025-03-28 | 6 | WIP;Merge branch 'main' into brain-fix-prxt-28-03 | DELETE |
| brain-image-button-positions | 2025-04-01 | 1 | Brain images - Button Positions | DELETE |
| memes-calendar-szn11 | 2025-04-01 | 1 | Memes calendar szn11 | DELETE |
| memes-minting-dates-global-timezones | 2025-04-02 | 1 | Global timezones from minting date times | DELETE |
| drop-preview | 2025-04-02 | 3 | Merge branch 'main' into drop-preview;WIP | DELETE |
| szns-to-search-fix | 2025-04-04 | 1 | Added snzs 10, 11 for user page collected | DELETE |
| render-paragraph-src-fix | 2025-04-04 | 1 | In chat images | DELETE |
| upload-multipart | 2025-04-04 | 12 | Merge branch 'main' into upload-multipart;WIP | DELETE |
| 6529-capital | 2025-04-04 | 8 | Merge branch 'main' into 6529-capital;WIP | DELETE |
| meme-phases-timezones | 2025-04-07 | 1 | Memes Phases timezones | DELETE |
| gif-picker | 2025-04-07 | 13 | Merge branch 'main' into gif-picker;Merge branch 'main' into gif-picker | DELETE |
| unused-imports-08-04 | 2025-04-08 | 1 | Unused imports | DELETE |
| waves-list-websockets-2 | 2025-04-08 | 3 | if wave not in list, add it;Merge branch 'main' into waves-list-websockets-2 | DELETE |
| notifications-rework | 2025-04-11 | 1 | WIP | DELETE |
| brain-notifications-read-unread | 2025-04-11 | 5 | WIP;WIP | DELETE |
| tweet-embed-add-helper-links | 2025-04-15 | 2 | Merge branch 'main' into tweet-embed-add-helper-links;Add helper links for tweet embed | DELETE |
| migrate-authcookies-localstorage | 2025-04-16 | 10 | WIP;WIP | DELETE |
| open-in-mobile-btn | 2025-04-16 | 13 | WIP;WIP | DELETE |
| navigation-test | 2025-04-16 | 2 | WIP;In app navigation | DELETE |
| wave-messages-websocket | 2025-04-16 | 44 | Merge branch 'main' into wave-messages-websocket;wip | DELETE |
| art-submission-thumbnail | 2025-04-17 | 1 | wip | DELETE |
| tailwind-upgrade | 2025-04-21 | 6 | wip;header tw: | DELETE |
| version-change-check | 2025-04-23 | 2 | wip;checking is version changed | DELETE |
| breadcrumbs-fixes | 2025-04-23 | 7 | Merge branch 'main' into breadcrumbs-fixes;wip | DELETE |
| profile-subscriptions-pagination | 2025-04-25 | 1 | Pagination for subscription tab in profiles | DELETE |
| fix-cic-rep-all | 2025-04-28 | 1 | fix | DELETE |
| remove-wp-header | 2025-04-28 | 1 | Remove WP header | DELETE |
| delegation-center-nav-fix | 2025-04-28 | 3 | Merge branch 'main' into delegation-center-nav-fix;WIP | DELETE |
| appsidebar-qr-scanner | 2025-05-05 | 8 | WIP;WIP | DELETE |
| mobile-page-header-nfts | 2025-05-06 | 2 | Add twitter media src;Add page header for mobile for our nfts | DELETE |
| gif-disable-scaling | 2025-05-07 | 1 | Disable scaling for gif | DELETE |
| update-marketplace-links | 2025-05-08 | 2 | WIP;Update marketplace links | DELETE |
| delegation-center-navigation | 2025-05-09 | 1 | Delegation Center Navigation fix | DELETE |
| memelab-tab-grid | 2025-05-09 | 1 | Fix grid of memelab in Memes pages | DELETE |
| fontawesome-replace | 2025-05-09 | 1 | Replace fontawesome icons | DELETE |
| code-cleanup-0905 | 2025-05-09 | 3 | Merge branch 'main' into code-cleanup-0905;WIP | DELETE |
| nfts-loop-rewrite | 2025-05-09 | 9 | WIP - android notifications;Merge branch 'main' into nfts-loop-rewrite | DELETE |
| ssr-revisited-fix | 2025-05-16 | 1 | Fix null ogImage | DELETE |
| dms-view | 2025-05-16 | 1 | wip | DELETE |
| app-to-layout | 2025-05-16 | 2 | wip;wip | DELETE |
| ssr-revisited | 2025-05-16 | 22 | Merge branch 'main' into ssr-revisited;WIP | DELETE |
| nft-navigation | 2025-05-16 | 4 | WIP;WIP | DELETE |
| codex/add-missing-aria-labels-to-component | 2025-05-18 | 1 | Add aria-label to delegation close button icon | DELETE |
| codex/fix-duplicate-word-in-sentence | 2025-05-18 | 1 | Fix typo in Pigments page | DELETE |
| codex/write-jest-tests-for-memepageactivity-filtering-and-paginati | 2025-05-18 | 1 | test: add MemePageActivity coverage | DELETE |
| codex/write-unit-tests-for-waves-and-waveslist-components | 2025-05-18 | 1 | test: add waves components tests | DELETE |
| codex/write-jest-tests-for-memepagelive | 2025-05-18 | 1 | test: cover MemePageLive sorting and refresh | DELETE |
| codex/write-jest-tests-for-usewavepagination-hook | 2025-05-18 | 1 | test: cover useWavePagination | DELETE |
| codex/add-jest-unit-tests-for-wave-validation-functions | 2025-05-18 | 1 | test: cover wave helpers | DELETE |
| codex/write-jest-tests-for-tab-navigation-in-memepage | 2025-05-18 | 1 | test: meme page tab navigation | DELETE |
| codex/add-missing-aria-label-for-accessibility | 2025-05-19 | 2 | Merge branch 'main' into codex/add-missing-aria-label-for-accessibility;Add aria label to add search wallet button | DELETE |
| codex/add-missing-aria-label-in-tsx-component | 2025-05-19 | 2 | Merge branch 'main' into codex/add-missing-aria-label-in-tsx-component;Add aria-label for edit profile picture button | DELETE |
| codex/fix-accessibility-issue-in-react-component-fl1dd3 | 2025-05-19 | 3 | Merge branch 'main' into codex/fix-accessibility-issue-in-react-component-fl1dd3;wip | DELETE |
| memes-chat-link-about-memes | 2025-05-20 | 1 | Memes chat link in /about/the-memes | DELETE |
| remove-test-from-build | 2025-05-20 | 1 | Remove tests from build | DELETE |
| codex/write-jest-tests-for-memepagemintcountdown | 2025-05-20 | 3 | wip;Merge branch 'main' into codex/write-jest-tests-for-memepagemintcountdown | DELETE |
| recent-tdh-history | 2025-05-20 | 7 | WIP;WIP | DELETE |
| codex/add-progresschart-component-above-table | 2025-05-20 | 9 | Merge branch 'main' into codex/add-progresschart-component-above-table;WIP | DELETE |
| remove-react-pdf | 2025-05-21 | 4 | WIP;WIP | DELETE |
| app-connect-debug | 2025-05-23 | 1 | App Connect | DELETE |
| deploy-empty-commit-23-05 | 2025-05-23 | 1 | Empty commit for testing deployment | DELETE |
| update-eb-env-name | 2025-05-23 | 2 | Merge branch 'main' into update-eb-env-name;Update elastic beanstalk env name | DELETE |
| codex/run-startup-script-with-arguments | 2025-05-24 | 1 | test: add AppWalletImport tests | DELETE |
| codex/run-start.sh-script-with-argument-4 | 2025-05-24 | 4 | test: add coverage for AppWalletAvatar;wip | DELETE |
| codex/run-start.sh-script-with-argument-3 | 2025-05-24 | 5 | test: add coverage for select menu and app wallets;test: add coverage for AppWalletAvatar (#903) | DELETE |
| codex/improve-test-coverage | 2025-05-26 | 42 | test: cover my stream wave components (#943);test: add coverage for random holders selection (#942) | DELETE |
| scz7v6-codex/improve-test-coverage | 2025-05-26 | 42 | test: cover my stream wave components (#943);test: add coverage for random holders selection (#942) | DELETE |
| zudqby-codex/improve-test-coverage | 2025-05-26 | 44 | test: add coverage for snapshot modal and sidebar step (#945);test: add build phase table body and row tests (#944) | DELETE |
| 860rue-codex/improve-test-coverage | 2025-05-26 | 51 | test: add coverage for download components and distribution plan;test: add MapDelegationsForm tests (#951) | DELETE |
| codex/follow-coverage-improvement-process | 2025-05-28 | 230 | test: add coverage for museum pages and utilities;test: add coverage for wave helpers (#1152) | DELETE |
| codex/follow-coverage-improvement-steps | 2025-05-28 | 237 | test: add coverage for museum pages and utilities (#1158);test: add comprehensive coverage for user and wave components (#1157) | DELETE |
| codex/write-tests-for-specified-files | 2025-05-28 | 265 | test: fix EMMA page dynamic rendering test;test: add coverage for museum pages and validation hooks (#1180) | DELETE |
| cbedvl-codex/write-tests-for-multiple-components-and-hooks | 2025-05-28 | 271 | wip;test: add coverage for museum and open data pages (#1187) | DELETE |
| revised-ios-us | 2025-06-02 | 20 | WIP;Merge branch 'main' into revised-ios-us | DELETE |
| deep-link-navigation-debug | 2025-06-02 | 4 | WIP;WIP | DELETE |
| drop-reactions | 2025-06-03 | 36 | WIP;WIP | DELETE |
| drop-mentions-alignment | 2025-06-04 | 1 | Fix alignment for mentions in drops | DELETE |
| reactions-tooltip-id-fix | 2025-06-04 | 1 | Fix reactions tooltip ids | DELETE |
| reactions-touch-interaction | 2025-06-04 | 2 | WIP;WIP | DELETE |
| drop-traits-rework | 2025-06-06 | 1 | Drop Traits | DELETE |
| drop-traits-reorder | 2025-06-06 | 4 | WIP;WIP | DELETE |
| codex/update-agents.md-with-clean-code-standards | 2025-06-10 | 1 | docs: clarify clean code standards | DELETE |
| ttadun-codex/update-agents.md-with-signed-off-by | 2025-06-10 | 1 | docs: clarify DCO sign-off requirements | DELETE |
| codex/update-agents.md-with-coding-conventions | 2025-06-10 | 1 | docs: clarify SonarQube clean code standard | DELETE |
| codex/update-agents.md-with-signed-off-by | 2025-06-10 | 1 | docs: require commit sign-off | DELETE |
| codex/fix-typo--cryptocurrecny--in-index.tsx | 2025-06-10 | 1 | fix: correct cryptocurrency typo | DELETE |
| luh0g3-codex/fix-typo--cryptocurrecny--in-index.tsx | 2025-06-10 | 1 | fix: correct cryptocurrency typo | DELETE |
| codex/correct-spelling-in-globals.scss | 2025-06-10 | 1 | fix: correct typo in global styles | DELETE |
| uetuko-codex/correct-spelling-in-globals.scss | 2025-06-10 | 1 | fix: correct typo in global styles | DELETE |
| codex/fix-typo-in-globals.scss | 2025-06-10 | 1 | fix: correct typo in globals style | DELETE |
| codex/fix-typos-in-globals.scss-and-education-collaboration-form | 2025-06-10 | 1 | fix: correct typos in styles and form page | DELETE |
| rxe39e-codex/fix-typos-in-globals.scss-and-education-collaboration-form | 2025-06-10 | 1 | fix: correct typos | DELETE |
| codex/modify-usecapacitor-to-store-listener-handle | 2025-06-10 | 1 | fix: manage capacitor listeners cleanup | DELETE |
| agents-md-commit-sign-off | 2025-06-10 | 1 | Sign off agents.md | DELETE |
| codex/update-import-in-drop-hasher-test | 2025-06-10 | 1 | test: fix DropHasher import path | DELETE |
| codex/add-dco-signature-guideline-to-agents.md | 2025-06-10 | 2 | docs: clarify DCO requirements in AGENTS;docs: clarify DCO requirements in AGENTS | DELETE |
| use-capacitor-listener-cleanup | 2025-06-10 | 2 | WIP;Fix capacitor listener cleanup | DELETE |
| codex/add-link-preview-with--link-preview-js | 2025-06-10 | 3 | Merge branch 'main' into codex/add-link-preview-with--link-preview-js;fix: update link preview types | DELETE |
| meme-calendar-szn12 | 2025-06-11 | 4 | WIP;WIP | DELETE |
| single-drop-download-media | 2025-06-12 | 3 | WIP;Merge branch 'main' into single-drop-download-media | DELETE |
| meme-current-season-end-fix | 2025-06-13 | 1 | Fix current season end | DELETE |
| meme-participatipation-drop-reactions | 2025-06-13 | 1 | Meme Participation drop reactions | DELETE |
| meme-calendar-active-section-fix | 2025-06-13 | 1 | Memes Calendar - Active Section adjustment | DELETE |
| codex/document-next.js-dual-structure-with-metadata-setup | 2025-06-25 | 57 | docs: add nextjs app routing info;WIP | DELETE |
| szn11-boosts | 2025-06-26 | 4 | Merge branch 'main' into szn11-boosts;Merge branch 'main' into szn11-boosts | DELETE |
| codex/migrate-tests-from-/pages/about-to-/app/about | 2025-06-30 | 66 | test: migrate about page tests to app router;WIP - Test fixes | DELETE |
| tpaxcs-codex/migrate-tests-from-/pages/about-to-/app/about | 2025-06-30 | 66 | test: migrate about page tests to app router;WIP - Test fixes | DELETE |
| app-layout-version-meta | 2025-07-07 | 2 | WIP;App Layout version meta | DELETE |
| app-migration | 2025-07-07 | 84 | WIP;WIP | DELETE |
| ui-fixes-09-07 | 2025-07-09 | 5 | Empty commit;WIP | DELETE |
| ui-fixes-10-07 | 2025-07-10 | 1 | UI Fix - Memes sort | DELETE |
| capacitor-package-updates | 2025-07-14 | 2 | WIP;Capacitor package updates | DELETE |
| qr-scanner-nav | 2025-07-14 | 2 | WIP;QR Scanner Navigation | DELETE |
| header-share-search-params | 2025-07-15 | 3 | Merge branch 'main' into header-share-search-params;Merge branch 'main' into header-share-search-params | DELETE |
| capacitor-middleware-rewrites | 2025-07-15 | 3 | WIP;WIP | DELETE |
| codex/update-query-string-to-use-enum-keys | 2025-07-16 | 10 | WIP;WIP | DELETE |
| capacitor-deeplinks-pushnotif | 2025-07-16 | 13 | WIP;WIP | DELETE |
| wagmi-config-test | 2025-07-16 | 2 | WIP;Wagmi config test | DELETE |
| ly2ed6-codex/migrate-specified-pages-to-/app-directory | 2025-07-17 | 2 | Merge branch 'main' into ly2ed6-codex/migrate-specified-pages-to-/app-directory;fix: address sonar test warnings | DELETE |
| codex/migrate-specified-pages-to-/app-directory | 2025-07-17 | 3 | Merge branch 'main' into codex/migrate-specified-pages-to-/app-directory;fix: clean up mapping tool pages | DELETE |
| zayhyz-codex/migrate-specified-pages-to-/app-directory | 2025-07-18 | 5 | WIP;WIP | DELETE |
| m3qfr2-codex/migrate-static-wordpress-pages-to-/app | 2025-07-21 | 1 | chore: add signoff | DELETE |
| codex/continue-migration-of-/pages-to-/app | 2025-07-21 | 18 | fix: remove site suffix from migrated education pages;WIP | DELETE |
| codex/migrate-/pages/tools-to-/app | 2025-07-22 | 15 | Merge branch 'app-wp-migration-2' into codex/migrate-/pages/tools-to-/app;WIP - tests fix | DELETE |
| text-selection-double-click | 2025-07-23 | 7 | wip;wip | DELETE |
| profile-page-social-links | 2025-08-06 | 1 | wip | DELETE |
| web3modal-wagmi-removal | 2025-08-11 | 56 | wip;wip | DELETE |
| metamask-bisect | 2025-08-11 | 57 | wip;wip | DELETE |
| mobile-1 | 2025-08-11 | 59 | wip;wip | DELETE |
| mobile-2 | 2025-08-11 | 63 | wip;wip | DELETE |
| mobile-3 | 2025-08-12 | 65 | wip;wip | DELETE |
| tdh-rate-link | 2025-08-26 | 4 | wip;wip | DELETE |
| user-brain-params-fix | 2025-09-03 | 3 | Merge branch 'main' into user-brain-params-fix;WIP | DELETE |
| video-download-btn | 2025-09-08 | 7 | wip;wip | DELETE |
| codex/set-up-husky-and-lint-staged | 2025-09-16 | 1 | chore: add husky pre-commit workflow | DELETE |
| codex/implement-open-graph-metadata-fetching | 2025-09-16 | 1 | feat: add open graph metadata route | DELETE |
| codex/add-opengraphpreview-component-features | 2025-09-16 | 1 | feat: add OpenGraph preview component | DELETE |
| codex/add-youtube-oembed-proxy-endpoint | 2025-09-16 | 1 | feat: add youtube oembed proxy | DELETE |
| codex/add-fetchyoutubepreview-with-caching | 2025-09-16 | 1 | feat: add youtube preview api service | DELETE |
| codex/add-youtube-preview-component | 2025-09-16 | 1 | feat: add YouTube preview component | DELETE |
| codex/refactor-commonfiltertargetselect-component | 2025-09-16 | 1 | feat: improve filter target accessibility | DELETE |
| codex/refactor-tooltipiconbutton-component | 2025-09-16 | 1 | feat: improve tooltip icon button accessibility | DELETE |
| codex/replace-static-import-with-dynamic-loading | 2025-09-16 | 1 | feat: lazy load tweet embeds | DELETE |
| codex/replace-console.log-with-onprimaryerror-callback | 2025-09-16 | 1 | fix: add primary error callback to fallback image | DELETE |
| codex/add-rel-attributes-to-target-blank-links | 2025-09-16 | 1 | fix: add rel security attributes | DELETE |
| codex/update-viewport-settings-for-zoom | 2025-09-16 | 1 | fix: allow pinch zoom in app viewport | DELETE |
| codex/replace-div-with-button-in-dateaccordion | 2025-09-16 | 1 | fix: improve DateAccordion header accessibility | DELETE |
| codex/refactor-notfound-component-for-navigation | 2025-09-16 | 1 | fix: improve not found navigation | DELETE |
| codex/add-labels-and-tests-to-timepicker | 2025-09-16 | 1 | fix: improve TimePicker accessibility | DELETE |
| codex/improve-performance-of-memepage-component | 2025-09-16 | 1 | fix: optimize meme page performance | DELETE |
| codex/improve-page-performance-and-efficiency | 2025-09-16 | 1 | perf: optimize memes listing performance | DELETE |
| codex/remove-cookie-management-from-codebase | 2025-09-16 | 1 | refactor: remove wallet cookie migration | DELETE |
| codex/lazy-load-and-optimize-nft-images | 2025-09-18 | 3 | WIP;Merge branch 'main' into codex/lazy-load-and-optimize-nft-images | DELETE |
| codex/add-pepe.wtf-handling-to-external-url-module | 2025-09-18 | 3 | wip;wip | DELETE |
| codex/create-environment-variable-management | 2025-09-23 | 6 | WIP;Merge branch 'main' into codex/create-environment-variable-management | DELETE |
| centralised-environment-config | 2025-09-25 | 17 | WIP;WIP | DELETE |
| env-vars-next-config | 2025-09-25 | 7 | WIP;WIP - Preload if assets from s3 | DELETE |
| block-picker-fix | 2025-09-26 | 8 | WIP;WIP | DELETE |
| codex/implement-nft-picker | 2025-09-30 | 5 | wip;wip | DELETE |
| codex/replace-relative-imports-with-path-alias-x03bvy | 2025-10-02 | 1 | chore: replace deep relative imports with alias | DELETE |
| fix-package-lock-02-10-25 | 2025-10-02 | 1 | Fix package-lock | DELETE |
| the-memes-loading-optimizations | 2025-10-02 | 16 | WIP - SZN13;Merge branch 'main' into the-memes-loading-optimizations | DELETE |
| restore-upcoming-meme-page | 2025-10-02 | 3 | WIP;WIP | DELETE |
| next-links-alias-imports | 2025-10-02 | 9 | WIP;WIP | DELETE |
| delegation-center-width-fix | 2025-10-03 | 1 | Delegation Center width fix | DELETE |
| more-a-to-next-link | 2025-10-03 | 4 | WIP;WIP | DELETE |
| ws-reconnect | 2025-10-08 | 1 | wip | DELETE |
| light-dark-theme | 2025-10-09 | 1 | Light Dark theme | DELETE |
| szn12-boosts-tdh1.4 | 2025-10-09 | 19 | WIP;WIP | DELETE |
| evolvecoder-auto/1-do-a-detailed-review-of-Agents-md-20251013-211343 | 2025-10-13 | 2 | EvoCoder iteration 2;EvoCoder iteration 1 | DELETE |
| new-desktop-layout | 2025-10-21 | 143 | wip;Merge branch 'main' into new-desktop-layout | DELETE |
| unified-search | 2025-10-27 | 18 | WIP;WIP | DELETE |
| meme-minting-timezones-followup | 2025-10-29 | 6 | WIP;Merge branch 'main' into meme-minting-timezones-followup | DELETE |
| chat-jump | 2025-11-01 | 6 | wip;wip | DELETE |
| transfer-nfts | 2025-11-05 | 103 | WIP;WIP | DELETE |
| app-keyboard-bug-fixes | 2025-11-07 | 1 | wip | DELETE |
| disable-rum | 2025-11-14 | 1 | wip | DELETE |
| internal-ssr-rate-limit | 2025-11-18 | 30 | WIP;WIP | DELETE |
| better-error-handlers-2 | 2025-11-19 | 29 | WIP;WIP | DELETE |
| fix-common-api-error | 2025-11-21 | 2 | WIP;Fix common api error thrown | DELETE |
| fix-common-api-error-reject-promise | 2025-11-21 | 2 | WIP;Fix common API error with promise reject | DELETE |
| next-images-remote-patterns | 2025-11-28 | 1 | Use remote patterns over domains in next config images | DELETE |
| b-17645968483 | 2025-12-01 | 1 | Reduced Sentry tracesSampleRate from 1 to 0.1 | DELETE |
| packages-sentry-updates-01-12 | 2025-12-01 | 12 | WIP;WIP | DELETE |
| sentry-03-12 | 2025-12-03 | 1 | Sentry issues | DELETE |
| sentry-03-12-2 | 2025-12-03 | 18 | WIP;WIP | DELETE |
| manifold-minting-description-clamping | 2025-12-03 | 2 | WIP;Manifold minting conditional description clamping | DELETE |
| sentry-client | 2025-12-03 | 2 | WIP;Sentry Client config | DELETE |
| xTDH-beta-badge | 2025-12-04 | 256 | wip;Merge branch 'main' into xTDH | DELETE |
| xtdh-responsiveness | 2025-12-05 | 291 | wip;wip | DELETE |
| szn-filter-grid-fix | 2025-12-12 | 1 | Fix szn filters in user page collected | DELETE |
| upcoming-subs-fix | 2025-12-12 | 8 | WIP;WIP | DELETE |
| update-react-next | 2025-12-15 | 1 | Update React and Nextjs | DELETE |
| alchemy-failover-backend-proxy | 2025-12-16 | 18 | Merge branch 'main' into alchemy-failover-backend-proxy;WIP | DELETE |
| tdh-rework | 2025-12-16 | 4 | Merge branch 'main' into tdh-rework;WIP | DELETE |
| sentry-04-12 | 2025-12-17 | 12 | WIP;Merge branch 'main' into sentry-04-12 | DELETE |
| notifications-unify-pfp | 2025-12-17 | 7 | WIP;WIP | DELETE |
| capacitor-sentry-18-12 | 2025-12-18 | 1 | Capacitor sentry fix | DELETE |
| multi-subscriptions | 2025-12-19 | 89 | WIP;WIP | DELETE |
| notifications-rework-2 | 2025-12-30 | 14 | WIP;WIP | DELETE |
| unread-divider-fix | 2025-12-31 | 7 | Merge branch 'main' into unread-divider-fix;WIP | DELETE |
| open-data-search | 2026-01-02 | 2 | WIP;Search open data pages | REVIEW |
| distribution-photos-direct-s3-upload | 2026-01-05 | 8 | WIP;WIP | REVIEW |
| text-grab-fix | 2026-01-08 | 1 | wip | REVIEW |
| leve-size-revert | 2026-01-09 | 1 | Revert level sizes | REVIEW |
| community-members-xtdh | 2026-01-09 | 21 | Merge branch 'main' into community-members-xtdh;WIP | REVIEW |
| reactions-dialog | 2026-01-09 | 6 | Merge branch 'main' into reactions-dialog;WIP | REVIEW |
| clean-scripts | 2026-01-13 | 2 | Merge branch 'main' into clean-scripts;wip | REVIEW |
| designated-payee | 2026-01-13 | 4 | WIP;WIP | REVIEW |
| meme-submissions-additional-fields | 2026-01-13 | 7 | Merge branch 'main' into meme-submissions-additional-fields;Merge branch 'main' into meme-submissions-additional-fields | REVIEW |
| toggle-drop-links-preview | 2026-01-14 | 7 | WIP;WIP | REVIEW |
| meme-submission-promo-video | 2026-01-15 | 5 | WIP;Merge branch 'main' into meme-submission-promo-video | REVIEW |
| leaderboard-image-optimizations | 2026-01-19 | 18 | Merge branch 'main' into leaderboard-image-optimizations;WIP | REVIEW |
| cic-rep-notifications | 2026-01-20 | 17 | Merge branch 'main' into cic-rep-notifications;WIP | REVIEW |
| temp-disable-pull-to-refresh | 2026-01-20 | 2 | WIP;Disable pull to refresh | REVIEW |
| homepage-ux-fixes | 2026-01-21 | 2 | wip;wip | REVIEW |
| hide-link-preview-all-links | 2026-01-21 | 3 | Merge branch 'main' into hide-link-preview-all-links;WIP | REVIEW |
| mobile-issues-21-01 | 2026-01-21 | 6 | WIP;WIP | REVIEW |
| evolvecoder-auto/Act-in-the-role-of-a-world-class-crypto--20260122-203558 | 2026-01-22 | 1 | evoticketresolver: apply ticket prompt | REVIEW |
| evolvecoder-auto/Fix-this-issue-in-a-way-consistent-with--20260122-214138 | 2026-01-22 | 1 | evoticketresolver: apply ticket prompt | REVIEW |
| evolvecoder-auto/Fix-this-issue-in-a-way-consistent-with--20260122-214253 | 2026-01-22 | 1 | evoticketresolver: apply ticket prompt | REVIEW |
| evolvecoder-auto/Fix-this-issue-in-a-way-consistent-with--20260122-214328 | 2026-01-22 | 1 | evoticketresolver: apply ticket prompt | REVIEW |
| evolvecoder-auto/Fix-this-issue-in-a-way-consistent-with--20260122-214434 | 2026-01-22 | 1 | evoticketresolver: apply ticket prompt | REVIEW |
| evolvecoder-auto/Fix-this-issue-in-a-way-consistent-with--20260122-214541 | 2026-01-22 | 1 | evoticketresolver: apply ticket prompt | REVIEW |
| evolvecoder-auto/Fix-this-issue-in-a-way-consistent-with--20260122-214637 | 2026-01-22 | 1 | evoticketresolver: apply ticket prompt | REVIEW |
| evolvecoder-auto/on-the-home-page-of-6529-io-and-possibly-20260122-204222 | 2026-01-22 | 1 | evoticketresolver: apply ticket prompt | REVIEW |
| touch-fix-scroll-to-unread-fix | 2026-01-22 | 11 | chore: retrigger checks;Merge branch 'main' into touch-fix-scroll-to-unread-fix | REVIEW |
| dismiss-new-unread-message-btn | 2026-01-23 | 10 | WIP;WIP | REVIEW |
| evolvecoder-auto/1-IA-user-cannot-select-text-or-reply-in-20260123-063328 | 2026-01-23 | 2 | Merge branch 'main' into evolvecoder-auto/1-IA-user-cannot-select-text-or-reply-in-20260123-063328;evoticketresolver: apply ticket prompt | REVIEW |
| evolvecoder-auto/can-you-figure-out-what-the-issue-is-and-20260122-230815 | 2026-01-23 | 2 | pr follow-up: remediation attempt 2;evoticketresolver: apply ticket prompt | REVIEW |
| mint-profile-selector | 2026-01-23 | 24 | WIP;WIP | REVIEW |
| manifold-minting-update-26-01 | 2026-01-26 | 1 | Remove remaining edition size if claim has ended | REVIEW |
| picture-fix | 2026-01-26 | 1 | wip | REVIEW |
| evolvecoder-auto/Fix-this-issue-in-a-way-consistent-with--20260122-214353 | 2026-01-26 | 2 | Merge branch 'main' into evolvecoder-auto/Fix-this-issue-in-a-way-consistent-with--20260122-214353;evoticketresolver: apply ticket prompt | REVIEW |
| collections-icon-update | 2026-01-27 | 1 | New Collections Icon | REVIEW |
| touch-devices-fix-24-01 | 2026-01-27 | 6 | Merge branch 'main' into touch-devices-fix-24-01;Merge branch 'main' into touch-devices-fix-24-01 | REVIEW |
| mobile-discover-tab | 2026-01-27 | 7 | Merge branch 'main' into mobile-discover-tab;WIP | REVIEW |
| next-mint-time | 2026-01-29 | 1 | Next mint time fix | REVIEW |
| github-allowlist-automation | 2026-01-29 | 7 | Merge branch 'main' into github-allowlist-automation;WIP | REVIEW |
| collapsible-drop | 2026-02-02 | 10 | WIP;WIP | REVIEW |
| group-notification-reactions | 2026-02-02 | 9 | WIP;WIP | REVIEW |
| link-previews-opimistic | 2026-02-03 | 1 | Disable link previews for temporary drops | REVIEW |
| my-votes-preview-image-2 | 2026-02-03 | 1 | Fix margin of myvotes image | REVIEW |
| my-votes-preview-media-type | 2026-02-03 | 2 | Merge branch 'main' into my-votes-preview-media-type;Adding preview image for 'My Votes', adding drop media type where applicable | REVIEW |
| my-votes-preview-image | 2026-02-03 | 3 | WIP;Merge branch 'main' into my-votes-preview-image | REVIEW |
| mobile-emoji-scroll | 2026-02-05 | 1 | Scroll in emoji picker on mobile | REVIEW |
| codex/fix-emoji-picker-scrolling-issue | 2026-02-05 | 2 | Fix mobile reaction picker closing when actions menu unmounts;Fix mobile emoji picker scrolling and close actions dialog | REVIEW |
| close-submission | 2026-02-09 | 3 | wip;Merge branch 'main' into close-submission | REVIEW |
| mint-for-me-profile-wallet-selection | 2026-02-11 | 8 | WIP;Merge branch 'main' into mint-for-me-profile-wallet-selection | REVIEW |
| b-17715865743 | 2026-02-13 | 3 | error toast for nic;your available rep/nic | REVIEW |
| rep-nic-limit-changes | 2026-02-13 | 3 | error toast for nic;your available rep/nic | REVIEW |
| meme-calendar-api | 2026-02-16 | 3 | WIP;WIP | REVIEW |
| delegation-expiry-fix | 2026-02-24 | 1 | Fix delegation expiry in Delegation Center | REVIEW |
| delegation-expiry-when-0 | 2026-02-26 | 1 | When delegation expiry is 0 consider it non-expiring | REVIEW |
| user-page-collected-network | 2026-02-26 | 2 | Merge branch 'main' into user-page-collected-network;User page collected - fix network query | REVIEW |
| stats-small-screen-position-fix | 2026-02-26 | 2 | WIP;Fix positioning of stats heart for small screens | REVIEW |
| prxtstaging | 2026-02-26 | 4 | WIP;Merge branch 'main' into lint-fix | REVIEW |
| lint-fix | 2026-02-26 | 7 | WIP;Merge branch 'main' into lint-fix | REVIEW |
| arweave-fallback-2 | 2026-03-02 | 3 | WIP;WIP | REVIEW |
| arweave-fallback-4 | 2026-03-02 | 3 | WIP;WIP | REVIEW |
| arweave-fallback | 2026-03-02 | 5 | WIP;WIP | REVIEW |
| eslint-imports | 2026-03-02 | 6 | WIP;WIP | REVIEW |
| arweave-fallback-3 | 2026-03-02 | 90 | Merge branch 'main' into arweave-fallback-3;Arweave fallback - more gateways | REVIEW |
| swiper-css-import-fix | 2026-03-03 | 2 | Merge branch 'main' into swiper-css-import-fix;Swiper css import fix | REVIEW |
| arweave-fallback-5 | 2026-03-03 | 2 | trigger coderabbit;Arweave Fallbacks fix | REVIEW |
| multi-profile-support | 2026-03-03 | 35 | Merge branch 'main' into multi-profile-support;WIP | REVIEW |
| central-ordinal-format | 2026-03-04 | 3 | WIP;WIP | REVIEW |
| multi-account-notifications | 2026-03-04 | 7 | Merge branch 'main' into multi-account-notifications;WIP | REVIEW |
| fix-account-switch-sync-thrash | 2026-03-05 | 3 | WIP;WIP | REVIEW |
| invalidate-notifications-after-read | 2026-03-05 | 3 | WIP;WIP | REVIEW |
| bottom-nav-icon-top-align | 2026-03-06 | 4 | WIP;WIP | REVIEW |
| sidebar-share-notifications | 2026-03-09 | 10 | WIP;WIP | REVIEW |
| reposition-search-desktop | 2026-03-09 | 5 | WIP;Merge branch 'main' into reposition-search-desktop | REVIEW |
| share-modal-update | 2026-03-10 | 14 | WIP;Merge branch 'main' into share-modal-update | REVIEW |
| manifold-migration | 2026-03-12 | 186 | WIP;Merge branch 'main' into manifold-migration | REVIEW |
| mint-phase-marketplaces | 2026-03-13 | 1 | Mint Phases time fix + marketplaces | REVIEW |
| nerd-unique-percent-rounding | 2026-03-13 | 1 | Nerd view - fix unique memes percent rounding | REVIEW |
| codex/implement-route-level-export-system-for-next.js | 2026-03-16 | 1 | Add route-level static export pipeline | REVIEW |
| codex/implement-route-level-export-system-for-next.js-ak9tit | 2026-03-16 | 1 | Add route-level static export pipeline | REVIEW |
| revert-2131-profile-small-ui-fixes | 2026-03-17 | 1 | Revert "icons ui changes (#2131)" | REVIEW |
| minting-claims-actions | 2026-03-17 | 32 | Merge branch 'main' into minting-claims-actions;Merge branch 'main' into minting-claims-actions | REVIEW |
| arweave-links-layout | 2026-03-23 | 7 | WIP;WIP | REVIEW |
| html-rendering-arweave | 2026-03-23 | 7 | WIP;WIP | REVIEW |
| build-fix-24-03-2 | 2026-03-24 | 1 | Build fix 2 | REVIEW |
| build-fix-24-03 | 2026-03-24 | 1 | Build fix | REVIEW |
| minting-page-standalone | 2026-03-24 | 59 | WIP;WIP | REVIEW |
| drop-forge-ipfs-animation-link-fix | 2026-03-24 | 7 | WIP;WIP | REVIEW |
| html-preview-fallback-fix | 2026-03-25 | 1 | Restore static preview-image fallback for html | REVIEW |
| drop-forge-launch-status-airdrop-cap | 2026-03-26 | 9 | WIP;WIP | REVIEW |
| fix-app-wallet-add-account-flow | 2026-03-27 | 3 | Merge branch 'main' into fix-app-wallet-add-account-flow;WIP | REVIEW |
| fix-calendar-fix-page-search | 2026-03-31 | 14 | WIP;WIP | REVIEW |
| build-error-0104-4 | 2026-04-01 | 2 | Revert selected files from last commit;Restore repository to pre-pnpm snapshot | REVIEW |
| subscribe-next-mint-2 | 2026-04-02 | 11 | WIP;WIP | REVIEW |
| next-mint-subscribe-fix | 2026-04-02 | 2 | WIP;Subscriptions visibility gating | REVIEW |
| media-type-and-mint-visibility | 2026-04-02 | 6 | WIP;WIP | REVIEW |
| pnpm-sfw | 2026-04-07 | 58 | Update docs for standalone staging and EB deploy flow;Remove obsolete EB runtime bandaid dependencies | REVIEW |
| fix-drop-actions-auth-gating | 2026-04-08 | 1 | Fix drop action auth gating | REVIEW |
| repo-scoped-6529-bootstrap | 2026-04-08 | 2 | WIP;Make 6529 bootstrap repo-scoped | REVIEW |
| latest-drop-sub-balance | 2026-04-08 | 7 | Merge branch 'main' into latest-drop-sub-balance;WIP | REVIEW |
| notifications-ipfs-avatar-fallback | 2026-04-08 | 7 | WIP;Merge branch 'main' into notifications-ipfs-avatar-fallback | REVIEW |
| curation-wave-groups | 2026-04-10 | 17 | wip;wip | REVIEW |
| subscriptions-redeemed-counts-csv | 2026-04-16 | 9 | WIP;WIP | REVIEW |
| pnpm-audit | 2026-04-17 | 14 | WIP;WIP | REVIEW |
| drop-forge-pay-artist | 2026-04-21 | 27 | WIP;WIP | REVIEW |
| create-wave-modal-changes | 2026-04-27 | 25 | wip;wip | REVIEW |
| drop-media-attachments | 2026-04-29 | 56 | Merge branch 'main' into drop-media-attachments;WIP | REVIEW |
| fix-eb-dangling-pnpm-symlinks | 2026-04-30 | 1 | Fix EB deploy bundle dangling pnpm symlinks | REVIEW |
| 6529-update | 2026-04-30 | 10 | WIP;WIP | REVIEW |
| attachment-preview-metadata-actions | 2026-04-30 | 4 | WIP;WIP | REVIEW |
| drop-preview-image-fallback | 2026-05-01 | 4 | WIP;WIP | REVIEW |
| fix-memes-html-media-badge | 2026-05-04 | 1 | Fix meme HTML media badge | REVIEW |
| drop-media-download-mobile | 2026-05-11 | 35 | Merge branch 'main' into drop-media-download-mobile;Merge branch 'main' into drop-media-download-mobile | REVIEW |
| pnpm-min-release-age | 2026-05-12 | 1 | PNPM Minimum Release Age | REVIEW |
| drop-votes-csv-download | 2026-05-12 | 10 | WIP;WIP | REVIEW |
| wave-picture-fallback-icon | 2026-05-12 | 3 | WIP;WIP | REVIEW |
| rememe-media-notification-fixes | 2026-05-13 | 4 | WIP;WIP | REVIEW |
| prxt-test-empty-pr | 2026-05-14 | 1 | Trigger PR | REVIEW |
| fix-drop-dates-display | 2026-05-14 | 3 | WIP;WIP | REVIEW |
| github-link-status-badges | 2026-05-14 | 8 | WIP;WIP | REVIEW |
| home-next-drop-wave-info | 2026-05-15 | 1 | Fix home next drop wave info and loading shift | REVIEW |
| next-16.2.6 | 2026-05-15 | 1 | Upgrade to next 16.2.6 | REVIEW |
| gamma-io-support | 2026-05-15 | 17 | Merge branch 'main' into gamma-io-support;Merge branch 'main' into gamma-io-support | REVIEW |
| batch-nft-balance-fetching | 2026-05-15 | 2 | WIP;Batch NFT balance lookups on collection grids | REVIEW |
| mobile-remove-login-requirement-150526 | 2026-05-18 | 5 | wip;Merge branch 'main' into mobile-remove-login-requirement-150526 | REVIEW |
| fix-wave-markdown-data-images | 2026-05-20 | 4 | WIP;Merge branch 'main' into fix-wave-markdown-data-images | REVIEW |
| notification-rating-context-rendering | 2026-05-20 | 7 | Merge branch 'main' into notification-rating-context-rendering;Merge branch 'main' into notification-rating-context-rendering | REVIEW |
| drop-inline-avatar | 2026-05-21 | 11 | Merge branch 'main' into drop-inline-avatar;WIP | REVIEW |
| media-gateway-html-ipfs | 2026-05-21 | 3 | Merge branch 'main' into media-gateway-html-ipfs;WIP | REVIEW |
| drop-inline-avatar-2 | 2026-05-22 | 11 | Merge branch 'main' into drop-inline-avatar-2;Merge branch 'main' into drop-inline-avatar-2 | REVIEW |
| chat-drops-not-clickable | 2026-05-22 | 3 | WIP;WIP | REVIEW |
| improve-vote-memes-tdh-design-220526 | 2026-05-22 | 5 | Merge branch 'main' into improve-vote-memes-tdh-design-220526;Merge branch 'main' into improve-vote-memes-tdh-design-220526 | REVIEW |
| fix-tweet-entity-crash | 2026-05-25 | 1 | Guard tweet entity enrichment | REVIEW |
| restore-notification-chat-drop-clicks | 2026-05-25 | 2 | WIP;Restore notification chat drop navigation | REVIEW |
| drop-metadata-limits | 2026-05-26 | 11 | Merge branch 'main' into drop-metadata-limits;Merge branch 'main' into drop-metadata-limits | REVIEW |
| drop-forge-craft-media-type-pills | 2026-05-26 | 11 | WIP;WIP | REVIEW |
| twitter-preview-card | 2026-05-26 | 17 | Merge branch 'main' into twitter-preview-card;WIP | REVIEW |
| profile-waves-feed-cards | 2026-05-28 | 14 | WIP;WIP | REVIEW |
| new-version-toast-update | 2026-05-28 | 8 | Merge branch 'main' into new-version-toast-update;WIP | REVIEW |
| fix-account-switch-auth-boundary | 2026-05-29 | 25 | WIP;WIP | REVIEW |
| x-quality-wallet-pagination-link-previews | 2026-06-02 | 9 | WIP;WIP | REVIEW |
