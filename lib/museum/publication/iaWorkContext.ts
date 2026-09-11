import type {
  MuseumBreadcrumbItem,
  MuseumEntityContextModel,
  MuseumEntityRelations,
} from "./ia";
import type { MuseumArtwork, MuseumPublication } from "./types";
import type { MuseumView } from "@/lib/museum/types";
import { museumWorkHref, museumWorkHrefForSourceId } from "./routes";
import { museumPublicWorkStatus } from "./collectionSemantics";
import {
  acquisitionRef,
  artistRef,
  buildMuseumAcquisitionIndex,
  dedupe,
  projectRef,
  programRef,
  typedProgramRef,
} from "./iaAcquisitions";

function firstPath(paths: readonly string[]): string | null {
  return paths.find((path) => path.trim().length > 0) ?? null;
}

function legacyStatus(
  artwork: MuseumArtwork
):
  | "accessioned_into_permanent_collection"
  | "selected_through_acquisition_program_acquisition_pending" {
  return artwork.institutionalStatus === "accessioned"
    ? "accessioned_into_permanent_collection"
    : "selected_through_acquisition_program_acquisition_pending";
}

function statusTone(
  status: string
): "neutral" | "success" | "warning" | "danger" {
  const normalized = status.toLocaleLowerCase();
  if (
    status === "accessioned_into_permanent_collection" ||
    normalized.includes("accessioned into the permanent collection")
  ) {
    return "success";
  }
  if (status === "closed_without_selection" || status === "withdrawn") {
    return "neutral";
  }
  return "warning";
}

export function buildMuseumWorkRelations(
  publication: MuseumPublication,
  artworkId: string,
  view: MuseumView | null
): MuseumEntityRelations {
  const publicWork = publication.works?.find((work) => work.id === artworkId);
  if (publicWork !== undefined) {
    const status = museumPublicWorkStatus(publicWork);
    const acquisitions = buildMuseumAcquisitionIndex(publication, view).filter(
      (item) => publicWork.acquisitionIds.includes(item.acquisitionId)
    );
    const programRefs =
      status === "selected_through_acquisition_program_acquisition_pending"
        ? publicWork.programIds.map((id) => typedProgramRef(publication, id))
        : [];
    return {
      primaryRelations: dedupe([
        artistRef(publicWork.artistId, publication),
        publicWork.projectId === null
          ? null
          : projectRef(publicWork.projectId, publication),
      ]),
      secondaryRelations: dedupe([
        ...acquisitions.map((item) =>
          acquisitionRef(
            item,
            status === "accessioned_into_permanent_collection"
              ? "Acquired through"
              : "Part of"
          )
        ),
        ...programRefs,
      ]),
    };
  }
  const artwork = publication.artworks.find((item) => item.id === artworkId);
  const outcome =
    artwork === undefined
      ? view?.objects.find((object) => object.objectId === artworkId)
      : undefined;
  if (artwork === undefined && outcome === undefined)
    return { primaryRelations: [], secondaryRelations: [] };
  const workId = artwork?.id ?? outcome?.objectId ?? artworkId;
  const acquisitions = buildMuseumAcquisitionIndex(publication, view).filter(
    (item) => item.workIds.includes(workId)
  );
  return {
    primaryRelations: dedupe([
      artwork === undefined ? null : artistRef(artwork.artistId, publication),
    ]),
    secondaryRelations: dedupe(
      acquisitions.flatMap((item) => [
        acquisitionRef(item, "Part of"),
        item.programId === null
          ? null
          : programRef(
              publication,
              item.programId,
              item.pathway ?? item.programId,
              item.statusAsOf,
              item.sourcePath
            ),
      ])
    ),
  };
}

export function buildMuseumWorkContext(
  publication: MuseumPublication,
  artworkId: string,
  view: MuseumView | null,
  breadcrumbs: readonly MuseumBreadcrumbItem[] = []
): MuseumEntityContextModel | null {
  const publicWork = publication.works?.find((work) => work.id === artworkId);
  if (publicWork !== undefined) {
    const status = museumPublicWorkStatus(publicWork);
    const relations = buildMuseumWorkRelations(publication, artworkId, view);
    return {
      kind: "work",
      id: publicWork.id,
      label: publicWork.title,
      canonicalHref: museumWorkHref(publicWork.id),
      breadcrumbs,
      status,
      statusTone: statusTone(status),
      statusAsOf: publicWork.statusAsOf,
      primaryRelations: relations.primaryRelations,
      secondaryRelations: relations.secondaryRelations,
      sourcePath: firstPath(publicWork.sourcePaths),
      sourceCommit: publication.identity.commit,
    };
  }
  const artwork = publication.artworks.find((item) => item.id === artworkId);
  const outcome = view?.objects.find((item) => item.objectId === artworkId);
  if (artwork === undefined && outcome === undefined) return null;
  const sourceId = artwork?.id ?? outcome?.objectId ?? artworkId;
  const canonicalHref = museumWorkHrefForSourceId(publication, sourceId, view);
  if (canonicalHref === null) return null;
  const relations = buildMuseumWorkRelations(publication, artworkId, view);
  const status =
    artwork === undefined
      ? "selected_through_acquisition_program_acquisition_pending"
      : legacyStatus(artwork);
  return {
    kind: "work",
    id: sourceId,
    label: artwork?.title ?? outcome?.title ?? artworkId,
    canonicalHref,
    breadcrumbs,
    status,
    statusTone: statusTone(status),
    statusAsOf: outcome?.statusAsOf ?? null,
    primaryRelations: relations.primaryRelations,
    secondaryRelations: relations.secondaryRelations,
    sourcePath: artwork?.sourcePath ?? outcome?.sourcePath ?? null,
    sourceCommit: publication.identity.commit,
  };
}
