import {
  buildMuseumAcquisitionContext,
  buildMuseumAcquisitionIndex,
} from "./iaAcquisitions";
import { buildMuseumWorkContext } from "./iaWorkContext";
import type {
  MuseumExternalProposalPresentationMedia,
  MuseumArtist,
  MuseumPublication,
} from "./types";
import { selectMuseumStillMedia } from "./mediaSelection";
import type { MuseumView } from "@/lib/museum/types";
import {
  museumProjectWorks,
  museumPublicWorkRelation,
  museumPublicWorkStatus,
} from "./collectionSemantics";
import {
  museumAcquisitionHref,
  museumAcquisitionProgramHref,
  museumArtistHref,
  museumCollectionHref,
  museumOrganizationHref,
  museumProjectHref,
  museumResearchHref,
  museumWorkHref,
  museumWorkHrefForSourceId,
} from "./routes";

const MUSEUM_NETWORK_ROOT = "/museum/network" as const;

export type MuseumEntityKind =
  | "collection"
  | "work"
  | "artist"
  | "organization"
  | "project"
  | "curated_acquisition"
  | "acquisition_program"
  | "research"
  | "about"
  | "exhibition";

export type MuseumStatusTone = "neutral" | "success" | "warning" | "danger";

export interface MuseumBreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

export interface MuseumEntityRefMedia {
  readonly kind: "governed" | "external_proposal";
  readonly src: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly alt: string;
  readonly creditLine?: string;
  readonly srcSet?: string;
  readonly sizes?: string;
}

export interface MuseumEntityRef {
  readonly kind: MuseumEntityKind;
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly relation: string;
  readonly status?: string;
  readonly statusAsOf?: string | null;
  readonly sourcePath?: string;
  readonly sourceCommit?: string;
  readonly media?: MuseumEntityRefMedia;
}

export interface MuseumEntityRelations {
  readonly primaryRelations: readonly MuseumEntityRef[];
  readonly secondaryRelations: readonly MuseumEntityRef[];
}

export interface MuseumEntityContextModel {
  readonly kind: Exclude<MuseumEntityKind, "exhibition">;
  readonly id: string;
  readonly label: string;
  readonly canonicalHref: string;
  readonly breadcrumbs: readonly MuseumBreadcrumbItem[];
  readonly status?: string;
  readonly statusAsOf: string | null;
  readonly statusTone?: MuseumStatusTone;
  readonly primaryRelations: readonly MuseumEntityRef[];
  readonly secondaryRelations: readonly MuseumEntityRef[];
  readonly sourcePath: string | null;
  readonly sourceCommit: string | null;
}

export type MuseumPublicAcquisitionStatus =
  | "proposed_in_museum_wave"
  | "selected_by_museum_wave_acquisition_review_in_progress"
  | "selected_through_acquisition_program_acquisition_pending"
  | "acquisition_complete_accession_review_in_progress"
  | "accessioned_into_permanent_collection"
  | "closed_without_selection"
  | "withdrawn";

export interface MuseumAcquisitionViewModel extends MuseumEntityContextModel {
  readonly kind: "curated_acquisition";
  readonly acquisitionId: string;
  readonly slug: string;
  readonly title: string;
  readonly thesis: string;
  readonly status: MuseumPublicAcquisitionStatus;
  readonly acquisitionMethod: string;
  readonly programId: string | null;
  readonly pathway: string | null;
  readonly artistIds: readonly string[];
  readonly organizationIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly workIds: readonly string[];
  readonly accessionLotIds: readonly string[];
  readonly sourceDocumentIds: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly presentationMedia: readonly MuseumExternalProposalPresentationMedia[];
}

