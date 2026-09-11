import type { MuseumPublication } from "./types";
import type { MuseumView } from "@/lib/museum/types";
import { isMuseumPermanentCollectionWork } from "./collectionSemantics";

/**
 * Canonical Museum route grammar. Entity identity is resolved from the
 * published record; these helpers only serialize an already-resolved slug or
 * identifier into a public URL.
 */

export const MUSEUM_CASEY_ACQUISITION_ID = "6529NM-CA-2026-001" as const;
export const MUSEUM_KEYS_AND_GATES_ACQUISITION_ID =
  "6529NM-CA-2026-002" as const;
export const MUSEUM_CASEY_ACQUISITION_SLUG =
  "the-system-in-seven-states" as const;
export const MUSEUM_KEYS_AND_GATES_ACQUISITION_SLUG = "keys-and-gates" as const;
const MUSEUM_KEYS_AND_GATES_PROGRAM_SLUG = "keys-and-gates" as const;
const MUSEUM_GIFT_ACQUISITIONS_PROGRAM_SLUG = "gift-acquisitions" as const;

export function museumCollectionHref(): string {
  return "/museum/network/collection";
}

export function museumAcquisitionsHref(): string {
  return "/museum/network/acquisitions";
}

export function museumAcquisitionProgramsHref(): string {
  return "/museum/network/acquisition-programs";
}

export function isMuseumCanonicalWorkId(value: string): boolean {
  return /^6529NM-W-[0-9]{4}$/u.test(value);
}

export function museumWorkHref(workId: string): string {
  if (!isMuseumCanonicalWorkId(workId)) {
    throw new Error("museum_work_id_not_canonical");
  }
  return `/museum/network/works/${encodeURIComponent(workId)}`;
}

function routeAliasesForPublication(
  publication: MuseumPublication
): readonly NonNullable<MuseumPublication["routeAliases"]>[number][] {
  return (
    publication.routeAliases ??
    publication.entityGraph?.identityInventory.routeAliases ??
    []
  );
}

function canonicalRouteAliasForSourceId(
  publication: MuseumPublication,
  sourceId: string,
  legacyPrefixes: readonly string[],
  canonicalPrefix: string
): string | null {
  const alias = routeAliasesForPublication(publication).find((candidate) => {
    const lastSegment = candidate.legacyRoute.slice(
      candidate.legacyRoute.lastIndexOf("/") + 1
    );
    try {
      return (
        legacyPrefixes.some((prefix) =>
          candidate.legacyRoute.startsWith(prefix)
        ) &&
        decodeURIComponent(lastSegment) === sourceId &&
        candidate.canonicalRoute.startsWith(canonicalPrefix)
      );
    } catch {
      return false;
    }
  });
  return alias?.canonicalRoute ?? null;
}

export function museumArtistHref(slug: string): string {
  return `/museum/network/artists/${encodeURIComponent(slug)}`;
}

export function museumProjectHref(slug: string): string {
  return `/museum/network/projects/${encodeURIComponent(slug)}`;
}

export function museumAcquisitionHref(slug: string): string {
  return `/museum/network/acquisitions/${encodeURIComponent(slug)}`;
}

/**
 * Legacy URL joins are explicit fixture joins. A legacy accession/program
 * value is never transformed into an acquisition identity by string rules.
 */
function museumLegacyAcquisitionHref(value: string): string | null {
  if (value === "6529NM.2026.001") {
    return museumAcquisitionHref(MUSEUM_CASEY_ACQUISITION_SLUG);
  }
  return null;
}

export function museumAcquisitionProgramHref(slug: string): string {
  return `/museum/network/acquisition-programs/${encodeURIComponent(slug)}`;
}

/**
 * Compatibility projection for the released AP-01 program record. The
 * program entity has its own canonical route; it is not the curated
 * acquisition route for the works it produced.
 */
function museumLegacyAcquisitionProgramHref(value: string): string | null {
  if (
    value === "6529NM-AP-01" ||
    value === MUSEUM_KEYS_AND_GATES_PROGRAM_SLUG
  ) {
    return museumAcquisitionProgramHref(MUSEUM_KEYS_AND_GATES_PROGRAM_SLUG);
  }
  if (
    value === "AP-GIFT-01" ||
    value === MUSEUM_GIFT_ACQUISITIONS_PROGRAM_SLUG
  ) {
    return museumAcquisitionProgramHref(MUSEUM_GIFT_ACQUISITIONS_PROGRAM_SLUG);
  }
  return null;
}

