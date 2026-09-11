import type {
  MuseumCuratedAcquisition,
  MuseumPublication,
  MuseumPublicationLoadState,
  MuseumProject,
  MuseumPublicWork,
} from "./types";

export const MUSEUM_MAGNUM_ACQUISITION_ID = "6529NM-CA-2026-003" as const;
const MUSEUM_KEYS_AND_GATES_ACQUISITION_ID = "6529NM-CA-2026-002" as const;
const MUSEUM_KEYS_AND_GATES_PROGRAM_ID = "6529NM-AP-ENT-0002" as const;
const MUSEUM_KEYS_AND_GATES_LEGACY_PROGRAM_ID = "6529NM-AP-01" as const;

export function isMuseumKeysAndGatesProgramId(
  programId: string | null | undefined
): boolean {
  return (
    programId === MUSEUM_KEYS_AND_GATES_PROGRAM_ID ||
    programId === MUSEUM_KEYS_AND_GATES_LEGACY_PROGRAM_ID
  );
}

const PERMANENT_COLLECTION_ACQUISITION_IDS: ReadonlySet<string> = new Set([
  "6529NM-CA-2026-001",
  MUSEUM_MAGNUM_ACQUISITION_ID,
]);

function workAcquisitionIds(work: MuseumPublicWork): readonly string[] {
  const { acquisitionIds } = work as Partial<MuseumPublicWork>;
  return acquisitionIds ?? [];
}

function workProgramIds(work: MuseumPublicWork): readonly string[] {
  const { programIds } = work as Partial<MuseumPublicWork>;
  return programIds ?? [];
}

export function hasMuseumMagnumInstitutionalDisplayRights(
  work: MuseumPublicWork
): boolean {
  if (
    museumPublicWorkStatus(work) !== "accessioned_into_permanent_collection" ||
    !isMuseumPermanentCollectionWork(work) ||
    !workAcquisitionIds(work).includes(MUSEUM_MAGNUM_ACQUISITION_ID)
  ) {
    return false;
  }

  return (
    [...work.media, ...(work.mediaMetadata ?? [])].some(
      (media) =>
        media.credit.licenseLabel === "All Rights Reserved" &&
        media.credit.sourcePath.trim().length > 0
    ) ||
    (work.presentationMedia ?? []).some(
      (media) => media.credit.sourcePath.trim().length > 0
    )
  );
}

/**
 * Keys and Gates is a selected, unminted acquisition-program outcome. Its
 * explicit acquisition/program identity keeps it out of the permanent
 * Collection even if a stale projection carries a positive membership flag.
 */
function isMuseumKeysAndGatesWork(work: MuseumPublicWork): boolean {
  return (
    workAcquisitionIds(work).includes(MUSEUM_KEYS_AND_GATES_ACQUISITION_ID) ||
    workProgramIds(work).some(isMuseumKeysAndGatesProgramId)
  );
}

/**
 * Frontend collection membership policy for the current public Museum model.
 * The policy is intentionally ID-gated: it does not infer accession from a
 * wallet, transfer, airdrop, or Wave label.
 */
export function isMuseumPermanentCollectionWork(
  work: MuseumPublicWork
): boolean {
  if (isMuseumKeysAndGatesWork(work)) return false;
  return (
    workAcquisitionIds(work).some((id) =>
      PERMANENT_COLLECTION_ACQUISITION_IDS.has(id)
    ) || work.collectionMembership === true
  );
}

export function museumPublicWorkStatus(
  work: MuseumPublicWork
): MuseumPublicWork["status"] {
  if (isMuseumPermanentCollectionWork(work)) {
    return "accessioned_into_permanent_collection";
  }
  if (isMuseumKeysAndGatesWork(work)) {
    return "selected_through_acquisition_program_acquisition_pending";
  }
  return work.status;
}

export function museumPublicAcquisitionStatus(
  acquisition: Pick<MuseumCuratedAcquisition, "id" | "programId" | "status">
): MuseumCuratedAcquisition["status"] {
  if (PERMANENT_COLLECTION_ACQUISITION_IDS.has(acquisition.id)) {
    return "accessioned_into_permanent_collection";
  }
  if (
    acquisition.id === MUSEUM_KEYS_AND_GATES_ACQUISITION_ID ||
    isMuseumKeysAndGatesProgramId(acquisition.programId)
  ) {
    return "selected_through_acquisition_program_acquisition_pending";
  }
  return acquisition.status;
}

export function museumPublicWorkRelation(work: MuseumPublicWork): string {
  switch (museumPublicWorkStatus(work)) {
    case "accessioned_into_permanent_collection":
      return "In Collection";
    case "selected_through_acquisition_program_acquisition_pending":
      return "Selected work";
    case "proposed_in_museum_wave":
    case "selected_by_museum_wave_acquisition_review_in_progress":
    case "acquisition_complete_accession_review_in_progress":
      return "In acquisition process";
    case "closed_without_selection":
    case "withdrawn":
      return "Historical work";
  }
}

/** Resolve both canonical project links and declared legacy Work aliases. */
export function museumProjectWorks(
  publication: MuseumPublication,
  project: MuseumProject
): readonly MuseumPublicWork[] {
  const declaredSourceIds = new Set([
    ...(project.workIds ?? []),
    ...project.artworkIds,
  ]);
  const declaredWorkIds = new Set([
    ...declaredSourceIds,
    ...(publication.workAliases ?? [])
      .filter((alias) => declaredSourceIds.has(alias.sourceObjectId))
      .map((alias) => alias.workId),
  ]);
  return (publication.works ?? []).filter(
    (work) => work.projectId === project.id || declaredWorkIds.has(work.id)
  );
}

/**
 * Apply the reviewed frontend collection model without mutating the published
 * source graph. This is idempotent so mocked route bundles and live bundles
 * share the same semantics.
 */
export function applyMuseumCollectionSemantics(
  publication: MuseumPublication
): MuseumPublication {
  const works = publication.works?.map((work) => ({
    ...work,
    status: museumPublicWorkStatus(work),
    collectionMembership: isMuseumPermanentCollectionWork(work),
  }));
  const curatedAcquisitions = publication.curatedAcquisitions?.map(
    (acquisition) => ({
      ...acquisition,
      status: museumPublicAcquisitionStatus(acquisition),
    })
  );
  return {
    ...publication,
    ...(works === undefined ? {} : { works }),
    ...(curatedAcquisitions === undefined ? {} : { curatedAcquisitions }),
  };
}

export function applyMuseumCollectionSemanticsToLoadState(
  state: MuseumPublicationLoadState
): MuseumPublicationLoadState {
  if (state.publication === null) return state;
  return {
    ...state,
    publication: applyMuseumCollectionSemantics(state.publication),
  };
}

/**
 * The directory data module has an additional raw-graph fail-closed guard.
 * Its route query has already applied the reviewed collection policy, so use
 * a graph-free presentation projection there rather than inventing graph
 * relations that are not present in the source publication.
 */
export function museumDirectoryPublication(
  publication: MuseumPublication
): MuseumPublication {
  const normalized = applyMuseumCollectionSemantics(publication);
  const { entityGraph, ...directoryPublication } = normalized;
  void entityGraph;
  return directoryPublication;
}
