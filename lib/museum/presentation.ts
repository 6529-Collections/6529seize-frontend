export function museumSlug(value: string): string {
  return encodeURIComponent(value.trim());
}

export function museumSlugMatches(value: string, candidate: string): boolean {
  try {
    return (
      museumSlug(value) === encodeURIComponent(decodeURIComponent(candidate))
    );
  } catch {
    return museumSlug(value) === candidate;
  }
}

export function isAdoptedGovernanceEffect(governanceEffect: string): boolean {
  const normalized = governanceEffect
    .toLocaleLowerCase()
    .replace(/[_-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  const negativePrefixes = [
    "no adopted",
    "no adoption",
    "not adopted",
    "not adoption",
    "without adopted",
    "without adoption",
    "never adopted",
    "never adoption",
  ];
  if (negativePrefixes.some((prefix) => normalized.includes(prefix))) {
    return false;
  }

  return normalized
    .split(" ")
    .some((word) => word === "adopted" || word === "adoption");
}

export function displayMuseumStatus(value: string): string {
  return value
    .replace(/[_-]+/gu, " ")
    .replace(/\b\w/gu, (letter) => letter.toLocaleUpperCase());
}

export function statusTone(
  value: string
): "neutral" | "success" | "warning" | "danger" {
  const normalized = value.toLocaleLowerCase();
  if (
    normalized.includes("complete") ||
    normalized.includes("accepted") ||
    normalized.includes("adopted")
  ) {
    return "success";
  }
  if (
    normalized.includes("progress") ||
    normalized.includes("selected") ||
    normalized.includes("pending") ||
    normalized.includes("conditional")
  ) {
    return "warning";
  }
  if (normalized.includes("rejected") || normalized.includes("invalid")) {
    return "danger";
  }
  return "neutral";
}
