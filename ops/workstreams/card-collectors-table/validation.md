# Card collectors table validation

The initial collector pass checked The Memes card 107 and Meme Lab card 1 against the staging API
in a local development build. Desktop captures use a 1600 × 1100 viewport;
mobile captures use a 390 × 844 Pixel 7 browser context. Images are cropped
to the collector section. Both mobile before/after pairs have identical pixels.
These images record the initial collector treatment before the subsequent
desktop typography refinements.

| Surface          | Before                                      | After                                     |
| ---------------- | ------------------------------------------- | ----------------------------------------- |
| Memes desktop    | [Before](evidence/memes-before-desktop.png) | [After](evidence/memes-after-desktop.png) |
| Memes mobile     | [Before](evidence/memes-before-mobile.png)  | [After](evidence/memes-after-mobile.png)  |
| Meme Lab desktop | [Before](evidence/lab-before-desktop.png)   | [After](evidence/lab-after-desktop.png)   |
| Meme Lab mobile  | [Before](evidence/lab-before-mobile.png)    | [After](evidence/lab-after-mobile.png)    |

The collectors cases in `tests/media/collectorsLeaderboardCases.ts` pass in
desktop and mobile Chromium: four cases across both projects. They cover
all six Memes columns in both directions, keyboard focus and activation,
`aria-sort`, pagination, identity filtering, CSV export, retained mobile
controls, and the Meme Lab Balance header. Desktop checks cover 768, 900,
and 1600 px; the existing mobile sweep covers 320–767 px. At wide desktop
the table fits its shell; narrower desktop widths scroll inside the shell.

The changed expectations follow the requested full-label sort buttons and
unstriped desktop rows. Existing mobile metric, direction, tooltip, overflow,
search, paging, and CSV guarantees remain in place. Meme Lab keeps its three
columns and its smaller-screen caret controls.

The media detail spec remains registered in the `media-readonly` manifest
packs for local, staging, and production runs. No CI pack selection was narrowed.

Local checks: all 48 leaderboard unit tests, changed-file lint/typecheck/quality,
E2E selector lint, documentation links, and React Doctor. React Doctor reports
99/100 with one component-length warning; splitting the existing leaderboard
further is outside this focused restyle. Browser checks inspect accessible names
and semantics; they do not replace a manual screen-reader session.

## Desktop card typography

The Memes, Gradient, Meme Lab, and ReMemes desktop card pages share 16 px
section headings, 14 px labels and values, and 12 px metadata. Properties have
quiet borderless tiles. The Memes and Meme Lab timelines span their sections
with dark, unboxed entries. Sort indicators precede their labels. Desktop
previous/next controls have 8 px corners, quiet surfaces, and visible keyboard
focus. Phone typography, mobile collector lists, and smaller-screen navigation
retain their existing styles.

Shared details, artwork, market, activity, navigation, and timeline styling is
selected by `data-nft-card-page` at 768 px and wider. The boundary is present
only on these four detail-page roots. NextGen and other consumers keep their
original appearance. The legacy timeline module retains compatibility rules
for unmarked consumers and smaller screens; card rules use existing Tailwind
tokens.

The earlier collector and typography checks passed 417 unit tests. The latest
card-page follow-up passed 104 tests in nine focused suites. Ten distinct
browser cases passed across desktop and mobile Chromium, including Properties
disclosure, the unboxed season/calendar row, Meme Lab and Gradient typography
and navigation, historical timeline fallback, and ReMemes detail tabs and
metadata. Relevant widths include 390, 639, 640, 767, 768, and 1600 px.
Final Meme Lab and ReMemes grid checks also pass after preserving their original
property-grid density. Captures remain local.

The preview uses the production API for design review; collector and historical
media cases use isolated browser fixtures. The production-qualified ReMemes
case can run against a loopback preview only with `PLAYWRIGHT_ENV=production`.
That explicit opt-in matches the verified production-API preview and leaves
ordinary local/staging fixture selection unchanged.

