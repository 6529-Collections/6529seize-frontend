export function museumSlug(value: string): string {
  return encodeURIComponent(value.trim());
}

export function museumSlugMatches(value: string, candidate: string): boolean {
  if (value.trim() === candidate) {
    return true;
  }

  try {
    const decodedCandidate = decodeURIComponent(candidate);
    return (
      museumSlug(value) === candidate ||
      museumSlug(value) === encodeURIComponent(decodedCandidate) ||
      value.trim() === decodedCandidate
    );
  } catch {
    return museumSlug(value) === candidate || value.trim() === candidate;
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
  if (value === "selection_complete_acquisition_and_accession_unverified") {
    return "Selection complete; acquisition and accession unverified";
  }
  if (value === "selected_unminted") {
    return "Selected; unminted";
  }

  return value
    .replace(/[_-]+/gu, " ")
    .replace(/\b\w/gu, (letter) => letter.toLocaleUpperCase());
}

export function statusTone(
  value: string
): "neutral" | "success" | "warning" | "danger" {
  const normalized = value.toLocaleLowerCase();
  if (
    normalized.includes("unverified") ||
    normalized.includes("progress") ||
    normalized.includes("selected") ||
    normalized.includes("pending") ||
    normalized.includes("conditional")
  ) {
    return "warning";
  }
  if (
    normalized.includes("complete") ||
    normalized.includes("accepted") ||
    normalized.includes("adopted") ||
    normalized.includes("accessioned")
  ) {
    return "success";
  }
  if (normalized.includes("rejected") || normalized.includes("invalid")) {
    return "danger";
  }
  return "neutral";
}
