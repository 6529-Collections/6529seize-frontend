# Active context

## Current state

- Frontend PR #3733 merged at exact main
  `d438a57eb58d3abaf4d7fc549441c9a5af253190`; staging deploy `31681902527`
  and automatic staging E2E `31682667244` passed, including the complete
  668-route crawl and decoded Casey, Magnum, and Keys and Gates media checks.
- Follow-up PR #3735 merged as exact frontend main
  `3bf97fb98a330e9fd42bcef40b0ffaec1d415aaf`.
- The test-contract follow-up PR #3737 merged as
  `3fe402fc2e0c13be5ffb18bf16785c6560d7f7a2`; automatic staging E2E run
  `31694252972` passed all 17 packs.
- The final protected-main production candidate was
  `6c7914a4eb270cb6acfa96eb7a8470106db91eb0`. Production deployment run
  `31697156091` and automatic production E2E run `31698559323` passed,
  including isolated evidence verification.
- Three consecutive live `/api/version` readbacks matched exact production
  `6c7914a4eb270cb6acfa96eb7a8470106db91eb0` with `stale:false`.
- The independent production audit passed all 651 generated Museum routes,
  with zero HTTP, soft-404, or Museum-boundary failures. The exact live
  desktop/mobile Museum IA suite passed 6/6, including Collection membership,
  all five Magnum photographs, all 16 Keys and Gates selections, responsive
  layout, navigation, and WCAG A/AA checks.
- Canonical Museum source is merged at
  `a5b64f7eb586a5a07024b56a0604d8b8ae0ea574`; post-merge run
  `31657649972` passed all six Museum, portable, catalog, and public-publication
  jobs.
- The canonical moving-main release points to active catalog commit
  `975f041aed7e2f402ab26d4fb2bb266e07db4974`; its immutable reviewed source is
  `9aea66c07d59f890e366dde6552a304580ba789a`. The website reports the reviewed
  source identity while resolving the active pointer from canonical main.
- The canonical public record states 12 works in the permanent Collection:
  seven Casey Reas works in accession `6529NM.2026.001` and five Magnum Photos
  works in accession `6529NM.2026.002`.
- Keys and Gates is selected, unminted, and in process. It is outside the
  permanent Collection until mint, custody, and accession are complete.
- The follow-up corrects the independently audited publication join defects,
  broken Research URLs, Collection hero composition, portrait media framing,
  mobile tables, long-manuscript tiering, and the plain-language explanation
  of accession channels.

## Rights interpretation

The Museum may publish and display the five Magnum photographs with the
specified credits in its institutional Collection, accession, artist, Work,
and scholarship contexts. Copyright remains with the photographers and Magnum
Photos. The accession does not create a general commercial-reproduction,
print, derivative-work, licensing, downloadable-master, preservation-copy, or
AI-training permission.

## Release boundary

1. Present Collection holdings, acquisition histories, acquisition programs,
   artists, Works, projects, and research as distinct but connected entities.
2. Lead acquisition and research routes with art and interpretation; place
   machine records, process, and source provenance in supporting tiers.
3. Eliminate misleading labels such as “connected work,” proposal treatment
   for completed Magnum accession, and permanent-Collection treatment for
   Keys and Gates.
4. Require exact-source activation and fail closed where canonical publication
   records are incomplete.
5. Complete PR review, staging E2E, production E2E, and a route-by-route live
   desktop/mobile editorial and media audit before closeout.

## Next work

1. No release-critical work remains for this correction lane.
2. Treat later Museum content or presentation changes as a new scoped release.
