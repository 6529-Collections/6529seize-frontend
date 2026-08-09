import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumBreadcrumbs } from "@/components/museum/MuseumBreadcrumbs";
import { MuseumEntityContext } from "@/components/museum/MuseumEntityContext";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  buildMuseumEntityContext,
} from "@/lib/museum/publication/ia";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { museumResearchHref } from "@/lib/museum/publication/routes";
import {
  buildMuseumResearchIndex,
  type MuseumResearchIndexEntry,
} from "../page";

interface MuseumResearchDetailProps {
  readonly params: Promise<{ slug: string }>;
}

async function findEntry(slug: string): Promise<{
  readonly entry: MuseumResearchIndexEntry;
  readonly publication: NonNullable<Awaited<ReturnType<typeof getMuseumPublicationState>>["publication"]>;
} | null> {
  const publication = (await getMuseumPublicationState()).publication;
  if (publication === null) return null;
  const entry = buildMuseumResearchIndex(publication).find(
    (candidate) => candidate.slug === slug
  );
  return entry === undefined ? null : { entry, publication };
}

export async function generateMetadata({
  params,
}: MuseumResearchDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const found = await findEntry(slug);
  return getAppMetadata({
    title: found?.entry.title ?? t(DEFAULT_LOCALE, "museum.network.research.indexTitle"),
    description: t(DEFAULT_LOCALE, "museum.network.research.indexDescription"),
  });
}

export default async function MuseumResearchDetailPage({
  params,
}: MuseumResearchDetailProps) {
  const { slug } = await params;
  const found = await findEntry(slug);
  if (found === null) notFound();
  const { entry, publication } = found;
  const context = buildMuseumEntityContext({
    kind: "research",
    id: entry.id,
    label: entry.title,
    canonicalHref: museumResearchHref(entry.slug),
    breadcrumbs: [
      { label: "6529 Network Museum", href: "/museum/network" },
      { label: t(DEFAULT_LOCALE, "museum.network.research.indexTitle"), href: "/museum/network/research" },
      { label: entry.title },
    ],
    primaryRelations: [],
    secondaryRelations: [],
    sourcePath: entry.sourcePath,
    sourceCommit: publication.identity.commit,
  });
  if (context === null) return <MuseumPublicationUnavailable />;

  return (
    <article className="tw-min-w-0">
      <MuseumBreadcrumbs
        ariaLabel={t(DEFAULT_LOCALE, "museum.network.accessibility.breadcrumbs")}
        items={context.breadcrumbs}
      />
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">{t(DEFAULT_LOCALE, "museum.network.research.detailEyebrow")}</p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-5xl">{entry.title}</h1>
      </header>
      <MuseumEntityContext
        context={context}
        labels={{
          ariaLabel: t(DEFAULT_LOCALE, "museum.network.accessibility.entityContext"),
          source: t(DEFAULT_LOCALE, "museum.network.entity.sources"),
        }}
      />
      {entry.document ? (
        <MuseumMarkdown className="tw-mt-10 tw-max-w-4xl" embeddedDocument sourceCommit={publication.identity.commit} sourcePath={entry.document.sourcePath}>
          {entry.document.markdown}
        </MuseumMarkdown>
      ) : null}
      {!entry.document && entry.publicationUri ? (
        <p className="tw-mt-10 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.research.typedRecordDescription")} {" "}
          <a href={entry.publicationUri} target="_blank" rel="noopener noreferrer" className="tw-text-primary-300 tw-underline tw-underline-offset-4">{t(DEFAULT_LOCALE, "museum.network.research.openPublication")}</a>.
        </p>
      ) : null}
      <Link href="/museum/network/research" className="tw-mt-8 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4">{t(DEFAULT_LOCALE, "museum.network.research.back")}</Link>
    </article>
  );
}
