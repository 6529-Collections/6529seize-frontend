import type { Metadata } from "next";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumMediaMetadataPlaceholder } from "@/components/museum/MuseumMediaMetadataPlaceholder";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { tryCaseyArtworksFromPublication } from "@/lib/museum/casey";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication";
import { museumArtistHref } from "@/lib/museum/publication/routes";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.artists.title"),
  description: t(DEFAULT_LOCALE, "museum.network.artists.description"),
});

function relationshipLine(
  works: readonly {
    readonly status: string;
    readonly collectionMembership?: boolean;
  }[]
): string {
  const collectionCount = works.filter(
    (work) => work.collectionMembership === true
  ).length;
  return `${t(
    DEFAULT_LOCALE,
    works.length === 1
      ? "museum.network.artists.connectedWorks.one"
      : "museum.network.artists.connectedWorks.other",
    { count: works.length }
  )} ${"\u00b7"} ${t(DEFAULT_LOCALE, "museum.network.artists.collectionCount", {
    count: collectionCount,
  })}`;
}

export default async function MuseumArtistsPage() {
  const { publicationState } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (publication === null) return <MuseumPublicationUnavailable />;

  const typedWorks = publication.works;
  if (typedWorks !== undefined) {
    const artists = publication.artists;
    if (artists.length === 0) return <MuseumPublicationUnavailable />;
    return (
      <section>
        <MuseumSectionHeading
          eyebrow={t(DEFAULT_LOCALE, "museum.network.artists.eyebrow")}
          title={t(DEFAULT_LOCALE, "museum.network.artists.title")}
          description={t(DEFAULT_LOCALE, "museum.network.artists.description")}
        />
        <div className="tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-10 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
          {artists.map((artist, index) => {
            const works = typedWorks.filter(
              (work) =>
                work.artistId === artist.id ||
                artist.workIds?.includes(work.id) === true
            );
            const representative = works.find(
              (work) =>
                work.media[0] !== undefined ||
                work.presentationMedia?.[0] !== undefined ||
                work.mediaMetadata?.[0] !== undefined
            );
            const media = representative?.media[0];
            const presentation = representative?.presentationMedia?.[0];
            const metadataRecord = representative?.mediaMetadata?.[0];
            if (media !== undefined) {
              return (
              <MuseumPublicMediaFigure
                key={artist.id}
                src={media.url}
                width={media.width}
                height={media.height}
                alt={media.altText ?? ""}
                href={museumArtistHref(artist.slug)}
                title={artist.preferredName}
                byline={relationshipLine(works)}
                eager={index < 3}
              />
              );
            }
            if (presentation !== undefined) {
              const sourceHref = buildMuseumSignedWaveStormDropUrl(
                presentation.source.waveId,
                presentation.source.dropId
              );
              const canOpenPresentation = presentation.affordances.includes(
                "open_upstream_presentation"
              );
              return (
              <figure key={artist.id} className="tw-m-0 tw-min-w-0">
                <div className="tw-group tw-block">
                  <div className="tw-aspect-square tw-overflow-hidden tw-bg-black">
                    <MuseumProposalImage
                      src={presentation.mediaUrl}
                      alt={presentation.altText}
                      width={presentation.width}
                      height={presentation.height}
                      {...(presentation.sourceByteSize === undefined
                        ? {}
                        : { sourceByteSize: presentation.sourceByteSize })}
                      {...(sourceHref === null || !canOpenPresentation
                        ? {}
                        : {
                            sourceHref,
                            sourceLabel: t(
                              DEFAULT_LOCALE,
                              "museum.network.acquisitions.openPresentation"
                            ),
                          })}
                      className="tw-block tw-h-full tw-w-full tw-object-contain"
                    />
                  </div>
                </div>
                <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
                  <a
                    href={museumArtistHref(artist.slug)}
                    className="tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    {artist.preferredName}
                  </a>
                  <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
                    {relationshipLine(works)}
                  </span>
                  <span className="tw-mt-2 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
                    {presentation.credit.creditLine}{" \u00b7 "}{t(DEFAULT_LOCALE, "museum.network.acquisitions.presentationRights")}
                  </span>
                </figcaption>
              </figure>
              );
            }
            if (metadataRecord !== undefined) {
              return (
                <figure key={artist.id} className="tw-m-0 tw-min-w-0">
                  <MuseumMediaMetadataPlaceholder
                    title={artist.preferredName}
                    metadata={metadataRecord}
                  />
                  <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
                    <a
                      href={museumArtistHref(artist.slug)}
                      className="tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                    >
                      {artist.preferredName}
                    </a>
                    <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
                      {relationshipLine(works)}
                    </span>
                  </figcaption>
                </figure>
              );
            }
            return (
              <article
                key={artist.id}
                className="tw-border-x-0 tw-border-b tw-border-t tw-border-solid tw-border-iron-800 tw-py-5"
              >
                <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50">
                  <a
                    href={museumArtistHref(artist.slug)}
                    className="tw-text-inherit tw-no-underline hover:tw-text-primary-200"
                  >
                    {artist.preferredName}
                  </a>
                </h2>
                <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-400">
                  {relationshipLine(works)}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  const artworks = tryCaseyArtworksFromPublication(publication);
  if (artworks === null) return <MuseumPublicationUnavailable />;
  const featuredArtwork = artworks.find(
    (artwork) => artwork.objectId === "6529NM.2026.001.05"
  );
  if (featuredArtwork === undefined) return <MuseumPublicationUnavailable />;
  return (
    <div>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.artists.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.artists.title")}
        description={t(DEFAULT_LOCALE, "museum.network.artists.description")}
      />
      <MuseumArtworkFigure
        artwork={featuredArtwork}
        href={museumArtistHref("casey-reas")}
        sizes="(min-width: 1024px) 40vw, 100vw"
      />
    </div>
  );
}
