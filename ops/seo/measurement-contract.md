# Organic-search measurement contract

Status: measurement-ready; no private Search Console or dashboard baseline was
available to this checkout as of 2026-09-14.

## Decision use

Use this contract to decide whether SEO work improves discovery, indexing, and
useful post-landing behavior. It is not a ranking guarantee and does not treat
wallet connection, total sessions, or a single search result as proof of
success.

The 2026-09 SEO audit established public delivery controls, but not private
search performance: 25 of 25 sampled initial responses lacked meaningful
server HTML, only 4 of 25 had canonical tags, and major sitemap families were
absent. Those are implementation baselines, not Google indexing or traffic
numbers. See the dated audit supplied with this workstream for its full sample
and observation method.

## Baseline access status (2026-09-14)

| Source                                | Read-only result                                                                                                                                              | What may be reported now                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Google Search Console domain property | No authenticated Google CLI account was available in the local credential inventory. No Search Console API/client configuration was found in this repository. | No impressions, clicks, CTR, position, coverage, canonical, or indexed-URL count is claimed. |
| AWS CloudWatch RUM                    | The local AWS CLI has no usable credentials (`NoCredentials`); no AppMonitor list or RUM data could be read.                                                  | Source configuration only, not field performance.                                            |
| Google tag / GA                       | Consent-gated Google tagging exists in source, but dashboard/property access and data quality were not verified.                                              | Do not use it as an organic-search baseline yet.                                             |
| Mixpanel and Sentry                   | Source integrations and privacy contracts exist, but their dashboards were not accessible for this workstream.                                                | Use only after an owner confirms a query and retention policy.                               |

This is deliberately an unavailable-data record rather than a zero baseline.

## Existing telemetry assessment

No tracker change is required for this measurement batch. The current code
already provides a privacy-preserving foundation:

- AWS RUM is production-only, samples browser sessions at a configurable rate
  (default 20%), records Core Web Vitals, errors, HTTP health, and normalized
  page families. It excludes raw paths, queries, hashes, dynamic identifiers,
  and selected third-party telemetry. Its public configuration is documented
  in `components/monitoring/AwsRumProvider.tsx` and `ops/telemetry/registry.json`.
- Google tag loading is gated by performance-cookie consent. The telemetry
  registry calls it legacy product-page analytics with externally unverified
  overlap, so it is not a replacement for Search Console.
- Mixpanel is consented product/funnel telemetry; Sentry is error and sampled
  performance diagnostics. Sentry default PII transmission is disabled, and
  replay remains opt-in and disabled unless explicitly configured.

Keep field RUM and Search Console exports aggregate-only. Do not add session
replay, a new tag, raw landing paths, search queries, wallet addresses,
profile handles, or content identifiers to browser telemetry.

## Required Search Console baseline

An owner with **read-only access** to the `6529.io` domain property should
export Web-search data. Record the property, search type, export timestamp,
and the last complete data date in a local receipt; do not commit credentials
or raw query exports. Google Search Console dates use its reporting timezone,
which must remain the same for comparisons.

Use two consecutive, non-overlapping 90-day windows ending on the last
complete date available at export time:

1. Current baseline: `last_complete_date - 89 days` through
   `last_complete_date` (inclusive).
2. Comparator: the immediately preceding 90 complete days.

If the current dataset is incomplete, delayed, filtered differently, or comes
from a URL-prefix rather than the same domain property, stop and label the
comparison non-comparable. Do not mix Web, Image, Discover, or News search
types. Search Console suppresses or rounds some data; totals across segmented
reports need not equal the unsegmented property total.

### Performance report

Create an aggregate report by day, page type, device, country, and query
class. The normalized columns are in
`search-console-performance.template.csv`.

