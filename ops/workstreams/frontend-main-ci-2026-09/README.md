# Main CI investigation — September 16, 2026

This is an incident snapshot at `a119efef56fb6b08db97588f7a1d6848b06e01ec`,
not a live gate report. The agreed scope is the current CI failure and recent
changes; legacy findings are recorded for separate follow-up. No Sonar issue
status, quality gate, baseline, exclusion, coverage floor, workflow or staging
configuration was changed.

## Confirmed Jest cause and limits

[Run 35099440185](https://github.com/6529-Collections/6529seize-frontend/actions/runs/35099440185)
checked out `d95f062e24b59d60c0e48f5344690606757d1308` and failed only
`native-surface-evidence.test.ts` / “fails the CLI when package prerequisites
are required but absent”. It reported `status: null`, not exit code 1.
The coverage-baseline step succeeded: the warning was coverage above the
baseline, not a coverage-floor failure.

[Run 35101438782](https://github.com/6529-Collections/6529seize-frontend/actions/runs/35101438782)
checked out `a119efef56fb6b08db97588f7a1d6848b06e01ec`; the full Jest suite and
coverage check succeeded. Git diff confirms that the test and
`ops/scripts/native-surface-evidence.cjs` are identical between those two heads.
Both files originated with the June 23 native-evidence contract; this is a
current intermittent test failure, not a proven recent script regression.

The confirmed defect is the test's dependence on the checkout and host:
`main()` calls `createNativeEvidence()`, which runs `adb version`,
`gradle --version`, `java -version`, and `xcodebuild -version` sequentially.
Each probe has a 5-second timeout, while the outer test allows 10 seconds for
the entire subprocess. Host tools can start SDK/Gradle infrastructure or stall
before the CLI reaches its exit decision. The test inherits host environment
and assumes that the real repository lacks package prerequisites.

A timeout is plausible, but **not proven**: the failed log did not record
`result.error`, its error code, or `result.signal`. A null exit status alone
cannot distinguish timeout, startup error, or external interruption. Do not
attribute this to a particular tool or to coverage instrumentation as fact.

The fix retains a real Node subprocess, real CLI parsing/probe logic, exit 1,
and the required error message. It uses temporary repository fixtures, an
empty PATH directory, and an explicit minimal child environment (retaining
SystemRoot where required on Windows). The missing-tool results are asserted.
All CLI cases share this isolation; a positive Electron-prerequisites fixture
also proves the gate is not simply forced to fail. Exit assertions include
error, signal, stdout and stderr. The 10-second limit is unchanged. The JSON
artifact test verifies simulation detection, output equivalence and path
redaction. Existing injected-runner unit tests retain the host-capability
classification coverage. Production probing and coverage settings are unchanged.

## Exact Sonar gate evidence

[Sonar main dashboard](https://sonarcloud.io/dashboard?id=6529-Collections_6529seize-frontend&branch=main)
analysis `72e89830-20ae-4df2-bc3f-17540d8ace09` at
`2026-09-16T13:22:47+0000` records the exact SHA above.

| Gate condition | Observed | Required |
| --- | --- | --- |
| Reliability on new code | C / 3 | A / 1 |
| Security on new code | C / 3 | A / 1 |
| Maintainability on new code | A / 1 | A / 1 |
| New duplicated lines | 0.6% | At most 3% |
| New security hotspots reviewed | 100% | 100% |

The supported Cloud issue filter is `sinceLeakPeriod=true`, with
`componentKeys=6529-Collections_6529seize-frontend`, `branch=main`,
`resolved=false`, `types=BUG,VULNERABILITY`, and `ps=500`. This returns exactly
70 findings, matching the measures: **43 BUGs (5 MAJOR, 38 MINOR) and 27
VULNERABILITY findings (22 MAJOR, 5 MINOR)**. `inNewCodePeriod=true` is not a
supported filter on this API and returned 80 overall findings instead; the ten
extra old bugs are not part of this failed new-code gate.

The five MAJOR bugs and 22 MAJOR vulnerability findings below determine the C
ratings. Every remaining MINOR finding also prevents an A rating. Resolving
only the major findings would leave B, not A. These are legacy type/severity
ratings (`new_reliability_rating`, `new_security_rating`), not ratings inferred
from the newer per-software-quality impact severities. See
[Sonar metric definitions](https://docs.sonarsource.com/sonarqube-cloud/digging-deeper/metric-definitions).

The new-code period is `previous_version`, starting
`2024-09-27T07:21:41+0000`. Analysis history reports `projectVersion: "not
provided"`; neither repository Sonar configuration supplies `sonar.projectVersion`.
This does not implement a meaningful recent-release boundary. It includes
findings with creation dates from April 2025 through September 2026; those
dates are Sonar metadata, not proof of which merge introduced a defect.
Automatic analysis reads `.sonarcloud.properties`; editing only
`sonar-project.properties` would not repair that setup.

### Recent changes versus older findings

- The only six inventory entries dated September are the September 13 artwork
  `S2245` findings. Each random value is consumed by colour, camouflage or
  opacity rendering. The rule explicitly concerns security contexts; these
  visual effects do not require cryptographic unpredictability. Preserve the
  artwork and propose issue-specific false-positive dispositions with the
  rationale below, rather than replacing randomness or excluding the file.
- The four Device Farm findings are on installation/sync lines introduced by
  `260f2ae3766` on July 5. Git blame and the September 12 cadence merge
  `a9eeae3303` confirm those lines were not introduced by the recent schedule
  change. They deserve a separate dependency/lifecycle review, not automatic
  dismissal. The Appium package is intentionally separate from the pnpm app;
  the mobile shell is another repository. Any future hardening must preserve
  required build steps and use its lockfile-installed Capacitor CLI.
- All five MAJOR reliability findings predate the recent changes. Four have
  concrete false-positive rationales below. The Sentry sample contains actual
  unreachable code after its intentional throw; removing the dead response is
  old cleanup, not a demonstrated new functional regression.
- Older accessibility findings include both propagation-only wrappers and
  genuine non-native click targets. They stay open for separate focused UI
  work. No claim is made that all old findings are false positives.

## Administrative decisions — not executed

1. **Approval requested:** mark only the six September artwork findings listed
   below as false positives, recording each visual-only data-flow rationale.
   The exact issue keys are `AaCYSxM5kcuVuZeQfqWX`, `AaCYSxM5kcuVuZeQfqWY`,
   `AaCYSxM5kcuVuZeQfqWZ`, `AaCYSxM5kcuVuZeQfqWa`, `AaCYSxM5kcuVuZeQfqWb`,
   and `AaCYSxM5kcuVuZeQfqWc`. This is a reviewed issue disposition, not a gate
   relaxation, and it cannot alone make main green.
2. **Separate policy decision:** replace the unmaintained version model only
   after agreeing the release cadence and ownership. A real release-version
   policy could retain `previous_version`; a continuous-delivery policy could
   use an explicitly approved rolling window. Sonar documents these options in
   [new-code definitions](https://docs.sonarsource.com/sonarqube-cloud/standards/about-new-code)
   and [configuration](https://docs.sonarsource.com/sonarqube-cloud/managing-your-projects/project-analysis/configuring-new-code-calculation).
   A shorter window moves unresolved findings into overall code; it does not
   fix them. Preserve this inventory and follow-up ownership before such a
   change. **No date reset, window length, version bump, or exclusion is
   proposed for immediate execution simply to turn this gate green.**
3. Older proposed false positives below are documented review candidates only.
   Contextual and hardening reviews are not dispositions. Apply no bulk
   resolution. Real legacy defects require separate fixes under the agreed
   recent-change scope.

Main's Sonar gate therefore remains unresolved by this test-only code change.
No new CI result is claimed; this investigation did not poll new PR checks.

## Complete gate inventory

Locations and creation dates are from the pinned analysis. All statuses were
open/unresolved in the snapshot. “Proposed false positive” records a source
review, not an applied Sonar transition. “Legacy ...” means retained for
follow-up, not accepted risk or a claim of safety. No exploitability is inferred
from a Sonar vulnerability label alone.

### MAJOR bugs — five contributors to Reliability C

| Issue key / rule | File:line | Created | Review / follow-up |
| --- | --- | --- | --- |
| `AZ9BFQSTqhIB65fl3Qpy` / `typescript:S6959` | `helpers/waves/wave-metadata.helpers.ts:344` | 2026-06-09 | **Proposed false positive.** Empty rows return null before reduce; nonempty array is guaranteed. |
| `AZ9BFQG3qhIB65fl3Qns` / `typescript:S7727` | `hooks/useMarkWaveNotificationsRead.requests.ts:212` | 2026-05-07 | **Proposed false positive.** Reducer accepts exactly two arguments; the extra index and array arguments are ignored. |
| `AZ9BFPMeqhIB65fl3QgY` / `typescript:S6523` | `components/header/share/HeaderQRScanner.tsx:137` | 2026-01-03 | **Proposed false positive.** Splitting a string on the nonempty literal ? always returns at least one string; the optional chain cannot short-circuit here. |
| `AZ9BFQMLqhIB65fl3Qoc` / `typescript:S1763` | `app/api/sentry-example-api/route.ts:13` | 2025-11-28 | **Legacy cleanup.** Unreachable response after deliberate Sentry probe throw; real dead code, not a new runtime regression. |
| `AZ9BFQFSqhIB65fl3Qnf` / `typescript:S6324` | `hooks/useSecureSign.ts:113` | 2025-08-25 | **Proposed false positive.** The null-byte regex intentionally rejects unsafe message content; deleting it would remove validation. |

### MAJOR vulnerability findings — 22 contributors to Security C

| Issue key / rule | File:line | Created | Review / follow-up |
| --- | --- | --- | --- |
| `AaCYSxM5kcuVuZeQfqWX` / `javascript:S2245` | `public/artwork/the-memes/445.html:736` | 2026-09-13 | **Recent proposed false positive.** Visual camouflage palette-index selection. No credential, authorization, winner selection, payment or secret depends on this random value. |
| `AaCYSxM5kcuVuZeQfqWY` / `javascript:S2245` | `public/artwork/the-memes/445.html:751` | 2026-09-13 | **Recent proposed false positive.** Visual camouflage neighbour-mixing probability. No credential, authorization, winner selection, payment or secret depends on this random value. |
| `AaCYSxM5kcuVuZeQfqWZ` / `javascript:S2245` | `public/artwork/the-memes/445.html:752` | 2026-09-13 | **Recent proposed false positive.** Visual camouflage neighbour colour selection. No credential, authorization, winner selection, payment or secret depends on this random value. |
| `AaCYSxM5kcuVuZeQfqWa` / `javascript:S2245` | `public/artwork/the-memes/445.html:766` | 2026-09-13 | **Recent proposed false positive.** Visual tattoo-colour probability. No credential, authorization, winner selection, payment or secret depends on this random value. |
| `AaCYSxM5kcuVuZeQfqWb` / `javascript:S2245` | `public/artwork/the-memes/445.html:981` | 2026-09-13 | **Recent proposed false positive.** Background palette-index selection. No credential, authorization, winner selection, payment or secret depends on this random value. |
| `AaCYSxM5kcuVuZeQfqWc` / `javascript:S2245` | `public/artwork/the-memes/445.html:982` | 2026-09-13 | **Recent proposed false positive.** Background opacity selection. No credential, authorization, winner selection, payment or secret depends on this random value. |
| `AZ9_pqjdRUrdlKBl_MBG` / `githubactions:S6505` | `.github/workflows/device-farm-qa.yml:166` | 2026-07-05 | **Legacy hardening review.** Lifecycle hooks remain enabled; inspect required hooks before disabling. Not introduced by September cadence changes. |
| `AZ9_pqjdRUrdlKBl_MBH` / `githubactions:S6505` | `.github/workflows/device-farm-qa.yml:311` | 2026-07-05 | **Legacy hardening review.** Mobile-shell install allows lifecycle hooks; review its separate dependency/build requirements. |
| `AZ9_pqjdRUrdlKBl_MBI` / `githubactions:S6505` | `.github/workflows/device-farm-qa.yml:329` | 2026-07-05 | **Legacy hardening review.** Use the lockfile-installed Capacitor executable to fail closed without an on-demand package fallback. |
| `AZ9_pqjdRUrdlKBl_MBJ` / `githubactions:S8543` | `.github/workflows/device-farm-qa.yml:329` | 2026-07-05 | **Legacy hardening review.** Capacitor is lockfile-resolved on a successful install; avoid npx fallback before considering this disposed. |
| `AZ9BFQZ6qhIB65fl3QsD` / `typescript:S2245` | `utils/monitoring/dropReactionMonitoring.ts:125` | 2026-04-22 | **Proposed false positive.** Fallback telemetry correlation ID; not an authentication token. |
| `AZ9BFQcaqhIB65fl3Qsv` / `jssecurity:S8705` | `bin/ghruns-dashboard.mjs:408` | 2026-03-26 | **Legacy contextual review.** gh is invoked with an argv array, not a shell; selected ID comes from GitHub. Agent-supplied CLI argument threat model still needs an explicit review. |
| `AZ9BFQVVqhIB65fl3Qqz` / `pythonsecurity:S8707` | `ops/scripts/docs-area-remediator-local/validate_docs_optimizations.py:553` | 2026-03-19 | **Legacy contextual review.** Explicit operator-controlled --scores-file input/output. Arbitrary paths are supported; review intended agent filesystem boundary before disposition. |
| `AZ9BFQVVqhIB65fl3Qq0` / `pythonsecurity:S8707` | `ops/scripts/docs-area-remediator-local/validate_docs_optimizations.py:570` | 2026-03-19 | **Legacy contextual review.** Explicit operator-controlled --scores-file input/output. Arbitrary paths are supported; review intended agent filesystem boundary before disposition. |
| `AZ9BFQVVqhIB65fl3Qq1` / `pythonsecurity:S8707` | `ops/scripts/docs-area-remediator-local/validate_docs_optimizations.py:575` | 2026-03-19 | **Legacy contextual review.** Explicit operator-controlled --scores-file input/output. Arbitrary paths are supported; review intended agent filesystem boundary before disposition. |
| `AZ9BFQJXqhIB65fl3QoE` / `typescript:S2245` | `app/api/open-graph/opensea/shared.ts:192` | 2026-02-13 | **Proposed false positive.** Log correlation ID; not an authorization or secrecy boundary. |
| `AZ9BFO99qhIB65fl3Qdm` / `typescript:S2245` | `components/waves/memes/submission/components/AirdropConfig.tsx:52` | 2026-01-06 | **Proposed false positive.** Local form-row identity; does not select airdrop recipients or grant access. |
| `AZ9BFO-FqhIB65fl3Qdn` / `typescript:S2245` | `components/waves/memes/submission/components/AllowlistBatchManager.tsx:27` | 2026-01-06 | **Proposed false positive.** Local form-batch identity; not a security token. |
| `AZ9BFO8bqhIB65fl3QdK` / `typescript:S2245` | `components/waves/memes/submission/hooks/useMediaUpload.ts:56` | 2026-01-06 | **Proposed false positive.** Local upload-state item identity; server URL and authorization are separate. |
| `AZ9BFPF-qhIB65fl3QfR` / `typescript:S2245` | `components/waves/hooks/useDropMetadata.ts:47` | 2025-09-24 | **Proposed false positive.** Local metadata-row identity; not an authorization token. |
| `AZ9_pq-fRUrdlKBl_MBK` / `shell:S6506` | `dev-setup/run-staging-ec2-setup.sh:160` | 2025-08-19 | **Legacy hardening review.** Installer starts on HTTPS but does not constrain redirect protocols; review download policy separately. |
| `AZ9BFQHTqhIB65fl3Qn1` / `typescript:S2245` | `services/api/common-api.ts:509` | 2025-05-10 | **Proposed false positive.** Retry jitter; unpredictability is not a security requirement. |

### MINOR bugs — 38 remaining Reliability A blockers

| Issue key / rule | File:line | Created | Review / follow-up |
| --- | --- | --- | --- |
| `AZ9BFOshqhIB65fl3Qab` / `typescript:S1082` | `components/distribution-plan-tool/create-custom-snapshots/CreateCustomSnapshots.tsx:101` | 2026-07-05 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFQBPqhIB65fl3QmU` / `typescript:S1082` | `components/voting/VotingModal.tsx:68` | 2026-06-12 | **Proposed false positive.** Wrapper only stops propagation; actual actions remain on child controls. No standalone action needs keyboard activation. |
| `AZ9BFQBPqhIB65fl3QmW` / `typescript:S1082` | `components/voting/VotingModal.tsx:83` | 2026-06-12 | **Proposed false positive.** Wrapper only stops propagation; actual actions remain on child controls. No standalone action needs keyboard activation. |
| `AZ9BFO0cqhIB65fl3Qbn` / `typescript:S1082` | `components/waves/drops/participation/ratings/ParticipationDropVoteDetailsContent.tsx:231` | 2026-06-03 | **Proposed false positive.** Wrapper only stops propagation; actual actions remain on child controls. No standalone action needs keyboard activation. |
| `AZ9BFO0lqhIB65fl3Qbu` / `typescript:S1082` | `components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger.tsx:355` | 2026-06-03 | **Proposed false positive.** Wrapper only stops propagation; actual actions remain on child controls. No standalone action needs keyboard activation. |
| `AZ9BFPLTqhIB65fl3QgM` / `typescript:S1082` | `components/utils/radio/CommonBorderedRadioButton.tsx:95` | 2026-05-05 | **Proposed false positive.** Native radio input handles keyboard selection and disabled state; wrapper adds pointer hit area. |
| `AZ9BFPCPqhIB65fl3Qeg` / `typescript:S1082` | `components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop.tsx:156` | 2026-05-05 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPEOqhIB65fl3Qe5` / `typescript:S1082` | `components/waves/winners/drops/DefaultWaveWinnerDrop.tsx:124` | 2026-05-05 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPEXqhIB65fl3Qe7` / `typescript:S1082` | `components/waves/winners/drops/MemesWaveWinnerDrop.tsx:212` | 2026-05-05 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFO2FqhIB65fl3Qb8` / `typescript:S1082` | `components/waves/drops/WaveDropQuote.tsx:287` | 2026-04-29 | **Proposed false positive.** Flagged branch renders a missing drop; isInteractive is false and handler does not navigate. |
| `AZ9BFO7hqhIB65fl3Qc-` / `typescript:S1082` | `components/waves/create-wave/groups/CreateWaveGroupSearchResults.tsx:117` | 2026-04-16 | **Proposed false positive.** Combobox input owns keyboard navigation and aria-activedescendant selection. |
| `AZ9BFPCPqhIB65fl3Qei` / `typescript:S1082` | `components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop.tsx:210` | 2026-04-01 | **Proposed false positive.** Wrapper only stops propagation; actual actions remain on child controls. No standalone action needs keyboard activation. |
| `AZ9BFQCMqhIB65fl3Qmu` / `typescript:S1082` | `components/mobile-wrapper-dialog/MobileWrapperDialog.tsx:547` | 2026-04-01 | **Proposed false positive.** Backdrop close has parent dialog Escape handling; not a standalone control. |
| `AZ9BFOv3qhIB65fl3QbP` / `typescript:S1082` | `components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialog.tsx:729` | 2026-03-26 | **Proposed false positive.** Backdrop close duplicates native dialog cancel and explicit close button. |
| `AZ9BFPhEqhIB65fl3Qj7` / `typescript:S1082` | `components/drops/view/item/content/media/MediaDisplayGLB.tsx:99` | 2026-03-12 | **Proposed false positive.** Container interaction only stops propagation while model controls are active; native button toggles 3D controls. |
| `AZ9BFPEGqhIB65fl3Qe3` / `typescript:S1082` | `components/waves/winners/drops/header/WaveWinnersDropHeader.tsx:23` | 2026-03-09 | **Proposed false positive.** Wrapper only stops propagation; actual actions remain on child controls. No standalone action needs keyboard activation. |
| `AZ9BFO1IqhIB65fl3Qb2` / `typescript:S1082` | `components/waves/drops/ArtistWinningArtworksContent.tsx:48` | 2026-02-27 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPFPqhIB65fl3QfJ` / `typescript:S1082` | `components/waves/MarketplacePreview.tsx:77` | 2026-02-27 | **Proposed false positive.** Wrapper only stops propagation; actual actions remain on child controls. No standalone action needs keyboard activation. |
| `AZ9BFO0_qhIB65fl3Qb0` / `typescript:S1082` | `components/waves/drops/participation/ParticipationDropFooter.tsx:96` | 2026-02-13 | **Proposed false positive.** Wrapper only stops propagation; actual actions remain on child controls. No standalone action needs keyboard activation. |
| `AZ9BFO2kqhIB65fl3QcE` / `typescript:S1082` | `components/waves/drops/ArtistActiveSubmissionContent.tsx:115` | 2026-02-05 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPpeqhIB65fl3Qlw` / `typescript:S1082` | `components/memes/drops/MemesLeaderboardDrop.tsx:181` | 2026-01-27 | **Legacy accessibility review.** Named native card-open button exists conditionally; verify all card variants before disposition. |
| `AZ9BFO2bqhIB65fl3QcA` / `typescript:S1082` | `components/waves/drops/ContentDisplay.tsx:42` | 2026-01-13 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPF2qhIB65fl3QfQ` / `typescript:S1082` | `components/waves/ArtBlocksTokenCard.tsx:362` | 2026-01-12 | **Proposed false positive.** Backdrop close duplicates Escape and Close live render button inside a focus trap. |
| `AZ9BFPHcqhIB65fl3Qfr` / `typescript:S1082` | `components/waves/small-leaderboard/DefaultWaveSmallLeaderboardDrop.tsx:29` | 2026-01-11 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPHlqhIB65fl3Qft` / `typescript:S1082` | `components/waves/small-leaderboard/MemesWaveSmallLeaderboardDrop.tsx:26` | 2026-01-11 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPHTqhIB65fl3Qfp` / `typescript:S1082` | `components/waves/small-leaderboard/WaveSmallLeaderboardItemContent.tsx:69` | 2026-01-11 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPgLqhIB65fl3Qjs` / `typescript:S1082` | `components/drops/view/part/DropPart.tsx:173` | 2026-01-03 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFQCMqhIB65fl3Qmw` / `typescript:S1082` | `components/mobile-wrapper-dialog/MobileWrapperDialog.tsx:554` | 2026-01-03 | **Proposed false positive.** Wrapper only stops propagation; actual actions remain on child controls. No standalone action needs keyboard activation. |
| `AZ9BFPYFqhIB65fl3QiY` / `typescript:S1082` | `components/xtdh/received/collection-tokens/token-contributors/subcomponents/XtdhTokenContributorsListItem.tsx:65` | 2025-12-05 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPoPqhIB65fl3Qlf` / `typescript:S1082` | `components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultipleListItem.tsx:22` | 2025-11-04 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPXbqhIB65fl3QiR` / `typescript:S1082` | `components/block-picker/BlockPickerTimeWindowSelectList.tsx:22` | 2025-11-04 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFOnpqhIB65fl3QZX` / `typescript:S1082` | `components/distribution-plan-tool/build-phases/build-phase/form/component-config/select-snapshot/SelectSnapshotDropdownListItem.tsx:41` | 2025-11-04 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPflqhIB65fl3Qjn` / `typescript:S1082` | `components/drops/view/part/dropPartMarkdown/linkUtils.tsx:182` | 2025-09-26 | **Proposed false positive.** Anchor receives its href via anchorProps; native keyboard activation is retained. |
| `AZ9BFO3UqhIB65fl3QcO` / `typescript:S1082` | `components/waves/drops/ArtistPreviewAppWrapper.tsx:55` | 2025-08-05 | **Proposed false positive.** Wrapper only stops propagation; actual actions remain on child controls. No standalone action needs keyboard activation. |
| `AZ9BFOdQqhIB65fl3QYD` / `typescript:S1082` | `components/user/settings/UserSettingsBackground.tsx:47` | 2025-07-07 | **Legacy accessibility review.** Icon duplicates native colour input activation; control labeling should be reviewed, not blanket-dismissed. |
| `AZ9BFOdQqhIB65fl3QYG` / `typescript:S1082` | `components/user/settings/UserSettingsBackground.tsx:81` | 2025-07-07 | **Legacy accessibility review.** Icon duplicates native colour input activation; control labeling should be reviewed, not blanket-dismissed. |
| `AZ9BFOdYqhIB65fl3QYI` / `typescript:S1082` | `components/user/settings/UserSettingsPrimaryWalletItem.tsx:24` | 2025-07-07 | **Legacy accessibility defect/review.** Clickable non-native surface lacks its own keyboard activation. Follow up with semantic controls and caller/viewport-specific keyboard coverage; do not dismiss. |
| `AZ9BFPppqhIB65fl3Ql0` / `typescript:S1082` | `components/memes/drops/MemeParticipationDrop.tsx:227` | 2025-04-10 | **Proposed false positive.** Wrapper only stops propagation; actual actions remain on child controls. No standalone action needs keyboard activation. |

### MINOR vulnerability findings — five remaining Security A blockers

| Issue key / rule | File:line | Created | Review / follow-up |
| --- | --- | --- | --- |
| `AZ9BFQcaqhIB65fl3Qsr` / `javascript:S4036` | `bin/ghruns-dashboard.mjs:320` | 2026-03-26 | **Legacy contextual review.** Local developer CLI resolves gh through the operator PATH; do not assume all host PATHs are trusted. |
| `AZ9BFQcaqhIB65fl3Qss` / `javascript:S4036` | `bin/ghruns-dashboard.mjs:409` | 2026-03-26 | **Legacy contextual review.** Same local gh/PATH trust boundary as the list operation. |
| `AZ9BFQVgqhIB65fl3Qq3` / `python:S5332` | `ops/scripts/docs-area-remediator-local/area_health.py:22` | 2026-03-19 | **Proposed false positive.** HTTP is a string prefix used to classify links; no HTTP network request is made here. |
| `AZ9BFQVpqhIB65fl3Qq7` / `python:S5332` | `ops/scripts/docs-area-remediator-local/validate_docs_links.py:10` | 2026-03-19 | **Proposed false positive.** HTTP is a string prefix used to classify links; no HTTP network request is made here. |
| `AZ9BFQYBqhIB65fl3Qrz` / `typescript:S4036` | `config/version.ts:19` | 2026-01-09 | **Legacy contextual review.** Build-time constant git command uses the build host PATH; requires trusted build environment. |

