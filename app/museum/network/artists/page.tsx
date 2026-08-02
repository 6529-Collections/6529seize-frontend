import type { Metadata } from "next";
import Link from "next/link";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ARTIST_NAME,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.artists.title"),
  description: t(DEFAULT_LOCALE, "museum.network.artists.description"),
});

export default async function MuseumArtistsPage() {
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const artworks = tryCaseyArtworksFromPublication(
    publicationState.publication
  );
  if (artworks === null) {
    return <MuseumPublicationUnavailable />;
  }
  const featuredArtwork = artworks.find(
    (artwork) => artwork.objectId === "6529NM.2026.001.05"
  );
  if (featuredArtwork === undefined) {
    return <MuseumPublicationUnavailable />;
  }
  return (
    <div>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.artists.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.artists.title")}
        description={t(DEFAULT_LOCALE, "museum.network.artists.description")}
      />
      <div className="tw-grid tw-gap-8 tw-border-x-0 tw-border-b tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 lg:tw-grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)] lg:tw-items-center">
        <MuseumArtworkFigure
          artwork={featuredArtwork}
          href="/museum/network/artists/casey-reas"
          sizes="(min-width: 1024px) 40vw, 100vw"
        />
        <div className="tw-max-w-2xl">
          <h2 className="tw-m-0 tw-text-3xl tw-font-semibold tw-tracking-tight tw-text-iron-50">
            {CASEY_ARTIST_NAME}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.artists.caseySummary")}
          </p>
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.artists.caseyWorks")}
          </p>
          <Link
            href="/museum/network/artists/casey-reas"
            className="hover:tw-text-primary-200 tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.artists.viewArtist")}
          </Link>
        </div>
      </div>
    </div>
  );
}