| Dimension     | Required values / rule                                                                                                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page_type`   | `homepage`, `collection`, `artwork`, `museum`, `education`, `profile`, `wave`, or `other`; classify by stable page family before aggregation.                                                                                                                                             |
| `device`      | Search Console device value: `DESKTOP`, `MOBILE`, or `TABLET`. Keep unknown/missing rows out of device comparisons and record their total separately.                                                                                                                                     |
| `country`     | Three-letter Search Console country code; report a global total plus the largest relevant countries, not a selectively chosen winner.                                                                                                                                                     |
| `query_class` | `brand`, `non_brand`, or `unknown`. Use a reviewed, versioned case-insensitive matcher for 6529 names/products (for example `6529`, `the memes`, `tdh`, and `xtdh`); retain uncertain queries as `unknown`. Never commit query text.                                                      |
| Metrics       | `clicks` and `impressions` are non-negative integers; `ctr = clicks / impressions`; `position` is at least 1 when impressions exist and is 0 only for an explicit zero-impression row. Position is an impressions-weighted average and must never be averaged from already averaged rows. |

The Search Console API/export can truncate high-cardinality combinations.
When a joint query/page/country/device pull is incomplete, build separate
consistent views (page/device/country and query class/device/country), record
the API row limit and returned-row count, and never add their totals together.

The reporting table must show impressions, clicks, CTR, and position for each
comparable window, absolute change, relative change where the comparator is
nonzero, and the exact filters. Separate branded from non-branded results;
brand demand and publishing/news cycles can otherwise hide changes in content
discovery.

### Indexed-page coverage

Maintain a local, approved indexable-destination inventory by the same page
types. For each reporting date, show:

- approved destinations submitted in sitemaps;
- URLs discovered/indexed, excluded, and errored from the property-level Page
  Indexing report (label these as Search Console report counts, not a crawl);
- a stratified URL Inspection sample for each page type, with sitemap
  submission, index state, Google-selected canonical, and last crawl date.

The normalized sample format is
`search-console-inspection.template.csv`. Sample at least 10 URLs per material
page type (or all URLs when fewer than 10), including both recently changed and
long-lived URLs. URL Inspection is sampled evidence, not a sitewide indexed
count. Record redirects, noindex, robots blocks, canonical disagreement, and
soft-404 states separately.

## Field and lab performance are different evidence

| Evidence                               | Use                                                                              | Do not infer                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Search Console                         | organic impressions, clicks, CTR, position, indexing/inspection                  | Core Web Vitals for a specific visitor or a causal ranking lift       |
| AWS RUM / CrUX field data              | real-user LCP, INP, CLS at a stated percentile, device cohort, and sample period | a controlled implementation regression without release/context checks |
| Lab tools such as Lighthouse/PageSpeed | repeatable pre-release diagnostics under stated device/network settings          | population field performance or organic traffic outcome               |

For field Core Web Vitals, report the 75th percentile and eligible sample
period by device; show insufficient-traffic status instead of substituting a
lab number. For lab checks, keep the URL, date, tool/version, form factor,
network/CPU profile, and cache state with the result. Never compare a lab run
directly with RUM or CrUX as if they share a denominator.

## Import and review procedure

1. Export data to a protected local location. Remove raw query text before
   creating the normalized performance CSV.
2. Apply the page-family and query-class rules consistently to both windows.
   Preserve the source export and row-limit note outside Git-controlled paths.
3. Validate the normalized file:

   ```powershell
   seize exec node ops/scripts/seo-validate-search-console-export.cjs --kind performance --input path/to/performance.csv
   seize exec node ops/scripts/seo-validate-search-console-export.cjs --kind inspection --input path/to/inspection.csv
   ```

4. Attach only a reviewed aggregate table and validation receipt to the SEO
   review. State the property, data date, window, filters, missing rows, and
   data limitations.
5. Compare equivalent windows only after release dates, publishing cadence,
   major market/news events, and device/country mix have been noted. Attribute
   change cautiously; search recrawling and reporting lag are expected.

## Review questions

- Who owns read-only Search Console access for the `6529.io` domain property,
  and can they provide the first normalized export?
- Which reviewed matcher/version defines branded demand, including historical
  terms and variants?
- Which approved inventory is the denominator for each indexable page type?
- Which post-organic-landing outcomes are worth querying in the existing
  consented product analytics, and who owns their dashboards?
- Who owns the AWS RUM AppMonitor and can provide a read-only 75th-percentile
  mobile/desktop field-performance baseline without exposing visitor data?
