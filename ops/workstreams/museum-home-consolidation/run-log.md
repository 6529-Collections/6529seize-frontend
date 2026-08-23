# Museum homepage consolidation run log

## 2026-08-23

- Confirmed production source base
  `2ed9d2e45cfdd0c31b01c07403848c6de220006a`.
- Diagnosed the repetition: the typed homepage rendered
  `MuseumTypedCollectionPresentation` and then the complete
  `MuseumAcquisitionStories` index using the same representative works.
- Removed the duplicate Collection preview and retained one complete
  acquisition section.
- Reworked the section heading, status summary, navigation, and responsive
  four-acquisition grid.
- Added a source-contract regression test that requires one acquisition
  section in the typed homepage and forbids restoration of the removed
  presentation component.
- The exact production build found a stale inline ESLint suppression in
  `services/dm-unread/DmUnreadStateProvider.tsx`. The referenced plugin was not
  present in that file's lint scope, so ESLint treated the suppression itself
  as an unknown-rule error. Removed the comment only; runtime behavior is
  unchanged.
- Rebuilt successfully with the production API and WebSocket endpoints: full
  repository lint, optimized Next.js build, TypeScript, 3,675 generated pages,
  and sitemap publication all passed.
- Captured the exact production build at 1440 x 1000, 820 x 1000, and
  390 x 844. The deterministic report records one `Acquisitions` heading, all
  four acquisition titles, no superseded homepage headings, no broken images,
  no console errors, and no horizontal overflow.
- Accepted screenshot SHA-256 values:
  - desktop: `4692cba94b4bb4e2a04b627be4f4abc6cde6d2526e275bb9d37d0843ee6fd65b`
  - tablet: `a74c739158967d90315627e9fc49671d8a349410a46af8a06f4eb7aa24ff19e9`
  - mobile: `1e695d4f7620e1beec5c24d07eeeb587820e616aea1143de8dedb5b79d23a57b`
- Reconciled the public status copy against canonical Museum main
  `3926d78faacf67a62b8d9b48e15d26c43b52eae9`: Keys and Gates comprises
  sixteen selected outcomes awaiting minting and accession; A Gift of Themes
  and Variations #210 has completed formal acceptance, transfer, custody, and
  accession.
- Independent museum/curatorial, visual/UX, and copy/editorial reviewers each
  re-read the exact final screenshot hashes above. All three returned PASS
  with no release blockers. Nonblocking observations concern future rhythm,
  mobile density, and minor nomenclature polish; none contradicts the factual
  or product acceptance boundary.
- Re-ran the focused homepage contract suite (7/7), changed lint, changed
  typecheck, and the Windows-safe diff check after the final copy corrections;
  all passed.
- Hosted App PR CI run `32674363154` correctly rejected the initial location
  of the retained capture utility because Knip could not infer it as an entry
  point. Moved the unchanged utility beneath the workstream's registered
  `scripts/` boundary. Full non-mutating Knip and changed lint now pass; no
  runtime code, copy, pixels, or accepted screenshot hash changed.
- CodeRabbit correctly observed that the first capture assertion could find an
  acquisition title in the section introduction even if its card were absent.
  The harness now reads only `article h3` titles inside the acquisition
  section. A fresh production-build capture retained all three accepted image
  hashes and passed the stricter four-card assertion.
- Hosted App PR CI run `32674774904` then rejected only the stricter harness's
  formatting. Applied the repository's pinned Prettier output and re-ran the
  direct Prettier check, changed lint, and diff check successfully. This is a
  tooling-only formatting correction; public output and evidence are unchanged.
- Hosted Linux lint then identified the capture utility's Windows-only
  dependency suppression as unnecessary. Removed that suppression and verified
  the file with the exact lint configuration on the current platform; the
  utility's behavior and retained visual evidence are unchanged.
