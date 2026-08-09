import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumBreadcrumbs } from "@/components/museum/MuseumBreadcrumbs";
import { MuseumEntityContext } from "@/components/museum/MuseumEntityContext";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
import { MuseumRelatedEntities } from "@/components/museum/MuseumRelatedEntities";
import { MuseumSourceMatrixLink } from "@/components/museum/MuseumSourceMatrixLink";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ARTIST_NAME,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import { getGenerativeStudyByProjectSlug } from "@/lib/museum/generative-studies";
import { getMintedProjectIndex } from "@/lib/museum/generative-studies/minted";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import type { MuseumPublication } from "@/lib/museum/publication/types";
import {
  buildMuseumEntityContext,
  buildMuseumProjectRelations,
  museumWorkHrefForSourceId,
} from "@/lib/museum/publication/ia";
import {
  museumArtistHref,
  museumOrganizationHref,
  museumProjectHref,
  museumWorkHref,
} from "@/lib/museum/publication/routes";
interface MuseumProjectPageProps {
  readonly params: Promise<{ slug: string }>;
}

function TypedProjectPage({
  project,
  publication,
}: {
  readonly project: MuseumPublication["projects"][number];
  readonly publication: MuseumPublication;
}) {
  const works = (publication.works ?? []).filter(
    (work) =>
      work.projectId === project.id || project.workIds?.includes(work.id) === true
  );
  const artists = publication.artists.filter(
    (artist) =>
      project.artistIds?.includes(artist.id) === true ||
      artist.id === project.artistId
  );
  const organizations = publication.organizations?.filter((organization) =>
    project.organizationIds?.includes(organization.id) === true
  ) ?? [];
  const relations = buildMuseumProjectRelations(publication, project.slug);
  const context = buildMuseumEntityContext({
    kind: "project",
    id: project.id,
    label: project.title,
    canonicalHref: museumProjectHref(project.slug),
    breadcrumbs: [
      { label: "6529 Network Museum", href: "/museum/network" },
      { label: t(DEFAULT_LOCALE, "museum.network.projects.title"), href: "/museum/network/projects" },
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

  return (
    <article className="tw-min-w-0">
      <MuseumBreadcrumbs
        ariaLabel={t(DEFAULT_LOCALE, "museum.network.accessibility.breadcrumbs")}
        items={context.breadcrumbs}
      />
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">{t(DEFAULT_LOCALE, "museum.network.projects.project")}</p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-5xl">{project.title}</h1>
        <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
          {artists.map((artist, index) => (
            <span key={artist.id}>
              {index > 0 ? ", " : null}
              <Link href={museumArtistHref(artist.slug)} className="tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-200">{artist.preferredName}</Link>
            </span>
          ))}
        </p>
      </header>
      <MuseumEntityContext
        context={context}
        labels={{
          ariaLabel: t(DEFAULT_LOCALE, "museum.network.accessibility.entityContext"),
          source: t(DEFAULT_LOCALE, "museum.network.entity.sources"),
        }}
      />
      <section className="tw-mt-10" aria-labelledby="typed-project-works-title">
        <h2 id="typed-project-works-title" className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">{t(DEFAULT_LOCALE, "museum.network.projects.works")}</h2>
        <div className="tw-mt-6 tw-grid tw-gap-x-6 tw-gap-y-10 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
          {works.map((work) => {
            const media = work.media[0];
            return media ? (
              <MuseumPublicMediaFigure key={work.id} src={media.url} width={media.width} height={media.height} alt={media.altText ?? ""} href={museumWorkHref(work.id)} title={work.title} />
            ) : (
              <Link key={work.id} href={museumWorkHref(work.id)} className="tw-border-b tw-border-solid tw-border-iron-800 tw-py-4 tw-text-primary-300 tw-underline-offset-4 hover:tw-text-primary-200 hover:tw-underline">{work.title}</Link>
            );
          })}
        </div>
      </section>
      {documents.map((document) => (
        <section key={document.id} className="tw-mt-14 tw-max-w-4xl tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10">
          <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">{document.title}</h2>
          <MuseumMarkdown className="tw-mt-6" embeddedDocument sourceCommit={publication.identity.commit} sourcePath={document.sourcePath}>{document.markdown}</MuseumMarkdown>
        </section>
      ))}
      <MuseumRelatedEntities entities={[...context.secondaryRelations]} headingId="typed-project-related-title" title={t(DEFAULT_LOCALE, "museum.network.projects.related")} />
    </article>
  );
}

export async function generateMetadata({
  params,
}: MuseumProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const publicationState = await getMuseumPublicationState();
  const project = publicationState.publication?.projects.find(
    (item) => item.slug === slug
  );
  return getAppMetadata({
    title: project?.title ?? t(DEFAULT_LOCALE, "museum.network.projects.title"),
    description: t(DEFAULT_LOCALE, "museum.network.projects.description"),
  });
}

export default async function MuseumProjectPage({
  params,
}: MuseumProjectPageProps) {
  const { slug } = await params;
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const project = publicationState.publication.projects.find(
    (item) => item.slug === slug
  );
  if (project === undefined) {
    notFound();
  }
  if (publicationState.publication.works !== undefined) {
    return <TypedProjectPage project={project} publication={publicationState.publication} />;
  }
  const artist = publicationState.publication.artists.find(
    (item) => item.id === project.artistId
  );
  if (artist === undefined) {
    notFound();
  }
  const caseyArtworks = tryCaseyArtworksFromPublication(
    publicationState.publication
  );
  if (caseyArtworks === null) {
    return <MuseumPublicationUnavailable />;
  }
  const artworks = caseyArtworks.filter((artwork) =>
    project.artworkIds.includes(artwork.objectId)
  );
  const projectEssay = publicationState.publication.documents.find(
    (document) =>
      document.kind === "project_essay" &&
      document.projectIds.includes(project.id)
  );
  const sourceMatrix = publicationState.publication.documents.find(
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
          const href = museumWorkHrefForSourceId(
            publicationState.publication,
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
          sourceCommit={publicationState.publication.identity.commit}
          sourcePath={projectEssay.sourcePath}
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
