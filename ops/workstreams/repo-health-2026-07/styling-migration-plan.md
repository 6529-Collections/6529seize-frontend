# Styling Migration Plan — Bootstrap Exit (Thread C)

Owner: repo-health campaign Thread C ("one styling system").
Status: **verification + residue burn-down** (re-planned 2026-07-05 after the
Phase 0 inventory found the migration itself already landed on `main`).

## Phase 0 inventory result (2026-07-05, on `main` @ 98cd4984e)

The 2026-07-04 audit baseline ("Bootstrap 5 + react-bootstrap + SCSS modules +
Tailwind coexist") is stale. The Bootstrap → Tailwind migration was executed on
`main` between 2026-06-28 and 2026-07-03 by the release lane as a PR wave:

- Component waves (react-bootstrap → Tailwind/`tw-*` + repo idioms):
  #2933, #2934, #2935, #2936, #2938, #2939, #2940, #2941, #2942, #2951, #2952,
  #2953, #2964, #2965, #2966, #2967, #2968, #2969 (Delegation tools).
- #2979 removed the last react-bootstrap runtime wrappers and the
  `react-bootstrap` package entry.
- #2992 removed obsolete React Bootstrap test mocks; #2991/#2994 cleaned shared
  global classes.
- #2998 removed the final runtime dependency: global Bootstrap Sass import,
  `seize-bootstrap.scss` compat layer (253 lines), Sass load-path config, the
  `guard-bootstrap-sass-import.cjs` build guard, and the `bootstrap` package
  entry.
- #3020 fixed Waves spacing fallout after the global cleanup.

The repo has since also exited Sass entirely (zero tracked `.scss` files, no
`sass` dependency; `styles/` is plain CSS + Tailwind).

Verified surface on current `main` (commands run 2026-07-05):

| Check | Result |
| --- | --- |
| `import`/`require`/`@import`/`@use` of `bootstrap` or `react-bootstrap` | 0 (only debt-ratchet test fixtures mention the names as strings) |
| `bootstrap`/`react-bootstrap` in `package.json` / `pnpm-lock.yaml` | absent |
| `data-bs-*` attributes | 0 |
| `--bs-` CSS variables | 0 |
| Bootstrap-only utility classes (`d-flex`, `justify-content-*`, `btn-*`, `col-{bp}-*`, `form-control`, `modal-dialog`, …) | 0 (all `form-select` hits are the `tw-form-select` Tailwind Forms class) |
| Bootstrap JS behaviors (modal/dropdown/collapse/tooltip) | none; repo idioms are `@headlessui/react`, native `dialog`, `react-tooltip`, Tailwind |
| `6529 run debt:ratchet` | green; `bootstrap_imports baseline 0 actual 0` |

## Guards against reintroduction

1. Dependencies are gone — any new import fails module resolution in
   typecheck/build.
2. Debt ratchet (`scripts/debt-ratchet.cjs`, required-check lane): the
   `bootstrap_imports` metric covers `import`/`export from`/`require` and CSS
   `@import`/`@use` specifiers; the baseline is 0 and any increase fails.
3. ESLint `no-restricted-imports` for `bootstrap`, `react-bootstrap`, and their
   subpaths in `baseRules` (added by this workstream) so every lint lane —
   `lint`, `lint:quiet` (gates `build`), `lint:changed`, tight, diff — reports
   the ban with a message pointing here. With zero existing usage this turns
   nothing red.

Rule of thumb for new UI: Tailwind `tw-*` utilities + existing repo components
(`@headlessui/react`, heroicons, native `dialog` for modals). Scoped CSS
modules remain acceptable where Tailwind cannot express the selector cleanly —
see `ops/standards/frontend-design-ui-ux.md`.

## Residue burn-down (owned by Thread C)

| # | Item | Why | Action |
| --- | --- | --- | --- |
| R1 | `AGENTS.md` "Bootstrap Sass must be imported as `@use \"bootstrap/scss/bootstrap\"` …" paragraph | Instructs agents to preserve config deleted in #2998; actively misleading | Remove; replace with a one-line "Bootstrap/Sass are removed" note |
| R2 | `jest.config.js` `^dom-helpers/css$` moduleNameMapper + `__mocks__/css-functions.js` | `dom-helpers` was a react-bootstrap transitive; package no longer in the lockfile; mapping is dead | Delete mapping + mock file |
| R3 | `jest.setup.js` comment "Mock DOM methods that Bootstrap modals might use" | Stale rationale; the `window.scrollTo` mock itself is still needed by non-Bootstrap code | Reword comment only |
| R4 | `ops/standards/frontend-design-ui-ux.md` | States Bootstrap/React Bootstrap/global Sass/Sass modules "still exist" | Update to the post-exit reality (Tailwind + plain CSS/CSS modules; Bootstrap banned) |
| R5 | `ops/skills/design-ui-ux/SKILL.md` | Same stale Bootstrap/Sass classification language | Same refresh |
| R6 | `.deepsec/data/6529seize-frontend/INFO.md` | Describes client stack as "Bootstrap/Tailwind styles" | Correct the stack description |
| R7 | ESLint ban (guard #3 above) | Fast in-editor feedback complementing the ratchet | Add to `eslint.config.mjs` `baseRules` |

Not residue (checked, intentionally kept): `debt-ratchet` script/test/baseline
mentions (the backstop itself); `stubs/empty.js` (used for canvas/react-native
webpack aliases, unrelated to the removed react-bootstrap jest stub); the
"bootstrap" wording in `bin/6529 bootstrap`, dev-setup EC2 scripts, Next.js
bootstrap-script CSP comments, Sentry test fixtures, and historical PR
reports/run logs.

## Visual verification checklist (former Bootstrap surfaces)

#2998 shipped with browser smoke QA pending and #3020 later patched Waves
spacing, so a page-level visual pass of the migrated surfaces is part of this
workstream's definition of done. Pass criteria: page renders with sane layout
(no unstyled/overlapping controls), interactive widgets open/close, keyboard
focus visible; a11y per `ops/standards/frontend-accessibility-wcag-22-aa.md`.

Executed 2026-07-05 with a scripted Chromium (Playwright) pass on a local dev
server against the public API: 23 routes, each captured with HTTP status,
console errors, horizontal-overflow metrics, and a reviewed 1440x900
screenshot. Result: **all pass** — every route 200, zero horizontal overflow,
zero app console errors (single external-DNS image failure on `/rememes`, not
styling-related), dark-first layout and controls intact everywhere.

- [x] `/delegation/delegation-center` (menu, cards, action buttons, collection row)
- [x] `/delegation/register-delegation` + `register-sub-delegation` (wallet-gated shells render correctly; on-chain form UI needs a connected wallet — covered by the delegation Jest suites)
- [x] `/delegation/register-consolidation` + `/delegation/assign-primary-address` (same gate pattern, clean)
- [x] `/delegation/any-collection` + `/delegation/the-memes` collection views
- [x] `/delegation/wallet-checker` — including an interactive lookup (`punk6529.eth`): ENS resolved to a checksummed address; delegations table, delegation-manager and consolidation sections rendered with live contract data; zero page errors
- [x] `/delegation/wallet-architecture`, `/delegation/delegation-faq`, `/delegation/consolidation-use-cases` content pages (typography, lists, anchors clean)
- [x] `/delegation-mapping-tool` + `/consolidation-mapping-tool` (CSV dropzone, selects, submit)
- [x] `/network` (leaderboard table, sort headers, level badges)
- [x] `/the-memes` (card grid, sort bar, year/season selectors)
- [x] `/meme-lab` (grid renders with live images)
- [x] `/rememes` (grid; one external image host unresolvable in the test env)
- [x] `/nextgen` (hero, featured collection, explore strip with live generator images)
- [x] `/open-data` (link cards)
- [x] `/meme-accounting` + `/meme-gas` (tables, artist/date dropdowns, The Memes / Meme Lab toggle)
- [x] `/about/faq` (#2941 wave)
- [x] Home page (next-mint card, subscription-minting toggle)

Not covered: wallet-connected transaction flows (register delegation/
consolidation submissions) — read-only environment; those forms were migrated
by #2942/#2969 and their behavior is exercised by the delegation Jest suites.
`/tools/app-wallets` create/unlock modals (#2979) are app-wallet surfaces
needing device secure storage; their behavior tests run in Jest. No
Bootstrap-exit regressions found, so no fix PRs were needed.

## Footprint evidence (2026-07-05)

- CSS: the deleted `styles/seize-bootstrap.scss` imported the **full**
  `bootstrap/scss/bootstrap` bundle (5.3.8, with variable overrides) into the
  global stylesheet graph of every page; Bootstrap 5.3.8's minified dist CSS
  is ~232 KiB for scale. After the exit, the entire production CSS output of
  `6529 run build` is 529.3 KiB across 9 chunks — Bootstrap-free (verified by
  the zero-surface inventory above).
- Dependency graph: 11 lockfile package entries removed — `react-bootstrap`
  2.10.10 plus transitives `dom-helpers`, `invariant`, `prop-types-extra`,
  `react-lifecycles-compat`, `react-transition-group`, `uncontrollable` (x2),
  `warning` (#2979), and `bootstrap` 5.3.8 + `@popperjs/core` 2.11.8 (#2998).
- A local "before" production build for a byte-exact bundle diff is not
  reproducible on this Windows/pnpm setup: Turbopack failed resolving
  Bootstrap Sass imports here even while Bootstrap was present (recorded in
  `ops/contracts/decentralized-media-resolver-review-and-rollout.md`).
- Post-exit production build on current main + residue branch: exit 0, with
  the new ESLint ban active in `lint:quiet` (which gates `build`).
- Full Jest: 1958 suites / 11044 tests green on the residue branch.

## Definition of done (Thread C)

- [x] Zero `bootstrap`/`react-bootstrap` imports (verified above)
- [x] Both deps removed from `package.json` (landed via #2979/#2998)
- [x] Delegation area Bootstrap-free (landed via #2942/#2969; verified)
- [x] Residue R1–R7 merged (PR #3046)
- [x] Visual checklist executed (23 routes, all pass; no regressions)
- [x] Bundle/footprint evidence recorded (above and in `run-log.md`)
