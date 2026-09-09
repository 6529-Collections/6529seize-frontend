import editorialMediaManifest from "@/public/museum/research/editorial/media-manifest.json";
import {
  museumMediaResponsiveImage,
  selectMuseumStillMedia,
} from "@/lib/museum/publication/mediaSelection";
import type {
  MuseumExternalProposalPresentationMedia,
  MuseumMedia,
  MuseumRetainedMedia,
  MuseumPublication,
} from "@/lib/museum/publication/types";

interface StableResearchMedia {
  readonly url: string;
  readonly srcSet: string;
  readonly manifestFile: string;
}

interface MuseumResearchEditorialMediaOptions {
  readonly id: string;
  readonly file: string;
  readonly altText: string;
  readonly creditLine: string;
  readonly licenseLabel: string;
  readonly licenseUrl: string;
}

interface MuseumWorkMediaResolution {
  readonly media?: MuseumMedia;
  readonly mediaSrcSet?: string;
}

const STABLE_RESEARCH_MEDIA_BY_WORK_ID: Readonly<
  Record<string, StableResearchMedia>
> = {
  "6529NM-W-0024": {
    url: "/museum/research/editorial/magnum/6529NM-W-0024-1280.webp",
    srcSet:
      "/museum/research/editorial/magnum/6529NM-W-0024-640.webp 640w, /museum/research/editorial/magnum/6529NM-W-0024-1280.webp 1280w",
    manifestFile: "magnum/6529NM-W-0024-1280.webp",
  },
  "6529NM-W-0025": {
    url: "/museum/research/editorial/magnum/6529NM-W-0025-1280.webp",
    srcSet:
      "/museum/research/editorial/magnum/6529NM-W-0025-640.webp 640w, /museum/research/editorial/magnum/6529NM-W-0025-1280.webp 1280w",
    manifestFile: "magnum/6529NM-W-0025-1280.webp",
  },
  "6529NM-W-0026": {
    url: "/museum/research/editorial/magnum/6529NM-W-0026-1280.webp",
    srcSet:
      "/museum/research/editorial/magnum/6529NM-W-0026-640.webp 640w, /museum/research/editorial/magnum/6529NM-W-0026-1280.webp 1280w",
    manifestFile: "magnum/6529NM-W-0026-1280.webp",
  },
  "6529NM-W-0027": {
    url: "/museum/research/editorial/magnum/6529NM-W-0027-1280.webp",
    srcSet:
      "/museum/research/editorial/magnum/6529NM-W-0027-640.webp 640w, /museum/research/editorial/magnum/6529NM-W-0027-1280.webp 1280w",
    manifestFile: "magnum/6529NM-W-0027-1280.webp",
  },
  "6529NM-W-0028": {
    url: "/museum/research/editorial/magnum/6529NM-W-0028-1280.webp",
    srcSet:
      "/museum/research/editorial/magnum/6529NM-W-0028-640.webp 640w, /museum/research/editorial/magnum/6529NM-W-0028-1280.webp 1280w",
    manifestFile: "magnum/6529NM-W-0028-1280.webp",
  },
};

export function museumResearchEditorialMedia({
  id,
  file,
  altText,
  creditLine,
  licenseLabel,
  licenseUrl,
}: MuseumResearchEditorialMediaOptions): MuseumMedia {
  const asset = editorialMediaManifest.assets.find(
    (candidate) => candidate.id === id
  );
  const derivative = asset?.derivatives.find(
    (candidate) => candidate.file === file
  );
  if (asset === undefined || derivative === undefined) {
    throw new Error(`museum_research_editorial_media_missing:${id}:${file}`);
  }
  return {
    id,
    artworkId: `editorial:${id}`,
    kind: "still",
    role: "fallback",
    mediaType: asset.mediaType,
    width: derivative.width,
    height: derivative.height,
    altText,
    credit: {
      creditLine,
      licenseLabel,
      licenseUrl,
      rightsExpressionId: null,
      sourcePath: "public/museum/research/editorial/media-manifest.json",
    },
    sourcePath: "public/museum/research/editorial/media-manifest.json",
    custody: "retained",
    url: `/museum/research/editorial/${file}`,
    preservationStatus:
      asset.preservationStatus as MuseumRetainedMedia["preservationStatus"],
    sha256: `sha256:${derivative.sha256}` as MuseumRetainedMedia["sha256"],
    upstreamProvider: null,
  };
}

