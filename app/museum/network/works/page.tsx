import type { Metadata } from "next";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ARTIST_NAME,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import type { MuseumMedia } from "@/lib/museum/publication/types";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
import {
  museumWorkHref,
  museumWorkHrefForSourceId,
} from "@/lib/museum/publication/routes";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import type { MuseumProgramMedia } from "@/lib/museum/types";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.works.title"),
    description: t(DEFAULT_LOCALE, "museum.network.works.description"),
  }),
  alternates: { canonical: "/museum/network/works" },
};

function caseyMedia(artwork: {
  readonly imageUrl: string;
  readonly visualDescription: string;
}): MuseumProgramMedia {
  return {
    sourceUrl: artwork.imageUrl,
    sourceMimeType: "image/png",
    sourceSha256: null,
    sourceByteSize: null,
    sourceWidth: null,
    sourceHeight: null,
    altText: artwork.visualDescription,
    altTextStatus: "governed_artwork_description",
    variants: [],
  };
}

function publicWorkMedia(
  media: MuseumMedia | undefined
): MuseumProgramMedia | undefined {
  if (media === undefined) return undefined;
  return {
    sourceUrl: media.url,
    sourceMimeType: media.mediaType ?? "image/*",
    sourceSha256: media.sha256,
    sourceByteSize: null,
    sourceWidth: media.width,
    sourceHeight: media.height,
    altText: media.altText ?? "",
    altTextStatus:
      media.altText === null ? "unavailable" : "governed_artwork_description",
    variants: [],
  };
}

function publicWorkStatus(status: string): string {
  switch (status) {
    case "accessioned_into_permanent_collection":
      return t(DEFAULT_LOCALE, "museum.network.works.collectionStatus");
    case "proposed_in_museum_wave":
      return t(DEFAULT_LOCALE, "museum.network.works.proposedStatus");
    case "selected_by_museum_wave_acquisition_review_in_progress":
      return t(
        DEFAULT_LOCALE,
        "museum.network.acquisitions.selectedWaveStatus"
      );
    case "selected_through_acquisition_program_acquisition_pending":
      return t(DEFAULT_LOCALE, "museum.network.works.selectedStatus");
    case "acquisition_complete_accession_review_in_progress":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.completeStatus");
    case "closed_without_selection":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.closedStatus");
    case "withdrawn":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.withdrawnStatus");
    default:
      return t(DEFAULT_LOCALE, "museum.network.works.relationship");
  }
}

function WorkTextFigure({
  href,
  title,
  byline,
  qualifier,
}: {
  readonly href: string;
  readonly title: string;
  readonly byline: string;
  readonly qualifier?: string;
}) {
  return (
    <article className="tw-border-x-0 tw-border-b tw-border-t tw-border-solid tw-border-iron-800 tw-py-5">
      <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        <a
          href={href}
          className="hover:tw-text-primary-200 tw-text-inherit tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {title}
        </a>
      </h2>
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
        {byline}
      </p>
      {qualifier ? (
        <p className="tw-m-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-500">
          {qualifier}
        </p>
      ) : null}
    </article>
  );
}

export default async function MuseumWorksPage() {
  const { publicationState, view } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (publication === null) return <MuseumPublicationUnavailable />;

  const caseyArtworks = tryCaseyArtworksFromPublication(publication);
  const publicWorks = publication.works;
  const selectedWorks =
    view?.objects.filter((object) => object.programId !== null) ?? [];

  if (
    (publicWorks === undefined &&
      caseyArtworks === null &&
      selectedWorks.length === 0) ||
    publicWorks?.length === 0
  ) {
    return <MuseumPublicationUnavailable />;
  }

  return (
    <section>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.works.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.works.title")}
        description={t(DEFAULT_LOCALE, "museum.network.works.description")}
      />
      <p className="tw-m-0 tw-mb-10 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-6 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(DEFAULT_LOCALE, "museum.network.works.relationship")}
      </p>

      <div className="tw-grid tw-min-w-0 tw-gap-5 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        {publicWorks?.map((work) => {
          const media = publicWorkMedia(selectMuseumStillMedia(work.media));
          const artist =
            publication.artists.find((item) => item.id === work.artistId)
              ?.preferredName ?? work.artistId;
          const byline = `${artist} · ${publicWorkStatus(work.status)}`;
          const qualifier =
            work.status ===
            "selected_through_acquisition_program_acquisition_pending"
              ? t(
                  DEFAULT_LOCALE,
                  "museum.network.acquisitions.selectedWorkQualifier"
                )
              : undefined;
          const qualifierProps = qualifier === undefined ? {} : { qualifier };
          if (media === undefined) {
            return (
              <WorkTextFigure
                key={work.id}
                href={museumWorkHref(work.id)}
                title={work.title}
                byline={byline}
                {...qualifierProps}
              />
            );
          }
          return (
            <MuseumPublicMediaFigure
              key={work.id}
              src={media.sourceUrl}
              width={media.sourceWidth}
              height={media.sourceHeight}
              alt={media.altText}
              href={museumWorkHref(work.id)}
              title={work.title}
              byline={byline}
              {...qualifierProps}
            />
          );
        })}
        {publicWorks === undefined &&
          caseyArtworks?.flatMap((artwork) => {
            const href = museumWorkHrefForSourceId(
              publication,
              artwork.objectId
            );
            if (href === null) return [];
            const media = caseyMedia(artwork);
            return [
              <MuseumPublicMediaFigure
                key={artwork.objectId}
                src={media.sourceUrl}
                width={media.sourceWidth}
                height={media.sourceHeight}
                alt={media.altText}
                href={href}
                title={artwork.title}
                byline={`${CASEY_ARTIST_NAME} · ${t(
                  DEFAULT_LOCALE,
                  "museum.network.works.collectionStatus"
                )}`}
              />,
            ];
          })}
        {publicWorks === undefined &&
          selectedWorks.flatMap((work) => {
            const href = museumWorkHrefForSourceId(publication, work.objectId);
            if (href === null) return [];
            const media = work.media;
            return [
              media === null ? (
                <WorkTextFigure
                  key={work.objectId}
                  href={href}
                  title={work.title}
                  byline={`${work.artist} · ${t(
                    DEFAULT_LOCALE,
                    "museum.network.works.selectedStatus"
                  )}`}
                  qualifier={t(
                    DEFAULT_LOCALE,
                    "museum.network.acquisitions.selectedWorkQualifier"
                  )}
                />
              ) : (
                <MuseumPublicMediaFigure
                  key={work.objectId}
                  src={media.sourceUrl}
                  width={media.sourceWidth}
                  height={media.sourceHeight}
                  alt={media.altText}
                  href={href}
                  title={work.title}
                  byline={`${work.artist} · ${t(
                    DEFAULT_LOCALE,
                    "museum.network.works.selectedStatus"
                  )}`}
                  qualifier={t(
                    DEFAULT_LOCALE,
                    "museum.network.acquisitions.selectedWorkQualifier"
                  )}
                />
              ),
            ];
          })}
      </div>
    </section>
  );
}
