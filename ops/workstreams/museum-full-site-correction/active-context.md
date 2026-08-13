# Active context

## Current state

- Frontend PR #3733 merged at exact main
  `d438a57eb58d3abaf4d7fc549441c9a5af253190`; staging deploy `31681902527`
  and automatic staging E2E `31682667244` passed, including the complete
  668-route crawl and decoded Casey, Magnum, and Keys and Gates media checks.
- Follow-up PR #3735 is open at signed exact head
  `17e6fb8e2fdfbc30318fa6b16656775d3627b917`.
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

1. Resolve every valid PR #3735 review or CI finding.
2. Merge the exact approved head.
3. Compose and qualify staging, then deploy and qualify production.
4. Audit every public Museum route live at desktop and 390px mobile widths.
