import type { MuseumBreadcrumbItem, MuseumEntityContextModel } from "./ia";
import type { MuseumArtwork, MuseumPublication } from "./types";
import type { MuseumView } from "@/lib/museum/types";
import { museumWorkHref, museumWorkHrefForSourceId } from "./routes";
import { buildMuseumWorkRelations } from "./iaAcquisitions";

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

export function buildMuseumWorkContext(
  publication: MuseumPublication,
  artworkId: string,
  view: MuseumView | null,
  breadcrumbs: readonly MuseumBreadcrumbItem[] = []
): MuseumEntityContextModel | null {
  const publicWork = publication.works?.find((work) => work.id === artworkId);
  if (publicWork !== undefined) {
    const relations = buildMuseumWorkRelations(publication, artworkId, view);
    return {
      kind: "work",
      id: publicWork.id,
      label: publicWork.title,
      canonicalHref: museumWorkHref(publicWork.id),
      breadcrumbs,
      status: publicWork.status,
      statusTone: statusTone(publicWork.status),
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