The existing media spec and pack registration cover these assertions without
narrowing CI or deployed pack selection. Meme Lab's former 12 px desktop
heading and white timeline expectations now follow the requested shared card
design; mobile keeps the original 12 px headings and white timeline cards.
All existing routes, labels, market placement, media, and interaction guarantees
remain. The unboxed calendar keeps the season/year destinations and focus ring.

Changed-file lint and typechecking, Playwright types, selector lint, formatting,
documentation links, and diff checks pass. React Doctor reports 96/100 with
advisories in existing component size and state/hook patterns; the diff changes
presentation rather than those state models. A local production build was not
run for this styling-only follow-up. Merge and deployment remain paused for
design review.

## Meme Lab trading and Properties follow-up

Meme Lab and Gradient use the existing Memes connection header and action grid
on desktop, including the primary Connect wallet button and quiet 8 px action
buttons. Their market links remain below the actions and marketplace shortcuts
retain their positions. Below 768 px their legacy action layout remains intact;
no sticky duplicates are added. NextGen does not opt in. Responsive framing
keeps the trade controller mounted so its draft survives a layout change.

Meme Lab Properties now shares the Memes desktop preview: six tiles in three
columns, with Show all {count} properties and Show fewer. At six or fewer there
is no disclosure. Meme Lab keeps all properties visible below 768 px. The Memes
keeps its existing phone disclosure and its full list at 640–767 px.

The maintained `memelab-marketplace-public` browser contract now looks for List
in More trading actions on desktop when Collect is available, as required by
the requested Memes action layout; phone List remains directly visible. The
desktop market summary and price-level expectations are 14 px, following the
requested typography unification; phone sizes and all order/selection/review,
focus, overflow, accessibility, and no-write guarantees remain intact.

The media-readonly spec covers both Properties templates at 390, 639, 640, 767,
768, and 1600 px with keyboard expansion/collapse and visible property counts.
Its Gradient case checks the desktop connection/button treatment and absence
of sticky actions while preserving smaller-screen controls. These six browser
checks pass across desktop and phone Chromium. The fixture-based marketplace
spec is selected by the existing Collect check in the app PR workflow when
shared Collect components change. Media coverage remains registered in the
media-readonly manifest packs; no selection or guarantees were narrowed.

Focused component coverage includes disclosure, the responsive controller's
retained state, sticky opt-out, and iOS purchasing omission before requests for
all layout modes: 70 tests pass in six suites. The complete fixture-based Meme
Lab marketplace flow also passes on desktop and phone Chromium, for eight
browser checks in this follow-up. Changed-file lint/typechecking, Playwright typechecking,
selector lint, Help Bot synchronization, and documentation link validation pass.
React Doctor remains 96/100 with existing component size/state advisories.
No production build, wallet authorization, real trade, merge, or deployment was
performed for this local UI review.

## Memes desktop market links row

The user explicitly approved moving View listings & offers and Marketplaces
into one desktop row directly below The Memes trading buttons, before supply
statistics. The link sits left and the marketplace group sits right. In tighter
desktop panels the marketplace label wraps above its icons inside the same
right-hand group. Below 768 px the existing navigation and marketplace positions
remain intact. Existing purchase gates apply to both positions; there is one
market navigation button and one set of marketplace links at a time.

The existing media-readonly card-controls case now checks the approved desktop
order and left/right alignment while retaining mobile order, transaction-dialog,
sticky actions, keyboard focus, market-tab navigation and selection guarantees.
No pack or CI selection changed. The component and native-gate suites pass 46
tests; both desktop and phone Chromium card-controls cases pass. Changed-file lint/typechecking, Playwright types, selector lint, Help Bot
synchronization and documentation links pass. Browser evidence and screenshots
remain local; GitHub delivery remains paused for review.

The desktop market link has text-only hover, matching Supply details & rankings.
Its background remains transparent while the label changes from iron-400 to
iron-100. The shared card boundary keeps this treatment off NextGen and smaller
screens. Both desktop and phone card-controls browser cases pass, including the
hover color and background assertions; a hover capture remains local.

