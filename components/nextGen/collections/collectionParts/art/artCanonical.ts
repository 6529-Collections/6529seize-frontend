export type ArtSearchParams = Readonly<
  Record<string, string | string[] | undefined>
>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Canonical ordering must not depend on the server's locale or merge distinct
// API-facing spellings. Preserve UTF-16 code-unit order explicitly.
function compareCanonicalTraits(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

/** Preserve result-set filters; sorting and display toggles share those results. */
export function getArtCanonicalQuery(searchParams: ArtSearchParams): string {
  const query = new URLSearchParams();
  const traits = firstValue(searchParams["traits"]);
  if (traits) {
    // Match the browser's first two colon-separated fields. Keep the original
    // trait/value spelling sent to the API; order and identical duplicates
    // do not select different artwork. Do not guess catalog validity here.
    const pairs = traits
      .split(",")
      .map((pair) => pair.split(":").slice(0, 2))
      .filter(([trait, value]) => trait && value)
      .map((pair) => pair.join(":"));
    const normalized = [...new Set(pairs)]
      .sort(compareCanonicalTraits)
      .join(",");
    if (normalized) {
      query.set("traits", normalized);
    }
  }
  const listed = firstValue(searchParams["listed"]);
  if (listed) {
    // Match the browser: any nonempty value other than "true" means unlisted.
    query.set("listed", String(listed === "true"));
  }
  return query.toString();
}
