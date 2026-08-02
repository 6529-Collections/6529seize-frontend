import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ARTIST_SLUG,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

interface MuseumArtistPageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MuseumArtistPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug !== CASEY_ARTIST_SLUG) {
    return getAppMetadata({
      title: t(DEFAULT_LOCALE, "museum.network.artists.title"),
      description: t(DEFAULT_LOCALE, "museum.network.artists.caseySummary"),
    });
  }
  const publicationState = await getMuseumPublicationState();
  const artist = publicationState.publication?.artists.find(
    (item) => item.slug === slug
  );
  return getAppMetadata({
    title:
      artist?.preferredName ??
      t(DEFAULT_LOCALE, "museum.network.artists.title"),
    description: t(DEFAULT_LOCALE, "museum.network.artists.caseySummary"),
  });
}

export default async function MuseumArtistPage({
  params,
}: MuseumArtistPageProps) {
  const { slug } = await params;
  if (slug !== CASEY_ARTIST_SLUG) {
    notFound();
  }
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = publicationState.publication;
  const artist = publication.artists.find((item) => item.slug === slug);
  if (artist === undefined) {
    notFound();
  }
  const artworks = tryCaseyArtworksFromPublication(publication);
  if (artworks === null) {
    return <MuseumPublicationUnavailable />;
  }
  const profile = publication.documents.find(
    (document) =>
      document.kind === "artist_practice" &&
      document.artistIds.includes(artist.id)
  );
  const projects = publication.projects.filter(
    (project) => project.artistId === artist.id
  );

  return (
    <article>
      <Link
        href="/museum/network/artists"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.artists.back")}
      </Link>
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.artists.artist")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {artist.preferredName}
        </h1>
        <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.artists.caseySummary")}
        </p>
      </header>

      <section className="tw-mt-12" aria-labelledby="artist-works-title">
        <h2
          id="artist-works-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.artists.worksInCollection")}
        </h2>
        <div className="tw-mt-6 tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-10 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
          {artworks.map((artwork) => (
            <MuseumArtworkFigure
              key={artwork.objectId}
              artwork={artwork}
              href={`/museum/network/collection/${encodeURIComponent(artwork.objectId)}`}
              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
      </section>

      <section className="tw-mt-16" aria-labelledby="artist-projects-title">
        <h2
          id="artist-projects-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.artists.projects")}
        </h2>
        <ul className="tw-m-0 tw-mt-5 tw-list-none tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-0">
          {projects.map((project) => (
            <li
              key={project.slug}
              className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800"
            >
              <Link
                href={`/museum/network/projects/${project.slug}`}
                className="hover:tw-text-primary-200 tw-flex tw-min-h-16 tw-items-center tw-justify-between tw-gap-4 tw-py-4 tw-text-base tw-font-semibold tw-text-iron-100 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                <span>{project.title}</span>
                <span className="tw-text-sm tw-font-normal tw-text-iron-500">
                  {t(
                    DEFAULT_LOCALE,
                    project.artworkIds.length === 1
                      ? "museum.network.projects.workCount.one"
                      : "museum.network.projects.workCount.other",
                    { count: project.artworkIds.length }
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="tw-mt-16 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        aria-labelledby="artist-profile-title"
      >
        <h2
          id="artist-profile-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.artists.profile")}
        </h2>
        {profile ? (
          <MuseumMarkdown
            className="tw-mt-6"
            embeddedDocument
            sourcePath={profile.sourcePath}
          >
            {profile.markdown}
          </MuseumMarkdown>
        ) : (
          <p className="tw-m-0 tw-mt-5 tw-text-sm tw-text-yellow-100">
            {t(DEFAULT_LOCALE, "museum.network.artists.profileUnavailable")}
          </p>
        )}
      </section>
    </article>
  );
}
