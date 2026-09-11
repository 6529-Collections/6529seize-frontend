import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import {
  InstitutionalPracticePublicationLine,
  institutionalPracticePublicationIsComplete,
  projectInstitutionalPracticeManuscript,
} from "@/components/museum/InstitutionalPracticeReadingRoom";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumResearchEditorialFigure } from "@/components/museum/research/MuseumResearchEditorialFigure";
import { MuseumResearchReading } from "@/components/museum/research/MuseumResearchReading";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { projectMuseumResearchReading } from "@/lib/museum/researchEditorialProjection";

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

export async function renderMuseumScholarshipAndWritingPage() {
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
  const selectedReading = projectMuseumResearchReading(projection.body, [
    "1. The Museum publishes arguments about art",
    "2. What substantive scholarship must achieve",
    "3. Evidence supports the argument",
    "3.1 Publish in layers",
    "3.2 State the condition of knowledge",
    "6. Close looking for born-digital and tokenized art",
    "8. Medium must be described at the level of the artwork",
    "12.1 Begin with the subject, not the institution",
    "12.3 Prefer verbs that identify action",
    "12.8 Finish without a slogan",
    "12.9 Edit for the audible sentence",
    "15. Acceptance test",
  ]);
  if (selectedReading === null) return <MuseumPublicationUnavailable />;

  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/research"
        prefetch={false}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.research.back")}
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
      <MuseumResearchEditorialFigure
        src="/museum/research/editorial/scholarship-and-writing-1600.webp"
        srcSet="/museum/research/editorial/scholarship-and-writing-800.webp 800w, /museum/research/editorial/scholarship-and-writing-1600.webp 1600w"
        width={1600}
        height={1911}
        alt="Johannes Vermeer's Woman Reading a Letter, circa 1663."
        credit="Johannes Vermeer, Woman Reading a Letter, c. 1663. Rijksmuseum. Public Domain Mark 1.0."
        sourceHref="https://www.rijksmuseum.nl/en/collection/object/Woman-Reading-a-Letter--8e9e02c8045362ffb2171b2fb52953ba"
      />
      <MuseumResearchReading
        selectedMarkdown={selectedReading}
        completeMarkdown={projection.body}
        sourceCommit={publication.identity.commit}
        sourcePath={document.sourcePath}
        selectedTitle={t(
          DEFAULT_LOCALE,
          "museum.network.research.publicWritingPrinciples"
        )}
        selectedDescription={t(
          DEFAULT_LOCALE,
          "museum.network.research.writingPrinciplesDescription"
        )}
        completeLabel={t(
          DEFAULT_LOCALE,
          "museum.network.research.completeStandard"
        )}
        completeDescription={t(
          DEFAULT_LOCALE,
          "museum.network.research.completeStandardDescription"
        )}
      />
      <div className="tw-mt-10 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6">
        <Link
          href="/museum/network/research/institutional-practice"
          prefetch={false}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(DEFAULT_LOCALE, "museum.network.institutionalPractice.readStudy")}
        </Link>
      </div>
    </article>
  );
}

export default function MuseumScholarshipAndWritingLegacyPage() {
  permanentRedirect("/museum/network/research/scholarship-and-writing");
}
