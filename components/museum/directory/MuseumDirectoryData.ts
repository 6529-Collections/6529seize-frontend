import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumArtist,
  MuseumPublication,
  MuseumPublicRelationRecord,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import { displayMuseumPublicAcquisitionStatus } from "@/lib/museum/presentation";

export type MuseumDirectoryWorkSection =
  | "permanent_collection"
  | "acquisition_in_process"
  | "other";

export interface MuseumDirectoryWorkRecord {
  readonly work: MuseumPublicWork;
  readonly artist: MuseumArtist | null;
  readonly artistName: string;
  readonly section: MuseumDirectoryWorkSection;
  readonly acquisitionTitle: string | null;
  readonly programTitle: string | null;
  readonly contextTitle: string | null;
  readonly relationship: string;
}

export interface MuseumDirectoryArtistRecord {
  readonly artist: MuseumArtist;
  readonly works: readonly MuseumDirectoryWorkRecord[];
  readonly permanentWorks: readonly MuseumDirectoryWorkRecord[];
  readonly acquisitionWorks: readonly MuseumDirectoryWorkRecord[];
  readonly relationship: string;
  readonly representative: MuseumDirectoryWorkRecord | null;
}

export interface MuseumDirectoryModel {
  readonly works: readonly MuseumDirectoryWorkRecord[];
  readonly permanentWorks: readonly MuseumDirectoryWorkRecord[];
  readonly acquisitionWorks: readonly MuseumDirectoryWorkRecord[];
  readonly artists: readonly MuseumDirectoryArtistRecord[];
  readonly permanentArtists: readonly MuseumDirectoryArtistRecord[];
  readonly acquisitionArtists: readonly MuseumDirectoryArtistRecord[];
}

const CLOSED_WORK_STATUSES = new Set(["closed_without_selection", "withdrawn"]);

function isActiveRelation(relation: MuseumPublicRelationRecord): boolean {
  return (
    relation.assertionStatus === "asserted" ||
    relation.assertionStatus === "observed"
  );
}

/**
 * A work is in the Collection only when the canonical projection says so and
 * the graph still carries the active Collection edge. The second check keeps
 * this UI fail-closed if a malformed publication ever reaches the renderer.
 */
export function museumDirectoryHasPermanentCollectionEdge(
  publication: MuseumPublication,
  work: MuseumPublicWork
): boolean {
  if (work.collectionMembership !== true) return false;
  const graph = publication.entityGraph;
  if (graph === undefined) return true;

  return graph.relations.some(
    (relation) =>
      isActiveRelation(relation) &&
      relation.relationType === "COLLECTION_CONTAINS_WORK" &&
      relation.targetEntityId === work.id &&
      relation.qualifier["collection_membership_status"] ===
        "permanent_collection" &&
      graph.entities.some(
        (entity) =>
          entity.id === relation.sourceEntityId &&
          entity.entityType === "COLLECTION"
      )
  );
}

function findAcquisitionTitle(
  publication: MuseumPublication,
  work: MuseumPublicWork
): string | null {
  const acquisition = publication.curatedAcquisitions?.find((candidate) =>
    work.acquisitionIds.includes(candidate.id)
  );
  return acquisition?.title ?? null;
}

function findProgramTitle(
  publication: MuseumPublication,
  work: MuseumPublicWork
): string | null {
  const program = publication.acquisitionPrograms?.find((candidate) =>
    work.programIds.includes(candidate.id)
  );
  return program?.title ?? null;
}

function contextTitle(
  acquisitionTitle: string | null,
  programTitle: string | null
): string | null {
  if (acquisitionTitle === null) return programTitle;
  if (programTitle === null || programTitle === acquisitionTitle) {
    return acquisitionTitle;
  }
  return `${acquisitionTitle} ${String.fromCharCode(183)} ${programTitle}`;
}

function workSection(
  publication: MuseumPublication,
  work: MuseumPublicWork
): MuseumDirectoryWorkSection {
  if (museumDirectoryHasPermanentCollectionEdge(publication, work)) {
    return "permanent_collection";
  }
  if (CLOSED_WORK_STATUSES.has(work.status)) return "other";
  return "acquisition_in_process";
}

function countWorks(count: number): string {
  return t(
    DEFAULT_LOCALE,
    count === 1
      ? "museum.network.acquisitions.worksCount.one"
      : "museum.network.acquisitions.worksCount.other",
    { count }
  );
}

function statusPhrase(work: MuseumPublicWork, context: string | null): string {
  const withContext = (status: string): string =>
    context === null
      ? status
      : t(DEFAULT_LOCALE, "museum.network.acquisitions.statusWithContext", {
          status,
          context,
        });

  switch (work.status) {
    case "accessioned_into_permanent_collection":
      return t(DEFAULT_LOCALE, "museum.network.works.collectionStatus");
    case "selected_by_museum_wave_acquisition_review_in_progress":
      return withContext(
        t(DEFAULT_LOCALE, "museum.network.acquisitions.selectedWaveStatus")
      );
    case "acquisition_complete_accession_review_in_progress":
      return withContext(
        t(DEFAULT_LOCALE, "museum.network.acquisitions.completeStatus")
      );
    case "selected_through_acquisition_program_acquisition_pending":
      return withContext(
        t(DEFAULT_LOCALE, "museum.network.acquisitions.selectedStatus")
      );
    case "proposed_in_museum_wave":
      return t(DEFAULT_LOCALE, "museum.network.works.proposedStatus");
    case "closed_without_selection":
    case "withdrawn":
      return displayMuseumPublicAcquisitionStatus(work.status);
  }
}

