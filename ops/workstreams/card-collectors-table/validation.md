# Card collectors table validation

The initial collector pass checked The Memes card 107 and Meme Lab card 1 against the staging API
in a local development build. Desktop captures use a 1600 × 1100 viewport;
mobile captures use a 390 × 844 Pixel 7 browser context. Images are cropped
to the collector section. Both mobile before/after pairs have identical pixels.
These images record the initial collector treatment before the subsequent
desktop typography refinements.

| Surface | Before | After |
| --- | --- | --- |
| Memes desktop | [Before](evidence/memes-before-desktop.png) | [After](evidence/memes-after-desktop.png) |
| Memes mobile | [Before](evidence/memes-before-mobile.png) | [After](evidence/memes-after-mobile.png) |
| Meme Lab desktop | [Before](evidence/lab-before-desktop.png) | [After](evidence/lab-after-desktop.png) |
| Meme Lab mobile | [Before](evidence/lab-before-mobile.png) | [After](evidence/lab-after-mobile.png) |

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

## Desktop typography follow-up

The Memes desktop card uses 16 px section headings, 14 px labels and values,
and 12 px metadata. Properties have quiet borderless tiles, highlighted labels
are grey with their blue dots retained, and the timeline spans the section
with dark, unboxed entries. Sort indicators precede their labels. Phone
typography, the mobile collector list, and smaller-screen Meme Lab controls
retain their existing styles.

Shared details, artwork, market, activity, and timeline styling is selected by
the existing `data-meme-card-page` boundary at 768 px and wider. The other
consumers keep their original appearance. The legacy timeline module retains
its compatibility rules for those consumers; the card-specific rules use
existing Tailwind tokens.

Validation includes 417 passing unit tests across the affected card,
leaderboard, timeline, market depth, and activity suites. Browser coverage
checks desktop typography at 768 and 1600 px and the original phone sizes,
sort-indicator placement, and dark timeline entries. The same checks visit
Meme Lab to confirm that shared properties and timeline cards retain their
original styles. The preview uses the production API for design review;
browser cases use isolated fixtures for collector rows and history events.

The existing media spec and pack registration cover these assertions without
changing CI selection. The added header and timeline expectations implement
the requested desktop typography; all existing media and mobile guarantees
remain. React Doctor reports 98/100 with five warnings in existing component
length and market state management; this styling change does not alter that
state model. A local production build was not run; the PR workflow provides
that check.
