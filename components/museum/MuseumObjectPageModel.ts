import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { museumCreatorSeparator } from "@/lib/museum/presentation";
import { getGenerativeStudyByObjectId } from "@/lib/museum/generative-studies";
import type {
  MuseumMedia,
  MuseumPublication,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import type { MuseumProgramMedia } from "@/lib/museum/types";

export const creatorSeparator = museumCreatorSeparator;

export function publicWorkMedia(media: MuseumMedia): MuseumProgramMedia {
  return {
    sourceUrl: media.url,
    sourceMimeType: media.mediaType ?? "image/*",
    sourceSha256: media.sha256,
    sourceByteSize: null,
    sourceWidth: media.width,
    sourceHeight: media.height,
    altText: media.altText ?? "",
    altTextStatus:
      media.altText === null ? "unavailable" : "governed_artwork_description",
    variants: (media.variants ?? []).map((variant) => ({
      url: variant.url,
      width: variant.width,
      height: variant.height,
      mimeType: "image/webp" as const,
      sha256: variant.sha256,
      byteSize: variant.byteSize,
    })),
  };
}

export function workQualifierLabel(
  work: MuseumPublicWork,
  qualifier: MuseumPublicWork["qualifiers"][number]
): string | null {
  if (qualifier.kind !== "mint" || qualifier.status !== "pending") {
    return null;
  }
  if (
    work.status === "selected_through_acquisition_program_acquisition_pending"
  ) {
    return t(
      DEFAULT_LOCALE,
      "museum.network.acquisitions.selectedWorkQualifier"
    );
  }
  return t(DEFAULT_LOCALE, "museum.network.works.mintPending");
}

export function museumWorkInsideSystemHref(
  work: MuseumPublicWork,
  publication: MuseumPublication
): string | null {
  const legacyStudyObjectId = [
    ...(work.sourceRecordIds ?? []),
    ...(publication.workAliases ?? [])
      .filter((alias) => alias.workId === work.id)
      .map((alias) => alias.sourceObjectId),
  ].find(
    (sourceObjectId) => getGenerativeStudyByObjectId(sourceObjectId) !== null
  );
  if (legacyStudyObjectId === undefined) return null;
  const generativeStudy = getGenerativeStudyByObjectId(legacyStudyObjectId);
  if (
    generativeStudy?.heldPositions.some(
      (position) => position.objectId === legacyStudyObjectId
    ) !== true
  ) {
    return null;
  }
  return `/museum/network/projects/${generativeStudy.projectSlug}/system?work=${encodeURIComponent(legacyStudyObjectId)}#possibility-space`;
}

export function museumWorkCreationDate(
  publication: MuseumPublication,
  workId: string
): string | null {
  const profile = publication.entityGraph?.entities.find(
    (entity) => entity.id === workId
  )?.profile;
  const creationDate = profile?.["creation_date"];
  if (
    typeof creationDate !== "object" ||
    creationDate === null ||
    Array.isArray(creationDate)
  ) {
    return null;
  }
  const display = (creationDate as Record<string, unknown>)["display"];
  return typeof display === "string" && display.trim().length > 0
    ? display.trim()
    : null;
}
