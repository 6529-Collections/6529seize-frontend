import type { Metadata } from "next";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumResearchProjectsLanding } from "@/components/museum/research/MuseumResearchProjectsLanding";
import type { MuseumResearchProjectCardData } from "@/components/museum/research/MuseumResearchProjectCard";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  applyMuseumCollectionSemantics,
  museumProjectWorks,
} from "@/lib/museum/publication/collectionSemantics";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import { museumProjectHref } from "@/lib/museum/publication/routes";
import type { MuseumPublication } from "@/lib/museum/publication/types";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.projects.title"),
    description: t(DEFAULT_LOCALE, "museum.network.projects.description"),
  }),
  alternates: { canonical: "/museum/network/projects" },
};

function projectArtists(
  publication: MuseumPublication,
  project: MuseumPublication["projects"][number]
): readonly string[] {
  const ids = [...new Set([project.artistId, ...(project.artistIds ?? [])])];
  return ids.flatMap((id) => {
    const artist = publication.artists.find((candidate) => candidate.id === id);
    return artist === undefined ? [] : [artist.preferredName];
  });
}

function buildProjectCards(
  publication: MuseumPublication
): readonly MuseumResearchProjectCardData[] {
  return publication.projects.map((project) => {
    const works = museumProjectWorks(publication, project);
    const declaredWorkCount = Math.max(
      project.workIds?.length ?? 0,
      project.artworkIds.length
    );
    const typedMedia = works
      .map((work) => selectMuseumStillMedia(work.media))
      .find((candidate) => candidate !== undefined);
    const media =
      typedMedia ??
      publication.artworks
        .filter((artwork) => project.artworkIds.includes(artwork.id))
        .map((artwork) => selectMuseumStillMedia(artwork.media))
        .find((candidate) => candidate !== undefined);
    const presentationMedia = works
      .flatMap((work) => work.presentationMedia ?? [])
      .at(0);
    return {
      id: project.id,
      href: museumProjectHref(project.slug),
      title: project.title,
      artistNames: projectArtists(publication, project),
      ...(project.platform.trim().length === 0
        ? {}
        : { platform: project.platform }),
      ...(project.releaseYear > 0 ? { releaseYear: project.releaseYear } : {}),
      workCount: Math.max(works.length, declaredWorkCount),
      ...(media === undefined ? {} : { media }),
      ...(media === undefined && presentationMedia !== undefined
        ? { presentationMedia }
        : {}),
    };
  });
}

export default async function MuseumProjectsPage() {
  const { publicationState } = await getMuseumPublicationBundle();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = applyMuseumCollectionSemantics(
    publicationState.publication
  );
  const projects = buildProjectCards(publication);
  const featured =
    projects.find((project) => project.media !== undefined) ?? projects[0];
  if (featured === undefined) return <MuseumPublicationUnavailable />;

  return (
    <MuseumResearchProjectsLanding
      eyebrow={t(DEFAULT_LOCALE, "museum.network.projects.eyebrow")}
      title={t(DEFAULT_LOCALE, "museum.network.projects.indexTitle")}
      description={t(
        DEFAULT_LOCALE,
        "museum.network.projects.indexDescription"
      )}
      distinctionTitle={t(
        DEFAULT_LOCALE,
        "museum.network.projects.distinctionTitle"
      )}
      distinctionDescription={t(
        DEFAULT_LOCALE,
        "museum.network.projects.distinctionDescription"
      )}
      featuredDescription={t(
        DEFAULT_LOCALE,
        "museum.network.projects.featuredDescription"
      )}
      featured={featured}
      projects={projects}
      browseTitle={t(DEFAULT_LOCALE, "museum.network.projects.browseTitle")}
      collectionLabel={t(
        DEFAULT_LOCALE,
        "museum.network.projects.collectionLink"
      )}
      collectionHref="/museum/network/collection"
      acquisitionsLabel={t(
        DEFAULT_LOCALE,
        "museum.network.projects.acquisitionsLink"
      )}
      acquisitionsHref="/museum/network/acquisitions"
    />
  );
}
