import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import { MuseumSourceMatrixLink } from "@/components/museum/MuseumSourceMatrixLink";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ARTIST_NAME,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import { getGenerativeStudyByProjectSlug } from "@/lib/museum/generative-studies";
import { getMintedProjectIndex } from "@/lib/museum/generative-studies/minted";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

interface MuseumProjectPageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MuseumProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const publicationState = await getMuseumPublicationState();
  const project = publicationState.publication?.projects.find(
    (item) => item.slug === slug
  );
  return getAppMetadata({
    title: project?.title ?? t(DEFAULT_LOCALE, "museum.network.projects.title"),
    description: t(DEFAULT_LOCALE, "museum.network.projects.description"),
  });
}

export default async function MuseumProjectPage({
  params,
}: MuseumProjectPageProps) {
  const { slug } = await params;
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const project = publicationState.publication.projects.find(
    (item) => item.slug === slug
  );
  if (project === undefined) {
    notFound();
  }
  const artist = publicationState.publication.artists.find(
    (item) => item.id === project.artistId
  );
  if (artist === undefined) {
    notFound();
  }
  const caseyArtworks = tryCaseyArtworksFromPublication(
    publicationState.publication
  );
  if (caseyArtworks === null) {
    return <MuseumPublicationUnavailable />;
  }
  const artworks = caseyArtworks.filter((artwork) =>
    project.artworkIds.includes(artwork.objectId)
  );
  const projectEssay = publicationState.publication.documents.find(
    (document) =>
      document.kind === "project_essay" &&
      document.projectIds.includes(project.id)
  );
  const sourceMatrix = publicationState.publication.documents.find(
    (document) => document.kind === "source_chronology_matrix"
  );
  if (projectEssay === undefined || sourceMatrix === undefined) {
    return <MuseumPublicationUnavailable />;
  }
  const editorialArtistName =
    artist.slug === "casey-reas" ? CASEY_ARTIST_NAME : artist.preferredName;
  const generativeStudy = getGenerativeStudyByProjectSlug(project.slug);
  const hasGenerativeExplorer =
    generativeStudy !== null && getMintedProjectIndex(project.slug) !== null;

  return (
    <article>
      <Link
        href={`/museum/network/artists/${artist.slug}`}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.projects.backToArtist", {
          artist: editorialArtistName,
        })}
      </Link>
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.projects.project")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {project.title}
        </h1>
        <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.projects.byline", {
            artist: editorialArtistName,
          })}
        </p>
      </header>
      <div className="tw-mt-10 tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-12 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        {artworks.map((artwork) => (
          <MuseumArtworkFigure
            key={artwork.objectId}
            artwork={artwork}
            href={`/museum/network/collection/${encodeURIComponent(artwork.objectId)}`}
            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
          />
        ))}
      </div>
      {!hasGenerativeExplorer ? null : (
        <section
          className="tw-mt-16 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/60 tw-p-6 sm:tw-p-8"
          aria-labelledby="project-system-title"
        >
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.eyebrow")}
          </p>
          <h2
            id="project-system-title"
            className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50 sm:tw-text-3xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.projectTitle")}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-300">
            {generativeStudy.thesis}
          </p>
          <Link
            href={`/museum/network/projects/${project.slug}/system`}
            className="hover:tw-text-primary-200 tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.enterSystem")}
          </Link>
        </section>
      )}
      <section
        className="tw-mt-16 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        aria-labelledby="project-essay-title"
      >
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.projects.essay")}
        </p>
        <h2
          id="project-essay-title"
          className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50"
        >
          {projectEssay.title}
        </h2>
        <MuseumMarkdown
          className="tw-mt-6"
          embeddedDocument
          sourceCommit={publicationState.publication.identity.commit}
          sourcePath={projectEssay.sourcePath}
        >
          {projectEssay.markdown}
        </MuseumMarkdown>
        <div className="tw-mt-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5">
          <MuseumSourceMatrixLink />
        </div>
      </section>
    </article>
  );
}
