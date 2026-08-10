import type { Metadata } from "next";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
import { MuseumPublicWorkTextFigure } from "@/components/museum/MuseumPublicWorkTextFigure";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { tryCaseyArtworksFromPublication } from "@/lib/museum/casey";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import {
  museumWorkHref,
  museumWorkHrefForSourceId,
} from "@/lib/museum/publication/routes";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";

function MuseumAccessionRecords({
  publication,
}: {
  readonly publication: NonNullable<
    Awaited<
      ReturnType<typeof getMuseumPublicationBundle>
    >["publicationState"]["publication"]
  >;
}) {
  const graph = publication.entityGraph;
  if (graph === undefined) return null;
  const worksById = new Map(
    (publication.works ?? []).map((work) => [work.id, work] as const)
  );
  const accessions = graph.entities
    .filter((entity) => entity.entityType === "ACCESSION")
    .map((accession) => ({
      accession,
      workIds: graph.relations
        .filter(
          (relation) =>
            relation.relationType === "ACCESSION_ADMITS_WORK" &&
            relation.sourceEntityId === accession.id &&
            (relation.assertionStatus === "asserted" ||
              relation.assertionStatus === "observed")
        )
        .map((relation) => relation.targetEntityId),
    }))
    .filter((item) => item.workIds.length > 0);
  if (accessions.length === 0) return null;
  return (
    <section
      id="accessions"
      className="tw-mt-16 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
      aria-labelledby="museum-accession-records-title"
    >
      <h2
        id="museum-accession-records-title"
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {t(DEFAULT_LOCALE, "museum.network.collection.accessionRecords")}
      </h2>
      <div className="tw-mt-6 tw-space-y-8">
        {accessions.map(({ accession, workIds }) => {
          const profile = accession.profile;
          const accessionNumber =
            typeof profile["accession_number"] === "string"
              ? profile["accession_number"]
              : accession.label;
          const sourceHref = buildImmutableMuseumBlobUrl(
            publication.identity.commit,
            accession.sourcePath
          );
          return (
            <div
              key={accession.id}
              className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-6"
            >
              <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-3">
                <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
                  {String(accessionNumber)}
                </h3>
                {sourceHref === null ? null : (
                  <a
                    href={sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    {t(DEFAULT_LOCALE, "museum.network.detail.sourceRecord")}
                  </a>
                )}
              </div>
              <ul className="tw-m-0 tw-mt-4 tw-list-none tw-space-y-2 tw-p-0">
                {workIds.map((workId) => {
                  const work = worksById.get(workId);
                  if (work === undefined) return null;
                  return (
                    <li key={work.id}>
                      <a
                        href={museumWorkHref(work.id)}
                        className="hover:tw-text-primary-200 tw-text-sm tw-text-iron-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                      >
                        {work.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.collection.title"),
    description: t(DEFAULT_LOCALE, "museum.network.collection.description"),
  }),
  alternates: { canonical: "/museum/network/collection" },
};

export default async function MuseumCollectionPage() {
  const { publicationState } = await getMuseumPublicationBundle();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = publicationState.publication;
  const typedHoldings = publication.works?.filter(
    (work) => work.collectionMembership
  );
  if (typedHoldings !== undefined) {
    if (typedHoldings.length === 0) {
      return <MuseumPublicationUnavailable />;
    }
    return (
      <div>
        <MuseumSectionHeading
          eyebrow={t(DEFAULT_LOCALE, "museum.network.collection.eyebrow")}
          title={t(DEFAULT_LOCALE, "museum.network.collection.title")}
          description={t(
            DEFAULT_LOCALE,
            "museum.network.collection.description"
          )}
        />
        <p className="tw-m-0 tw-mb-10 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-6 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "museum.network.collection.scope")}
        </p>
        <div className="tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-12 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
          {typedHoldings.map((work) => {
            const media = work.media[0];
            if (media !== undefined) {
              return (
                <MuseumPublicMediaFigure
                  key={work.id}
                  src={media.url}
                  width={media.width}
                  height={media.height}
                  alt={media.altText ?? ""}
                  href={museumWorkHref(work.id)}
                  title={work.title}
                  byline={media.credit.creditLine}
                />
              );
            }
            const artist = publication.artists.find(
              (candidate) => candidate.id === work.artistId
            );
            return (
              <MuseumPublicWorkTextFigure
                key={work.id}
                title={work.title}
                href={museumWorkHref(work.id)}
                {...(artist === undefined
                  ? {}
                  : { byline: artist.preferredName })}
              />
            );
          })}
        </div>
        <MuseumAccessionRecords publication={publication} />
      </div>
    );
  }
  const artworks = tryCaseyArtworksFromPublication(publication);
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
        {artworks.map((artwork) => {
          const href = museumWorkHrefForSourceId(publication, artwork.objectId);
          return (
            <MuseumArtworkFigure
              key={artwork.objectId}
              artwork={artwork}
              {...(href === null ? {} : { href })}
              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
            />
          );
        })}
      </div>
    </div>
  );
}
