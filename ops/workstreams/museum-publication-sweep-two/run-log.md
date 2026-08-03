# Run log

## 2026-08-03 — production closeout and sweep-two kickoff

- Verified production frontend commit
  `bd0983475802c8a742a1f52416fe480285ab1960` through the deployed version API
  and deployment workflow run `30773179983`.
- Retained production desktop/mobile evidence for Museum home, gift, artist,
  project, and object routes. All ten route checks loaded artwork and matched
  their viewport width; the object route exposed the exact Museum source commit.
- Verified one strict live generator iframe and Return to still. Retained the
  forced-stall timeout race as a sweep-two defect rather than claiming it passed.
- Ran the release's three read-only production packs. Core smoke passed 14/14;
  WCAG/i18n passed 6/6; surface matrix passed 24, skipped 22, and produced two
  harness false positives.
- Controlled browser tracing proved both JSON-RPC requests were
  `eth_getBlockByNumber` reads and that the sandboxed child frame was an Arweave
  presentation on the general home page, not the Museum Art Blocks viewer.
- Uploaded redacted core, WCAG, raw surface failure, classification, and Museum
  route-sweep evidence to the deployment release's approved durable artifact
  prefix. The release owner accepted the explicit false-positive exception.
- Fetched frontend remote main and created this branch from exact commit
  `bd0983475802c8a742a1f52416fe480285ab1960` before tracked edits.
- Bootstrapped an isolated frontend environment and installed frozen
  dependencies through the repository wrappers.
- Audited canonical Museum source commit
  `04856bc3d137cc2a74a8cf15f068e02d3d026038`. All seven sweep-two manuscripts
  are declared in the 209-entry deterministic release manifest.

## 2026-08-03 - sweep-two implementation and local qualification

- Extended the strict publication contract to require the governed gift
  narrative, five project essays, and source/chronology matrix. The exact-source
  probe assembled 23 public documents from canonical Museum main and failed
  closed when a required manuscript was absent.
- Replaced interim gift and project copy with those atomic publication
  documents, added the onsite source/chronology route, mapped safe relative
  citations to Museum routes or immutable exact-commit source links, and made
  wide research tables keyboard-focusable without widening the page.
- Preserved governed artwork, rights, and accession relationships. Static media
  remains only the exact-object presentation overlay already validated by the
  publication facade.
- Replaced cross-origin iframe readiness inference with an honest recovery
  affordance: the sandboxed live frame remains visible, the single Return to
  still control gains a recovery label after 12 seconds, and only a real iframe
  error invokes the hard error state. Real Chromium forced-stall evidence
  confirmed one `allow-scripts` frame remained mounted, no viewer error was
  shown, and recovery restored the still.
- Restricted desktop session-storage initialization to the top frame. Added
  the two observed public RPC hosts under the existing read-only JSON-RPC method
  parser; tests continue to reject transaction submission methods.
- Validation readback before final build: changed-code lint passed; changed-code
  typecheck passed for 1,229 TypeScript files; focused publication, Markdown,
  route, viewer, and guard tests passed 9 suites / 65 tests; the broader Museum
  regression passed 13 suites / 85 tests; the production surface matrix passed
  26 tests with 22 intentional project skips and zero failures.
- Synced 201 production help records. The repository does not define a separate
  help-index check command.
- Two bounded screenshot-harness attempts were stopped because the capture
  helper did not emit files promptly. No product assertion failed. Per release
  direction, this did not block code review; the owner-verified rescue visuals
  remain the design baseline and the new real-browser viewer recovery evidence
  is retained outside the repository.
- The production build completed successfully in 520.8 seconds, including env
  schema generation, OpenAPI generation, help/agent sync, Next compilation and
  route generation, and sitemap postbuild. The final prompt-state-only viewer
  cleanup then passed changed-code lint, changed-code typecheck, 65 focused
  tests, React Doctor 100/100, and the whitespace gate.
