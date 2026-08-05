import type { Metadata } from "next";
import Link from "next/link";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";
import { projectSourceMatrixForVisitors } from "@/lib/museum/publication/sourceMatrixProjection";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.research.title"),
  description: t(DEFAULT_LOCALE, "museum.network.research.description"),
});

export default async function MuseumSourceAndChronologyPage() {
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = publicationState.publication;
  const sourceMatrix = publication.documents.find(
    (document) => document.kind === "source_chronology_matrix"
  );
  if (sourceMatrix === undefined) {
    return <MuseumPublicationUnavailable />;
  }
  const visitorResearch = projectSourceMatrixForVisitors(sourceMatrix.markdown);
  if (visitorResearch === null) {
    return <MuseumPublicationUnavailable />;
  }
  const sourceUrl = buildImmutableMuseumBlobUrl(
    publication.identity.commit,
    sourceMatrix.sourcePath
  );
  if (sourceUrl === null) {
    return <MuseumPublicationUnavailable />;
  }

  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/stories"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.research.backToStories")}
      </Link>
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.research.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {t(DEFAULT_LOCALE, "museum.network.research.title")}
        </h1>
        <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.research.description")}
        </p>
        <p className="tw-m-0 tw-mt-5 tw-text-xs tw-leading-5 tw-text-iron-500">
          {t(DEFAULT_LOCALE, "museum.network.research.verifiedAt", {
            commit: publication.identity.commit.slice(0, 12),
          })}{" "}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.research.completeSource")}
          </a>
        </p>
      </header>
      <section
        className="tw-mt-12 tw-max-w-5xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        aria-labelledby="museum-research-record-title"
      >
        <h2
          id="museum-research-record-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.research.recordHeading")}
        </h2>
        <MuseumMarkdown
          className="tw-mt-6"
          embeddedDocument
          sourceCommit={publication.identity.commit}
          sourcePath={sourceMatrix.sourcePath}
        >
          {visitorResearch}
        </MuseumMarkdown>
      </section>
    </article>
  );
}
