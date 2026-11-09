# Card collectors table validation

The Memes card 107 and Meme Lab card 1 were checked against the staging API
in a local development build. Desktop captures use a 1600 × 1100 viewport;
mobile captures use a 390 × 844 Pixel 7 browser context. Images are cropped
to the collector section. Both mobile before/after pairs have identical pixels.

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
