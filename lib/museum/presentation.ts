import { formatList } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumPublicAcquisitionStatus } from "@/lib/museum/publication/ia";

export function museumSlug(value: string): string {
  return encodeURIComponent(value.trim());
}

export function formatMuseumCreatorCredit(
  creatorNames: readonly string[]
): string {
  const names = [...new Set(creatorNames)].filter(
    (name) => name.trim().length > 0
  );
  const [primary, ...collaborators] = names;
  if (primary === undefined) return "";
  if (collaborators.length === 0) return primary;
  return t(DEFAULT_LOCALE, "museum.network.artists.collaborationCredit", {
    primary,
    collaborators: formatList(DEFAULT_LOCALE, collaborators),
  });
}

export function museumCreatorSeparator(index: number, count: number): string {
  if (index === 0) return "";
  if (index === 1) {
    return `, ${t(DEFAULT_LOCALE, "museum.network.artists.collaborationWith")} `;
  }
  if (index === count - 1) {
    return ` ${t(DEFAULT_LOCALE, "museum.network.artists.collaborationAnd")} `;
  }
  return ", ";
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

export function displayMuseumPublicAcquisitionStatus(
  value: MuseumPublicAcquisitionStatus
): string {
  switch (value) {
    case "proposed_in_museum_wave":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.proposedStatus");
    case "selected_by_museum_wave_acquisition_review_in_progress":
      return t(
        DEFAULT_LOCALE,
        "museum.network.acquisitions.selectedWaveStatus"
      );
    case "selected_through_acquisition_program_acquisition_pending":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.selectedStatus");
    case "acquisition_complete_accession_review_in_progress":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.completeStatus");
    case "accessioned_into_permanent_collection":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.accessionedStatus");
    case "closed_without_selection":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.closedStatus");
    case "withdrawn":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.withdrawnStatus");
  }
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