export function museumResearchHref(slug?: string): string {
  return slug === undefined
    ? "/museum/network/research"
    : `/museum/network/research/${encodeURIComponent(slug)}`;
}

export function museumOrganizationHref(slug: string): string {
  return `/museum/network/organizations/${encodeURIComponent(slug)}`;
}

export function museumApprovedCollectionSlug(preferredName: string): string {
  return encodeURIComponent(
    preferredName.trim().toLocaleLowerCase().replace(/\s+/gu, "-")
  );
}

export function resolveMuseumWorkId(
  publication: MuseumPublication,
  sourceObjectId: string,
  view: MuseumView | null = null
): string | null {
  if (publication.works === undefined) {
    return publication.artworks.some(
      (artwork) => artwork.id === sourceObjectId
    ) ||
      view?.objects.some((object) => object.objectId === sourceObjectId) ===
        true
      ? sourceObjectId
      : null;
  }
  if (publication.works.some((work) => work.id === sourceObjectId))
    return sourceObjectId;
  return (
    publication.workAliases?.find(
      (alias) => alias.sourceObjectId === sourceObjectId
    )?.workId ?? null
  );
}

export function museumWorkHrefForSourceId(
  publication: MuseumPublication,
  sourceObjectId: string,
  view: MuseumView | null = null
): string | null {
  const workId = resolveMuseumWorkId(publication, sourceObjectId, view);
  if (workId !== null && isMuseumCanonicalWorkId(workId)) {
    return museumWorkHref(workId);
  }
  return canonicalRouteAliasForSourceId(
    publication,
    sourceObjectId,
    [
      "/museum/network/works/",
      "/museum/network/objects/",
      "/museum/network/collection/",
    ],
    "/museum/network/works/"
  );
}

export function museumWorkHrefIndex(
  publication: MuseumPublication,
  view: MuseumView | null = null
): Readonly<Record<string, string>> {
  const sourceIds = new Set([
    ...(publication.works?.map((work) => work.id) ?? []),
    ...(publication.workAliases?.map((alias) => alias.sourceObjectId) ?? []),
    ...publication.artworks.map((artwork) => artwork.id),
    ...(view?.objects.map((object) => object.objectId) ?? []),
  ]);
  const index = Object.fromEntries(
    [...sourceIds].flatMap((sourceId) => {
      const href = museumWorkHrefForSourceId(publication, sourceId, view);
      return href === null ? [] : [[sourceId, href]];
    })
  );
  for (const work of publication.works ?? []) {
    const href = museumWorkHrefForSourceId(publication, work.id, view);
    if (href === null) continue;
    for (const documentId of work.documentIds) {
      const sourcePath = publication.documents.find(
        (document) => document.id === documentId
      )?.sourcePath;
      if (sourcePath !== undefined) index[sourcePath] = href;
    }
  }
  return index;
}

/**
 * The collection namespace is narrower than the generic object namespace.
 * Resolve through the canonical Work first, then require the relation-gated
 * Collection projection before serializing a permanent-hold redirect.
 */
export function museumCollectionWorkHrefForSourceId(
  publication: MuseumPublication,
  sourceObjectId: string,
  view: MuseumView | null = null
): string | null {
  const workId = resolveMuseumWorkId(publication, sourceObjectId, view);
  if (workId === null) return null;
  const typedWork = publication.works?.find((work) => work.id === workId);
  if (typedWork !== undefined) {
    return isMuseumPermanentCollectionWork(typedWork)
      ? museumWorkHref(workId)
      : null;
  }
  const legacyArtwork = publication.artworks.find(
    (artwork) => artwork.id === sourceObjectId
  );
  return legacyArtwork?.institutionalStatus === "accessioned"
    ? museumWorkHrefForSourceId(publication, sourceObjectId, view)
    : null;
}