## Shared marketplace icon size

The Memes-only image override is removed. NFTMarketplaceLinks owns the common
24 × 24 px desktop icon style for the four `data-nft-card-page` templates:
The Memes, Gradient, Meme Lab and ReMemes. Smaller-screen sizing and unmarked
consumers retain their existing rules. No links, labels, marketplace visibility
or purchase behavior changed.

The existing typography/navigation browser cases now assert both dimensions of
every visible marketplace icon on all four templates at 390, 767, 768 and
1600 px. All six desktop and phone Chromium cases pass, including the
production-qualified ReMemes fixture through the local production-API preview.
The current ReMemes card was also visually checked at 24 × 24 px. Browser pack
and CI registration stay unchanged. The standing review scope is to check shared
refinements across all four card templates before handoff, with NextGen excluded.

## Supply disclosure chevron

On desktop, Supply details & rankings keeps the chevron 4 px after its label.
The native details element, down/up rotation, expanded content below the
summary, focus treatment and mobile edge alignment stay intact. The other
three collection templates do not use this disclosure.

The media-readonly pack has a focused supply-disclosure browser case covering
767/768 px alignment and Enter/Space expansion, content placement, rotation and
focus. It runs in both existing desktop and phone projects, alongside the
unchanged trading-flow checks. Their existing timeouts, no-retry policy and
route/market/selection guarantees remain intact. No pack or CI registration
was narrowed. The current Memes card was also visually checked while expanded.
All four desktop and phone browser cases pass, along with changed-file
typechecking, Playwright types, selector lint and documentation links.

## Mint metadata grouping and retained statistics

Desktop Memes places Mint date beside Mint price, then its existing Distribution
Plan and Main Stage Submission links, above supply statistics. The original
date formatter, price precision, distribution targets, Main Stage mapping and
visibility rules are reused. Edition size, both reserve-adjusted counts, Holding
wallets, TDH rate, expanded reserve counts and rankings remain. TDH retains its
Pending state and remains available when extended supply metadata is missing.
The supply grid uses three desktop columns and keeps its existing phone layout.

Meme Lab groups the same date/price fields above its card details, with the
existing Distribution Plan when available. Its edition, burn, reserve, rank,
collection, website, volume and metadata renderers keep their original values
and conditions. Gradient's mint date was already above its statistics; ReMemes
has no corresponding mint fields. No new statistics are inferred from the visual
reference, and no data, calculations, API requests or purchasing rules were
removed. Phone information order and NextGen remain unchanged.

Fifty-nine component tests in three suites pass, including both desktop and
phone modes for reserve counts/ranks, Pending TDH, missing metadata, localized
formatting, distribution targets and Main Stage links. The new browser cases
cover the date/price row, values, links and statistics at 390, 767, 768, 1024 and
1600 px on both browser projects. Existing card controls, disclosure, typography,
navigation and ReMemes cases were also checked. The first broad run passed 12
cases and encountered a Gradient loading-skeleton readiness failure and a phone
flow deadline. Gradient now waits for its existing data before measuring CSS;
both Gradient cases pass. The unchanged phone flow passes in isolation with its
original assertions and timeout. No retries, skips, timeouts or pack selection
were relaxed.
All 14 distinct browser cases now have passing evidence after those focused
checks. The four final mint-layout cases were checked again after aligning Meme
Lab's label/value spacing; both mint values are measured in one layout snapshot
to avoid asynchronous loading shifts between measurements.

Changed-file typechecking, uncommitted-file lint, React Doctor, Playwright types,
selector lint, documentation links and Help Bot synchronization pass. Initial
lint feedback on a nested conditional was fixed without changing behavior.
React Doctor remains 96/100 with the existing size/state advisories. No local
production build was needed for this presentation change. Captures stay local;
GitHub delivery and deployment remain paused for design review.

