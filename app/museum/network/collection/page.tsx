import type { Metadata } from "next";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { tryCaseyArtworksFromPublication } from "@/lib/museum/casey";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.collection.title"),
  description: t(DEFAULT_LOCALE, "museum.network.collection.description"),
});

export default async function MuseumCollectionPage() {
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
  return (
    <div>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.collection.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.collection.title")}
        description={t(DEFAULT_LOCALE, "museum.network.collection.description")}
      />
      <p className="tw-m-0 tw-mb-10 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-6 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(DEFAULT_LOCALE, "museum.network.collection.scope")}
      </p>
      <div className="tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-12 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        {artworks.map((artwork) => (
          <MuseumArtworkFigure
            key={artwork.objectId}
            artwork={artwork}
            href={`/museum/network/collection/${encodeURIComponent(artwork.objectId)}`}
            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
          />
        ))}
      </div>
    </div>
  );
}
