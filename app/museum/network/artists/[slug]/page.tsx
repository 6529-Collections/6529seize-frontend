import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { buildMuseumDirectoryModel } from "@/components/museum/directory/MuseumDirectoryData";
import { MuseumBreadcrumbs } from "@/components/museum/MuseumBreadcrumbs";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import { MuseumRelatedEntities } from "@/components/museum/MuseumRelatedEntities";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ARTIST_SLUG,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import {
  applyMuseumCollectionSemantics,
  isMuseumPermanentCollectionWork,
  museumDirectoryPublication,
  museumPublicWorkStatus,
} from "@/lib/museum/publication/collectionSemantics";
import { buildMuseumArtistContext } from "@/lib/museum/publication/ia";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import {
  MUSEUM_CASEY_ACQUISITION_SLUG,
  museumAcquisitionHref,
  museumArtistHref,
  museumWorkHrefForSourceId,
  museumWorkHrefIndex,
} from "@/lib/museum/publication/routes";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";
import type { MuseumView } from "@/lib/museum/types";
import { MuseumArtistRecordSummary } from "./MuseumArtistRecordSummary";
import { TypedArtistProfile } from "./TypedArtistProfile";
import { TypedArtistProjects } from "./TypedArtistProjects";
import { TypedArtistWorks } from "./TypedArtistWorks";

interface MuseumArtistPageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MuseumArtistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { publicationState } = await getMuseumPublicationBundle();
  const artist = publicationState.publication?.artists.find(
    (item) => item.slug === slug
  );
  const metadata = getAppMetadata({
    title:
      artist?.preferredName ??
      t(DEFAULT_LOCALE, "museum.network.artists.title"),
    description: t(DEFAULT_LOCALE, "museum.network.artists.description"),
  });
  return artist === undefined
    ? metadata
    : { ...metadata, alternates: { canonical: museumArtistHref(artist.slug) } };
}

function TypedArtistPage({
  artist,
  publication,
  view,
}: {
  readonly artist: NonNullable<
    Awaited<
      ReturnType<typeof getMuseumPublicationBundle>
    >["publicationState"]["publication"]
  >["artists"][number];
  readonly publication: NonNullable<
    Awaited<
      ReturnType<typeof getMuseumPublicationBundle>
    >["publicationState"]["publication"]
  >;
  readonly view: MuseumView | null;
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
      project.artistIds?.includes(artist.id) === true ||
      works.some((work) => work.projectId === project.id)
  );
  const relationshipLabel = (work: (typeof works)[number]): string => {
    if (isMuseumPermanentCollectionWork(work)) {
      return t(DEFAULT_LOCALE, "museum.network.works.collectionStatus");
    }
    const status = museumPublicWorkStatus(work);
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
  const relationshipSummary =
    buildMuseumDirectoryModel(
      museumDirectoryPublication(publication)
    )?.artists.find((record) => record.artist.id === artist.id)?.relationship ??
    t(DEFAULT_LOCALE, "museum.network.artists.profileUnavailable");
  const context = buildMuseumArtistContext(publication, artist.slug, view, [
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
    if (
      document === undefined ||
      (document.kind !== "artist_practice" &&
        document.kind !== "source_record") ||
      (document.artistIds.length > 0 && !document.artistIds.includes(artist.id))
    ) {
      return [];
    }
    return [document];
  });
  const workHrefs = museumWorkHrefIndex(publication, view);
  const acquisition = context.secondaryRelations.find(
    (entity) => entity.kind === "curated_acquisition"
  );
  const sourceHref =
    context.sourcePath === null || context.sourceCommit === null
      ? null
      : buildImmutableMuseumBlobUrl(context.sourceCommit, context.sourcePath);
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
      <MuseumArtistRecordSummary
        relationshipSummary={relationshipSummary}
        workCount={works.length}
        {...(acquisition === undefined
          ? {}
          : {
              acquisition: {
                label: acquisition.label,
                href: acquisition.href,
              },
            })}
        profileHref={
          profileDocuments.length > 0 ? "#typed-artist-profile-title" : null
        }
        sourceHref={sourceHref}
      />
      <TypedArtistWorks
        relationshipLabel={relationshipLabel}
        view={view}
        works={works}
      />
      <TypedArtistProfile
        profileDocuments={profileDocuments}
        publication={publication}
        workHrefs={workHrefs}
      />
      <TypedArtistProjects projects={projects} />
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
  const { publicationState, view } = await getMuseumPublicationBundle();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = applyMuseumCollectionSemantics(
    publicationState.publication
  );
  const artist = publication.artists.find((item) => item.slug === slug);
  if (artist === undefined) {
    notFound();
  }
  if (publication.works !== undefined) {
    return (
      <TypedArtistPage artist={artist} publication={publication} view={view} />
    );
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
  const workHrefs = museumWorkHrefIndex(publication, view);
  const sourceHref =
    profile === undefined
      ? null
      : buildImmutableMuseumBlobUrl(
          publication.identity.commit,
          profile.sourcePath
        );

  return (
    <article className="tw-min-w-0">
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

      <MuseumArtistRecordSummary
        relationshipSummary={t(
          DEFAULT_LOCALE,
          "museum.network.artists.caseyWorks"
        )}
        workCount={artworks.length}
        acquisition={{
          label: t(DEFAULT_LOCALE, "museum.network.acquisitions.caseyTitle"),
          href: museumAcquisitionHref(MUSEUM_CASEY_ACQUISITION_SLUG),
        }}
        profileHref={profile === undefined ? null : "#artist-profile-title"}
        sourceHref={sourceHref}
      />

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
            workHrefs={workHrefs}
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