function dedupe(
  refs: readonly (MuseumEntityRef | null)[]
): readonly MuseumEntityRef[] {
  const seen = new Set<string>();
  return refs.flatMap((item) => {
    if (item === null) return [];
    const key = `${item.kind}:${item.id}:${item.href}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [item];
  });
}

function ref(input: {
  readonly kind: MuseumEntityKind;
  readonly id: string;
  readonly label: string;
  readonly href: string | null;
  readonly relation: string;
  readonly status?: string;
  readonly statusAsOf?: string | null;
  readonly sourcePath?: string | null;
  readonly sourceCommit?: string | null;
  readonly media?: MuseumEntityRefMedia;
}): MuseumEntityRef | null {
  if (
    input.href === null ||
    input.href.trim().length === 0 ||
    input.id.trim().length === 0
  )
    return null;
  return {
    kind: input.kind,
    id: input.id,
    label: input.label,
    href: input.href,
    relation: input.relation,
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.statusAsOf === undefined ? {} : { statusAsOf: input.statusAsOf }),
    ...(input.sourcePath?.trim() ? { sourcePath: input.sourcePath } : {}),
    ...(input.sourceCommit?.trim() ? { sourceCommit: input.sourceCommit } : {}),
    ...(input.media === undefined ? {} : { media: input.media }),
  };
}

function hasValidEntityRef(entityRef: MuseumEntityRef): boolean {
  return (
    entityRef.id.trim().length > 0 &&
    entityRef.label.trim().length > 0 &&
    entityRef.href.trim().length > 0 &&
    entityRef.relation.trim().length > 0
  );
}

function statusTone(status: string): MuseumStatusTone {
  const normalized = status.toLocaleLowerCase();
  if (
    status === "accessioned_into_permanent_collection" ||
    normalized.includes("accessioned into the permanent collection")
  ) {
    return "success";
  }
  if (status === "closed_without_selection" || status === "withdrawn")
    return "neutral";
  return "warning";
}

function museumEntityHref(kind: MuseumEntityKind, id?: string): string | null {
  if (id?.trim() === "") return null;
  if (kind === "collection") return museumCollectionHref();
  if (kind === "about") return `${MUSEUM_NETWORK_ROOT}/about`;
  if (kind === "research")
    return id === undefined ? museumResearchHref() : museumResearchHref(id);
  if (kind === "exhibition" || id === undefined) return null;
  const detailHrefs: Record<
    Exclude<
      MuseumEntityKind,
      "collection" | "about" | "research" | "exhibition"
    >,
    (value: string) => string
  > = {
    work: museumWorkHref,
    artist: museumArtistHref,
    organization: museumOrganizationHref,
    project: museumProjectHref,
    curated_acquisition: museumAcquisitionHref,
    acquisition_program: museumAcquisitionProgramHref,
  };
  return detailHrefs[kind](id);
}

export {
  buildMuseumAcquisitionContext,
  buildMuseumAcquisitionIndex,
  buildMuseumWorkContext,
};

export function buildMuseumEntityContext(input: {
  readonly kind: Exclude<MuseumEntityKind, "exhibition">;
  readonly id: string;
  readonly label: string;
  readonly canonicalHref?: string;
  readonly breadcrumbs: readonly MuseumBreadcrumbItem[];
  readonly status?: string;
  readonly statusAsOf?: string | null;
  readonly primaryRelations?: readonly MuseumEntityRef[];
  readonly secondaryRelations?: readonly MuseumEntityRef[];
  readonly sourcePath: string | null;
  readonly sourceCommit: string | null;
}): MuseumEntityContextModel | null {
  const canonicalHref =
    input.canonicalHref ?? museumEntityHref(input.kind, input.id);
  if (canonicalHref === null) return null;
  const primaryRelations = input.primaryRelations ?? [];
  const secondaryRelations = input.secondaryRelations ?? [];
  if (
    input.id.trim().length === 0 ||
    input.label.trim().length === 0 ||
    canonicalHref.trim().length === 0 ||
    [...primaryRelations, ...secondaryRelations].some(
      (relation) => !hasValidEntityRef(relation)
    )
  ) {
    return null;
  }
  return {
    kind: input.kind,
    id: input.id,
    label: input.label,
    canonicalHref,
    breadcrumbs: input.breadcrumbs,
    ...(input.status === undefined
      ? {}
      : { status: input.status, statusTone: statusTone(input.status) }),
    statusAsOf: input.statusAsOf ?? null,
    primaryRelations,
    secondaryRelations,
    sourcePath: input.sourcePath,
    sourceCommit: input.sourceCommit,
  };
}

function artistForValue(
  publication: MuseumPublication,
  value: string
): MuseumArtist | undefined {
  const normalized = value.toLocaleLowerCase();
  return publication.artists.find(
    (artist) =>
      artist.id === value ||
      artist.slug.toLocaleLowerCase() === normalized ||
      artist.preferredName.toLocaleLowerCase() === normalized
  );
}

function artistRelation(
  publication: MuseumPublication,
  id: string,
  relation: string
): MuseumEntityRef | null {
  const artist = artistForValue(publication, id);
  return artist === undefined
    ? null
    : ref({
        kind: "artist",
        id: artist.id,
        label: artist.preferredName,
        href: museumArtistHref(artist.slug),
        relation,
        sourcePath: artist.sourcePaths.find((path) => path.trim()) ?? null,
        sourceCommit: publication.identity.commit,
      });
}

export function buildMuseumArtistRelations(
  publication: MuseumPublication,
  artistSlug: string,
  view: MuseumView | null = null
): MuseumEntityRelations {
  const artist = publication.artists.find((item) => item.slug === artistSlug);
  const typedWorks = (publication.works ?? []).filter(
    (work) => work.artistId === artist?.id
  );
  const legacyWorks =
    artist === undefined
      ? []
      : publication.artworks.filter((artwork) =>
          artist.artworkIds.includes(artwork.id)
        );
  const selectedWorks =
    publication.works === undefined
      ? (view?.objects ?? []).filter(
          (object) =>
            artistForValue(publication, object.artist)?.slug === artistSlug
        )
      : [];
  const acquisitionRefs = buildMuseumAcquisitionIndex(publication, view)
    .filter((acquisition) =>
      acquisition.artistIds.includes(artist?.id ?? artistSlug)
    )
    .map((acquisition) => {
      return ref({
        kind: "curated_acquisition",
        id: acquisition.acquisitionId,
        label: acquisition.title,
        href: museumAcquisitionHref(acquisition.slug),
        relation:
          acquisition.status === "accessioned_into_permanent_collection"
            ? "Acquired through"
            : "Included in",
        status: acquisition.status,
        statusAsOf: acquisition.statusAsOf,
        sourcePath: acquisition.sourcePath,
        sourceCommit: publication.identity.commit,
      });
    });
  const typedRefs = typedWorks.flatMap((work) => {
    const media = selectMuseumStillMedia(work.media);
    const relation = ref({
      kind: "work" as const,
      id: work.id,
      label: work.title,
      href: museumWorkHref(work.id),
      relation: museumPublicWorkRelation(work),
      status: museumPublicWorkStatus(work),
      ...(media === undefined
        ? {}
        : {
            media: {
              kind: "governed" as const,
              src: media.url,
              width: media.width,
              height: media.height,
              alt: media.altText ?? work.title,
              creditLine: media.credit.creditLine,
            },
          }),
    });
    return relation === null ? [] : [relation];
  });
  const legacyRefs = legacyWorks.flatMap((artwork) => {
    const relation = ref({
      kind: "work" as const,
      id: artwork.id,
      label: artwork.title,
      href: museumWorkHrefForSourceId(publication, artwork.id, view),
      relation:
        artwork.institutionalStatus === "accessioned"
          ? "In Collection"
          : "Selected work",
      status:
        artwork.institutionalStatus === "accessioned"
          ? "accessioned_into_permanent_collection"
          : "selected_through_acquisition_program_acquisition_pending",
    });
    return relation === null ? [] : [relation];
  });
  const selectedRefs = selectedWorks.flatMap((work) => {
    const relation = ref({
      kind: "work" as const,
      id: work.objectId,
      label: work.title,
      href: museumWorkHrefForSourceId(publication, work.objectId, view),
      relation: "Selected work",
      status: "selected_through_acquisition_program_acquisition_pending",
    });
    return relation === null ? [] : [relation];
  });
  return {
    primaryRelations: dedupe([...typedRefs, ...legacyRefs, ...selectedRefs]),
    secondaryRelations: dedupe(acquisitionRefs),
  };
}

export function buildMuseumArtistContext(
  publication: MuseumPublication,
  artistSlug: string,
  view: MuseumView | null = null,
  breadcrumbs: readonly MuseumBreadcrumbItem[] = []
): MuseumEntityContextModel | null {
  const artist = publication.artists.find((item) => item.slug === artistSlug);
  if (
    artist === undefined &&
    !(view?.objects ?? []).some(
      (object) =>
        artistForValue(publication, object.artist)?.slug === artistSlug
    )
  )
    return null;
  const relations = buildMuseumArtistRelations(publication, artistSlug, view);
  return buildMuseumEntityContext({
    kind: "artist",
    id: artist?.id ?? artistSlug,
    label: artist?.preferredName ?? artistSlug,
    breadcrumbs,
    primaryRelations: relations.primaryRelations,
    secondaryRelations: relations.secondaryRelations,
    sourcePath: artist?.sourcePaths.find((path) => path.trim()) ?? null,
    sourceCommit: publication.identity.commit,
  });
}

export function buildMuseumProjectRelations(
  publication: MuseumPublication,
  projectSlug: string
): MuseumEntityRelations {
  const project = publication.projects.find(
    (item) => item.slug === projectSlug
  );
  if (project === undefined)
    return { primaryRelations: [], secondaryRelations: [] };
  const workRefs = museumProjectWorks(publication, project).flatMap((work) => {
    const media = selectMuseumStillMedia(work.media);
    const relation = ref({
      kind: "work" as const,
      id: work.id,
      label: work.title,
      href: museumWorkHref(work.id),
      relation: "Part of",
      status: museumPublicWorkStatus(work),
      ...(media === undefined
        ? {}
        : {
            media: {
              kind: "governed" as const,
              src: media.url,
              width: media.width,
              height: media.height,
              alt: media.altText ?? work.title,
              creditLine: media.credit.creditLine,
            },
          }),
    });
    return relation === null ? [] : [relation];
  });
  const artistRefs = (project.artistIds ?? [project.artistId]).map((id) =>
    artistRelation(publication, id, "By")
  );
  const researchRefs = publication.documents
    .filter((document) => document.projectIds.includes(project.id))
    .map((document) => ({
      kind: "research" as const,
      id: document.id,
      label: document.title,
      href: museumResearchHref(document.id),
      relation: "Related research",
      sourcePath: document.sourcePath,
      sourceCommit: publication.identity.commit,
    }));
  return {
    primaryRelations: dedupe(workRefs),
    secondaryRelations: dedupe([...artistRefs, ...researchRefs]),
  };
}
