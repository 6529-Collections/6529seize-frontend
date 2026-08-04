import type { Metadata } from "next";
import Link from "next/link";
import {
  InstitutionalPracticeManuscript,
  InstitutionalPracticePublicationLine,
  institutionalPracticePublicationIsComplete,
  projectInstitutionalPracticeManuscript,
} from "@/components/museum/InstitutionalPracticeReadingRoom";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

export const metadata: Metadata = getAppMetadata({
  title: t(
    DEFAULT_LOCALE,
    "museum.network.institutionalPractice.editorialTitle"
  ),
  description: t(
    DEFAULT_LOCALE,
    "museum.network.institutionalPractice.editorialDescription"
  ),
});

export default async function MuseumScholarshipAndWritingPage() {
  const publicationState = await getMuseumPublicationState();
  const publication = publicationState.publication;
  if (!institutionalPracticePublicationIsComplete(publication)) {
    return <MuseumPublicationUnavailable />;
  }

  const document = publication.institutionalPractice.editorialStandard;
  const projection = projectInstitutionalPracticeManuscript(document.markdown);
  if (projection?.title !== document.title) {
    return <MuseumPublicationUnavailable />;
  }

  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/stories"
        prefetch={false}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(
          DEFAULT_LOCALE,
          "museum.network.institutionalPractice.backToStories"
        )}
      </Link>
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.institutionalPractice.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {projection.title}
        </h1>
        {projection.subtitle === null ? null : (
          <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-lg tw-leading-8 tw-text-iron-300">
            {projection.subtitle}
          </p>
        )}
        <InstitutionalPracticePublicationLine projection={projection} />
      </header>
      <div className="tw-mt-12 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-2">
        <InstitutionalPracticeManuscript
          projection={projection}
          sourceCommit={publication.identity.commit}
          sourcePath={document.sourcePath}
        />
      </div>
      <div className="tw-mt-10 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6">
        <Link
          href="/museum/network/stories/a-field-of-practice"
          prefetch={false}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(DEFAULT_LOCALE, "museum.network.institutionalPractice.readStudy")}
        </Link>
      </div>
    </article>
  );
}