export function resolveMuseumAcquisitionSlug(
  publication: MuseumPublication,
  sourceId: string
): string | null {
  const typed = publication.curatedAcquisitions?.find(
    (acquisition) =>
      acquisition.id === sourceId ||
      acquisition.slug === sourceId ||
      acquisition.sourceAliases?.includes(sourceId) === true ||
      publication.acquisitionAliases?.some(
        (alias) =>
          alias.acquisitionId === acquisition.id && alias.alias === sourceId
      ) === true
  );
  if (typed !== undefined) return typed.slug;
  const routeAlias = canonicalRouteAliasForSourceId(
    publication,
    sourceId,
    ["/museum/network/acquisitions/"],
    "/museum/network/acquisitions/"
  );
  if (routeAlias !== null) return routeAlias.split("/").at(-1) ?? null;
  return publication.curatedAcquisitions === undefined &&
    museumLegacyAcquisitionHref(sourceId) !== null
    ? MUSEUM_CASEY_ACQUISITION_SLUG
    : null;
}

export function museumAcquisitionHrefForSourceId(
  publication: MuseumPublication,
  sourceId: string
): string | null {
  const slug = resolveMuseumAcquisitionSlug(publication, sourceId);
  return slug === null ? null : museumAcquisitionHref(slug);
}

/**
 * Resolve only an explicit legacy gift/accession route alias. Acquisition
 * program IDs, Wave drops, and object aliases are intentionally outside this
 * compatibility namespace.
 */
export function museumAcquisitionHrefForLegacyRoute(
  publication: MuseumPublication,
  sourceId: string,
  legacyPrefix: "/museum/network/gifts/" | "/museum/network/accessions/"
): string | null {
  const routeAlias = routeAliasesForPublication(publication).find((alias) => {
    if (!alias.legacyRoute.startsWith(legacyPrefix)) return false;
    const lastSegment = alias.legacyRoute.slice(
      alias.legacyRoute.lastIndexOf("/") + 1
    );
    try {
      return (
        decodeURIComponent(lastSegment) === sourceId &&
        alias.canonicalRoute.startsWith("/museum/network/acquisitions/")
      );
    } catch {
      return false;
    }
  });
  if (routeAlias !== undefined) return routeAlias.canonicalRoute;
  const typedAlias = publication.acquisitionAliases?.find(
    (alias) => alias.alias === sourceId
  );
  if (typedAlias !== undefined) {
    const acquisition = publication.curatedAcquisitions?.find(
      (candidate) => candidate.id === typedAlias.acquisitionId
    );
    if (acquisition !== undefined) {
      return museumAcquisitionHref(acquisition.slug);
    }
  }
  return publication.curatedAcquisitions === undefined &&
    sourceId === "6529NM.2026.001"
    ? museumAcquisitionHref(MUSEUM_CASEY_ACQUISITION_SLUG)
    : null;
}

export function resolveMuseumAcquisitionProgramSlug(
  publication: MuseumPublication,
  sourceId: string
): string | null {
  const typed = publication.acquisitionPrograms?.find(
    (program) =>
      program.id === sourceId ||
      program.slug === sourceId ||
      program.sourceAliases?.includes(sourceId) === true
  );
  if (typed !== undefined) return typed.slug;
  const routeAlias = canonicalRouteAliasForSourceId(
    publication,
    sourceId,
    ["/museum/network/acquisition-programs/"],
    "/museum/network/acquisition-programs/"
  );
  if (routeAlias !== null) return routeAlias.split("/").at(-1) ?? null;
  if (publication.acquisitionPrograms !== undefined) return null;
  if (museumLegacyAcquisitionProgramHref(sourceId) === null) return null;
  if (
    sourceId === "AP-GIFT-01" ||
    sourceId === MUSEUM_GIFT_ACQUISITIONS_PROGRAM_SLUG
  ) {
    return MUSEUM_GIFT_ACQUISITIONS_PROGRAM_SLUG;
  }
  return MUSEUM_KEYS_AND_GATES_PROGRAM_SLUG;
}

export function museumAcquisitionProgramHrefForSourceId(
  publication: MuseumPublication,
  sourceId: string
): string | null {
  const slug = resolveMuseumAcquisitionProgramSlug(publication, sourceId);
  return slug === null ? null : museumAcquisitionProgramHref(slug);
}
