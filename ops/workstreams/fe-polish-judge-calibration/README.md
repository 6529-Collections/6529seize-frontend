# FE Polish Judge Calibration, 2026-10-12

This is the calibration record for the
[frontend polish judge](../../standards/frontend-polish-judge.md). It covers
single-round verdicts: whether one fresh judge, given a run record and
evidence, files the right findings and reaches the right decision. It does not
yet cover the repair loop, meaning convergence, unnecessary edits, and time to
acceptance.

## Setup

- **Judge:** Claude Opus 5.5 (`claude-opus-5-5`), one fresh-context subagent
  per general case and one per lens for Museum cases. Judges saw only the judge
  prompt, the standards, `run.json`, and the evidence tiles. They had no
  browser and never saw the answer keys.
- **Prompt and rubric:** `fe-polish-judge/2.0` at commit `04d8b1e250` for
  c01–c15, and `fe-polish-judge/2.1` from this change for c16–c22. The exact
  prompts are in `prompts.jsonl`.
- **Evidence:** full-page captures cut into viewport-height tiles.
  - c01–c10 and c16–c17 capture production `/museum/network/about` and `/`.
    The seeded cases insert one defect into the live DOM before capture;
    production itself was never changed.
  - c11–c15 slice the evidence already committed in the
    `museum-home-consolidation`, `museum-art-first-rebuild`,
    `mint-progress-modals`, and `mint-success-modal` workstreams.
  - Evidence tiles are not committed. `scripts/prepare-cases.mjs` regenerates
    them, but production captures reflect production on the day they are taken.
