import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumBreadcrumbs } from "@/components/museum/MuseumBreadcrumbs";
import { MuseumEntityContext } from "@/components/museum/MuseumEntityContext";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumRelatedEntities } from "@/components/museum/MuseumRelatedEntities";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { buildMuseumEntityContext } from "@/lib/museum/publication/ia";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import {
  museumOrganizationHref,
  museumProjectHref,
} from "@/lib/museum/publication/routes";

interface MuseumOrganizationPageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MuseumOrganizationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const organization = (
    await getMuseumPublicationState()
  ).publication?.organizations?.find((candidate) => candidate.slug === slug);
  const metadata = getAppMetadata({
    title:
      organization?.preferredName ??
      t(DEFAULT_LOCALE, "museum.network.organizations.title"),
    description: t(DEFAULT_LOCALE, "museum.network.organizations.description"),
  });
  return organization === undefined
    ? metadata
    : {
        ...metadata,
        alternates: { canonical: museumOrganizationHref(organization.slug) },
      };
}

export default async function MuseumOrganizationPage({
  params,
}: MuseumOrganizationPageProps) {
  const { slug } = await params;
  const publication = (await getMuseumPublicationState()).publication;
  if (publication?.organizations === undefined) {
    return <MuseumPublicationUnavailable />;
  }
  const organization = publication.organizations.find(
    (candidate) => candidate.slug === slug
  );
  if (organization === undefined) notFound();
  const projects = publication.projects.filter(
    (project) =>
      organization.projectIds.includes(project.id) ||
      project.organizationIds?.includes(organization.id) === true
  );
  const context = buildMuseumEntityContext({
    kind: "organization",
    id: organization.id,
    label: organization.preferredName,
    canonicalHref: museumOrganizationHref(organization.slug),
    breadcrumbs: [
      { label: "6529 Network Museum", href: "/museum/network" },
      {
        label: t(DEFAULT_LOCALE, "museum.network.organizations.title"),
        href: "/museum/network/organizations",
      },
      { label: organization.preferredName },
    ],
    primaryRelations: projects.map((project) => ({
      kind: "project" as const,
      id: project.id,
      label: project.title,
      href: museumProjectHref(project.slug),
      relation: "Originates",
      ...(project.sourcePaths[0] ? { sourcePath: project.sourcePaths[0] } : {}),
      sourceCommit: publication.identity.commit,
    })),
    secondaryRelations: [],
    sourcePath: organization.sourcePaths[0] ?? null,
    sourceCommit: publication.identity.commit,
  });
  if (context === null) return <MuseumPublicationUnavailable />;

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
          {t(DEFAULT_LOCALE, "museum.network.organizations.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-5xl">
          {organization.preferredName}
        </h1>
        <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.organizations.detailDescription")}
        </p>
      </header>
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
      <section
        className="tw-mt-10"
        aria-labelledby="organization-projects-title"
      >
        <h2
          id="organization-projects-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.organizations.projects")}
        </h2>
        <ul className="tw-m-0 tw-mt-5 tw-list-none tw-border-y tw-border-solid tw-border-iron-800 tw-p-0">
          {projects.map((project) => (
            <li
              key={project.id}
              className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 last:tw-border-b-0"
            >
              <Link
                href={museumProjectHref(project.slug)}
                className="hover:tw-text-primary-200 tw-flex tw-min-h-16 tw-items-center tw-justify-between tw-gap-4 tw-py-4 tw-text-base tw-font-semibold tw-text-iron-100 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
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
        entities={context.primaryRelations}
        headingId="organization-related-title"
        title={t(DEFAULT_LOCALE, "museum.network.organizations.related")}
      />
    </article>
  );
}