## Collection refresh skeleton

The Memes index used the generic primary-route 1/2/3-column fallback while its
loaded grid uses two columns, three from 640px, and auto-fill tracks of at least
15rem from 1024px. Its container width and padding also differed. The dedicated
fallback now shares the exact container and grid constants with both flat and
Meme-grouped lists. Loaded card styles, filtering, requests, and data remain
unchanged. Other collections retain their existing route fallbacks.

Eight targeted Chromium browser checks pass across desktop and phone projects:
six loading-grid cases plus both existing public-browse cases. The sweep covers
320, 390, 639, 640, 767, 768, 1023, 1024, 1279, 1280, 1440, 1600, and 1920px.
The real streamed fallback is held with JavaScript disabled; normal collection
rendering uses the production API. Column count, gaps, refresh persistence, and
overflow are checked throughout. From 1024px, track widths, content width and
left alignment match exactly. The script-free phone fixture retains the shell's
initial navigation gutter, so smaller-width comparisons cover columns/gaps
rather than asserting equality with that unrelated hydrated-shell position.
Desktop loading and loaded screenshots were visually reviewed.

The initial 320px run caught a new placeholder-header overflow, fixed by letting
its filter blocks shrink. Initial phone assertions compared different shell
hydration states; their geometry scope was corrected without changing existing
browse expectations. Sixteen existing unit tests pass for collection requests
and the shared loading shell. Browser context options were also corrected for
exact optional property types; Playwright typechecking and selector lint pass.

Coverage stays in `nextgen-collections-readonly.spec.ts`, registered in the local,
staging, and production collections-readonly packs. Ordinary PR core browser
lanes do not run that pack; the focused checks above ran locally. No pack
selection, existing expectation, retry, or timeout was changed. The docs' loading
state now describes matching placeholders; this cosmetic fix adds no Help Bot
route, control, or workflow facts. Documentation links pass for 325 files.

React Doctor reports 95/100 and 29 existing advisories. The additional warnings
are from including the large existing TheMemes component in the inspected diff;
its state, effects, navigation and Suspense boundary are unchanged. The route
already wraps that component in Suspense. No GitHub or deployment work was done.
Changed-file lint and typechecking pass, together with a scoped TypeScript check
of all four skeleton/layout sources (the changed-file script does not select
every dirty tracked file). Focused test lint and diff checks also pass.

## Other collection loading grids

Gradient, Meme Lab, and ReMemes previously showed fetching text rather than
card skeletons; Meme Lab's individual collection view left its results blank
while loading. All four now use the shared CollectionGridSkeleton with the
exact classes of their respective loaded grid. Gradient's unchanged grid rule
was lifted into a local constant for both states. Existing media areas are
300px tall; the skeleton reserves that height. Loading announcements remain
outside the decorative, aria-hidden grid, and reduced motion disables its pulse.
Loaded cards, sorting, filters, API requests, pagination and failure states are
preserved. NextGen and the prior Memes skeleton remain unchanged.

The browser sweep checks 15 widths: 320, 390, 639, 640, 767, 768, 1023, 1024,
1199, 1200, 1279, 1280, 1440, 1600, and 1920px. These are fully hydrated pages
with actual API responses held at delivery, so every width compares track
count/width, card width, column and row gaps, content width, and left alignment
within the same app shell. It also checks overflow and reduced motion. Captures
of loading and loaded states at 390 and 1600px are retained locally. The single
Meme Lab collection is discovered through the real Collections view, avoiding
an unqualified hardcoded slug across environments.

The first run caught fractional CSS track remainder differences of 1/64px in
the individual collection test. Track widths are compared to rendered-pixel
precision while retaining every column. A delayed ReMemes request also exposed
the cost of holding a request before sending it; the fixture now fetches actual
data immediately and holds only delivery. No synthetic response data is used.
The next run passed 17 of 18 cases and caught a pre-existing 5px ReMemes header
overflow at 320px once the result count appeared. The brand trigger is now
constrained to its container, and the header can wrap its existing controls.
Both ReMemes grid cases and both browse cases then passed in a focused rerun;
all 18 distinct browser cases have passing evidence after the correction.