function relationshipForArtist(
  works: readonly MuseumDirectoryWorkRecord[]
): string {
  const permanentCount = works.filter(
    (record) => record.section === "permanent_collection"
  ).length;
  const acquisitionGroups = new Map<
    string,
    { count: number; work: MuseumPublicWork; contextTitle: string | null }
  >();

  for (const record of works) {
    if (record.section === "permanent_collection") continue;
    const key = `${record.work.status}|${record.contextTitle ?? ""}`;
    const current = acquisitionGroups.get(key);
    if (current === undefined) {
      acquisitionGroups.set(key, {
        count: 1,
        work: record.work,
        contextTitle: record.contextTitle,
      });
    } else {
      acquisitionGroups.set(key, { ...current, count: current.count + 1 });
    }
  }

  const parts: string[] = [];
  if (permanentCount > 0) {
    parts.push(
      t(DEFAULT_LOCALE, "museum.network.artists.collectionCount", {
        count: permanentCount,
      })
    );
  }
  for (const group of acquisitionGroups.values()) {
    parts.push(
      `${countWorks(group.count)} ${statusPhrase(group.work, group.contextTitle)}`
    );
  }

  return parts.join(` ${String.fromCharCode(183)} `);
}

function representativeWork(
  works: readonly MuseumDirectoryWorkRecord[]
): MuseumDirectoryWorkRecord | null {
  return (
    works.find((record) =>
      record.work.media.some(
        (media) => media.kind === "still" && media.role === "source"
      )
    ) ??
    works.find((record) => (record.work.presentationMedia ?? []).length > 0) ??
    works.find((record) => (record.work.mediaMetadata ?? []).length > 0) ??
    works[0] ??
    null
  );
}

export function museumDirectoryStatusText(
  record: MuseumDirectoryWorkRecord
): string {
  return statusPhrase(record.work, record.contextTitle);
}

export function buildMuseumDirectoryModel(
  publication: MuseumPublication
): MuseumDirectoryModel | null {
  const works = publication.works;
  if (works === undefined || works.length === 0) return null;

  const artistsById = new Map(
    publication.artists.map((artist) => [artist.id, artist] as const)
  );
  const records = works.map((work) => {
    const artist = artistsById.get(work.artistId) ?? null;
    const acquisitionTitle = findAcquisitionTitle(publication, work);
    const programTitle = findProgramTitle(publication, work);
    const context = contextTitle(acquisitionTitle, programTitle);
    const record: MuseumDirectoryWorkRecord = {
      work,
      artist,
      artistName: artist?.preferredName ?? work.artistId,
      section: workSection(publication, work),
      acquisitionTitle,
      programTitle,
      contextTitle: context,
      relationship: "",
    };
    return { ...record, relationship: statusPhrase(work, context) };
  });

  const recordsByArtist = new Map<string, MuseumDirectoryWorkRecord[]>();
  for (const record of records) {
    const artistIds = new Set(
      record.work.artistIds ?? [record.work.artistId]
    );
    artistIds.add(record.work.artistId);
    for (const artistId of artistIds) {
      const current = recordsByArtist.get(artistId) ?? [];
      current.push(record);
      recordsByArtist.set(artistId, current);
    }
  }

  const artistRecords = publication.artists.flatMap((artist) => {
    const artistWorks = recordsByArtist.get(artist.id) ?? [];
    if (artistWorks.length === 0) return [];
    const permanentWorks = artistWorks.filter(
      (record) => record.section === "permanent_collection"
    );
    const acquisitionWorks = artistWorks.filter(
      (record) => record.section === "acquisition_in_process"
    );
    return [
      {
        artist,
        works: artistWorks,
        permanentWorks,
        acquisitionWorks,
        relationship: relationshipForArtist(artistWorks),
        representative: representativeWork([
          ...permanentWorks,
          ...acquisitionWorks,
          ...artistWorks.filter((record) => record.section === "other"),
        ]),
      },
    ];
  });

  return {
    works: records,
    permanentWorks: records.filter(
      (record) => record.section === "permanent_collection"
    ),
    acquisitionWorks: records.filter(
      (record) => record.section === "acquisition_in_process"
    ),
    artists: artistRecords,
    permanentArtists: artistRecords.filter(
      (record) => record.permanentWorks.length > 0
    ),
    acquisitionArtists: artistRecords.filter(
      (record) => record.acquisitionWorks.length > 0
    ),
  };
}
