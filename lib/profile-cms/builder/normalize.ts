// Shared snake_case (backend) -> camelCase (frontend builder) normalization
// helpers. Centralized here so gallery.ts, package.ts, and api.ts do not
// duplicate the same small string/slug/id transforms (Sonar duplication
// budget is tight for this lane).

export function slugifyBuilderId(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return trimHyphenEdges(normalized).slice(0, 80) || "item";
}

function trimHyphenEdges(value: string): string {
  let start = 0;
  let end = value.length;

  while (start < end && value[start] === "-") {
    start += 1;
  }

  while (end > start && value[end - 1] === "-") {
    end -= 1;
  }

  return value.slice(start, end);
}

export function toNullableString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}