Thirty existing component tests pass across Gradient, Meme Lab, Meme Lab
collection coverage, and ReMemes. The seven ReMemes component cases also pass
after the header correction. Existing browse and keyboard-pagination
expectations were preserved; no existing test, retry, timeout, or pack selection
was relaxed. New cases remain in the existing collections-readonly pack,
registered locally and in staging/production. The ordinary PR core lanes do not
schedule that pack; the browser checks above ran locally on the existing
preview. User-facing docs and three Help Bot records describe the placeholders;
the 299-record corpus sync and 325-file documentation link validation pass.

Changed-file lint, changed-file typechecking, a scoped TypeScript check of all
five edited collection sources, Playwright typechecking, selector lint,
formatting, and diff checks pass. React Doctor completed at 93/100 with one
existing prop-to-state synchronization diagnostic in ReMemes and 39 existing
advisories across the expanded source selection. Its initialMemeId effect keeps
route-driven filter changes synchronized; this presentation change does not
modify that state or effect, and removing it would change browsing behavior.
The new skeleton primitive has no diagnostics. No production build, GitHub
delivery, or deployment was performed; the existing local preview stays running.

## Quiet overview dividers

The shared desktop heading simplification had hidden the old inline heading
rules, leaving lower overview groups without separators. A shared Tailwind
class string now applies a 1px iron-800 horizontal rule, 32px preceding spacing,
and 32px inner top padding between the existing direct groups from 768px.
The Memes Stats and Boosts remain one full-width separated row with their
existing two-column layout; individual metrics are not framed. Meme Lab's
additional details and ReMemes Metadata groups use the same treatment. Gradient
already separates its mint/creator, statistics and market groups, so its source
was left intact. The earlier phone and 640–767px styles remain unchanged.

Manual review caught the repo's preflight-free default side border widths when
applying divide-solid; divide-x-0 explicitly clears them. Browser assertions
verify the horizontal rule and all three zero-width sides. Existing typography
cases now also check these dividers and spacing at 390, 767, 768 and 1600px,
including the full-width Stats/Boosts wrapper. ReMemes Metadata and Gradient's
existing statistics rule are covered in their existing detail cases. All six
desktop/phone browser cases pass; twenty existing component tests pass for
additional details, all metadata/stat values, locale handling and ReMemes.
Captures of the Memes 571 groups were visually reviewed in the local preview.

No content, values, available links, calculations, controls, state or requests
changed. The media-readonly pack already registers the inspected specs locally
and for deployed checks; no pack selection, retry or timeout changed. Docs now
describe the visual grouping. This cosmetic separator change introduces no
new Help Bot route, control, terminology or workflow fact. Playwright types,
selector lint and documentation links pass. React Doctor remains 93/100 with
the previously recorded one existing ReMemes prop-sync diagnostic and 39
advisories; this change introduces no hooks or state. No build, commit, push or
deployment was performed.

## Final divider and primary-tab review

The final accepted Memes overview keeps the existing iron-800 color only at
the boundary between TDH breakdown and the Stats/Boosts row. Additional rules
by Arweave links, Properties and ReMemes metadata were removed. Meme Lab has
one explicitly requested matching rule between Card details and Properties.
Both rules are desktop-only. These supersede the broader divider placement
described in the earlier review record.

Gradient's desktop primary navigation was missing its baseline. It now has a
full-width white/10 baseline matching The Memes, with the active underline
aligned over it. Meme Lab and ReMemes have explicit desktop full width and the
same baseline color. No tab labels, handlers, focus/scroll hooks, controls or
data behavior changed. The existing six detail browser cases now verify these
widths and colors as well as the accepted divider locations. The case passed
before the final Meme Lab rule; the final rerun covers that last addition.
