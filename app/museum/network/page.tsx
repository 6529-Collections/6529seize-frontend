import Link from "next/link";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ACCESSION_ID,
  CASEY_ARTIST_NAME,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

export default async function MuseumNetworkPage() {
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
    (artwork) => artwork.objectId === "6529NM.2026.001.01"
  );
  if (featuredArtwork === undefined) {
    return <MuseumPublicationUnavailable />;
  }
  const supportingArtworks = artworks.filter(
    (artwork) => artwork.objectId !== featuredArtwork.objectId
  );
  return (
    <div className="tw-min-w-0 tw-space-y-20 sm:tw-space-y-28">
      <section aria-labelledby="museum-home-title">
        <div className="tw-grid tw-gap-8 lg:tw-grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)] lg:tw-items-end lg:tw-gap-12">
          <div className="tw-max-w-xl lg:tw-pb-2">
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
              {t(DEFAULT_LOCALE, "museum.network.home.eyebrow")}
            </p>
            <h1
              id="museum-home-title"
              className="tw-m-0 tw-mt-4 tw-text-4xl tw-font-semibold tw-leading-[1.08] tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl"
            >
              {t(DEFAULT_LOCALE, "museum.network.home.title")}
            </h1>
            <p className="tw-m-0 tw-mt-5 tw-text-base tw-leading-7 tw-text-iron-300 sm:tw-text-lg sm:tw-leading-8">
              {t(DEFAULT_LOCALE, "museum.network.home.intro")}
            </p>
            <Link
              href="/museum/network/collection"
              className="tw-mt-7 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-md tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-no-underline hover:tw-bg-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
            >
              {t(DEFAULT_LOCALE, "museum.network.home.exploreCollection")}
            </Link>
          </div>
          <MuseumArtworkFigure
            artwork={featuredArtwork}
            eager
            href={`/museum/network/collection/${encodeURIComponent(featuredArtwork.objectId)}`}
            sizes="(min-width: 1024px) 62vw, 100vw"
          />
        </div>
      </section>

      <section aria-labelledby="museum-casey-title">
        <div className="tw-mb-8 tw-grid tw-gap-5 md:tw-grid-cols-[minmax(0,1fr)_minmax(17rem,0.55fr)] md:tw-items-end">
          <div>
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
              {t(DEFAULT_LOCALE, "museum.network.home.firstGift")}
            </p>
            <h2
              id="museum-casey-title"
              className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
            >
              {t(DEFAULT_LOCALE, "museum.network.home.caseyTitle")}
            </h2>
          </div>
          <div>
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(DEFAULT_LOCALE, "museum.network.home.caseySummary")}
            </p>
            <Link
              href={`/museum/network/gifts/${CASEY_ACCESSION_ID}`}
              className="hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {t(DEFAULT_LOCALE, "museum.network.home.readGift")}
            </Link>
          </div>
        </div>
        <div className="tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-10 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
          {supportingArtworks.map((artwork) => (
            <MuseumArtworkFigure
              key={artwork.objectId}
              artwork={artwork}
              href={`/museum/network/collection/${encodeURIComponent(artwork.objectId)}`}
              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
      </section>

      <div className="tw-grid tw-gap-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 lg:tw-grid-cols-2 lg:tw-gap-16">
        <section aria-labelledby="museum-home-artist-title">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.nav.artists")}
          </p>
          <h2
            id="museum-home-artist-title"
            className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {CASEY_ARTIST_NAME}
          </h2>
          <p className="tw-m-0 tw-mt-3 tw-max-w-xl tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.home.artistSummary")}
          </p>
          <Link
            href="/museum/network/artists/casey-reas"
            className="hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.home.readArtist")}
          </Link>
        </section>
        <section aria-labelledby="museum-home-program-title">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.nav.programsExhibitions")}
          </p>
          <h2
            id="museum-home-program-title"
            className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.programs.keysAndGates")}
          </h2>
          <p className="tw-m-0 tw-mt-3 tw-max-w-xl tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.home.keysSummary")}
          </p>
          <Link
            href="/museum/network/programs/6529NM-AP-01"
            className="hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.home.readProgram")}
          </Link>
        </section>
      </div>
    </div>
  );
}
