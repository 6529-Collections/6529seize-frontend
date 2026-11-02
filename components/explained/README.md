# The 6529 Explained kit (release 1)

One system for every chapter of 6529 Explained: the shell, the claim marks,
the evidence components, the lens and Break it framework, the figure
primitives, the tokens and the facts layer. The design is in the final design
folder (`EXPLAINED.md` §5 to §8, `TDH-DESIGN.md` §3 and §5, `SCORECARD.md`);
the gallery at `/explained/kit` (development only) shows every component in
every state, on the fixture feed of 2026-10-18 (`?feed=live` reads every
source now; `?locale=de-DE` for the longest copy).

## Rules for a page built on the kit

1. **Every number through a fact.** Read facts on the server with
   `loadFactBook()` (`lib/explained/feed.server.ts`), print them with
   `<FactValue fact={book.get("tdh.latest.total")} />`, and pass
   `book.snapshot()` to `ExplainedShell` so client models read them with
   `useFact(id)`. An id the registry does not know fails the typecheck (and,
   for `meme.N.*` and `decision.DN`, the render). A source that cannot be
   read gives `null` from `book.maybe(id)`; show that, never a typed number.
2. **Every string a message key.** Page copy lives in `explained.<chapter>.*`
   message files in five locales; shared words in `explained.kit.*`. A message
   never contains a number: fill it with `fill(locale, key, { total })`, which
   throws on an unfilled `{placeholder}` outside production.
3. **Marks, not pills.** `Mark`, `Track`, `Tag`, `StampLine` (at most three
   marks), `DriftNote`. No amber, no new colour, decisions never green.
4. **Name newer decisions.** List the decisions the page relies on, and the
   record head it was checked through, in `lib/explained/pages.json`. When the
   record gains a decision that cites one of them, the drift check fails until
   the page names it in a `<DriftNote by={["D142"]}>`.
5. **One world per chapter.** Wrap a chapter's models in `World`; a page that
   shares its state in the link passes `share`, `parse` and the `?w=` value it
   read from its search params as `link`, so the server and the browser start
   from the same state.
6. **Selectors the gates use.** A model is a `Lens` with an `id` (`data-lens`)
   and a `BreakIt` with an `id` (`data-break`); list its states in
   `pages.json` so they are rendered at 1440 and 390.
7. **Mark the lede** with `data-ex-lede` and wrap the page body in
   `<article data-ex-article>`; the measure gate reads both.

## Files

| Folder              | What                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens.ts`         | colour roles (hex and Tailwind), type scale, spacing, grid, radius, elevation, motion, focus, buttons                                                                                                                                                                                                                                                                                                                                         |
| `i18n.ts`, `age.ts` | `kt()` / `fill()` (placeholders checked), `ageText()`                                                                                                                                                                                                                                                                                                                                                                                         |
| `facts/`            | `FactsProvider`, `useFact`, `FactValue`                                                                                                                                                                                                                                                                                                                                                                                                       |
| `marks/`            | `Mark`, `Track`, `Tag`, `StampLine`, `HashStripes`, `Hash`, `AsOf`, `DriftNote`, `Pulse`, `Glyph`, `Icon`                                                                                                                                                                                                                                                                                                                                     |
| `shell/`            | `ExplainedShell`, `Breadcrumb`, `ChapterBar`, `ShelfMenu`, `ChapterSwitcher`, `LivePill`, `HowWeKnow`, `PrevNext`, `PageIndex`, `ChapterIndex`, `ReaderPaths`, `LoopAtlas`, `chapters` (the map)                                                                                                                                                                                                                                              |
| `evidence/`         | `Verdict`, `Equation`, `DayRibbon` / `DayTile` / `ribbonDays`, `LiveStrip`, `Receipt` / `ReceiptRow` / `ReceiptNote`, `BrowserHash`, `ProvenanceTrail`, `AgreementBars`, `AssuranceLadder` / `HalfPair`, `LimitNote`, `FailureSentence`, `DefinitionChip`, `HonestyBox`, `IsIsNot`, `ClaimInParts`, `ClaimTable`, `Scoreboard`, `AssumptionLedger`, `SimulationSwitch` / `WhenReal` / `WhenSimulated` / `SimulationButton` / `SimulatedState` |
| `lens/`             | `Lens` / `LensHead` / `Stage` / `RuleRail` / `RuleValue` / `Readout`, `BreakIt`, `useBreakable`, `Predict`, `Seg`, `Stepper`, `Slider`, `World` / `useWorld`, `Clock`                                                                                                                                                                                                                                                                         |
| `figures/`          | `svg.tsx` (`SvgFrame`, `Label`, `Hatch`, `Tile`, `IdentityHull`, `Stripes`, `Axis`, `niceTicks`, `px`), `useMeasuredWidth`, `AreaTile`, `EqualAreaFigure`, `IdentityBlock`, `WalletGraph`, `RateFigure`, `BoostFigure`, `Lanes`, `Ribbon`, `Convergence`, `LoopFigure` / `LoopLocator`                                                                                                                                                        |
| `things/`           | `ArtCard`, `CardPicker`, `LiveNumber`                                                                                                                                                                                                                                                                                                                                                                                                         |
| `layout/`           | `rows.tsx` (`PageHead`, `Eyebrow`, `You`, `Section`, `Statement` / `StatementLabel`, `EdRow`, `Para`, `GoLink`, `pageLink`): the statement and editorial rows every chapter page is composed of; `RecordValue`, `Toggles`, `ValueTable`, `numbers`, `time` (UTC days and clocks from seconds)                                                                                                                                              |

The facts layer is `lib/explained/`: `facts.ts` (types, `createFactBook`,
`fmt`, `factsAsJson`), `registry/` (every fact and its source), `feed.server.ts`
(the live loaders, today's cache times), `engine.ts` (the one seam to the TDH
engine), `drift.ts`, `voice.ts`, `pages.json`, `data/record.json` (the decision
record's snapshot), `data/site.json`, `fixtures/` (the feed of 2026-10-18).

## Gates

| Command                                                                                | What                                                                                                                   |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `6529 run explained:check`                                                             | facts against the mockups' values, unknown ids, the drift check, the voice and number lints, no amber, the kit's tests |
| `6529 run explained:gates -- --base URL [--pages ids] [--locale de-DE] [--built-only]` | render, measure, states, axe and readers at 1440 and 390                                                               |
| `6529 run explained:compare -- --base URL --mockups <final/mockups>`                   | each kit component beside its mockup, at 1440 and 390                                                                  |
| `6529 run explained:sync-record -- --chain <6529chain> [--check]`                      | refresh the decision record's snapshot from 6529chain `origin/main` (the fact gate)                                    |
| `6529 run explained:fixtures -- --from <final/data>`                                   | rewrite the feed and editions fixtures, hashes checked                                                                 |

The kit's exports that the gallery does not reach yet are its public API for
the chapter lanes; `knip.jsonc` exempts `components/explained/**` and
`lib/explained/**` from the unused-export check until the chapter pages import
them. Remove those two entries as the chapters land.

CI: `scripts/explained/ci/explained-gates.yml` runs `explained:check`, then
`explained:gates -- --built-only` at 1440 and 390 and in de-DE at 390, on a
dev server. Install it as `.github/workflows/explained-gates.yml`; this
branch could not add a workflow file (the push token lacks the `workflow`
scope).
