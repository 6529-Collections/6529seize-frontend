import type { Metadata } from "next";
import Link from "next/link";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ACCESSION_ID,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

const FEATURED_STORY_OBJECT_ID = "6529NM.2026.001.07";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.stories.title"),
  description: t(DEFAULT_LOCALE, "museum.network.stories.description"),
});

export default async function MuseumStoriesPage() {
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = publicationState.publication;
  const artworks = tryCaseyArtworksFromPublication(publication);
  if (artworks === null) {
    return <MuseumPublicationUnavailable />;
  }
  const featuredArtwork = artworks.find(
    (artwork) => artwork.objectId === FEATURED_STORY_OBJECT_ID
  );
  const governedFeaturedArtwork = publication.artworks.find(
    (artwork) => artwork.id === FEATURED_STORY_OBJECT_ID
  );
  const artist = publication.artists.find(
    (item) => item.id === governedFeaturedArtwork?.artistId
  );
  const collectionEssay = publication.documents.find(
    (document) =>
      document.kind === "collection_essay" &&
      document.giftIds.includes(CASEY_ACCESSION_ID)
  );
  const artistProfile = publication.documents.find(
    (document) =>
      document.kind === "artist_practice" &&
      artist !== undefined &&
      document.artistIds.includes(artist.id)
  );
  const sourceMatrix = publication.documents.find(
    (document) => document.kind === "source_chronology_matrix"
  );
  if (
    featuredArtwork === undefined ||
    artist === undefined ||
    collectionEssay === undefined ||
    artistProfile === undefined ||
    sourceMatrix === undefined
  ) {
    return <MuseumPublicationUnavailable />;
  }

  return (
    <div>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.stories.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.stories.title")}
        description={t(DEFAULT_LOCALE, "museum.network.stories.description")}
      />
      <div className="tw-grid tw-gap-8 tw-border-x-0 tw-border-b tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 lg:tw-grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.15fr)] lg:tw-items-center">
        <MuseumArtworkFigure
          artwork={featuredArtwork}
          href={`/museum/network/gifts/${CASEY_ACCESSION_ID}#casey-reas-collection-essay`}
          sizes="(min-width: 1024px) 45vw, 100vw"
        />
        <article>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.stories.collectionEssay")}
          </p>
          <h2 className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50">
            {collectionEssay.title}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.stories.caseyEssaySummary")}
          </p>
          <Link
            href={`/museum/network/gifts/${CASEY_ACCESSION_ID}#casey-reas-collection-essay`}
            className="hover:tw-text-primary-200 tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.stories.readEssay")}
          </Link>
        </article>
      </div>
      <article className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-8">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.research.eyebrow")}
        </p>
        <h2 className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50">
          {sourceMatrix.title}
        </h2>
        <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.research.description")}
        </p>
        <Link
          href="/museum/network/stories/source-and-chronology"
          className="hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(DEFAULT_LOCALE, "museum.network.research.readSourceMatrix")}
        </Link>
      </article>
      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-8">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.stories.artistResearch")}
        </p>
        <h2 className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50">
          {artistProfile.title}
        </h2>
        <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.stories.artistSummary")}
        </p>
        <Link
          href={`/museum/network/artists/${artist.slug}#artist-profile-title`}
          className="hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(DEFAULT_LOCALE, "museum.network.stories.readResearch")}
        </Link>
      </div>
    </div>
  );
}