- **Scope pins:** every case is screenshot-only, so J08, J11, and J12 are pinned
  N/A. J09 is pinned N/A where only the populated state exists, and J13 where
  there is no wallet interaction. A real run would leave the first three
  unverified instead (see [Evidence](../../standards/frontend-polish-judge.md#evidence)).

Scripts, run from the repository root:

| Script                       | Purpose                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| `scripts/prepare-cases.mjs`  | Capture or slice the evidence tiles (`[case...]` for a subset)   |
| `scripts/write-run-records.mjs` | Write each `run.json` and the answer keys                     |
| `scripts/judge-prompts.mjs`  | Write `prompts.jsonl`                                            |
| `scripts/analyze.mjs`        | Score cases with `score.mjs` and compare with an answer key      |
| `scripts/findings-table.mjs` | Print one line per finding for adjudication                      |

## Cases

| Case    | Kind                    | Surface                                     | Expected                                  |
| ------- | ----------------------- | ------------------------------------------- | ----------------------------------------- |
| c01     | control                 | Museum About                                | no seeded defect                          |
| c02     | seeded                  | Museum About + brief leakage in the lede    | I2 fails                                  |
| c03     | seeded                  | Museum About + fake-profundity section      | J07 required finding                      |
| c04     | seeded                  | Museum About + governance theater eyebrow   | I3 fails                                  |
| c05     | seeded                  | Museum About + invented metric tiles        | I1 fails                                  |
| c06     | seeded                  | Museum About + file path and TODO headline  | I2 fails                                  |
| c07     | control                 | Home                                        | no seeded defect                          |
| c08     | seeded                  | Home + false-urgency banner, "free" claim   | S6 fails                                  |
| c09–c10 | repeat                  | c01 evidence again                          | same verdict as c01                       |
| c11     | recorded pass           | Museum home consolidation (Museum profile)  | three human reviewers passed it           |
| c12     | recorded rejection      | Registry-first Museum pages (Museum profile) | the owner rejected them                  |
| c13     | recorded pass           | Art-first Museum pages (Museum profile)     | the owner passed them                     |
| c14     | recorded pass           | Mint progress modals                        | reviewed and shipped                      |
| c15     | recorded pass           | Mint success modal                          | reviewed and shipped                      |
| c16–c17 | control (2.1)           | c01 and c07 pages, recaptured with the phone device profile | adjudicated              |
| c18     | evidence gap (2.1)      | c01 evidence rejudged                       | no finding filed for capture artifacts    |
| c19–c20 | seeded (2.1)            | c02 and c08 evidence rejudged               | I2 and S6 still fail                      |
| c21–c22 | recorded pass (2.1)     | c14 and c15 with S checks pinned            | c21 accepted; c22 no required finding     |
| c23     | recorded pass (2.1)     | c22 again, after the S3 evidence line       | S3 unverified, so not accepted            |

## Results, rubric 2.0

`results-2.0.json` holds the scored results from the 2.0 scorer.

**Detection.** The judge caught all six seeded defects at the expected check:
I2 (c02, c06), I3 (c04), I1 (c05), and S6 (c08) as P0/P1 blocking failures, and
the fake-profundity section (c03) as a required J07 finding. In c08 the judge
also failed I1, I3, and S1, filed at P0. Each seeded case also kept the page's
baseline findings, so one loud defect did not hide the others.

**Recorded rejection.** The judge rejected c12 decisively: total 4.95, with M1,
M2, and I2 failing and 21 required findings, matching the owner's rejection of
pages that showed records but no art.

**Acceptance.** Under 2.0 no case was accepted, so false acceptance could be
tested only through c12, which the judge rejected. The 2.1 rerun below exercises
the acceptance path.

**Strictness.** The judge is stricter than past human review. Every production
page and every human-passed Museum case drew required P2 findings and scores
below the floor of 8. Of the 21 required findings on the four control runs
(c01, c07, c09, c10):

| Adjudication                                                     | Count | Examples                                                                                                                          |
| ---------------------------------------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------- |
| Real, verified on production                                     |     7 | "Collection care" section with a square, uneven border and no left padding (3 runs); three Collection link labels with mixed casing (2); raw markdown in wave card previews; dangling footer separators at phone width |
| Accurate observation; whether it is a deficit is a judgment call |    10 | unexplained internal terms such as TDH and Museum Safe (3 runs); inconsistent section headings; section order; caption depth; monospace mission sentence; vote-leader TDH figures that contradicted the rank labels in that capture (live values; a later capture showed them in rank order) |
| Capture artifact                                                 |     3 | 390 capture ending before the footer (2); desktop icon rail at 390 (1)                                                            |
| Mixed                                                            |     1 | black Latest Drop player: the API's poster URL lacks the file name (real), and the video did not load in the headless capture     |

The human-passed Museum cases show the same pattern:

- **c11:** 14 required findings, including a failed M4 because the hero work
  reappears in the Acquisitions row. That is correct under M4's wording, since
  the historical record names no curatorial decision; M4 did not exist when the
  page shipped.
- **c13:** total 8.458. Its only required gap is the object image being taller
  than a 1,000 px viewport, filed by both the curatorial and visual lenses.
- **c14 and c15:** no required findings, with totals of 8.72 and 8.78. Both
  still ended `incomplete`, because S checks for lifecycle stages outside the
  reviewed states could only be marked `unverified`.

**Repeatability.** On identical evidence (c01, c09, c10), totals were 7.93,
8.05, and 7.86 (spread 0.19), and the decision was the same each time. The
required sets differed. Two findings recurred in all three runs, the
"Collection care" frame and the internal terms; the rest varied, and the
average pairwise overlap of required sets was about 40 percent. Across all
eight About-page runs (c01–c06, c09, c10):

- The frame finding appeared in 8 of 8, at P2 every time.
- The internal-terms finding appeared in 8 of 8, at P2 in 6.
- The Collection-label finding appeared in 7 of 8, at P2 in 2.

Most of the variance is the P2/P3 boundary on the same observation. The
late-admission rule already contains it: after the baseline, a new P2 is
admitted only as a regression.

**Cost.** Each judge context used about 85k–125k tokens and took 1–6 minutes.
A Museum round is three contexts, and the 21 contexts of the 2.0 set used about
2.4M tokens.

## Changes made from these results (rubric 2.1)

1. **S checks can be pinned.** A run scoped to part of a crypto flow may pin
   S1–S5 N/A for stages outside its reviewed states, with a reason. S6 and the
   I and M checks cannot be pinned, and a pin needs a reason. Without this, a
   review of one modal state can never be accepted (c14, c15).
2. **Evidence gaps are not product defects.** A truncated capture, media that
   failed to load in the capture, or a phone width captured without mobile
   emulation is marked unverified instead of filed as a finding.
3. **Phone captures use mobile device emulation.** The app switches to its
   touch layout on touch-first devices. The 2.0 harness's bare 390 px context
   rendered the desktop icon rail and ended the capture early; the 2.1 harness
   uses a phone device profile and scrolls until the page height settles.
4. **S3 needs lifecycle evidence.** A single success frame cannot show that
   success waited for confirmation, so S3 stays unverified without the
   submitted-to-confirmed transition, a recording, or a test (added after c22).
5. **Labels.** The acceptance label is now `judge-accepted (partially
   calibrated)`.

## Results, rubric 2.1

`results-2.1.json` holds the scored results. c16–c22 ran before the S3 line
was added to the judge prompt; c23 ran after it.

| Case | Decision   | Total | Required | Result                                                                                                     |
| ---- | ---------- | ----: | -------: | ---------------------------------------------------------------------------------------------------------- |
| c16  | repair     |  8.05 |        2 | About page with a clean phone capture: only the two findings every About run agrees on, the frame and the internal terms |
| c17  | incomplete |  7.94 |        8 | Home with a clean phone capture. The 1440 cell is unverified because media did not load in the headless desktop capture (it renders in a real browser and at 390). Required findings include raw markdown, footer separators, unexplained TDH and allowance wording, a mobile gutter jog, and the wave section's hook |
| c18  | incomplete |     – |        2 | c01 evidence: the truncated, desktop-shell phone capture is marked unverified with the right reason, and no finding is filed for it |
| c19  | incomplete |     – |        2 | Seeded brief leakage still fails I2 at P1                                                                  |
| c20  | incomplete |     – |        4 | Seeded dark pattern still fails S6, I1, I3, and S1 at P0/P1                                                |
| c21  | accepted   |  8.84 |        0 | Mint progress modals with S1, S2, and S4 pinned: accepted, with four P3 suggestions                        |
| c22  | accepted   |  8.74 |        0 | Mint success modal with S1, S2, S4, and S5 pinned, but S3 passed from one frame                            |
| c23  | incomplete |  8.85 |        0 | The same evidence after the S3 line: S3 is unverified, so the run asks for lifecycle evidence               |

What 2.1 changed:

- Capture artifacts no longer turn into product findings. All three judges
  shown the bad phone capture (c18–c20) marked it unverified with an accurate
  reason. With a clean capture (c16), the About page's required set shrank to
  the two findings every run agrees on.
- Seeded defects are still caught at the same severity.
- A review scoped to part of a crypto flow can now be accepted (c21), but not
  on a check the evidence cannot show (c23).

Each 2.1 judge context used about 93k–138k tokens and took 2–7.5 minutes.

## Limits and next calibration

- **Repair loop:** not measured. Convergence, unnecessary edits, and rounds to
  acceptance need a builder–judge run on a page with known defects.
- **Coverage:** screenshot-only. Interaction (J08), recovery states (J09),
  performance (J11), and localization (J12) were not exercised. J13 and S
  checks were judged from static frames.
- **Labels:** "production pages need no required change" was the wrong
  expectation for controls; they were adjudicated finding by finding instead.
  The next set should include pages that a human reviewer confirms need no
  change at the 8.5 bar.
- **Evidence:** the c01–c10 tiles were recaptured once after judging, by an
  accidental rerun of the 2.0 harness. Tile counts and the truncated phone
  capture reproduced exactly, so the adjudication above stands.
- **Rerun policy:** a judge model or prompt change requires rerunning this set
  and recording the result here.
