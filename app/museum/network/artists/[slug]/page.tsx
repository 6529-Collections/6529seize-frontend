import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumBreadcrumbs } from "@/components/museum/MuseumBreadcrumbs";
import { MuseumEntityContext } from "@/components/museum/MuseumEntityContext";
import {
  MuseumJsonDisclosure,
  MuseumMarkdown,
} from "@/components/museum/MuseumMarkdown";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
import { MuseumRelatedEntities } from "@/components/museum/MuseumRelatedEntities";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ARTIST_SLUG,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import {
  buildMuseumArtistContext,
} from "@/lib/museum/publication/ia";
import {
  museumWorkHref,
  museumWorkHrefForSourceId,
} from "@/lib/museum/publication/routes";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication";

interface MuseumArtistPageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MuseumArtistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const publicationState = await getMuseumPublicationState();
  const artist = publicationState.publication?.artists.find(
    (item) => item.slug === slug
  );
  return getAppMetadata({
    title:
      artist?.preferredName ??
      t(DEFAULT_LOCALE, "museum.network.artists.title"),
    description: t(DEFAULT_LOCALE, "museum.network.artists.description"),
  });
}

function TypedArtistPage({
  artist,
  publication,
}: {
  readonly artist: NonNullable<
    Awaited<ReturnType<typeof getMuseumPublicationState>>["publication"]
  >["artists"][number];
  readonly publication: NonNullable<
    Awaited<ReturnType<typeof getMuseumPublicationState>>["publication"]
  >;
}) {
  const works =
    publication.works?.filter(
      (work) =>
        work.artistId === artist.id ||
        artist.workIds?.includes(work.id) === true
    ) ?? [];
  const projects = publication.projects.filter(
    (project) =>
      project.artistId === artist.id ||
      project.artistIds?.includes(artist.id) === true
  );
  const collectionCount = works.filter(
    (work) => work.collectionMembership === true
  ).length;
  const relationshipLabel = (work: (typeof works)[number]): string => {
    if (work.collectionMembership === true) {
      return t(DEFAULT_LOCALE, "museum.network.works.collectionStatus");
    }
    const status = work.status;
    switch (status) {
      case "accessioned_into_permanent_collection":
        return t(DEFAULT_LOCALE, "museum.network.works.connectedStatus");
      case "selected_by_museum_wave_acquisition_review_in_progress":
        return t(
          DEFAULT_LOCALE,
          "museum.network.acquisitions.selectedWaveStatus"
        );
      case "selected_through_acquisition_program_acquisition_pending":
        return t(DEFAULT_LOCALE, "museum.network.works.selectedStatus");
      case "proposed_in_museum_wave":
        return t(DEFAULT_LOCALE, "museum.network.works.proposedStatus");
      case "acquisition_complete_accession_review_in_progress":
        return t(DEFAULT_LOCALE, "museum.network.acquisitions.completeStatus");
      case "closed_without_selection":
        return t(DEFAULT_LOCALE, "museum.network.acquisitions.closedStatus");
      case "withdrawn":
        return t(DEFAULT_LOCALE, "museum.network.acquisitions.withdrawnStatus");
    }
  };
  const relationshipSummary = `${t(
    DEFAULT_LOCALE,
    works.length === 1
      ? "museum.network.artists.connectedWorks.one"
      : "museum.network.artists.connectedWorks.other",
    { count: works.length }
  )} ${"\u00b7"} ${t(DEFAULT_LOCALE, "museum.network.artists.collectionCount", {
    count: collectionCount,
  })}`;
  const context = buildMuseumArtistContext(publication, artist.slug, null, [
    { label: "6529 Network Museum", href: "/museum/network" },
    {
      label: t(DEFAULT_LOCALE, "museum.network.artists.title"),
      href: "/museum/network/artists",
    },
    { label: artist.preferredName },
  ]);
  if (context === null) return <MuseumPublicationUnavailable />;
  const profileDocuments = artist.documentIds.flatMap((documentId) => {
    const document = publication.documents.find(
      (candidate) => candidate.id === documentId
    );
    return document === undefined ? [] : [document];
  });
  return (
    <article className="tw-min-w-0">
      <MuseumBreadcrumbs
        ariaLabel={t(
          DEFAULT_LOCALE,
          "museum.network.accessibility.breadcrumbs"
        )}
        items={[
          { label: "6529 Network Museum", href: "/museum/network" },
          {
            label: t(DEFAULT_LOCALE, "museum.network.artists.title"),
            href: "/museum/network/artists",
          },
          { label: artist.preferredName },
        ]}
      />
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.artists.artist")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {artist.preferredName}
        </h1>
        <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
          {relationshipSummary}
        </p>
      </header>
      <MuseumEntityContext
        context={context}
        labels={{
          ariaLabel: t(
            DEFAULT_LOCALE,
            "museum.network.accessibility.entityContext"
          ),
          status: t(DEFAULT_LOCALE, "museum.network.entity.status"),
          statusAsOf: t(DEFAULT_LOCALE, "museum.network.entity.statusAsOf"),
          source: t(DEFAULT_LOCALE, "museum.network.entity.sources"),
        }}
      />
      {profileDocuments.length > 0 ? (
        <section
          className="tw-mt-10 tw-max-w-4xl"
          aria-labelledby="typed-artist-profile-title"
        >
          <h2
            id="typed-artist-profile-title"
            className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.artists.profile")}
          </h2>
          <div className="tw-mt-6 tw-space-y-8">
            {profileDocuments.map((document) =>
              document.kind === "source_record" ? (
                <MuseumJsonDisclosure
                  key={document.id}
                  label={document.title}
                  sourceJson={document.markdown}
                />
              ) : (
                <MuseumMarkdown
                  key={document.id}
                  className="tw-max-w-3xl"
                  embeddedDocument
                  sourceCommit={publication.identity.commit}
                  sourcePath={document.sourcePath}
                >
                  {document.markdown}
                </MuseumMarkdown>
              )
            )}
          </div>
        </section>
      ) : null}
      <section className="tw-mt-12" aria-labelledby="typed-artist-works-title">
        <h2
          id="typed-artist-works-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.acquisitions.related")}
        </h2>
        <div className="tw-mt-6 tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-10 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
          {works.map((work) => {
            const media = work.media[0];
            const presentation = work.presentationMedia?.[0];
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
                  byline={relationshipLabel(work)}
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
                <figure key={work.id} className="tw-m-0 tw-min-w-0">
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
                    <Link
                      href={museumWorkHref(work.id)}
                      className="hover:tw-text-primary-200 tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                    >
                      {work.title}
                    </Link>
                    <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
                      {relationshipLabel(work)}
                    </span>
                    <span className="tw-mt-2 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
                      {presentation.credit.creditLine} ·{" "}
                      {t(
                        DEFAULT_LOCALE,
                        "museum.network.acquisitions.presentationRights"
                      )}
                    </span>
                  </figcaption>
                </figure>
              );
            }
            return (
              <p
                key={work.id}
                className="tw-m-0 tw-border-b tw-border-solid tw-border-iron-800 tw-py-4"
              >
                <Link
                  href={museumWorkHref(work.id)}
                  className="tw-text-primary-300 tw-underline tw-underline-offset-4"
                >
                  {work.title}
                </Link>
              </p>
            );
          })}
        </div>
      </section>
      <section
        className="tw-mt-16"
        aria-labelledby="typed-artist-projects-title"
      >
        <h2
          id="typed-artist-projects-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.artists.projects")}
        </h2>
        <ul className="tw-m-0 tw-mt-5 tw-list-none tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-0">
          {projects.map((project) => (
            <li
              key={project.id}
              className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800"
            >
              <Link
                href={`/museum/network/projects/${encodeURIComponent(project.slug)}`}
                className="hover:tw-text-primary-200 tw-flex tw-min-h-16 tw-items-center tw-justify-between tw-gap-4 tw-py-4 tw-text-base tw-font-semibold tw-text-iron-100 tw-no-underline"
              >
                <span>{project.title}</span>
                <span className="tw-text-sm tw-font-normal tw-text-iron-500">
                  {project.workIds?.length ?? project.artworkIds.length} works
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <MuseumRelatedEntities
        entities={context.secondaryRelations}
        headingId="typed-artist-acquisitions-title"
        title={t(DEFAULT_LOCALE, "museum.network.artists.acquisitions")}
      />
    </article>
  );
}

export default async function MuseumArtistPage({
  params,
}: MuseumArtistPageProps) {
  const { slug } = await params;
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = publicationState.publication;
  const artist = publication.artists.find((item) => item.slug === slug);
  if (artist === undefined) {
    notFound();
  }
  if (publication.works !== undefined) {
    return <TypedArtistPage artist={artist} publication={publication} />;
  }
  if (slug !== CASEY_ARTIST_SLUG) {
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
          {artworks.map((artwork) => {
            const href = museumWorkHrefForSourceId(
              publication,
              artwork.objectId
            );
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
            sourceCommit={publication.identity.commit}
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
