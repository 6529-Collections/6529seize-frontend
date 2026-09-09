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
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
import { MuseumReviewedProgramMediaFigure } from "@/components/museum/MuseumReviewedProgramMediaFigure";
import { MuseumRelatedEntities } from "@/components/museum/MuseumRelatedEntities";
import { MuseumSourceMatrixLink } from "@/components/museum/MuseumSourceMatrixLink";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatDate } from "@/i18n/format";
import {
  CASEY_ARTIST_NAME,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import { getGenerativeStudyByProjectSlug } from "@/lib/museum/generative-studies";
import { getMintedProjectIndex } from "@/lib/museum/generative-studies/minted";
import { findReviewedProgramMediaMatch } from "@/lib/museum/normalize";
import {
  displayMuseumPublicAcquisitionStatus,
  museumCreatorSeparator,
} from "@/lib/museum/presentation";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication";
import {
  applyMuseumCollectionSemantics,
  MUSEUM_MAGNUM_ACQUISITION_ID,
  museumProjectWorks,
} from "@/lib/museum/publication/collectionSemantics";
import {
  museumMediaResponsiveImage,
  selectMuseumStillMedia,
} from "@/lib/museum/publication/mediaSelection";
import {
  buildMuseumEntityContext,
  buildMuseumProjectRelations,
} from "@/lib/museum/publication/ia";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import {
  museumArtistHref,
  museumOrganizationHref,
  museumProjectHref,
  museumWorkHref,
  museumWorkHrefForSourceId,
  museumWorkHrefIndex,
} from "@/lib/museum/publication/routes";
import type {
  MuseumProject,
  MuseumPublication,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import type { MuseumView } from "@/lib/museum/types";

interface MuseumProjectPageProps {
  readonly params: Promise<{ slug: string }>;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function firstNonEmptyString(values: readonly unknown[]): string | null {
  for (const value of values) {
    const result = nonEmptyString(value);
    if (result !== null) return result;
  }
  return null;
}

function positiveYear(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function projectEntityProfile(
  publication: MuseumPublication,
  project: MuseumProject
): Readonly<Record<string, unknown>> | null {
  return (
    publication.entityGraph?.entities.find((entity) => entity.id === project.id)
      ?.profile ?? null
  );
}

function projectDetails(
  publication: MuseumPublication,
  project: MuseumProject
): {
  readonly platform: string | null;
  readonly releaseYear: number | null;
  readonly description: string | null;
} {
  const projectRecord = project as unknown as Record<string, unknown>;
  const profile = projectEntityProfile(publication, project);
  return {
    platform: firstNonEmptyString([
      project.platform,
      projectRecord["platform_name"],
      profile?.["platform"],
      profile?.["platform_name"],
    ]),
    releaseYear:
      positiveYear(project.releaseYear) ??
      positiveYear(projectRecord["release_year"]) ??
      positiveYear(profile?.["release_year"]) ??
      positiveYear(profile?.["year"]),
    description: firstNonEmptyString([
      projectRecord["description"],
      projectRecord["summary"],
      profile?.["description"],
      profile?.["scope_statement"],
    ]),
  };
}

function ProjectDetails({
  details,
  organizations,
}: {
  readonly details: ReturnType<typeof projectDetails>;
  readonly organizations: readonly NonNullable<
    MuseumPublication["organizations"]
  >[number][];
}) {
  const hasDetails =
    details.platform !== null ||
    details.releaseYear !== null ||
    organizations.length > 0 ||
    details.description !== null;
  if (!hasDetails) return null;

  return (
    <section
      className="tw-mt-12 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
      aria-labelledby="typed-project-details-title"
    >
      <h2
        id="typed-project-details-title"
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {t(DEFAULT_LOCALE, "museum.network.projects.details")}
      </h2>
      <dl className="tw-m-0 tw-mt-5 tw-grid tw-gap-x-8 tw-gap-y-5 sm:tw-grid-cols-2">
        {details.platform === null ? null : (
          <div>
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.projects.platform")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-200">
              {details.platform}
            </dd>
          </div>
        )}
        {details.releaseYear === null ? null : (
          <div>
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.projects.releaseYear")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-200">
              {details.releaseYear}
            </dd>
          </div>
        )}
        {organizations.length === 0 ? null : (
          <div>
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.projects.organization")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-flex tw-flex-wrap tw-gap-x-3 tw-gap-y-1 tw-text-sm tw-leading-6">
              {organizations.map((organization) => (
                <Link
                  key={organization.id}
                  href={museumOrganizationHref(organization.slug)}
                  className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {organization.preferredName}
                </Link>
              ))}
            </dd>
          </div>
        )}
        {details.description === null ? null : (
          <div className="sm:tw-col-span-2">
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.projects.descriptionLabel")}
            </dt>
            <dd className="tw-m-0 tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-200">
              {details.description}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function ProjectWorkCard({
  index,
  view,
  work,
}: {
  readonly index: number;
  readonly view: MuseumView | null;
  readonly work: MuseumPublicWork;
}) {
  const media = selectMuseumStillMedia(work.media);
  const status = displayMuseumPublicAcquisitionStatus(work.status);
  const statusRecorded = t(
    DEFAULT_LOCALE,
    "museum.network.projects.statusRecorded",
    { date: formatDate(DEFAULT_LOCALE, work.statusAsOf) }
  );
  const programMediaMatch =
    media === undefined
      ? findReviewedProgramMediaMatch(view, [
          work.id,
          ...(work.sourceRecordIds ?? []),
        ])
      : null;

  if (media !== undefined) {
    const responsive = museumMediaResponsiveImage(media);
    if (media.altText === null || media.altText.trim() === "") {
      throw new Error("museum_project_work_alt_text_missing");
    }
    return (
      <MuseumPublicMediaFigure
        key={work.id}
        src={responsive.src}
        {...(responsive.srcSet === undefined
          ? {}
          : { srcSet: responsive.srcSet })}
        width={media.width}
        height={media.height}
        alt={media.altText}
        href={museumWorkHref(work.id)}
        title={work.title}
        status={status}
        qualifier={statusRecorded}
        eager={index === 0}
      />
    );
  }

  if (programMediaMatch !== null) {
    const metadata = work.mediaMetadata?.find((candidate) =>
      candidate.sourceRecordIds?.includes(programMediaMatch.sourceRecordId)
    );
    return (
      <MuseumReviewedProgramMediaFigure
        key={work.id}
        media={programMediaMatch.media}
        metadata={metadata}
        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
        eager={index === 0}
      >
        <Link
          href={museumWorkHref(work.id)}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {work.title}
        </Link>
        <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
          {status}
        </span>
        <span className="tw-mt-1 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
          {statusRecorded}
        </span>
      </MuseumReviewedProgramMediaFigure>
    );
  }

  const presentation = work.presentationMedia?.[0];
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
              sourceByteSize={presentation.sourceByteSize}
              variants={presentation.variants}
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
              eager={index === 0}
            />
          </div>
        </div>
        <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
          <Link
            href={museumWorkHref(work.id)}
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {work.title}
          </Link>
          <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
            {status}
          </span>
          <span className="tw-mt-1 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
            {statusRecorded}
          </span>
          <span className="tw-mt-2 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
            {presentation.credit.creditLine} ·{" "}
            {t(
              DEFAULT_LOCALE,
              presentation.source.contextEntityId ===
                MUSEUM_MAGNUM_ACQUISITION_ID
                ? "museum.network.rights.magnumInstitutionalDisplayCaption"
                : "museum.network.acquisitions.presentationRights"
            )}
          </span>
        </figcaption>
      </figure>
    );
  }

  return (
    <p
      key={work.id}
      className="tw-m-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4"
    >
      <Link
        href={museumWorkHref(work.id)}
        className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {work.title}
      </Link>
      <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
        {status}
      </span>
      <span className="tw-mt-1 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
        {statusRecorded}
      </span>
    </p>
  );
}

function TypedProjectPage({
  project,
  publication,
  view,
}: {
  readonly project: MuseumProject;
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
}) {
  const works = museumProjectWorks(publication, project);
  const workArtistIds = new Set(works.map((work) => work.artistId));
  const artists = publication.artists.filter(
    (artist) =>
      project.artistIds?.includes(artist.id) === true ||
      artist.id === project.artistId ||
      workArtistIds.has(artist.id)
  );
  const organizations =
    publication.organizations?.filter(
      (organization) =>
        project.organizationIds?.includes(organization.id) === true ||
        organization.projectIds.includes(project.id)
    ) ?? [];
  const relations = buildMuseumProjectRelations(publication, project.slug);
  const context = buildMuseumEntityContext({
    kind: "project",
    id: project.id,
    label: project.title,
    canonicalHref: museumProjectHref(project.slug),
    breadcrumbs: [
      { label: "6529 Network Museum", href: "/museum/network" },
      {
        label: t(DEFAULT_LOCALE, "museum.network.projects.title"),
        href: "/museum/network/projects",
      },
      { label: project.title },
    ],
    primaryRelations: relations.primaryRelations,
    secondaryRelations: [
      ...relations.secondaryRelations,
      ...organizations.map((organization) => ({
        kind: "organization" as const,
        id: organization.id,
        label: organization.preferredName,
        href: museumOrganizationHref(organization.slug),
        relation: "Organization",
        ...(organization.sourcePaths[0]
          ? { sourcePath: organization.sourcePaths[0] }
          : {}),
        sourceCommit: publication.identity.commit,
      })),
    ],
    sourcePath: project.sourcePaths[0] ?? null,
    sourceCommit: publication.identity.commit,
  });
  if (context === null) return <MuseumPublicationUnavailable />;
  const documents = publication.documents.filter((document) =>
    project.documentIds.includes(document.id)
  );
  const workHrefs = museumWorkHrefIndex(publication, view);
  const details = projectDetails(publication, project);

  return (
    <article className="tw-min-w-0">
      <MuseumBreadcrumbs
        ariaLabel={t(
          DEFAULT_LOCALE,
          "museum.network.accessibility.breadcrumbs"
        )}
        items={context.breadcrumbs}
      />
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.projects.project")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-5xl">
          {project.title}
        </h1>
        <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
          {artists.map((artist, index) => (
            <span key={artist.id}>
              {museumCreatorSeparator(index, artists.length)}
              <Link
                href={museumArtistHref(artist.slug)}
                className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4"
              >
                {artist.preferredName}
              </Link>
            </span>
          ))}
        </p>
      </header>
      <section className="tw-mt-10" aria-labelledby="typed-project-works-title">
        <h2
          id="typed-project-works-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.projects.works")}
        </h2>
        <div
          className={`tw-mt-6 tw-grid tw-gap-x-6 tw-gap-y-10 ${
            works.length === 1
              ? "tw-max-w-6xl tw-grid-cols-1"
              : "sm:tw-grid-cols-2 xl:tw-grid-cols-3"
          }`}
        >
          {works.map((work, index) => (
            <ProjectWorkCard
              key={work.id}
              index={index}
              view={view}
              work={work}
            />
          ))}
        </div>
      </section>
      <ProjectDetails details={details} organizations={organizations} />
      <MuseumEntityContext
        context={context}
        labels={{
          ariaLabel: t(
            DEFAULT_LOCALE,
            "museum.network.accessibility.entityContext"
          ),
          source: t(DEFAULT_LOCALE, "museum.network.entity.sources"),
        }}
      />
      {documents.map((document) => (
        <section
          key={document.id}
          className="tw-mt-14 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        >
          <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
            {document.title}
          </h2>
          {document.kind === "source_record" ? (
            <div className="tw-mt-6">
              <MuseumJsonDisclosure
                label={document.title}
                sourceJson={document.markdown}
              />
            </div>
          ) : (
            <MuseumMarkdown
              className="tw-mt-6"
              embeddedDocument
              sourceCommit={publication.identity.commit}
              sourcePath={document.sourcePath}
              workHrefs={workHrefs}
            >
              {document.markdown}
            </MuseumMarkdown>
          )}
        </section>
      ))}
      <MuseumRelatedEntities
        entities={[...context.secondaryRelations]}
        headingId="typed-project-related-title"
        title={t(DEFAULT_LOCALE, "museum.network.projects.related")}
      />
    </article>
  );
}

export async function generateMetadata({
  params,
}: MuseumProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { publicationState } = await getMuseumPublicationBundle();
  const project = publicationState.publication?.projects.find(
    (item) => item.slug === slug
  );
  const metadata = getAppMetadata({
    title: project?.title ?? t(DEFAULT_LOCALE, "museum.network.projects.title"),
    description: t(DEFAULT_LOCALE, "museum.network.projects.description"),
  });
  return project === undefined
    ? metadata
    : {
        ...metadata,
        alternates: { canonical: museumProjectHref(project.slug) },
      };
}

export default async function MuseumProjectPage({
  params,
}: MuseumProjectPageProps) {
  const { slug } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = applyMuseumCollectionSemantics(
    publicationState.publication
  );
  const project = publication.projects.find((item) => item.slug === slug);
  if (project === undefined) {
    notFound();
  }
  if (publication.works !== undefined) {
    return (
      <TypedProjectPage
        project={project}
        publication={publication}
        view={view}
      />
    );
  }
  const artist = publication.artists.find(
    (item) => item.id === project.artistId
  );
  if (artist === undefined) {
    notFound();
  }
  const caseyArtworks = tryCaseyArtworksFromPublication(publication);
  if (caseyArtworks === null) {
    return <MuseumPublicationUnavailable />;
  }
  const artworks = caseyArtworks.filter((artwork) =>
    project.artworkIds.includes(artwork.objectId)
  );
  const projectEssay = publication.documents.find(
    (document) =>
      document.kind === "project_essay" &&
      document.projectIds.includes(project.id)
  );
  const sourceMatrix = publication.documents.find(
    (document) => document.kind === "source_chronology_matrix"
  );
  if (projectEssay === undefined || sourceMatrix === undefined) {
    return <MuseumPublicationUnavailable />;
  }
  const editorialArtistName =
    artist.slug === "casey-reas" ? CASEY_ARTIST_NAME : artist.preferredName;
  const generativeStudy = getGenerativeStudyByProjectSlug(project.slug);
  const hasGenerativeExplorer =
    generativeStudy !== null && getMintedProjectIndex(project.slug) !== null;
  const workHrefs = museumWorkHrefIndex(publication, view);

  return (
    <article>
      <Link
        href={`/museum/network/artists/${artist.slug}`}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.projects.backToArtist", {
          artist: editorialArtistName,
        })}
      </Link>
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.projects.project")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {project.title}
        </h1>
        <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.projects.byline", {
            artist: editorialArtistName,
          })}
        </p>
      </header>
      <div className="tw-mt-10 tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-12 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
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
      {!hasGenerativeExplorer ? null : (
        <section
          className="tw-mt-16 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/60 tw-p-6 sm:tw-p-8"
          aria-labelledby="project-system-title"
        >
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.eyebrow")}
          </p>
          <h2
            id="project-system-title"
            className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50 sm:tw-text-3xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.projectTitle")}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-300">
            {generativeStudy.thesis}
          </p>
          <Link
            href={`/museum/network/projects/${project.slug}/system`}
            className="hover:tw-text-primary-200 tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.enterSystem")}
          </Link>
        </section>
      )}
      <section
        className="tw-mt-16 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        aria-labelledby="project-essay-title"
      >
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.projects.essay")}
        </p>
        <h2
          id="project-essay-title"
          className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50"
        >
          {projectEssay.title}
        </h2>
        <MuseumMarkdown
          className="tw-mt-6"
          embeddedDocument
          sourceCommit={publication.identity.commit}
          sourcePath={projectEssay.sourcePath}
          workHrefs={workHrefs}
        >
          {projectEssay.markdown}
        </MuseumMarkdown>
        <div className="tw-mt-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5">
          <MuseumSourceMatrixLink />
        </div>
      </section>
    </article>
  );
}
