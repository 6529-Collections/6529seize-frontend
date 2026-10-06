# Museum media delivery and E2E stability

## Problem and evidence

The October 5 staging and production E2E failures include Art Blocks still
requests rejected with `net::ERR_BLOCKED_BY_ORB`. The earlier artifacts do not
establish the status, headers, or body of those rejected responses. An upstream
error, MIME error, or failed redirect must not be presented as a proven cause.

Diagnostic run [37364501865, attempt 2](https://github.com/6529-Collections/6529seize-frontend/actions/runs/37364501865/attempts/2)
observed 92 successful image responses while loading the affected Museum routes.
All returned HTTP 200 with `image/png`. The canonical Art Blocks URLs redirected
through `core-api.artblocks.io` to publisher S3 buckets. The separate HTTP replay
also succeeded; it is not evidence of the body rejected in earlier browser runs.
Six sidebar replays became ready 2.0–2.6 seconds after bundle release without
page errors. These successful replays do not reproduce the earlier CI failures.

## Delivery decision

Use the observed final publisher URLs for exactly eight accessioned stills:
the seven Casey Reas holdings and Themes and Variations #210. The finite mapping
is in `lib/museum/runtime/artBlocksDelivery.ts`. It removes the intermediary
redirects and retains publisher custody. No image bytes are added to the
repository, no derivative is created, and canonical publication URIs, source
records, rights, and credit lines remain unchanged.

The existing content-addressed CloudFront WebP proxy and its URL/redirect,
content-type, size, and deadline protections remain unchanged. This change adds
no general proxy, fetch authority, or backend dependency. New and old frontend
servers remain compatible during a rolling deployment.

When a publisher location changes, verify the canonical redirect chain and
actual image before changing the corresponding finite mapping. Do not infer a
bucket from an arbitrary token URL or broaden this into a general Art Blocks
rewrite. Persistent publisher failures must still fail image acceptance.

## Browser contracts

Museum readiness tracks media source and alternative text, including duplicate
occurrences, rather than an index in a changing list of image nodes. Every
observed image must remain present and decode. A replaced failure panel reports
the original image identity. Required holdings and artwork counts remain intact.
The Casey artist and gift checks additionally require all seven images to decode.
Responsive-candidate assertions apply to the five retained Magnum photographs.
Their existing content-addressed WebP variants are unchanged. The delivery
route relays those existing derivatives; it does not produce new variants.
The Vera Collection/object card also retains its published WebP variants.

Sidebar restoration downloads the actual Next.js bundles while withholding
delivery to the browser. The pre-hydration saved-width and page-padding assertions
remain intact. Initial bundle downloads have a 30-second bound, followed by a
separate 15-second readiness bound; the general assertion and test timeouts are
unchanged. Chromium does not download `nomodule` polyfills, so they are excluded
from the initial bundle gate. Timing evidence distinguishes downloading from
hydration and retains failures.

Museum-only Chromium diagnostics capture bounded original status/header and
transport evidence, including responses hidden by ORB. URLs omit credentials,
query values, and fragments; only selected headers are retained. Assertions do
not suppress ORB or failed media responses.

## Publisher availability monitoring

The existing Production E2E daily canary runs at 05:30 UTC. Its
`museum-institutional-practice` cron pack includes the institutional-practice
and network-IA specs at desktop and mobile. These checks require the seven
Casey images and Collection, Acquisitions, and Research media to remain present
and decode, including the eighth mapped still in Acquisitions. The
post-deployment pack repeats the same contracts. Failure notifications use the
existing CI wave workflow; no new
schedule or notification channel is introduced. A dead publisher URL must fail
these checks rather than be accepted as a fallback panel. Availability between
scheduled checks remains an external publisher dependency.

On a failure, inspect the retained original browser status/MIME/transport
evidence and the canonical redirect chain. Update an exact destination only
after verifying the publisher's actual image, then review and deploy normally.
Do not infer a storage layout for new contracts or retain replacement bytes.
The full contract-and-token source URL is the lookup key; a different contract
using an existing token number receives no override.

The repeated Source record headings describe each section's purpose, while the
separately named native disclosure summaries retain record identification and
keyboard access. Heading-only navigation loses some specificity, especially in
the System acquisition's longer record list. Independent visual review records
this as a non-blocking improvement: use approved human descriptions in a future
editorial pass rather than numbering the records. DOM IDs do not disambiguate
spoken heading names. This release makes no claim of a complete assistive
technology audit.

## Release

The exact-build tablet geometry check found a long source URL overflowing the
Casey artist and acquisition documents. Mobile capture also found the same
problem in the CENTURY project bibliography. Artist profile, acquisition and
project document renderers now allow long source links to wrap. Editorial
review also found source-record identifiers and JSON filenames presented as
project and program section headings. JSON source-record headings in project,
program and acquisition templates now use the existing translated Source record
label; human document titles and subordinate catalog identifiers remain intact. The capture
inventory includes all routes using these shared renderers, in addition to
the 25 routes affected by the delivery mapping. Initial parallel local browser
runs hit public API rate limits; those captures are superseded and final local
validation runs at reduced concurrency.

Frontend only; no backend Lambda deployment or database change is required.
Complete the Museum screenshot review before opening the PR. Follow normal PR
bot review and CI, then staging deployment and the affected E2E gate before
production. After production, verify the affected packs and live screenshots.
