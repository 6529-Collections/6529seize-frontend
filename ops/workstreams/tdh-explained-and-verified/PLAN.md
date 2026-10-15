# TDH, explained and verified: information architecture and page plan

Status: plan, 15 October 2026. Nothing in this document is built yet.
Branch: `claude/tdh-explained-and-verified`.

The owner wants pages on 6529.io that explain TDH all the way from a
one-minute introduction to the formal specification, show the
implementations, and publish a public daily verification dashboard. The
presentation must be world class. Target: tomorrow, 16 October 2026; at the
latest Saturday, 17 October 2026. This plan fixes the routes, the full copy,
the worked examples, the diagrams, the interactive elements and the data each
page reads, so the pages can be built in parallel.

## Contents

0. [How to read this plan](#0-how-to-read-this-plan)
1. [Sources, citations and content rules](#1-sources-citations-and-content-rules)
2. [Findings to resolve before the copy goes live](#2-findings-to-resolve-before-the-copy-goes-live)
3. [Information architecture](#3-information-architecture)
4. [Shared presentation system](#4-shared-presentation-system)
5. [Page: Overview, `/network/tdh`](#5-page-overview-networktdh)
6. [Page: How it works, `/network/tdh/how-it-works`](#6-page-how-it-works-networktdhhow-it-works)
7. [Page: Specification, `/network/tdh/specification`](#7-page-specification-networktdhspecification)
8. [Page: Formal model, `/network/tdh/formal`](#8-page-formal-model-networktdhformal)
9. [Page: Implementations, `/network/tdh/implementations`](#9-page-implementations-networktdhimplementations)
10. [Page: Verification, `/network/tdh/verification`](#10-page-verification-networktdhverification)
11. [Verification data contract](#11-verification-data-contract)
12. [Engineering plan](#12-engineering-plan)
13. [Delivery sequence](#13-delivery-sequence)
- [Appendix A. Worked-example computation](#appendix-a-worked-example-computation)
- [Appendix B. Cause codes in plain words](#appendix-b-cause-codes-in-plain-words)
- [Appendix C. The 36 conformance vectors](#appendix-c-the-36-conformance-vectors)

## 0. How to read this plan

- **Copy** blocks are the text as it will appear, in US English, ready to
  become `en-US` messages. Headings inside a copy block are the page's own
  headings.
- **Citations.** A bracketed reference such as [P26 §5.2] or [D121] after a
  sentence is not printed inline. It renders as a source chip (§4.4) beside
  the sentence or paragraph it supports. Every factual claim carries one.
- **Numbers.** Every number in a worked example is exact and was computed
  with the P26 Python reference (Appendix A). Unless a block says otherwise,
  examples use the network as it stood at the 2026-10-11 cycle: the largest
  effective Meme edition `H` was 3,941 (FirstGM), 559 Memes were eligible in
  17 seasons, there were 101 Gradients and one NextGen collection of 1,000
  tokens [P26 §5.2, Replay 2026-10-11].
- **Status labels** (Decided, In progress, Planned, Sample, Not yet fully
  checked, Built, not deployed) appear on the pages exactly as written here.

## 1. Sources, citations and content rules

### 1.1 Sources of truth

All are read-only inputs to this plan. The design record and the validator
repository are private.

| Code | Document | Used for |
| --- | --- | --- |
| P26 | TDH-v1 deterministic specification, rule version `tdh-v1.0`, text of 15 October 2026 | Every rule, formula, parameter, deviation and legacy issue |
| P53 | Validator v1 specification | The daily cycle (§2), the dual run (§4.5), history modes (§11), the comparison with 6529.io (§12) |
| P38 | Shadow mode | Difference classes A to D and the classification ladder (§3.3) |
| P52 | State proofs on Ethereum | Programs A and B (§3.7) and measured run times (§3.4) |
| Decisions | D112, D116, D118, D119, D121, D122, D125, D128, D130, D131, D132 | The status of each component and each rule choice |
| Replay 2026-10-11 | The differential replay of cycle 2026-10-11 | Network figures, the two DEV-2 differences, ties, sinks |
| Clean room 2026-10-11 | The second, clean-room Rust implementation | 23 ambiguities found in P26 and fixed |
| Comparison 2026-10-14/15 | The validator's comparison milestone (M6) | Sample dashboard data |
| Vectors | The 36 conformance vectors | The implementations page and Appendix C |

The Lean work (a `tdh-lean` folder in the design record) did not exist when
this plan was written. Section 8 is written from what that work will contain
and is marked In progress (finding F9).

### 1.2 Content rules

1. **No real person.** No name, handle, display name, wallet address or ENS
   name of any person appears in pages, fixtures, tests, screenshots or
   commits. Examples use Wallet A, Wallet B and Wallet C. The dashboard
   labels differences `holder-1`, `holder-2`. Card ids appear only where P26
   itself names them: FirstGM (Meme 8), Memes 1 to 4 for the Genesis and
   Nakamoto boosts, and Memes 206, 215, 311 and 559 in the floor examples.
2. **Private sources stay private.** No link to the validator repository or
   to the design record. Where a page would link to source code it says
   "Source to be published" [D112, D116]. The specification page restates P26
   in full, so every source chip resolves to a section of these pages.
3. **No overclaiming.** Every component carries its real status: running,
   built, built and not deployed, decided, rule text pending, in progress or
   planned. A proof is described by what it states, never as making TDH
   "correct" or "secure".
4. **No private environment details.** No hostnames, provider names, account
   ids, regions or IP addresses. Data sources are described by kind ("a public
   Ethereum log service", "6529's own Ethereum node").
5. **UTC everywhere.** Every time is given in UTC and labelled so. The cycle
   date is the date whose 00:00 UTC closes the cycle [P26 §4.1].
6. **Formatting.** Numbers, percentages and dates go through the repo's
   `@/i18n/format` helpers; formulas, hashes and addresses are not
   translated.

## 2. Findings to resolve before the copy goes live

These came up while reading the sources against the live site and backend.
F1 needs an owner decision before the cutover; the others are handled by the
copy as written below.

| ID | Finding | Effect | Proposal |
| --- | --- | --- | --- |
| F1 | **Four-wallet consolidations.** The backend's `main` now groups up to four wallets: a fourth joins only when one member registered every link in both directions at or after a configured activation time (`CONSOLIDATIONS_LIMIT = 4`, `CONSOLIDATIONS_UNGATED_LIMIT = 3`, `src/consolidation-policy.ts`). The site's consolidation guide and its design page explain this. P26 `tdh-v1.0` fixes `consolidation_max_wallets` at 3 with no activation gate, and breaks same-block ties by event position where the backend uses the pair key [P26 §6.3, §10, DEV-11]. Whether production has an activation time set was not checked. | Under D121 and D132 the website will show the Rust core's result from about 23 October. If the core stays at `tdh-v1.0`, any group of four formed after activation splits into three plus one at the cutover, and the daily comparison shows those identities as class D until a cause code exists. | Owner decision before the cutover. Recommended: a new rule version (P26 §10: a registry change is a new rule version with its own activation cycle) that adds the gated fourth wallet, with vectors, before 23 October. Until decided, How it works says "up to three wallets under rule version `tdh-v1.0`" and links to the consolidation guide (§6, step 10). |
| F2 | **D131 is decided but not yet written into P26.** P26 §7.1 still applies canonical order to every movement, and the Python reference read for this plan does not yet net within a transaction [D131]. | The pages must not present netting as already computed by the published rule text. | Describe netting as Decided, with the label "Rule text being finalised". The worked example shows both results. Re-check when P26 changes. |
| F3 | **The overview's "Exact calculation" copy describes today's backend**: rates "recorded" by the backend, floors refreshed with the old floor kept on failure, "the block at or just before 00:00 UTC". | After the cutover these are P26 rules: rates from on-chain counts at the cutoff block, floors read at that block for Memes below 300 copies, the last block before 00:00 UTC on the finalized chain [P26 §4.2, §5.2, §5.3]. | Move the exact calculation to How it works, rewritten to P26 (§6). The overview keeps a pointer at the old anchor `#tdh-exact`. |
| F4 | **Two version names.** The site calls the current boost schedule "TDH 1.4" (anchor `#tdh-1-4`); the specification calls the exact rule TDH-v1, rule version `tdh-v1.0`. | "v1" reads as older than "1.4". | "TDH-v1" names the exact rule; "boost schedule 1.4" names the schedule it encodes. Historic boosts gains one sentence saying so (§5.6). Owner to confirm the wording. |
| F5 | **P26's header still reads "Proposal P26, not adopted"**, while D121 makes it the formula for 6529.io, the backend and validators. | Pages could contradict the record. | Say: the rule 6529.io and every validator compute (D121); its adoption as the consensus rule of the future chain remains the owner's decision [P26 header]. |
| F6 | **35 or 36 vectors.** D116's text says 35; the vector folder, P53's exit criterion VX6 and both Rust test suites have 36 (vector 12b counted). | | Pages say 36. |
| F7 | **Schema gaps** in the daily job's JSON: the verdict values are not enumerated; a day may lack the Python run; roots are unknown before publication; the cutover state is not in the data; the sample has no per-holder values. | The dashboard cannot render every state from the schema as given. | Section 11 adds optional fields only (`verdict` enum, nullable values, an optional `cutover` block), so the job can ship with the schema as given and the page still renders. |
| F8 | **After the cutover, "Rust versus 6529.io" stops testing the computation**, because 6529.io then runs the same Rust core [P53 §4.5]. | A green dashboard could be misread. | The dashboard says so in its method note and switches its headline comparison to Rust versus Python after the cutover (§10). |
| F9 | **The Lean work is absent** from the design record. | | The Formal page is In progress; its statement table is driven by a manifest when one is published (§8, §11.5). |

## 3. Information architecture

### 3.1 Routes

| Route | H1 | Section-nav label | Audience | Rendering | Reads |
| --- | --- | --- | --- | --- | --- |
| `/network/tdh` | TDH | Overview | Everyone; newcomers first | Existing page, restructured | `/api/tdh/rules`, the profile TDH API (existing), verification `index.json` |
| `/network/tdh/how-it-works` | How TDH is calculated | How it works | Collectors who want to understand their number | Static, with client islands | Nothing at runtime; examples are bundled |
| `/network/tdh/specification` | The TDH-v1 specification | Specification | Builders, auditors, curious collectors | Static | Nothing |
| `/network/tdh/formal` | Formal model | Formal model | Engineers, auditors | Static; ISR when a manifest exists | Optional `formal/manifest.json` |
| `/network/tdh/implementations` | Implementations | Implementations | Engineers, operators | Static plus one ISR card | `index.json` (latest day) |
| `/network/tdh/verification` | TDH verification | Verification | Anyone who wants evidence | ISR, 10 minutes | `index.json`, `days/{latest}.json` |
| `/network/tdh/verification/[cycleDay]` | TDH verification, cycle {N} | (Verification) | Permalinks to one day | ISR, 1 hour; 404 for unknown days | `days/{N}.json`, `index.json` |
| `/network/tdh/consolidation` | Unchanged | Consolidation guide (secondary) | | Existing | Existing |
| `/network/tdh/historic-boosts` | Unchanged, plus one sentence (F4) | Historic boosts (secondary) | | Existing | Existing |

`/network/tdh` stays the canonical entry point; every existing link and
anchor keeps working (`#tdh-reference`, `#tdh-example`, `#tdh-profile`,
`#tdh-1-4`, `#tdh-exact`).

### 3.2 Navigation

- **TDH section nav** (new, shared by all seven routes above): a horizontal
  list under the existing contents-dropdown row: Overview, How it works,
  Specification, Formal model, Implementations, Verification, then a muted
  "More" group with Consolidation guide and Historic boosts. `aria-current`
  marks the active page. On phones the list scrolls horizontally inside its
  own region with edge fades; the page itself never scrolls sideways.
- **Contents dropdown** (`components/about/about.routes.ts`, group
  `networkReputation`): add "How TDH is calculated" and "TDH verification"
  right after "TDH". The other sub-pages are reached through the section nav,
  so the dropdown does not grow by five.
- **Network references** (`components/network/NetworkReferenceNavigation.tsx`):
  add How it works, Specification and Verification.
- **Sitemap** (`next-sitemap.config.ts`): add the five new static routes.
  Day permalinks are not listed.
- **Help index** (`ops/help/help-index.json`, then `6529 run help-index:sync`):
  one record per new route, with the questions each answers (§12.4).

### 3.3 Journeys

| Reader | Path | Leaves knowing |
| --- | --- | --- |
| Newcomer | Overview hero, "TDH in a minute", the three-step strip | What TDH is, why time and rarity matter, that it is checked daily |
| Collector | Overview, Explain my TDH, then How it works | Why their number is what it is, and what would change it |
| Builder or auditor | Specification, then Implementations, then Formal model | The exact rule, who implements it, how agreement is tested and what is proven |
| Skeptic | Overview's "Verified daily" strip, then Verification | Today's three-way agreement, every difference and its cause |

### 3.4 Page metadata

| Route | `<title>` | Description |
| --- | --- | --- |
| Overview | TDH: Total Days Held \| Network (was "How TDH is calculated", which moves to How it works) | What TDH is, how to read your own, and how it is calculated and verified every day. |
| How it works | How TDH is calculated, step by step \| Network | Copies, whole days, edition rates, boosts and consolidations, with worked examples you can change. |
| Specification | The TDH-v1 specification \| Network | The exact rule behind TDH: every input, formula and rounding step, in readable form. |
| Formal model | TDH formal model \| Network | A Lean 4 model of the TDH rule, and what its proofs do and do not guarantee. |
| Implementations | TDH implementations \| Network | The Rust core, program B, the Python reference and 6529.io, and how they are checked against each other. |
| Verification | TDH verification \| Network | Every day, Rust, Python and 6529.io TDH side by side, with every difference explained. |
| Day permalink | TDH verification, cycle {N} \| Network | Rust, Python and 6529.io TDH for {date}. |

All use `getAppMetadata()` with a `canonicalPath`.

## 4. Shared presentation system

World class here means editorial clarity inside the app's own visual
language, not a marketing site [frontend design standard]. Principles:

- **One idea per section,** in the same order everywhere: plain words, then
  an example, then the exact rule.
- **Every number reproducible, every claim cited.**
- **Diagrams show the real mechanism**, drawn from the rule, never decoration.
- **Explorables where a parameter matters:** the reader changes an input and
  watches the rule respond.
- **Honest states:** sample, in progress, not yet fully checked and pending
  are labelled where the reader looks, not in a footnote.

### 4.1 Layout

- Page shell: `NETWORK_REFERENCE_PAGE_CLASSES`, `AboutContentsDropdown`, an
  `article` of `tw-max-w-6xl`, as the overview does today.
- Sections: the existing `TDHSection` pattern (sticky heading column and
  content column from `lg`, one column below). Prose is capped at about
  70 characters per line (`tw-max-w-3xl`).
- Panels: `TDH_PANEL` (`tw-rounded-xl`, `iron-900` surface, `white/[0.07]`
  edges). Rule blocks and tables use `tw-rounded-lg`.

### 4.2 Typography and numbers

- Headings and prose as on the overview today (`iron-50` H1, `iron-100` H2,
  `iron-200` and `iron-400` prose).
- All figures use tabular numerals (`tw-tabular-nums`). Formulas, hashes and
  addresses use the mono stack; long hashes truncate in the middle with a
  copy button and the full value in the accessible name.
- Rates show two decimals, boosts two decimals with "×", TDH whole numbers.

### 4.3 Rule blocks

A rule block is a mono panel holding a formula or pseudocode exactly as P26
writes it, with a caption naming its section and a copy button. On phones a
rule block scrolls inside itself (`overflow-x-auto`, focusable, labelled), so
the page never scrolls sideways.

### 4.4 Source chips

`<TdhSource ref="P26 §5.2" />` renders a small chip after the cited text.

| Reference | Chip text | Link |
| --- | --- | --- |
| P26 section | P26 §5.2 | `/network/tdh/specification#s5-2` |
| P26 deviation or issue | DEV-2, BUG-7 | `/network/tdh/specification#dev-2`, `#bug-7` |
| Decision | D121 | `/network/tdh/specification#d121` (the decisions list) |
| Evidence | Replay 2026-10-11 | `/network/tdh/specification#evidence-replay` |
| P53, P38, P52 | P53 §4.5 | No link; tooltip and accessible name "Validator specification, section 4.5; source to be published" |

### 4.5 Status pills

A rounded-full chip with a dot and a word. Neutral `iron` surface; the dot
carries the colour, so colour is never the only signal.

| Pill | Dot | Used for |
| --- | --- | --- |
| Equal | success | A comparison with no difference |
| Explained | primary | Differences, all class A or B |
| Investigating | warning | Any class D difference |
| Mismatch | error | Class C, or Rust and Python disagree |
| Decided | primary | A decision whose rule text is final |
| Rule text being finalised | warning | D131 until P26 carries it |
| In progress | warning | The Formal model |
| Planned | iron | Statements not yet written |
| Proved | success | Statements the Lean kernel accepted with no gaps |
| Sample | warning | Non-production sample data |
| Not yet fully checked | warning | `mode: "unchecked-history"` |
| Fully checked | success | `mode: "checked"` |
| Built, not deployed | iron | The D128 contract |

### 4.6 Diagram grammar

- Inline SVG React components with a `viewBox`, scaling to the column width;
  text is real text from messages; `role="img"`, a `<title>` and `<desc>`,
  plus a visible "Text version" disclosure for anything complex.
- Strokes and fills use `currentColor` and the `iron-*` and `primary-*`
  tokens. Fixed series hues, used the same way on every page:

| Series | Use |
| --- | --- |
| The Memes, Gradients, NextGen | Three distinct hues from the existing palette, always with a text label |
| Rust core, program B, Python reference, 6529.io | Four distinct hues; 6529.io is the neutral one because it is the object under test [P53 §12] |

- Motion: at most a 200 ms transition when an explorable changes; none
  under `prefers-reduced-motion`.

### 4.7 Explorables

Client islands with a reset button, keyboard operation, visible focus, a
polite live region announcing the result, and no layout shift (results
reserve their space). Inputs are integers with steppers; no free-text
parsing. Each explorable states under it: "Computed in your browser for
illustration. The computation of record is the Rust core." [D121]

They share one small module, `lib/tdh/tdhV1Arithmetic.ts`, that ports
P26 §8's `RATE`, `BASE`, `ADD`, the boost and `FINAL` with integer cents.
`B64` uses JavaScript's own binary64 division and multiplication, which P26
§1 allows ("hardware binary64 division and multiplication, no fused
multiply-add"). Jest checks it against every number in Appendix A.

### 4.8 Accessibility

WCAG 2.2 AA per the repo standard: semantic tables with captions behind every
chart; headings in order; the section nav is a `nav` with a label; status is
never colour alone; 44 px targets; 200% zoom without loss; focus returns to
the heading named in a hash (the existing `useTDHSectionHashFocus`).

### 4.9 Messages

New `en-US` namespaces, each its own JSON file wired in `i18n/messages/en-US.ts`
like `networkTdhExplainer.en-US.json`: `network.tdh.shared` (nav, chips,
pills), `network.tdh.how`, `network.tdh.spec`, `network.tdh.formal`,
`network.tdh.impl`, `network.tdh.verify`. The overview extends
`network.tdh.explainer`. Other locales fall back to `en-US` and the debt is
recorded in the i18n fallback workstream.

## 5. Page: Overview, `/network/tdh`

**Purpose.** The front door: TDH in under a minute, then the reader's own
number, then the way deeper. **Audience.** Everyone, newcomer first.

### 5.1 New order of sections

1. Hero and "TDH in a minute" (new, replaces the current header text).
2. Verified daily strip (new).
3. Explain my TDH (existing `#tdh-profile`).
4. Try an example (existing `#tdh-example`).
5. Three steps to your score (existing `#tdh-how`, copy tightened).
6. FirstGM: the original TDH reference (existing `#tdh-reference`).
7. Current boosts and the full schedule (existing `#tdh-1-4`).
8. Go deeper (new cards to the five sub-pages).
9. The exact calculation has moved (pointer at `#tdh-exact`).
10. Explore the network (existing related links).

### 5.2 Copy

> **TDH**
>
> TDH, Total Days Held, measures the art you hold and how long you have held
> it. Every copy of an eligible card earns its whole days held, weighted by
> how rare the card is and multiplied by a boost for collecting sets. It is
> recalculated from scratch every day at 00:00 UTC from Ethereum's public
> records, so anyone can check it. [P26 §4, §7, §8]
>
> **TDH in a minute**
>
> **1. Hold.** Each copy you hold counts the whole days since you got it. A
> copy bought today starts counting tomorrow; selling it removes its days.
> [P26 §4.3, §7.1]
>
> **2. Weigh.** Rarer cards weigh more. A card's rate is the largest edition
> divided by the card's own edition: FirstGM, with 3,941 copies, is 1.00, and
> a 310-copy Meme is 12.71. [P26 §5.3, §8.1]
>
> **3. Boost.** Complete sets, seasons and Gradients raise one multiplier
> that applies to everything you hold. It starts at 1.00. [P26 §8.3]
>
> One 310-copy Meme held for 100 days, by a collector who also holds one
> Gradient: 100 days × 12.71 = 1,271, then × 1.02 = **1,296 TDH** from that
> card. [P26 §8.2, §8.4]
>
> The Memes, Gradients and NextGen count. Meme Lab and received xTDH do not.
> [P26 §2]

> **Verified daily**
>
> Every day the validators' Rust core, the Python reference and 6529.io's
> current backend compute TDH for the same snapshot, and the results are
> compared in public. From about 23 October 2026, the TDH on this site comes
> from the same Rust core the validators run. [D121, D132]
>
> *(with data)* Cycle {cycle} · {date}: **{equal} of {total}** identities
> equal between Rust and 6529.io. {differenceSentence} [Open the dashboard]
>
> {differenceSentence}: "No differences." / "The {count} differences are
> explained." / "{count} differences are being investigated."
>
> *(after the cutover)* Cycle {cycle} · {date}: **{equal} of {total}**
> identities equal between the Rust core and the Python reference.
> {differenceSentence} [P53 §4.5]
>
> *(before the first report)* Daily reports start on 16 October 2026. The
> first one appears here after its run. [D132]
>
> *(sample, non-production only)* Sample data, not a measurement.

> **Three steps to your score** *(existing section; copy unchanged except the
> snapshot note)*
>
> Snapshot note, shipped with the cutover (until then keep today's note):
> Updated daily from the last Ethereum block before 00:00 UTC, once Ethereum
> has finalized it, about 13 to 20 minutes after midnight. Ages are measured
> to that block's time. [P26 §4.2, §4.3, P53 §2, D132]

> **Go deeper**
>
> - **How TDH is calculated.** Step by step: copies, whole days, editions,
>   boosts and consolidations, with worked examples you can change.
> - **The specification.** The exact rule, TDH-v1, in readable form: every
>   input, formula and rounding step.
> - **Formal model.** *In progress.* A Lean 4 model of the rule, and what its
>   proofs will and will not guarantee.
> - **Implementations.** The Rust core, program B, the Python reference and
>   6529.io, and how they are checked against each other.
> - **Verification.** Every day, Rust, Python and 6529.io side by side.

> **The exact calculation has moved** *(at `#tdh-exact`)*
>
> The step-by-step calculation, with worked examples, now has its own page.
> [How TDH is calculated]

### 5.3 Diagram: "TDH in a minute"

Three panels in a row on desktop, stacked on phones, joined by "×" and "="
glyphs:

1. **Days.** A horizontal track from "Bought" to "Today 00:00 UTC" with 100
   small ticks grouped in tens; a dot marks the acquisition. Caption: "100
   whole days".
2. **Rate.** Two columns of small squares at the same scale: a tall column
   labelled "Largest edition, 3,941 copies" and a short one labelled "This
   card, 310 copies". A bracket between them reads "3,941 ÷ 310 = 12.71".
3. **Boost.** A horizontal meter from 1.00 to the schedule's ceiling, with a
   filled segment to 1.02 labelled "One Gradient".

Result chip: "= 1,296 TDH". Text version: "100 whole days × rate 12.71 =
1,271; × boost 1.02 = 1,296."

### 5.4 Interactive elements

- Explain my TDH and Try an example: unchanged.
- Verified daily strip: a link to the latest day; no interaction.

### 5.5 Data

- `/api/tdh/rules` (existing, for Current boosts).
- The profile TDH API (existing, for Explain my TDH).
- `index.json` (latest entry) for the strip, fetched on the server with the
  same loader as the dashboard (§11.3); the strip hides itself on error,
  because the overview must never fail on the dashboard's account.

### 5.6 Historic boosts (one addition)

> Boost schedule 1.4 is the schedule that TDH-v1, rule version `tdh-v1.0`,
> encodes. [P26 §10]

## 6. Page: How it works, `/network/tdh/how-it-works`

**Purpose.** Walk through one day's calculation in the order the computer
does it, each step with an example. **Audience.** Collectors who want to
understand and predict their number.

**Structure.** Fourteen numbered steps, each with plain words, an example,
and a collapsible "Exact rule" block. A left rail on desktop lists the steps
and highlights the one in view; on phones a "Steps" disclosure replaces it.

### 6.1 Copy

> **How TDH is calculated**
>
> This page follows one day's calculation in the order the computer does it.
> It describes TDH-v1, the exact rule 6529.io adopts at the cutover around 23
> October 2026; step 14 lists what changes from today. [D121, D132]
>
> Every number was computed with the reference implementation of the rule.
> The examples use the network as it stood on the 2026-10-11 cycle:
> the largest edition was FirstGM's 3,941 copies, 559 Memes were eligible in
> 17 seasons, and there were 101 Gradients and 1,000 NextGen tokens.
> [P26 §5.2, Replay 2026-10-11]

> **Step 1. One snapshot a day**
>
> TDH is computed once a day. Day N closes at 00:00 UTC, and the snapshot is
> the last Ethereum block before that moment. Ethereum offers a slot every 12
> seconds and 23:59:59 is always one of them, so the snapshot block is
> normally stamped 23:59:59; if that slot was empty, it is the block before.
> [P26 §4.1, §4.2]
>
> The calculation waits until Ethereum has finalized the next block, about 13
> to 20 minutes after midnight, so that no reorganisation can change the
> snapshot. [P26 §4.2, P53 §2]
>
> Example: the cycle of 15 October 2026 is cycle 20,741, the number of days
> since 1 January 1970. Its boundary is 00:00:00 UTC, Unix time
> 1,792,022,400. With the snapshot block stamped 23:59:59 on 14 October, ages
> are measured to 1,792,022,399. [P26 §4.1]
>
> Exact rule:
> ```text
> B = the block b on the finalized chain with ts(b) < M <= ts(b + 1)
> T = ts(B)        M = N × 86,400
> ```

> **Step 2. Whole days**
>
> A copy's age is the number of whole days between when you got it and the
> snapshot's time. Partial days do not count. [P26 §4.3]
>
> | Acquired before the snapshot | Whole days |
> | --- | --- |
> | 100 days and 23 hours | 100 |
> | 23 hours | 0, held but not yet counting |
> | exactly 24 hours | 1 |
>
> Ages are measured to the snapshot block's time, not to midnight, as 6529.io
> has always done. [P26 §4.3, DEV-17, D121]
>
> Exact rule: `days(a) = (T − a) div 86,400`

> **Step 3. Which cards count**
>
> The Memes, Gradients and NextGen count. A Meme or a Gradient counts once its
> first mint is at least one full day old; a NextGen token counts once
> minted. The clock starts at the very first mint, including the zero-copy
> mint by which a Manifold claim creates a card. Meme Lab, received xTDH,
> prices, REP and $6529 balances are not inputs. [P26 §2, §5.1, DEV-5]

> **Step 4. Every copy has a timestamp**
>
> For each card, each wallet keeps a list of acquisition times, one per copy.
> A copy received from someone else is stamped with the time of the transfer.
> When you send copies, they leave from the end of the list, which is
> normally your most recent purchase, so you keep your oldest copies: last in,
> first out. [P26 §7.1]
>
> Example: Wallet A bought three copies of a card 300, 200 and 100 days
> before the snapshot, and sold one 50 days before it.
>
> | | Copies left | Whole days |
> | --- | --- | --- |
> | Wallet A | 2 | 300 + 200 = 500 |
> | The buyer | 1 | 50, a fresh start |
>
> Minting debits nobody. Sending a copy to the zero address or to `0x…dEaD`
> is a burn: the copy stops counting for its holder, and the card's edition
> size does not shrink. [P26 §3.4, §5.2]
>
> Exact rule: P26 §7.1 pseudocode (the full block).

> **Step 5. Ownership is read between transactions** *(Decided · Rule text
> being finalised)*
>
> Ethereum only shows who owns what between transactions, so TDH looks at
> each transaction as a whole. Within one transaction, each wallet's
> movements of each card are netted, and only the net change counts. A copy
> that leaves a wallet and comes back inside one transaction never left. A to
> B to C inside one transaction counts as A to C. Movements in different
> transactions keep their order, even inside one block. [D131, D121]
>
> Example: Wallet A has held a copy for 300 days. Twenty days before the
> snapshot, one transaction sends it out and brings it back.
>
> | Rule | Wallet A's copy |
> | --- | --- |
> | Netted within the transaction (D131) | 300 days |
> | Every movement in order, without netting | 20 days, the age resets |
>
> This was the only kind of difference between the independent computation
> and 6529.io on 14 and 15 October 2026, in two identities each day. Netting
> makes them agree. [D131, Comparison 2026-10-14/15]

> **Step 6. Edition sizes**
>
> A card's edition is the number of copies minted. Burns do not reduce it.
> FirstGM is the one adjusted card: 6,529 minted, minus 2,588 copies from its
> recorded burn, gives 3,941. [P26 §3.4, §5.2, §10]
>
> A Meme with fewer than 300 copies minted is counted at the size its final
> top-up airdrop will bring it to: its claim's mint limit, at most 310. From
> 300 copies on, the minted count is the edition. [P26 §5.2]
>
> | Minted | Claim limit | Edition used | Rate |
> | --- | --- | --- | --- |
> | 149 | 332 | 310 | 12.71 |
> | 299 | 333 | 310 | 12.71 |
> | 300 | 333 | 300 | 13.14 |
> | 303 | 333 | 303 | 13.01 |
> | 309 | 329 | 309 | 12.75 |
>
> On the 2026-10-11 cycle only Meme 559 was below 300 copies (149 minted);
> Memes 206, 215 and 311 keep 309, 309 and 303 copies although their claims
> allow more. [P26 §5.2]

> **Step 7. Rates**
>
> The largest edition among eligible Memes sets the scale: H = 3,941. Each
> card's rate is H divided by its edition, rounded to cents. A Gradient's rate
> uses the number of Gradients and never falls below 1.00; a NextGen token's
> uses the size of its collection. [P26 §5.3, §8.1]
>
> | Card | Edition or count | Rate |
> | --- | --- | --- |
> | FirstGM | 3,941 | 1.00 |
> | A NextGen token | 1,000 in its collection | 3.94 |
> | A 310-copy Meme | 310 | 12.71 |
> | A 300-copy Meme | 300 | 13.14 |
> | A Gradient | 101 Gradients | 39.02 |
>
> Rounding detail: at an exact half cent, the computer's binary arithmetic
> decides, as 6529.io always has. A 200-copy edition would get 19.70, not
> 19.71. [P26 §8.1]
>
> Exact rule: `RATE(n, d) = HALFUP( B64( B64(n / d) × 100 ) )`

> **Step 8. Base TDH per card**
>
> Add up the whole days of your copies of a card, multiply by its rate, and
> round to a whole number. A copy with zero whole days adds nothing yet.
> [P26 §7.2, §8.2]
>
> Example: one copy of a 310-copy Meme held 100 days: 100 × 12.71 = 1,271.
>
> Rounding happens per wallet, per card. If two wallets of one collector each
> hold that card for one day, each rounds 12.71 to 13, so the collector has
> 26, not 25. [P26 §7.3]
>
> Exact rule: `BASE(r, raw) = (r × raw + 50) div 100`, rate `r` in cents.

> **Step 9. The boost**
>
> One multiplier applies to everything a collector holds. It starts at 1.00
> and grows with complete sets, complete seasons and Gradients. A copy counts
> for the boost from the moment you hold it, even before it has a whole day.
> [P26 §8.3]
>
> - **Gradients:** +0.02 each, up to 5 (+0.10). [P26 §10]
> - **Complete seasons:** +0.05 for each season you hold completely, for
>   seasons 1 to 20, except the current season, which starts paying once a
>   later season begins. [P26 §5.4, §8.3]
> - **Season 1, partly:** without the whole season, Memes 1, 2 and 3 (Genesis)
>   add +0.01 and Meme 4 (Nakamoto) adds +0.01. [P26 §8.3]
> - **A full set** of every eligible Meme replaces the season bonuses with
>   all of them at once, and each further full set adds a smaller bonus:
>   +0.05, then about +0.033, +0.021 and so on, approaching +0.144 in total.
>   [P26 §8.3]
>
> Examples on the 2026-10-11 cycle (17 seasons, so seasons 1 to 16 pay):
>
> | Holdings | Boost |
> | --- | --- |
> | Nothing that boosts | 1.00 |
> | 1 Gradient | 1.02 |
> | 5 Gradients (or 7: the cap is 5) | 1.10 |
> | Genesis and Nakamoto | 1.02 |
> | All of Season 2 | 1.05 |
> | All of Season 2, Genesis and Nakamoto | 1.07 |
> | All of Season 17, the current season, only | 1.00 |
> | One full set | 1.80 |
> | Every Meme except the newest one | 1.80 |
> | Two full sets | 1.85 |
> | Three full sets | 1.88 |
> | One full set and 5 Gradients | 1.90 |
> | 33 or more full sets and 5 Gradients, the highest on that cycle | 2.04 |
>
> "Every Meme except the newest" equals a full set on that day because the
> missing card is in the current season, which pays nothing yet, while
> seasons 1 to 16 are complete. Once 20 seasons pay, the highest boost the
> schedule allows is 2.24. The boost rounds to cents, and its rounding never
> meets a tie. [P26 §8.3]
>
> Exact rule: P26 §8.3 block, and `ADD(sets) = HALFUP(10^6 × 0.05 × (1 −
> 0.6529^(sets−1)) / (1 − 0.6529))` micro-units: ADD(2) = 50,000, ADD(3) =
> 82,645, ADD(n) = 144,051 from 33 sets on.

> **Step 10. Wallets and identities: consolidation**
>
> A collector can make several wallets count as one identity. Each wallet
> registers the other in the delegation contract under the consolidation use
> case (999), for The Memes or for all collections. One direction is pending;
> both directions confirm the link. Either wallet can revoke it. [P26 §6.1,
> §6.2]
>
> Under rule version `tdh-v1.0` an identity holds up to three wallets, and
> every pair of them must be confirmed. Groups are formed newest confirmed
> link first. [P26 §6.3, §10] *(See F1: this sentence changes if the
> four-wallet rule becomes a rule version.)*
>
> | Confirmed links, oldest to newest | Identities |
> | --- | --- |
> | A–B, B–C, A–C | A + B + C |
> | A–B, B–C (no A–C) | B + C, and A alone |
> | A–B, B–C, A–C, then C–D | C + D, then A + B |
>
> What consolidation changes [P26 §7.1, §7.3, §6.4]:
>
> 1. Your holdings add up across wallets, card by card.
> 2. The boost is computed on the combined holdings, so a set split across
>    wallets counts.
> 3. Moving a copy between your own wallets keeps its age. Example: a copy
>    held 300 days in Wallet A and moved to Wallet B 10 days ago counts 300
>    days if A and B are consolidated, and 10 if they are not.
> 4. Today's grouping applies to the whole history, including moves made
>    before the wallets were consolidated, as 6529.io always has.
>    [DEV-10, D121]
>
> Delegation is not consolidation. Delegations for other uses, their expiry,
> their token scope and their updates do not change TDH. [P26 §6.1, DEV-12]
>
> To set one up, follow the [consolidation guide].

> **Step 11. Final TDH**
>
> For each card, multiply its base by the boost and round to a whole number;
> your TDH is the sum. [P26 §8.4]
>
> Example: base 1,271 with boost 1.02 gives 1,296.42, so 1,296.
>
> Rounding detail: when the product ends in exactly .5, binary arithmetic
> decides, as on 6529.io: 25 × 1.14 = 28.5 gives 28. On the 2026-10-11 cycle
> 82 card values rounded down this way; exact decimal rounding would have
> added 82 TDH in total. [P26 §8.4, DEV-14, D121]
>
> Exact rule: `FINAL(base, beta) = HALFUP( B64( base × B64(beta / 100) ) )`

> **Step 12. A full example: one collector, two wallets**
>
> Wallet A and Wallet B belong to one collector and are consolidated. The
> snapshot is at 23:59:59 UTC. [P26 §7, §8]
>
> | Wallet | Card | Copies | Whole days per copy | Rate | Base |
> | --- | --- | --- | --- | --- | --- |
> | A | FirstGM | 2 | 200, 120 | 1.00 | 320 |
> | A | A 310-copy Meme | 1 | 0 (bought 5 hours earlier) | 12.71 | 0 |
> | A | Gradient 1 | 1 | 400 | 39.02 | 15,608 |
> | B | The same 310-copy Meme | 1 | 90 | 12.71 | 1,144 |
> | B | Gradient 2 | 1 | 30 | 39.02 | 1,171 |
> | B | A NextGen token | 1 | 365 | 3.94 | 1,438 |
>
> Boost: two Gradients, so 1.04 for the identity. Each wallet alone holds one
> Gradient, so 1.02.
>
> | Card, for the identity | Base | × 1.04 = final |
> | --- | --- | --- |
> | FirstGM | 320 | 333 |
> | The 310-copy Meme (2 copies) | 1,144 | 1,190 |
> | Gradient 1 | 15,608 | 16,232 |
> | Gradient 2 | 1,171 | 1,218 |
> | NextGen token | 1,438 | 1,496 |
> | **Total** | **19,681** | **20,469** |
>
> - **Not consolidated,** the wallets would score 16,246 and 3,828, together
>   20,074: consolidation adds 395 here, all from the shared boost.
> - **Tomorrow,** with no other change: 20,583, up 114. The daily rate is
>   1.04 × (1.00 + 1.00 + 12.71 + 39.02 + 39.02 + 3.94) = 100.56 TDH a day,
>   and the copy bought 5 hours before the snapshot starts counting.
>   [P26 §8.6]
> - **If Wallet B sold Gradient 2** before the snapshot: 18,880, down 1,589:
>   the card's own 1,218, and the boost falls from 1.04 to 1.02 on everything
>   else.

> **Step 13. Network totals**
>
> The network total is the sum over identities. The zero address and
> `0x…dEaD` keep records from burns, but they never count as participants or
> toward any share of the network. On the 2026-10-11 cycle the network had
> 10,280 identities, 11,130 wallets and 2,061,888,575 TDH under TDH-v1, of
> which the two sink records held 1,085,953. [P26 §8.5, DEV-13, D121, Replay
> 2026-10-11]

> **Step 14. What changes when 6529.io switches to TDH-v1**
>
> From about 23 October 2026, 6529.io shows the result of the validators' Rust
> core. [D132] The rule is the same as today's except where today's result
> depends on timing, database order or a failed refresh: [D121]
>
> - the snapshot block comes from the finalized chain, and the input must be
>   complete; [DEV-3, DEV-4]
> - edition floors are read at the snapshot block; [DEV-6]
> - Gradient and NextGen rates come from on-chain counts at that block; [DEV-7]
> - seasons come from a versioned list, not from editable metadata; [DEV-8]
> - movements in different transactions of one block keep their on-chain
>   order. On the 2026-10-11 cycle this was the only change to any value: two
>   identities, 241 TDH in total. [DEV-2, D121, D132]

### 6.2 Diagrams

1. **The pipeline** (top of page, also the step rail's backbone). A left to
   right flow: Ethereum logs → canonical order → holding stacks per wallet →
   whole days per copy → × rate → base per card → identity sums → × boost →
   final per card → total. Each node is labelled with its step number and
   links to it.
2. **The stack** (step 4). For one card and one wallet, a vertical stack of
   copy tiles, oldest at the bottom, each tile showing its age. A sale lifts
   the top tile and drops it on the buyer's stack with a fresh "0 days" tile.
3. **The transaction box** (step 5). One rounded rectangle labelled
   "Transaction". Inside, two arrows: Wallet A → Wallet C and Wallet C →
   Wallet A. Below it, the netted result: "Wallet A: net 0, age kept".
4. **Rate curve** (step 7). Rate (y) against edition size (x, logarithmic,
   100 to 4,000) as the curve 3,941 / E, with labelled points for FirstGM,
   NextGen, the 300 and 310 editions and Gradients (at 101). The floor appears
   as a flat segment: editions below 300 minted sit on the 310 point.
5. **Boost ladder** (step 9). A stacked horizontal bar from 1.00 to 2.24 with
   segments in order: seasons (0.05 each, 16 shown for the example cycle),
   extra full sets (0.144 approached), Gradients (0.02 × 5). A marker shows
   the current explorable value.
6. **Identity graph** (step 10). Wallet nodes; one-way registrations as
   dashed arrows; confirmed links as solid lines; each identity outlined.
   The three table rows are three small multiples.
7. **The household** (step 12). Two wallet columns feeding one identity
   column, each card a row with its base, and the boost applied at the
   identity.

### 6.3 Interactive elements

1. **Day counter** (step 2). Two date-time inputs in UTC (acquired, snapshot),
   output whole days, with the remainder shown as "and 23 h not yet counted".
2. **Stack simulator** (step 4). Buttons "Buy a copy", "Sell a copy", "Move
   to my other wallet" and a toggle "Wallets consolidated"; a day slider
   advances time. Shows both stacks and the raw days.
3. **Rate explorer** (step 6 and 7). Inputs: minted copies (1 to 5,000) and
   claim limit (0 to 400). Output: edition used, H / E and the rounded rate;
   a note appears when the floor or the half-cent rule applies.
4. **Boost builder** (step 9). Steppers for full sets (0 to 40) and Gradients
   (0 to 7), and checkboxes for complete seasons 1 to 17, Genesis and
   Nakamoto (disabled when a full set is chosen, with the reason). Output: the
   boost, and its parts as a ladder.
5. **Household walkthrough** (step 12). Four buttons: "As one identity", "As
   two wallets", "Tomorrow", "Sell Gradient 2", updating the table and total.

### 6.4 Data

None at runtime. The worked examples are constants in
`app/network/tdh/how-it-works/examples.ts`, with their expected values
tested in Jest (Appendix A).

## 7. Page: Specification, `/network/tdh/specification`

**Purpose.** P26 in readable form: the complete rule, with each section in
plain words beside its exact text. **Audience.** Builders, auditors and
curious collectors.

**Layout.** A table of contents in the left column (sticky on desktop, a
disclosure on phones). Each section has "In plain words" in the prose
column and "The rule" as rule blocks. Each section heading has a link
button. Anchors: `#s1` to `#s13`, subsections `#s5-2`, deviations `#dev-1`
to `#dev-19`, issues `#bug-1` to `#bug-15`, decisions `#d112` and so on,
evidence `#evidence-replay`, `#evidence-clean-room`, `#evidence-comparison`.

### 7.1 Copy

> **The TDH-v1 specification**
>
> TDH-v1 is the exact rule behind TDH, written so that independent programs
> produce identical results, to the last unit. It restates the formula
> 6529.io has always used. Where it departs from the old backend, it removes
> a dependence on timing, database order, editable data or floating-point
> evaluation, and section 11 lists each departure with its measured effect.
> [P26 header]
>
> Rule version `tdh-v1.0`. Specification P26, text of 15 October 2026. It is
> the rule 6529.io and every validator compute; its adoption as the consensus
> rule of the future chain remains the owner's decision. [D121, P26 header]
>
> Decided on 15 October 2026 and not yet in the text below: movements within
> one transaction are netted (section 7, D131).

> **1. Scope and conventions** `#s1`
>
> In plain words: TDH-v1 defines, for one day, each wallet's and each
> identity's balance, whole days, base, boost and final TDH for every eligible
> token, and the network totals. Ranks, xTDH, REP and upload files are out of
> scope. All arithmetic is on integers or exact fractions. Where the old
> backend's floating-point rounding matters, the rule names it exactly: `B64`
> is the nearest binary64 number, and it only decides ties. [P26 §1]
>
> The rule:
> ```text
> a div b    floor division
> HALFUP(x)  floor(x + 1/2), for rational x >= 0
> B64(x)     the IEEE-754 binary64 value nearest to x, ties to even; B64(0) = 0
> DAY        86,400 seconds
> SINKS      {0x0000000000000000000000000000000000000000,
>             0x000000000000000000000000000000000000dEaD}
> ```

> **2. Inputs** `#s2`
>
> In plain words: one day's inputs are Ethereum's canonical chain up to the
> snapshot block, every event of five contracts up to that block, and the
> rule version's parameter list. Prices, Meme Lab, received xTDH, REP and
> $6529 balances are not inputs. [P26 §2]
>
> | Role | Contract | Standard | Events used |
> | --- | --- | --- | --- |
> | The Memes | `0x33fd426905f149f8376e227d0c9d3340aad17af1` | ERC-1155 | `TransferSingle`, `TransferBatch` |
> | Gradients | `0x0c58ef43ff3032005e472cb5709f8908acb00205` | ERC-721 | `Transfer` |
> | NextGen core | `0x45882f9bc325e14fbb298a1df930c43a874b83ae` | ERC-721 | `Transfer` |
> | Delegation (consolidations) | `0x2202cb9c00487e7e8ef21e6d8e914b32e709f43d` | | Register and revoke, direct and through a sub-delegate |
> | Manifold lazy claim (edition floors) | `0x26bbea7803dcac346d5f5f135b57cf2c752a02be` | | `getClaimForToken`, read at the snapshot block |
>
> A disclosure "Event signatures" lists P26 §2's topic table verbatim.

> **3. Canonical events** `#s3`
>
> In plain words: every event is read exactly once, decoded strictly, and put
> in one order that everyone can reproduce: block, then transaction, then log,
> then position in a batch. A node that cannot show it has every event must
> not publish. A malformed event invalidates the day's input rather than
> being skipped. Zero-amount and self transfers move nothing but are kept,
> because a zero-amount mint is how a card is created. [P26 §3.1 to §3.3]
>
> Mints, burns and sinks: a mint comes from the zero address and debits
> nobody. A transfer to the zero address or `0x…dEaD` is a burn; the sinks
> receive records but are never debited. The FirstGM burn transaction is not
> credited to the zero address. Burns do not reduce edition sizes. [P26 §3.4]
>
> The rule:
> ```text
> order = ascending (block, txIndex, logIndex, batchPos)
> ```
> Decided by D131, text pending: within one transaction, each wallet's
> movements of each token are netted and applied at the transaction's
> position.

> **4. Day, snapshot and whole days** `#s4`
>
> In plain words: day N is the number of days since 1 January 1970; it closes
> at N × 86,400 seconds, 00:00 UTC. The snapshot block is the last block
> before that moment on the finalized chain, and the day has no result until
> the next block is finalized too. Ages are whole days measured to the
> snapshot block's time. Example: the upload dated 2026-10-11 is day 20,737,
> boundary 1,791,676,800. [P26 §4]
>
> The rule:
> ```text
> B = the block b on the finalized chain with ts(b) < M <= ts(b + 1)
> T = ts(B)
> days(a) = (T - a) div DAY
> ```
> The result binds (N, B, hash(B), T, rule version, registry hash).

> **5. Eligibility, editions, rates and seasons** `#s5`
>
> 5.1 Eligibility `#s5-1`. Memes and Gradients count when their first mint,
> of any amount, is at least `eligibility_min_age_s` (86,400 s) before T.
> NextGen tokens count when minted at or before B. `n_memes` is the number of
> eligible Memes, a count. [P26 §5.1]
>
> 5.2 Editions and floors `#s5-2`. Burns do not reduce an edition. FirstGM's
> edition is adjusted by −2,588. A Meme with fewer than 300 copies gets a
> floor, its claim's `totalMax` capped at 310, and its edition is the larger
> of the floor and the minted count, because the final top-up airdrop takes
> it to 310, above the Nakamoto Threshold of 300. From 300 copies on there is
> no floor. A Meme with no claim has no floor. A Meme with an effective edition of 0 is eligible but has no
> rate, and holding a copy of it makes the input invalid. [P26 §5.2]
> ```text
> minted[i]  = sum of mint amounts of Meme i in blocks <= B
> adj[i]     = -2588 if i = 8 (FirstGM), else 0
> floor[i]   = min(totalMax_i, 310) if minted[i] + adj[i] < 300 and totalMax_i > 0, else 0
> E[i]       = max(minted[i] + adj[i], floor[i])
> H          = max(E[i] over eligible Memes), or 0 if none
> ```
>
> 5.3 Rates `#s5-3`. Meme i: `RATE(H, E[i])`. Gradient: `RATE(H, G)`, at
> least 1.00, G = Gradients minted at or before B. NextGen token t:
> `RATE(H, N_c)`, c = t div 10^10, N_c = tokens of collection c minted at or
> before B. With no eligible Meme, H = 0: Gradients get 1.00 and NextGen 0.
> [P26 §5.3]
>
> 5.4 Seasons `#s5-4`. Seasons come from a versioned list of first Meme ids:
> 1, 48, 87, 119, 152, 181, 213, 246, 279, 311, 343, 375, 407, 439, 477, 516,
> 556. A season is listed for a day when its first id is at most `n_memes`;
> the highest listed is current. Seasons 1 to 20 carry a 0.05 bonus; a
> season pays when it is not current and its bonus is positive. A new season
> must be added, as a new rule version, before its first card becomes
> eligible. [P26 §5.4, §10]

> **6. Consolidation** `#s6`
>
> 6.1 Events `#s6-1`. Only delegation events with use case 999, for The Memes
> or the all-collections address `0x8888…8888`, between two different
> wallets, count. Expiry, `allTokens`, token id and update events are
> ignored. [P26 §6.1]
>
> 6.2 Pair state `#s6-2`. Each unordered pair of wallets has at most one row.
> ```text
> REGISTER(a, b):
>   no row                -> row (a, b, pos, false)
>   row (a, b, ...)       -> unchanged
>   row (b, a, ...)       -> row (b, a, pos, true)     # confirms or refreshes
> REVOKE(a, b):
>   no row                -> unchanged
>   row (a, b, _, true)   -> row (b, a, pos, false)
>   row (a, b, _, false)  -> delete
>   row (b, a, ...)       -> row (b, a, pos, false)
> ```
> The collection does not partition the state. [P26 §6.2, DEV-12]
>
> 6.3 Identities `#s6-3`. Confirmed pairs, newest first, grow cliques of at
> most 3 wallets in which every pair is confirmed; a wallet joins at most one.
> [P26 §6.3] (Rule block: the P26 §6.3 pseudocode, verbatim.)
>
> 6.4 and 6.5 `#s6-4`. The grouping after all events up to B applies to the
> whole history of the day's calculation. An identity's key is its sorted
> lowercase addresses joined by `-`. [P26 §6.4, §6.5, DEV-10]

> **7. Holdings** `#s7`
>
> In plain words: replay every transfer in canonical order, keeping a list of
> acquisition times per wallet and token; sends take from the end; age
> carries only between wallets of one identity. Base per token is rounded per
> wallet; an identity's base is the sum of its wallets' bases, never
> recomputed from merged days. A wallet has a record when it holds an
> eligible token or belongs to a group; an identity has a record when one of
> its wallets does. [P26 §7]
> ```text
> if from = to or amount = 0: skip
> moved = none
> if from not in SINKS:
>     if len(stack[from]) < amount: input invalid
>     moved = last `amount` entries of stack[from]; remove them
> if to in SINKS:
>     unless to = ZERO and txHash = firstgm_burn_tx:
>         append amount copies of timestamp to stack[to]
> elif moved is not none and cluster(from) = cluster(to):
>     append moved to stack[to]                 # age carries inside an identity
> else:
>     append amount copies of timestamp to stack[to]
>
> balance = len(stack)
> raw     = sum(days(a) for a in stack if days(a) > 0)
> base    = BASE(rate, raw)
> ```
> Decided by D131, text pending: the replay applies each transaction's net
> change per wallet and token.

> **8. Arithmetic and scores** `#s8`
>
> 8.1 Rate `#s8-1`. `RATE(n, d) = HALFUP(B64(B64(n / d) × 100))`. It equals
> half-up of 100n/d except at an exact half cent; with H = 3,941 that happens
> only for editions 8, 40, 56, 200, 280 and 1,400. [P26 §8.1]
>
> 8.2 Base `#s8-2`. `BASE(r, raw) = (r × raw + 50) div 100`, equal to the old
> two-step rounding. [P26 §8.2]
>
> 8.3 Boost `#s8-3`. A record holds a token when the token is eligible and
> the balance is positive, whatever the copies' ages. (Rule block: the P26
> §8.3 pseudocode, verbatim.) ADD(2) = 50,000, ADD(3) = 82,645, ADD(n) =
> 144,051 for n ≥ 33; the cent rounding never meets a tie. [P26 §8.3]
>
> 8.4 Final `#s8-4`. `FINAL(base, beta) = HALFUP(B64(base × B64(beta /
> 100)))` per token; a record's final is the sum. Ties round down only for
> some boosts and some bases, the smallest being base 25 at 1.14. [P26 §8.4]
>
> 8.5 Totals `#s8-5`. The total is the sum of identity finals; a second total
> excludes the zero and dead identities, which never enter any consensus
> weight. [P26 §8.5]
>
> 8.6 Daily rate `#s8-6`. `rate_e4 = beta × sum(rate of each copy with at
> least one whole day)`, in 10^-4 TDH a day; derived data. [P26 §8.6]
>
> 8.7 Range `#s8-7`. A day is inside the `tdh-v1.0` range when H, G, every
> N_c, every base × beta and the total are below 2^53; outside it there is no
> result. Inside it, hardware binary64 and exact emulation agree. [P26 §8.7]

> **9. The day's output** `#s9`
>
> The header (N, B, hash(B), T, rule version, registry hash), and per identity
> its key, wallets, boost and final, with per-token balance, raw, base and
> final. The per-token final is what card-set credit uses. Wallet records,
> daily rates and totals are derived. [P26 §9]

> **10. Parameters** `#s10`
>
> Every number the rule uses is a parameter of the rule version. Changing any
> of them makes a new rule version with its own start day. [P26 §10]
>
> Table: every row of P26 §10 (name, value, what it does), without the
> provenance column, plus:
>
> Registry hash of `tdh-v1.0`:
> `0x74b4a8f96e3f1fbc3f44167bb42f0a18effb7a0f49d12bc8b88cdb3784c663d3`
> (recomputed with the Python reference for this plan). [P26 §10]

> **11. Where TDH-v1 differs from the old backend** `#s11`
>
> Nineteen differences, each listed with what the old backend did, what
> TDH-v1 does, the measured effect and the decision. Only one changed any
> value on the replayed cycle: DEV-2. [P26 §11, D121]
>
> Table columns: ID, Old backend, TDH-v1, Effect measured on 2026-10-11,
> Decision. Rows from Appendix B, with these decisions:
> DEV-2 "TDH-v1's order (D121); within a transaction, netting (D131)";
> DEV-10, DEV-12, DEV-14, DEV-17 "Old behavior kept (D121)"; DEV-13 "Sink
> records kept, excluded from consensus weight (D121)"; all others
> "Adopted; no value changed on the replayed cycle (D121)". Filter chips:
> "Changes values", "Kept as before", "All".

> **12. Issues found in the old backend** `#s12`
>
> Fifteen issues the work on TDH-v1 found in the old backend's calculation,
> each with the TDH-v1 rule that removes it. [P26 §12] Table: ID, the issue
> in plain words, fixed by (Appendix B).

> **13. Conformance** `#s13`
>
> A program conforms when it reproduces every one of the 36 conformance
> vectors and, for a real day, the reference implementation's output from
> the same inputs. The Python reference, the Rust core and program B pass all
> 36. [P26 §13, Clean room 2026-10-11] See [Implementations].

> **Decisions referenced** `#decisions`
>
> - **D112** `#d112` Validator v1 agrees on TDH once a day, peer to peer:
>   each validator computes TDH-v1 with the Rust core, signs the result and
>   compares it with 6529.io.
> - **D116** `#d116` The validator code is licensed under Apache 2.0 and is
>   published, with the TDH-v1 core and the conformance vectors, before the
>   first outside operator runs it.
> - **D118** `#d118` Every validator checks each block's events against
>   Ethereum's block headers, and the headers against a finalized block its
>   own light client follows; a node that cannot complete the checks does not
>   sign.
> - **D119** `#d119` Two separately written programs, A and B, prove each
>   day's result from Ethereum's own history in two different zero-knowledge
>   virtual machines.
> - **D121** `#d121` One TDH formula everywhere: 6529.io, its backend and the
>   validators compute identical TDH with the validators' Rust core; the
>   open deviations are settled as listed in section 11.
> - **D122** `#d122` 6529 runs its own Ethereum node.
> - **D125** `#d125` Every validator computes TDH with two separately written
>   implementations before it signs, and does not sign if they disagree;
>   anyone can add the Python reference as a third.
> - **D128** `#d128` A minimal Ethereum contract records a day's result once
>   both programs' proofs verify; built and tested, deployed only when the
>   owner approves.
> - **D130** `#d130` A new validator may take the TDH history from the
>   network's agreement, or check all of it itself.
> - **D131** `#d131` Ownership is read at transaction boundaries: each
>   wallet's movements of each token within one transaction are netted.
> - **D132** `#d132` From 16 October 2026 the Rust core and the Python
>   reference run daily beside 6529.io's backend and are shown side by side;
>   6529.io switches to the Rust result about one week later, around 23
>   October 2026.

> **Evidence** `#evidence`
>
> - **Replay of 2026-10-11** `#evidence-replay`. From the live per-token
>   inputs, TDH-v1 reproduces all 132,481 wallet-token bases and every wallet
>   and identity value. From the 388,335 indexed transfers it reproduces
>   10,278 of 10,280 identities and 11,128 of 11,130 wallets; the two others
>   are a token sent out and back in one transaction (DEV-2, −241 TDH in
>   total). The cycle's raw logs equal the indexed rows (69 of 69). A full
>   replay from raw logs since 2021 was not run.
> - **Clean room, 2026-10-11** `#evidence-clean-room`. A second Rust
>   implementation written from the specification alone found 23 places
>   where it had to guess (2 high, 11 medium, 10 low). Each now has a rule in
>   P26 and vectors that pin it.
> - **Comparison of 14 and 15 October 2026** `#evidence-comparison`. From
>   independent inputs (Ethereum logs, history not yet fully checked), the
>   Rust core reproduced, each day, 10,280 of 10,282 identities and 11,131 of
>   11,133 wallets of 6529.io's published files in every field. The two others
>   were tokens sent out and back within one transaction, class A (DEV-2),
>   which D131's netting settles.

### 7.2 Diagrams

1. **Section map** at the top: P26 §2 inputs → §3 events → §4 snapshot → §5
   eligibility and rates → §6 identities → §7 holdings → §8 scores → §9
   output, with §10 parameters feeding §5 to §8. Each box links to its
   section.
2. **Pair state machine** (§6.2): three states (no row; pending a→b;
   confirmed), arrows labelled REGISTER and REVOKE as in the table.
3. **Clique growth** (§6.3): the three examples from How it works, step 10.

### 7.3 Interactive elements

- Table of contents with scroll spy; a link button per heading that copies
  the section URL.
- Copy buttons on rule blocks and on the registry hash and addresses.
- Deviation table filter chips.
- The decisions list and evidence blocks are anchors that source chips on
  every page link to.

### 7.4 Data

None. The page is static content pinned to the P26 text of 15 October 2026.
Updating it is a deliberate content change in this repository, reviewed
against the new P26 text.

## 8. Page: Formal model, `/network/tdh/formal`

**Purpose.** Explain the Lean 4 model of TDH-v1, what its proofs guarantee
and what they do not. **Audience.** Engineers and auditors, and collectors
who want to know what "formally verified" would and would not mean.
**Status.** In progress (F9). The whole page carries the In progress pill
under its H1.

### 8.1 Copy

> **Formal model**
>
> *In progress.* We are writing TDH-v1 a third way: as a precise
> mathematical model in Lean 4, a programming language in which a computer
> checks every step of every proof. This page explains what the model
> contains, what its proofs will establish and what they will not.

> **Why write the rule again**
>
> Plain English can be read two ways. When a second implementation was
> written from the specification alone, it found 23 places where it had to
> guess; two of them were rated high, because the two readings give
> different results. Each now has an exact rule.
> [Clean room 2026-10-11] A formal model leaves no such room: every term has
> exactly one meaning, and the computer rejects a proof with a gap.

> **What the model contains**
>
> The Lean model defines the same steps as the specification, one module per
> section: decoding and order (§3), the snapshot and whole days (§4),
> eligibility, editions, rates and seasons (§5), pair state and identities
> (§6), holdings (§7) and the arithmetic and scores (§8). Its definitions run:
> the model computes TDH for a given input, so it can be tested on the same
> 36 conformance vectors as every other implementation.

> **What the proofs will state**
>
> Each statement below is planned. The status column changes to Proved only
> when Lean's kernel accepts the proof with no gaps.
>
> | Statement | In plain words | Rule | Status |
> | --- | --- | --- | --- |
> | Order independence | The result depends only on which events are in the input, not on the order in which they arrive. | P26 §3.3 | Planned |
> | Copies are conserved | For every card, the accounting neither creates nor loses copies except where the rule says so: mints add copies, the FirstGM burn is not credited, and the two sinks are never debited. | P26 §3.4, §7.1 | Planned |
> | Netting | A copy that leaves a wallet and returns within one transaction leaves that wallet's holdings unchanged; A to B to C in one transaction equals A to C. | D131 | Planned |
> | Age stays with its identity | A copy keeps its acquisition time when it moves between wallets of one identity, and only then. | P26 §7.1 | Planned |
> | Last in, first out | A send removes the most recently added entries of the sender's list. | P26 §7.1 | Planned |
> | Whole days | A copy's whole days are never negative, and never fall from one day to the next while it stays. | P26 §4.3 | Planned |
> | Rounding equalities | BASE equals the old two-step rounding; RATE and FINAL equal half-up except at exact ties; ADD(2) = 50,000, ADD(3) = 82,645 and ADD(n) = 144,051 from 33 sets; the boost's rounding never meets a tie. | P26 §8 | Planned |
> | Boost bounds | Under `tdh-v1.0` the boost is between 1.00 and 2.24. | P26 §8.3, §10 | Planned |
> | Identities | Every identity is a group of at most three wallets in which every pair is confirmed both ways, and no wallet belongs to two. | P26 §6.3 | Planned |
> | Identity sums | An identity's base is the sum of its wallets' bases, and its TDH is the sum of its per-token values. | P26 §7.3, §8.4 | Planned |
> | Range | Inside the `tdh-v1.0` range every value fits in 64 bits, and binary64 evaluation equals the exact rule. | P26 §1, §8.7 | Planned |
> | Conformance | The model reproduces all 36 conformance vectors. This is checked by running them, not by proof. | P26 §13 | Planned |

> **What the proofs will not guarantee**
>
> - **That the English text says the same thing.** People check that the
>   model matches the specification; a disagreement is fixed in one or the
>   other and recorded.
> - **That the Rust and Python programs match the model on every input.**
>   They are checked against the same 36 vectors and against each other every
>   day, but no machine-checked proof links their code to the model.
> - **That the inputs are right.** Whether a day's Ethereum events are
>   complete and genuine is checked by other means: every validator checks
>   events against Ethereum's block headers (D118), and two separately
>   written programs prove each day's result from Ethereum's history (D119).
> - **That the rule is the right rule.** A proof shows the rule does what it
>   says, not that it is fair or wise. Rule changes are owner decisions.
> - **Lean itself.** The proofs rely on Lean's small kernel and its standard
>   axioms. A proof that admits a gap is not counted as proved, and the table
>   shows it.

> **How you will be able to check**
>
> The model is published with the validator code. Anyone with Lean installed
> can rebuild it, which re-checks every proof, and run the vectors through it.
> Source to be published. [D116]

### 8.2 Diagram: three layers of assurance

Three horizontal bands, top to bottom:

1. **The specification** (P26, English).
2. **The Lean model**: definitions plus proved statements.
3. **The programs**: Rust core, program B, Python reference.

Between 1 and 2: a dashed connector labelled "checked by people". Between 2
and 3: a connector labelled "36 shared vectors; daily agreement". A side
column labelled "Inputs" points into band 3 with "Checked reads (D118) and
proofs A and B (D119)". The legend states which links are machine-checked
(only the proofs inside band 2).

### 8.3 Interactive elements

- Statement table: each row expands to show the Lean statement (mono, as
  published in the manifest) and the P26 text it formalises. Filter by
  status.
- Status pill per row (Planned, Stated, Proved, Gap).

### 8.4 Data

Optional `{base}/formal/manifest.json` (§11.5). Without it, the table
renders the planned statements above with Planned. With it, the table
renders only what the manifest lists, so the page can never show a statement
as proved that the build did not prove.

## 9. Page: Implementations, `/network/tdh/implementations`

**Purpose.** Show who computes TDH, how each implementation was written, and
how they are checked against each other. **Audience.** Engineers, operators,
auditors.

### 9.1 Copy

> **Implementations**
>
> TDH-v1 is one written rule and several programs, written separately from
> the same text. They are checked against the same test cases and against
> each other every day, so a mistake in one shows up as a difference.

> **The programs**
>
> | | Rust core | Program B | Python reference | 6529.io backend today |
> | --- | --- | --- | --- | --- |
> | Language | Rust, standard library only, integers only | Rust, standard library plus a pinned Keccak crate, integers only | Python 3.10 or later, standard library only, no floating point | TypeScript |
> | Written from | P26 and the vectors alone, in a clean room; then made into a library with no rule changed | The specifications alone, in a separate clean room that never read the Rust core, the Python reference or the other Rust code | Written alongside P26 as its reference | 6529.io's original calculation |
> | Runs in | Every validator [D112]; 6529's daily job from 16 October [D132]; 6529.io from the cutover [D121, D132]; proof program A [D119] | Every validator, as the second check before it signs [D125]; proof program B, in a second zero-knowledge virtual machine [D119] | 6529's daily job [D132]; any validator, as an optional third check [D125] | 6529.io until the cutover, about 23 October 2026 [D132] |
> | Conformance | All 36 vectors (609 checks) | All 36 vectors, every normative block | All 36 vectors | Measured against TDH-v1 by replay and the daily comparison |
> | Speed, one full day | 0.6 s on one core | Not yet published | 4.3 s | |
> | Source | Source to be published [D116] | Source to be published [D116] | Source to be published | |
>
> Sources for the table: [P53 §4.5, P52 §3.4, §3.7, D119, D125, D132]
>
> A fifth, the Lean model, is in progress. [Formal model]

> **How each was written**
>
> The Python reference came first, written with the specification. Then a
> separate Rust implementation was written from the specification alone,
> without reading the Python, and it listed every place where it had to
> guess: 23 in all. The specification now has an exact rule for each, and the
> vectors pin them. [Clean room 2026-10-11] That Rust implementation became
> the validators' core without any change to its rules; every copied file is
> pinned by its hash. Program B was written later, in a separate clean room,
> from the specifications only. [D119]

> **How they are checked**
>
> 1. **Conformance vectors.** 36 small cases, each with the exact values the
>    rule must produce: zero holdings, editions, transfers inside one block,
>    consolidation carry, burns, FirstGM, floors, boost tiers, rounding ties,
>    malformed events, and inputs that must produce no result. Vectors 1 to
>    18 were derived by hand; 19 to 35 were generated by the reference and
>    their derivations checked by hand. Every implementation must pass all
>    of them. [P26 §13]
> 2. **Differential replays.** Whole days run through more than one
>    implementation and compared with 6529.io's published values. The
>    2026-10-11 replay reproduced 10,278 of 10,280 identities; the two others
>    are explained (DEV-2). [Replay 2026-10-11]
> 3. **The dual run in every validator.** Before it signs, a validator
>    computes TDH with the Rust core and with program B. If they disagree on
>    any value, it does not sign and raises an alarm. [D125, P53 §4.5]
> 4. **The daily comparison.** From 16 October 2026, 6529 runs the Rust core
>    and the Python reference every day beside 6529.io's backend and
>    publishes the three results. [D132] [Verification]
> 5. **Proofs.** Programs A and B are being built to prove each day's result
>    from Ethereum's own history in two different zero-knowledge virtual
>    machines; a minimal Ethereum contract that records proven results is
>    built and tested on a copy of mainnet and is not deployed. [D119, D128]
>
> After the cutover, 6529.io runs the Rust core itself, so comparing the two
> no longer tests the computation, only its publication. The independent
> checks are then the Python reference and program B. [P53 §4.5]

> **Latest daily agreement** *(card, from `index.json`)*
>
> Cycle {cycle}, {date}: Rust and Python agree on {n} of {total} identities.
> Rust and 6529.io: {m} of {total}. [Open the dashboard]

### 9.2 Diagrams

1. **Lineage.** Three source documents on the left (P26 and vectors; P27,
   P28, P52 and P53; the old backend). Arrows to: Python reference (from P26);
   clean-room Rust (from P26 and vectors only, with a wall icon and "did not
   read the Python") → Rust core (arrow labelled "made into a library, no
   rule changed, hash-pinned"); program B (from all specifications, wall
   icon: "did not read the Rust core, the Python or the clean-room Rust").
   The old backend sits apart, with a dashed arrow "replaced at the cutover"
   to the Rust core.
2. **Where each runs.** A matrix: columns Validator signing, Daily job,
   6529.io, Proof program; rows the four implementations; filled cells as in
   the table; the 6529.io cell for the Rust core labelled "from about 23
   October 2026".
3. **The check web.** The 36 vectors in the centre, the three implementations
   around them with "36 / 36" on each spoke; outer arcs labelled "dual run",
   "daily comparison", "proofs A and B".

### 9.3 Interactive elements

- **Vector browser.** The 36 vectors (Appendix C) as a filterable list by
  topic (holdings, consolidation, editions and rates, boosts, rounding,
  decoding, no result). Each row shows the name and what it covers. The vector
  files are not downloadable until the source is published.
- **Latest daily agreement** card, linking to the day.

### 9.4 Data

Static content, plus `index.json` (latest entry) for the agreement card,
through the shared loader (§11.3). The card hides on error.

## 10. Page: Verification, `/network/tdh/verification`

**Purpose.** A public, daily, three-way comparison of TDH: the Rust core,
the Python reference and 6529.io, with every difference shown with its class
and cause and never with a holder's identity. **Audience.** Anyone who wants
evidence rather than assurance.

### 10.1 Layout, top to bottom

1. H1, lede, and the sample banner when sample data is shown.
2. **Today** status band: verdict pill, cycle and date, snapshot block, mode
   pill, and the cutover card on the right (stacked below on phones).
3. **Agreement tiles:** identities (Rust vs 6529.io), wallets (Rust vs
   6529.io), Rust vs Python, total TDH difference.
4. **Side by side** table: three implementation columns.
5. **Differences** table.
6. **History:** the chart, with its data table.
7. **How this works:** method, classes, honest labels, raw data links.

The day permalink page uses the same components for one day, with previous
and next day links and a "Latest" link.

### 10.2 Copy

> **TDH verification**
>
> Every day, the TDH of every collector is computed three ways and compared:
> by the validators' Rust core, by the Python reference, and by 6529.io's
> current backend. This page shows the results, including every difference
> and its explanation. Holders are never named. [D132, P53 §12]

> **Sample banner** *(non-production builds without a data source)*
>
> **Sample data, not a measurement.** The Rust and 6529.io figures are from
> the independent comparison of 14 and 15 October 2026. The Python figures
> are copied from Rust to show the layout and were not computed.

> **Status band**
>
> {verdictPill} · Cycle {cycle} · Snapshot {date}, 00:00 UTC · Block
> {cutoffBlock}
>
> Verdict pills: Equal ("Every identity and wallet is equal in all three."),
> Explained ("Every difference has a known cause."), Investigating ("At least
> one difference is not yet explained."), Mismatch ("Rust and Python
> disagree, or a defect was found. Validators would not sign this result."),
> Pending ("Waiting for 6529.io's published files.").
>
> Mode pill, `unchecked-history`: **Not yet fully checked.** Expanded:
> "History read from Ethereum logs, not yet fully checked. The snapshot block
> and the edition floors are checked against Ethereum. The history before them was read from a public Ethereum log
> service and is taken as reported. When 6529's own Ethereum node has
> finished syncing, every block's events will be checked against Ethereum's
> block headers, and this label will change." [D118, D122, P53 §11]
>
> Mode pill, `checked`: **History fully checked.** Expanded: "Every event
> since the first Gradient transfer was checked against Ethereum's block
> headers." [D118]

> **Cutover card**
>
> Before the date: **Cutover in {n} days.** "About 23 October 2026, 6529.io
> switches to the Rust core's result, the computation every validator runs."
> [D132, D121]
>
> On or after the date, not yet done: **Cutover due.** "This card changes
> when 6529.io has switched."
>
> Done: **Switched on {date}.** "Since cycle {cycle}, 6529.io shows the Rust
> core's result. Comparing the two now checks publication; the Python
> reference is the independent check." [P53 §4.5]

> **Agreement tiles**
>
> - Identities equal, Rust and 6529.io: **{a} of {b}** ({pct})
> - Wallets equal, Rust and 6529.io: **{a} of {b}** ({pct})
> - Rust and Python: **{a} of {b}** identities equal. When Python did not
>   run: "Python reference not run this day."
> - Total TDH, Rust minus 6529.io: **{delta}** ("−240" on the sample days)
>
> After the cutover the first two tiles move below the Rust and Python tile,
> and their caption reads "Publication check".

> **Side by side**
>
> | | Rust core | Python reference | 6529.io |
> | --- | --- | --- | --- |
> | Total TDH | | | |
> | Identities | | | |
> | Wallets | | | |
> | Cycle root | | | Not published |
> | Wallet root | | | Not published |
> | History root | | | Not published |
> | Code version | {commit} | {commit} | |
> | Run time | {s} | {s} | |
> | Source | | | 6529.io's upload, {short id} |
>
> A missing value shows "Not yet published" (roots, commits, run times) or
> "Not run" (a whole implementation).

> **Differences**
>
> Lede: "A difference is any record whose values are not equal in every
> field. Each one gets a class and, when known, a cause. Holders are shown
> as labels only." [P38 §3.3]
>
> Empty state: "No differences on this day."
>
> Columns: Label, Kind (Identity, Wallet), Field, Rust, Python, 6529.io,
> Rust − 6529.io, Class, Cause. A row expands to the cause's explanation
> (Appendix B) and, for DEV-2, the transaction-box diagram from How it
> works.
>
> Classes:
> - **A, deliberate:** explained by a deliberate difference between TDH-v1
>   and the old backend (a DEV item).
> - **B, old bug:** explained by a known issue in the old backend (a BUG
>   item).
> - **C, our defect:** a defect in the new software, for example Rust and
>   Python disagree.
> - **D, not yet explained:** every difference starts here until it is
>   classified.
> Class A and B differences are explained, not accepted: the owner still
> decides what to do with each. [P38 §3.3.1]

> **History**
>
> Title: "Agreement over time". Caption: "Identities equal between Rust and
> 6529.io, and the total TDH difference, per day." A "Show as table" toggle
> shows the same data as a table: date, cycle, verdict, identities equal,
> total TDH for each implementation.

> **How this works**
>
> 1. **The same snapshot.** All three use the snapshot block of the day,
>    the last Ethereum block before 00:00 UTC. [P26 §4.2]
> 2. **Independent inputs.** The Rust core and the Python reference read the
>    day's events from Ethereum and compute TDH-v1. 6529.io's values come
>    from the files it publishes every day on Arweave. 6529.io's values are
>    the object under test, never an input. [P53 §12]
> 3. **Exact comparison.** Every field of every identity and wallet is
>    compared for exact equality, with no tolerance. [P53 §12]
> 4. **Classification.** Each difference is classified A to D. [P38 §3.3]
> 5. **After the cutover** 6529.io runs the Rust core, so their agreement
>    shows that what is published is what was computed. The Python reference
>    stays the independent check of the computation. [P53 §4.5, D132]
>
> Validators run the same comparison on their own, after they have signed,
> so 6529.io's values can never influence their vote. [P53 §12]
>
> Raw data: "Download this day as JSON" and "Download the index as JSON",
> linking to the published files.

> **States**
>
> - Production, no data source configured, or an empty index: "Daily reports
>   start on 16 October 2026. The first appears here after its run." [D132]
> - Data source unreachable or invalid: "The verification data could not be
>   loaded. It is published as static files; try again in a few minutes."
>   with a Retry button, and the last good day if the index loaded.
> - Unknown day on a permalink: the standard not-found page.

### 10.3 Diagrams and charts

1. **Daily flow** (in How this works): Ethereum → two boxes, Rust core and
   Python reference → Compare ← 6529.io backend → its Arweave upload; Compare
   → Published JSON → this page. After the cutover a dashed line runs from
   the Rust core into the 6529.io box, labelled "same code since {date}".
2. **History chart.** chart.js through the existing `react-chartjs-2`, loaded
   with `next/dynamic` and `ssr: false`, behind the server-rendered table.
   Two panels sharing the date axis: top, identities equal as a percentage
   (axis 99.90% to 100%, since every value so far is above 99.9%; the axis
   floor drops automatically to include the minimum); bottom, total TDH
   Rust minus 6529.io as bars around zero. Points are coloured by verdict;
   tooltips on hover and focus; the cutover drawn as a vertical rule.
3. **Delta bars** in the differences table: a small bar per row proportional
   to Rust − 6529.io, signed, with the number beside it.

### 10.4 Interactive elements

- Day picker (previous, next, latest; a select of dates on desktop).
- Class filter chips over the differences (A, B, C, D, All), counts on each.
- Expandable difference rows.
- Mode and verdict pills expand their explanations (disclosure buttons).
- History chart and table toggle; keyboard focus moves through points.
- Copy buttons for roots and the upload id.

### 10.5 Data

`index.json` and `days/{cycleDay}.json` from
`NEXT_PUBLIC_TDH_VERIFICATION_BASE` (§11). Server components fetch and
validate; client islands receive plain props.

## 11. Verification data contract

### 11.1 Base URL

- New public env var `NEXT_PUBLIC_TDH_VERIFICATION_BASE`, added to
  `publicEnvSchema` in `config/env.schema.ts` as an optional URL. It must be
  `https:`; `http://localhost` is accepted only outside production.
- The loader joins paths with `new URL(path, base)`, so a stray path in the
  data can never point elsewhere.
- CSP: `connect-src` already allows `https:`; the loader runs on the server
  anyway, so no CSP change is needed. Download links are plain anchors.

### 11.2 Schema (as given, with optional additions)

Validated with zod at the loader boundary. Unknown fields are ignored.
Additions are optional, so the daily job can ship with the schema as given.

```ts
// index.json
{
  days: Array<{
    cycleDay: number;            // N
    date: string;                // YYYY-MM-DD, the date whose 00:00 UTC closes the cycle
    verdict: Verdict;
    identitiesEqual: number;     // Rust vs 6529.io
    identitiesTotal: number;
    totalTdh: { rust: number; python: number | null; live: number | null };
  }>;
  cutover?: { plannedDate: string; status: "planned" | "done"; cycleDay?: number }; // addition
}

// days/{cycleDay}.json
{
  cycleDay: number; date: string; cutoffBlock: number;
  mode: "unchecked-history" | "checked";
  implementations: {
    rust: Impl;
    python: Impl | null;                          // addition: null when not run
    live: { source: string | null;               // "arweave:<tx>"
            totalTdh: number | null; identities: number | null; wallets: number | null } | null;
  };
  agreement: { rustVsPython: Agreement | null; rustVsLive: Agreement | null };
  differences: Array<{
    label: string;                               // "holder-1"; must match /^holder-\d+$/
    kind: "identity" | "wallet";
    fields: Array<{ name: string; rust: number | null; python: number | null; live: number | null }>;
    class: "A" | "B" | "C" | "D";
    cause: string | null;                        // "DEV-2", "BUG-5", ...
  }>;
  verdict: Verdict;
}
Impl = { commit: string | null; totalTdh: number; identities: number; wallets: number;
         cycleRoot: string | null; walletRoot: string | null; historyRoot: string | null;
         runtimeMs: number | null };
Agreement = { identitiesEqual: number; identitiesTotal: number; walletsEqual: number; walletsTotal: number };
Verdict = "equal" | "explained" | "investigating" | "mismatch" | "pending";   // addition: the enum
```

Rules for the publisher (the daily job), stated here so the page can rely on
them:

1. `verdict`: `equal` when every comparison is equal; `explained` when every
   difference is class A or B; `investigating` when any is class D;
   `mismatch` when any is class C or Rust and Python differ; `pending` when
   6529.io's files are not yet available. Unknown strings render as a neutral
   "See details" pill.
2. No address, ENS name, handle, token id or transaction hash appears in any
   file. Labels are `holder-1`, `holder-2` and so on, numbered per day; an
   identity and its own wallet share a label.
3. Values are integers in TDH units, below 2^53, so JSON numbers are exact.
4. `date` and `cycleDay` agree: `cycleDay = days since 1970-01-01 of date`.
   The loader rejects a day whose pair disagrees.

### 11.3 Loader and caching

- `lib/tdh/verification/loadVerification.ts` (server only): `fetch` with
  `next: { revalidate: 600 }` for the index and the latest day, `3600` for
  older days; an 8-second timeout through `AbortSignal.timeout`.
- Returns a discriminated union: `{ kind: "data" | "sample" | "awaiting" |
  "error", ... }`, so every page and card renders every state explicitly.
- Selection:

| Base URL | Environment | Result |
| --- | --- | --- |
| Set | Any | Fetch; `error` on failure |
| Unset | Production (`getAppEnvironment().isProduction`) | `awaiting` |
| Unset | Staging, local, test | `sample` |

Production is decided by the app environment (the 6529.io host), not by
`NODE_ENV`, because staging builds also run with `NODE_ENV=production`.

### 11.4 Sample fixtures

Server-only module `app/network/tdh/verification/sample-data.ts`, imported
only on the `sample` path. Values are from the comparison of 14 and 15
October 2026; Python copies Rust (the banner says so); roots, commits, run
times and per-holder values are null, because they were not published.

```json
{
  "days": [
    { "cycleDay": 20740, "date": "2026-10-14", "verdict": "explained",
      "identitiesEqual": 10280, "identitiesTotal": 10282,
      "totalTdh": { "rust": 2070436097, "python": 2070436097, "live": 2070436337 } },
    { "cycleDay": 20741, "date": "2026-10-15", "verdict": "explained",
      "identitiesEqual": 10280, "identitiesTotal": 10282,
      "totalTdh": { "rust": 2073214694, "python": 2073214694, "live": 2073214934 } }
  ],
  "cutover": { "plannedDate": "2026-10-23", "status": "planned" }
}
```

```json
{
  "cycleDay": 20741, "date": "2026-10-15", "cutoffBlock": 26194188,
  "mode": "unchecked-history",
  "implementations": {
    "rust":   { "commit": null, "totalTdh": 2073214694, "identities": 10282, "wallets": 11133,
                "cycleRoot": null, "walletRoot": null, "historyRoot": null, "runtimeMs": null },
    "python": { "commit": null, "totalTdh": 2073214694, "identities": 10282, "wallets": 11133,
                "cycleRoot": null, "walletRoot": null, "historyRoot": null, "runtimeMs": null },
    "live":   { "source": null, "totalTdh": 2073214934, "identities": 10282, "wallets": 11133 }
  },
  "agreement": {
    "rustVsPython": { "identitiesEqual": 10282, "identitiesTotal": 10282, "walletsEqual": 11133, "walletsTotal": 11133 },
    "rustVsLive":   { "identitiesEqual": 10280, "identitiesTotal": 10282, "walletsEqual": 11131, "walletsTotal": 11133 }
  },
  "differences": [
    { "label": "holder-1", "kind": "identity", "fields": [ { "name": "final", "rust": null, "python": null, "live": null } ], "class": "A", "cause": "DEV-2" },
    { "label": "holder-2", "kind": "identity", "fields": [ { "name": "final", "rust": null, "python": null, "live": null } ], "class": "A", "cause": "DEV-2" },
    { "label": "holder-1", "kind": "wallet",   "fields": [ { "name": "final", "rust": null, "python": null, "live": null } ], "class": "A", "cause": "DEV-2" },
    { "label": "holder-2", "kind": "wallet",   "fields": [ { "name": "final", "rust": null, "python": null, "live": null } ], "class": "A", "cause": "DEV-2" }
  ],
  "verdict": "explained"
}
```

Day 20,740 is the same shape with `cutoffBlock` 26,187,014, totals
2,070,436,097 (Rust, Python) and 2,070,436,337 (6529.io), and `live.source`
`"arweave:5V7lje2GIOEr6opL7J6j7KPcBiZDeGFNSrUtkRPpQI8"` (6529.io's
consolidated upload of that day). When per-holder values are null, the
differences table shows "Values not in sample" in place of the numbers.

Jest fixtures for the differences table use obviously synthetic values
(1,000 against 1,120) in test files only, never on a page.

### 11.5 Formal manifest (optional)

`{base}/formal/manifest.json`, published by the Lean build when it exists:

```ts
{ leanVersion: string; builtAt: string; vectorsPassed: number; vectorsTotal: number;
  statements: Array<{ id: string; title: string; plain: string; p26: string;
                      lean: string; status: "stated" | "proved" | "gap" }> }
```

## 12. Engineering plan

### 12.1 Files

```text
app/network/tdh/
  page.client.tsx                      restructured (section 5)
  TDHSubnav.tsx                        shared section nav (3.2)
  TdhSource.tsx, TdhStatusPill.tsx     chips and pills (4.4, 4.5)
  how-it-works/page.tsx, page.client.tsx, examples.ts, explorables/*.tsx, diagrams/*.tsx
  specification/page.tsx, sections/*.tsx, deviations.ts, registry.ts
  formal/page.tsx, statements.ts
  implementations/page.tsx, vectors.ts, diagrams/*.tsx
  verification/page.tsx, [cycleDay]/page.tsx, sample-data.ts, components/*.tsx
lib/tdh/tdhV1Arithmetic.ts             RATE, BASE, ADD, boost, FINAL (4.7)
lib/tdh/verification/schema.ts         zod schemas (11.2)
lib/tdh/verification/loadVerification.ts
config/env.schema.ts                   NEXT_PUBLIC_TDH_VERIFICATION_BASE
i18n/messages/networkTdh*.en-US.json   new namespaces (4.9)
components/about/about.routes.ts, components/network/NetworkReferenceNavigation.tsx
next-sitemap.config.ts, ops/help/help-index.json, ops/docs/network/*.md
```

Server components for every page; client islands only for the explorables,
the section nav's scroll fades, the chart, filters and disclosures.
`useSearchParams` is not needed; the day comes from the route segment.

### 12.2 Tests

Jest (fast layer):

- `tdhV1Arithmetic`: every number in Appendix A, including the rate tie at
  200, the final ties, ADD values and the boost table.
- `schema` and `loadVerification`: valid fixtures; each invalid shape; an
  address-like string in `label` rejected; `date` and `cycleDay`
  disagreement rejected; the three selection paths of §11.3; timeout.
- Verdict, mode and cutover state mapping, including unknown verdicts and
  the day of the cutover in UTC.
- Rendering tests per page for the states: data, sample, awaiting, error,
  Python not run, empty differences.
- A static contract test that every new route is in the sitemap list and
  the help index, and that every source chip's anchor exists on the
  specification page.

Playwright (one representative route per template, per `AGENTS.md`):

- `/network/tdh/how-it-works` (static explainer template) at desktop and
  mobile: no horizontal overflow; the boost builder updates its live region.
- `/network/tdh/verification` with sample data (data template) at desktop
  and mobile: tiles, table and chart fallback table render; class filter
  works.

Register both specs in `tests/packs.manifest.cjs` under the network pack.

### 12.3 Validation

`6529 run lint:changed`, `6529 run typecheck:changed`, `6529 run
check:changed`, `6529 run react-doctor:diff`, targeted `6529 run test`,
`6529 run debt:ratchet`, and `6529 run build` (env schema and new routes).
Screenshots with headless Chrome at 1440 × 1000 and 390 × 844 for every page
and every dashboard state, reviewed before handoff.

### 12.4 Docs and help

- `ops/docs/network/feature-tdh-how-it-works.md`, `feature-tdh-specification.md`,
  `feature-tdh-formal-model.md`, `feature-tdh-implementations.md`,
  `feature-tdh-verification.md`, linked from `ops/docs/network/README.md`.
- Help index records answering: "How is my TDH calculated?", "What is
  TDH-v1?", "Is TDH verified?", "Why does 6529.io differ from the
  validators?", "What does class A mean?", "When does 6529.io switch to the
  Rust computation?".

## 13. Delivery sequence

| When | Pull request | Contents |
| --- | --- | --- |
| Thursday 15 October | This plan | The plan |
| Friday 16 October, morning | PR 1, verification | Env var, schema, loader, sample data, the dashboard and the day permalink, the overview's Verified daily strip, the section nav. Ready when the daily job's first JSON lands. |
| Friday 16 October | PR 2, How it works | The page, the arithmetic module, the explorables, the overview restructure and the `#tdh-exact` move |
| Saturday 17 October | PR 3, specification, implementations, formal | The three pages, the decisions list and evidence anchors, docs and help index |
| Before 23 October | Follow-ups | F1 decision reflected in copy; D131 text once in P26; the real base URL in production; the cutover card switched to done |

The orchestrator opens the pull requests, runs the judges and handles
staging and production with the owner.

## Appendix A. Worked-example computation

Every example number above comes from the P26 Python reference, rule version
`tdh-v1.0`, run with Python 3.12. The script imports `tdh_v1` from a design
record checkout; it is reproduced here because that checkout is private.

```python
# python -I worked_examples.py <path to design/tdh-reference>
import sys
from fractions import Fraction
sys.path.insert(0, sys.argv[1])
import tdh_v1 as R

P, H, DAY = R.PARAMS, 3941, R.DAY
MEMES, GRADS = P["memes"], P["gradients"]
T = 1_792_022_399                       # 2026-10-14 23:59:59 UTC

# Rates and editions
for e in (3941, 1000, 310, 309, 303, 300, 200):
    print("RATE", e, R.rate_cents(H, e))
print("Gradient", R.rate_cents(H, 101, minimum_one=True))
def edition(minted, total_max):
    floors = R.edition_floors({1: total_max})
    return minted if minted >= 300 else max(minted, floors.get(1, 0))
for m, tm in ((149, 332), (299, 333), (300, 333), (303, 333), (309, 329)):
    print("edition", m, tm, edition(m, tm))

# Boosts on the 2026-10-11 cycle: 559 eligible Memes, 17 seasons
seasons, elig = R.seasons_for(559), list(range(1, 560))
beta = lambda bal, g: R.boost_cents(bal, g, elig, seasons)[0]
print(beta({}, 1), beta({}, 5), beta({}, 7), beta({1: 1, 2: 1, 3: 1, 4: 1}, 0))
print(beta({i: 1 for i in range(48, 87)}, 0))
print(beta({i: 1 for i in elig}, 0), beta({i: 2 for i in elig}, 0),
      beta({i: 3 for i in elig}, 0), beta({i: 33 for i in elig}, 5))
print([R.additional_sets_u(n) for n in (2, 3, 33)])

# Base and final
print(R.base_tdh(1271, 100), R.base_tdh(1271, 1), R.base_tdh(1271, 2))
print(R.final_tdh(1271, 102), R.final_tdh(25, 114), R.final_tdh_exact(25, 114))

# Stacks: last in, first out; carry; a round trip in one transaction
A, B, C, X, Z = ("0x" + c * 40 for c in "abce0")
ts = lambda d, h=0: T - d * DAY - h * 3600
tr = lambda i, t, f, to, n=1, txi=0, li=0, tx=None: (1000 + i, txi, li, 0, t, tx or f"0x{i}",
                                                      MEMES, 500, f, to, n)
lifo = [tr(1, ts(400), Z, X, 3), tr(2, ts(300), X, A), tr(3, ts(200), X, A),
        tr(4, ts(100), X, A), tr(5, ts(50), A, C)]
st = R.replay_holdings(lifo, {})[(MEMES, 500)]
print([R.whole_days(T, a) for a in st[A]], [R.whole_days(T, a) for a in st[C]])
carry = [tr(1, ts(400), Z, X), tr(2, ts(300), X, A), tr(3, ts(10), A, B)]
for groups in ({A: (A, B), B: (A, B)}, {}):
    print([R.whole_days(T, a) for a in R.replay_holdings(carry, groups)[(MEMES, 500)][B]])
```

Output, as used in the copy:

| Quantity | Value |
| --- | --- |
| RATE for editions 3,941 / 1,000 / 310 / 309 / 303 / 300 / 200 | 100 / 394 / 1,271 / 1,275 / 1,301 / 1,314 / 1,970 cents (half-up would give 1,971 at 200) |
| Gradient rate (101 Gradients) | 3,902 cents |
| Editions for (149, 332), (299, 333), (300, 333), (303, 333), (309, 329) | 310, 310, 300, 303, 309 |
| Boosts: 1 Gradient, 5, 7, Genesis and Nakamoto, Season 2 | 1.02, 1.10, 1.10, 1.02, 1.05 |
| Season 2 with Genesis and Nakamoto; current season only | 1.07; 1.00 |
| Full sets 1, 2, 3; 1 with 5 Gradients; 33 with 5 Gradients | 1.80, 1.85, 1.88; 1.90; 2.04 |
| Every Meme except Meme 559 | 1.80 |
| Ceiling with 21 listed seasons, 33 sets, 5 Gradients | 2.24 |
| ADD(2), ADD(3), ADD(4), ADD(5), ADD(10), ADD(33) | 50,000; 82,645; 103,959; 117,875; 140,945; 144,051 |
| BASE(1,271, 100), BASE(1,271, 1), BASE(1,271, 2) | 1,271; 13; 25 |
| FINAL(1,271, 1.02); FINAL(25, 1.14), exact decimal | 1,296; 28 (exact decimal 29) |
| FINAL(50, 1.13), exact decimal | 56 (57) |
| Whole days for 100 d 23 h, 23 h, 24 h | 100, 0, 1 |
| Last in, first out: kept, buyer | [300, 200]; [50] |
| Carry inside an identity; without consolidation | 300; 10 |
| Round trip in one transaction: in order; netted (D131) | 20; 300 |
| Cycle day of 2026-10-15; its boundary | 20,741; 1,792,022,400 |
| Identities from links A–B, B–C, A–C | (A, B, C) |
| Identities from links A–B, B–C | (B, C) and A alone |
| Identities from A–B, B–C, A–C, then C–D | (C, D), (A, B) |
| Registry hash | `0x74b4a8f96e3f1fbc3f44167bb42f0a18effb7a0f49d12bc8b88cdb3784c663d3` |

The household (How it works, step 12) used the same functions with these
holdings, rates from H = 3,941 and the 2026-10-11 seasons:

| Record | Boost | Base | Final | Daily rate |
| --- | --- | --- | --- | --- |
| Wallet A | 1.02 | 15,928 | 16,246 | 41.8404 |
| Wallet B | 1.02 | 3,753 | 3,828 | 56.7834 |
| Identity A + B | 1.04 | 19,681 | 20,469 | 100.5576 |
| Identity, one day later | 1.04 | | 20,583 | |
| Identity, after selling Gradient 2 | 1.02 | | 18,880 | |

Per-token identity finals: FirstGM 333, the 310-copy Meme 1,190,
Gradient 1 16,232, Gradient 2 1,218, NextGen 1,496. One day later: 335,
1,217, 16,273, 1,258, 1,500.

## Appendix B. Cause codes in plain words

Short explanations shown on the specification page (§11, §12) and in the
dashboard's difference rows. Effects are those measured on the 2026-10-11
cycle [P26 §11, §12, Replay 2026-10-11].

| Code | Old backend | TDH-v1 | Effect | Decision |
| --- | --- | --- | --- | --- |
| DEV-1 | Transfers came from an indexing service, merged per transaction | One transfer per event, in on-chain order | None measured | Adopted |
| DEV-2 | Same-second movements ordered by a rule that depends on the wallet and on database order | On-chain order; within one transaction, netting (D131) | 2 identities, −241 TDH: a token sent out and back in one transaction | TDH-v1's order (D121); netting (D131) |
| DEV-3 | Snapshot block found at 00:01 on the unfinalized chain | Finalized chain only | None that day | Adopted |
| DEV-4 | Read whatever had been indexed by 00:01 | A complete, finalized set of events | None that day; one late transfer in a year | Adopted |
| DEV-5 | Two definitions of a mint | The first mint of any amount starts the clock | None | Adopted |
| DEV-6 | Edition floors kept in a database, refreshed for recent Memes only | Read at the snapshot block, below 300 copies only | None today | Adopted |
| DEV-7 | Gradient and NextGen rates from current database totals | From on-chain counts at the snapshot block | None today | Adopted |
| DEV-8 | Seasons from editable card metadata | A versioned list of season starts | None | Adopted |
| DEV-9 | Consolidations read when the job runs, recomputed during the day | As of the snapshot block | None in the uploads | Adopted |
| DEV-10 | Today's grouping applied to the whole history | Kept | No change | Old behavior kept (D121) |
| DEV-11 | Ties between links broken by database order | By on-chain position | None | Adopted |
| DEV-12 | Link state ignores collection, expiry and updates | Kept | No change | Old behavior kept (D121) |
| DEV-13 | Zero and dead addresses get records and enter totals | Records kept; never in consensus weight | Totals only | Kept, excluded from weight (D121) |
| DEV-14 | Final rounding with binary64 ties | Kept, defined exactly | No change | Old behavior kept (D121) |
| DEV-15 | Rates and boosts with floating point | Exact, binary64 only at ties | None | Adopted |
| DEV-16 | A send larger than the holding silently removed fewer copies | The input is invalid | None | Adopted |
| DEV-17 | Ages measured to the snapshot block's time | Kept | No change | Old behavior kept (D121) |
| DEV-18 | Undefined results with no eligible Meme | Defined: H = 0, no sets | None | Adopted |
| DEV-19 | A Meme with no copies got an infinite rate | Eligible, no rate; holding it invalidates the input | None | Adopted |

| Code | Issue in the old backend | Removed by |
| --- | --- | --- |
| BUG-1 | The same-second ordering rule is inconsistent and can crash the run | On-chain order (DEV-2) |
| BUG-2 | The order before sorting depends on which database query finishes first | On-chain order |
| BUG-3 | Indexing merges movements and drops their position | One record per event (DEV-1) |
| BUG-4 | Indexing follows the unfinalized chain and never revisits blocks | Finalized input (DEV-4) |
| BUG-5 | The job does not wait for indexing to catch up | A completeness barrier (DEV-4) |
| BUG-6 | The snapshot block search uses the unfinalized head | P26 §4.2 (DEV-3) |
| BUG-7 | Grouping changes rewrite history, and a day's values can change after publication | Grouping as of the snapshot block (DEV-9) |
| BUG-8 | Link ties are ordered differently in two code paths | On-chain position (DEV-11) |
| BUG-9 | Revoking one registration can unlink a pair confirmed under another collection | Kept by decision (DEV-12) |
| BUG-10 | Floors read at the latest state, failures dropped silently | Floors read at the snapshot block (DEV-6) |
| BUG-11 | Gradient and NextGen rates from current totals | Counts at the snapshot block (DEV-7) |
| BUG-12 | Seasons from editable metadata; a missing trait creates a phantom season | Season list (DEV-8) |
| BUG-13 | Two different definitions of a mint | One definition (DEV-5) |
| BUG-14 | An oversized send removes fewer copies than requested | Invalid input (DEV-16) |
| BUG-15 | Uploads mix in current values for some columns | The snapshot's own values |

## Appendix C. The 36 conformance vectors

From the reference README; used by the implementations page's vector
browser. Topic tags in brackets.

| Vector | Covers |
| --- | --- |
| 01-zero | No holdings; a consolidated pair still has a zero record [holdings] |
| 02-single-erc721 | One Gradient, the Gradient rate and boost [rates, boosts] |
| 03-erc1155-editions | Two editions, a zero-day copy, a half-unit final tie [editions, rounding] |
| 04-mid-period-transfer | Last-in, first-out removal [holdings] |
| 05-same-block-out-then-in | On-chain order against the old same-second rule [order] |
| 06-consolidation-age-carry | Age carried inside an identity, applied to history [consolidation] |
| 07-consolidation-lifo-from-end | A moved old copy is removed first [consolidation, holdings] |
| 08-burns | Zero and dead sinks; editions not reduced; totals without sinks [holdings] |
| 09-firstgm | FirstGM's −2,588 adjustment and burn exclusion [editions] |
| 10-boost-tiers | Genesis, Nakamoto, season sets, full sets, Gradient cap [boosts] |
| 11-edition-floors | Floor cases [editions] |
| 12-rounding-boundaries | Rate, base, final and extra-set rounding boundaries [rounding] |
| 12b-final-ties | Final-rounding ties [rounding] |
| 13-log-decoding | TransferSingle, TransferBatch, ERC-721 Transfer [decoding] |
| 14-consolidation-clusters | Link states, groups of three, chains, revocations [consolidation] |
| 15-cutoff-and-days | Finalized snapshot with a missed slot; whole-day boundaries [snapshot] |
| 16-cluster-same-block | A pattern on which the old code crashes [order, consolidation] |
| 17-creation-mint-eligibility | A zero-amount creation mint starts the clock [eligibility] |
| 18-erc721-round-trip | Send and return in one transaction [order] |
| 19-season-count | Seasons listed by the count of eligible Memes [boosts] |
| 20-held-zero-day | Zero-day copies count as held for boosts [boosts] |
| 21-zero-edition | An eligible Meme with edition 0 [editions] |
| 22-no-eligible-meme | No eligible Meme: H = 0, minimum rates, daily rate [rates] |
| 23-identity-sums | Identity sums, a full set split across wallets, per-token finals [consolidation, boosts] |
| 24-ages-and-counts | Eligibility boundary, ages, counts, large ids, dead senders, many sets [eligibility, holdings] |
| 25-raw-log-cycle | A full day from raw events, all four delegation events [decoding, consolidation] |
| 26-delegation-decoding | Delegation event layouts and malformed events [decoding] |
| 27-malformed-transfer-logs | Ignored and malformed transfer events [decoding] |
| 28-registry-hash | The registry hash [parameters] |
| 29-invalid-underflow | No result: a send larger than the holding [no result] |
| 30-invalid-duplicate-transfer | No result: an event included twice [no result] |
| 31-invalid-zero-edition-holder | No result: a held Meme with edition 0 [no result] |
| 32-invalid-rate-range | No result: a rate input outside the range [no result] |
| 33-invalid-final-range | No result: a final value outside the range [no result] |
| 34-cutoff-edges | No result before the next block is final, or with non-increasing times [snapshot, no result] |
| 35-edition-floor-threshold | Floors only below 300 copies [editions] |
