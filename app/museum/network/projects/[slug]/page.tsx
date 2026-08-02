import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { caseyArtworksFromPublication } from "@/lib/museum/casey";
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
  const artworks = caseyArtworksFromPublication(
    publicationState.publication
  ).filter((artwork) => project.artworkIds.includes(artwork.objectId));

  return (
    <article>
      <Link
        href="/museum/network/artists/casey-reas"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.projects.backToArtist")}
      </Link>
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.projects.project")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {project.title}
        </h1>
        <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
          Casey Reas ·{" "}
          {t(DEFAULT_LOCALE, "museum.network.projects.collectionRelationship")}
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
    </article>
  );
}