function stableResearchMedia(
  workId: string | undefined,
  media: MuseumMedia | undefined
): MuseumMedia | undefined {
  const stable =
    workId === undefined ? undefined : STABLE_RESEARCH_MEDIA_BY_WORK_ID[workId];
  if (media === undefined || stable === undefined) return media;
  const asset = editorialMediaManifest.assets.find((candidate) =>
    candidate.derivatives.some(
      (derivative) => derivative.file === stable.manifestFile
    )
  );
  const derivative = asset?.derivatives.find(
    (candidate) => candidate.file === stable.manifestFile
  );
  return asset === undefined || derivative === undefined
    ? media
    : {
        ...media,
        mediaType: asset.mediaType,
        url: stable.url,
        width: derivative.width,
        height: derivative.height,
        sourcePath: "public/museum/research/editorial/media-manifest.json",
        custody: "retained",
        preservationStatus:
          asset.preservationStatus as MuseumRetainedMedia["preservationStatus"],
        sha256: `sha256:${derivative.sha256}` as MuseumRetainedMedia["sha256"],
        upstreamProvider: null,
      };
}

export function proposalPresentationMedia(
  workId: string,
  media: MuseumExternalProposalPresentationMedia
): MuseumMedia | undefined {
  const delivery =
    media.variants?.find((variant) => variant.width >= 1280) ??
    media.variants?.at(-1);
  if (delivery === undefined) return undefined;
  return {
    id: media.id,
    artworkId: workId,
    kind: "still",
    role: "source",
    mediaType: media.mediaMimeType,
    width: delivery.width,
    height: delivery.height,
    altText: media.altText,
    credit: {
      creditLine: media.credit.creditLine,
      licenseLabel: media.rights.licenseLabel,
      licenseUrl: media.rights.licenseUrl,
      rightsExpressionId: null,
      sourcePath: media.credit.sourcePath,
    },
    sourcePath: media.source.mediaRecordPath,
    custody: "upstream",
    url: delivery.url,
    preservationStatus: "not_retained",
    sha256: null,
    upstreamProvider: "museum_public_derivative",
  };
}

function sourceObjectIdsForWork(
  publication: MuseumPublication,
  workId: string
): readonly string[] {
  return [
    workId,
    ...(publication.workAliases ?? [])
      .filter((alias) => alias.workId === workId)
      .map((alias) => alias.sourceObjectId),
  ];
}

export function resolveExactWorkMediaById(
  publication: MuseumPublication,
  workId: string
): MuseumWorkMediaResolution {
  const work = publication.works?.find((candidate) => candidate.id === workId);
  const retained = selectMuseumStillMedia(work?.media ?? []);
  let media: MuseumMedia | undefined;
  if (retained !== undefined) {
    media = stableResearchMedia(workId, retained);
  } else {
    const presentation = work?.presentationMedia?.[0];
    media =
      presentation === undefined
        ? undefined
        : stableResearchMedia(
            workId,
            proposalPresentationMedia(workId, presentation)
          );
  }

  if (media !== undefined) {
    const stable = STABLE_RESEARCH_MEDIA_BY_WORK_ID[workId];
    const responsive = museumMediaResponsiveImage(media);
    const mediaSrcSet = stable?.srcSet ?? responsive.srcSet;
    return {
      media: { ...media, url: responsive.src },
      ...(mediaSrcSet === undefined ? {} : { mediaSrcSet }),
    };
  }

  const artwork = sourceObjectIdsForWork(publication, workId)
    .map((sourceId) =>
      publication.artworks.find((candidate) => candidate.id === sourceId)
    )
    .find((candidate) => candidate !== undefined);
  const legacyMedia = stableResearchMedia(
    workId,
    selectMuseumStillMedia(artwork?.media ?? [])
  );
  if (legacyMedia === undefined) return {};
  const stable = STABLE_RESEARCH_MEDIA_BY_WORK_ID[workId];
  const responsive = museumMediaResponsiveImage(legacyMedia);
  const mediaSrcSet = stable?.srcSet ?? responsive.srcSet;
  return {
    media: { ...legacyMedia, url: responsive.src },
    ...(mediaSrcSet === undefined ? {} : { mediaSrcSet }),
  };
}

function workIdForTitle(
  publication: MuseumPublication,
  title: string
): string | undefined {
  return (
    publication.works?.find((candidate) => candidate.title === title)?.id ??
    publication.artworks.find((candidate) => candidate.title === title)?.id
  );
}

/**
 * Compatibility export retained for existing consumers and tests. New route
 * code resolves through exactWorkMediaById so display copy cannot select a
 * different Work.
 */
export function exactWorkMedia(
  publication: MuseumPublication,
  title: string
): MuseumMedia | undefined {
  const workId = workIdForTitle(publication, title);
  return workId === undefined
    ? undefined
    : resolveExactWorkMediaById(publication, workId).media;
}

/** Compatibility export; use exactWorkMediaSrcSetById in route code. */
export function exactWorkMediaSrcSet(
  publication: MuseumPublication,
  title: string
): string | undefined {
  const workId = workIdForTitle(publication, title);
  return workId === undefined
    ? undefined
    : resolveExactWorkMediaById(publication, workId).mediaSrcSet;
}
