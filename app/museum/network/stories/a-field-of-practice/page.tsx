import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import {
  InstitutionalPracticeDirectory,
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
  title: t(DEFAULT_LOCALE, "museum.network.institutionalPractice.title"),
  description: t(
    DEFAULT_LOCALE,
    "museum.network.institutionalPractice.description"
  ),
});

export async function renderMuseumInstitutionalPracticePage() {
  const publicationState = await getMuseumPublicationState();
  const publication = publicationState.publication;
  if (!institutionalPracticePublicationIsComplete(publication)) {
    return <MuseumPublicationUnavailable />;
  }

  const document = publication.institutionalPractice.introduction;
  const projection = projectInstitutionalPracticeManuscript(document.markdown);
  if (projection?.title !== document.title) {
    return <MuseumPublicationUnavailable />;
  }
  const selectedReading = projectMuseumResearchReading(projection.body, [
    "Overview",
    "Thematic pathways",
    "1. Work, interface, and access",
    "2. Preservation, reconstruction, and technical care",
    "3. Records, archives, and public data",
    "Working lessons",
    "Describe the encounter before the interpretation",
    "Publish loss and missingness",
    "Connect the object to its research paths",
    "Keep revisions visible",
  ]);
  if (selectedReading === null) return <MuseumPublicationUnavailable />;
  const labelledSelectedReading = selectedReading
    .replace(
      /^## Thematic pathways$/m,
      "## Selected thematic pathways"
    )
    .replace(/^## Working lessons$/m, "## Selected working lessons");

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
          {t(DEFAULT_LOCALE, "museum.network.institutionalPractice.title")}
        </h1>
        {projection.subtitle === null ? null : (
          <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-lg tw-leading-8 tw-text-iron-300">
            {projection.subtitle}
          </p>
        )}
        <InstitutionalPracticePublicationLine projection={projection} />
      </header>

      <MuseumResearchEditorialFigure
        src="/museum/research/editorial/museums-to-learn-1600.webp"
        srcSet="/museum/research/editorial/museums-to-learn-800.webp 800w, /museum/research/editorial/museums-to-learn-1600.webp 1600w"
        width={1600}
        height={1275}
        alt="Visitors in the Gallery of Art in the Smithsonian Institution Building in 1857."
        credit="United States National Museum Photographic Laboratory, Gallery of Art, Smithsonian Institution Building, 1857 (copied in the 1950s); the source mount labels the depicted gallery ‘ca. 1860.’ Smithsonian Institution Archives. CC0."
        sourceHref="https://siarchives.si.edu/collections/siris_arc_401640"
      />

      <MuseumResearchReading
        selectedMarkdown={labelledSelectedReading}
        completeMarkdown={projection.body}
        sourceCommit={publication.identity.commit}
        sourcePath={document.sourcePath}
        selectedTitle={t(
          DEFAULT_LOCALE,
          "museum.network.research.selectedReading"
        )}
        selectedDescription={t(
          DEFAULT_LOCALE,
          "museum.network.research.institutionalReadingDescription"
        )}
        completeLabel={t(
          DEFAULT_LOCALE,
          "museum.network.research.completeStudy"
        )}
        completeDescription={t(
          DEFAULT_LOCALE,
          "museum.network.research.completeStudyDescription"
        )}
      />

      <section
        className="tw-mt-14 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        aria-labelledby="institutional-practice-directory-title"
      >
        <div className="tw-max-w-4xl">
          <h2
            id="institutional-practice-directory-title"
            className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50"
          >
            {t(
              DEFAULT_LOCALE,
              "museum.network.institutionalPractice.directoryTitle"
            )}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "museum.network.institutionalPractice.directoryDescription"
            )}
          </p>
        </div>
        <details className="tw-group tw-mt-7 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-1">
          <summary className="hover:tw-text-primary-200 tw-flex tw-min-h-16 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-py-4 tw-text-base tw-font-semibold tw-text-primary-300 marker:tw-hidden focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 [&::-webkit-details-marker]:tw-hidden">
            <span>
              {t(
                DEFAULT_LOCALE,
                "museum.network.research.openInstitutionDirectory"
              )}
            </span>
            <span
              aria-hidden="true"
              className="tw-text-xl tw-text-iron-400 group-open:tw-rotate-45"
            >
              +
            </span>
          </summary>
          <InstitutionalPracticeDirectory
            practice={publication.institutionalPractice}
          />
        </details>
      </section>

      <nav
        aria-label={t(
          DEFAULT_LOCALE,
          "museum.network.institutionalPractice.researchApparatus"
        )}
        className="tw-mt-12 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6"
      >
        <Link
          href="/museum/network/research/institutional-practice/adjacent-practice"
          prefetch={false}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(
            DEFAULT_LOCALE,
            "museum.network.institutionalPractice.readAdjacentPractice"
          )}
        </Link>
        <Link
          href="/museum/network/research/scholarship-and-writing"
          prefetch={false}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(
            DEFAULT_LOCALE,
            "museum.network.institutionalPractice.readEditorialStandard"
          )}
        </Link>
        <Link
          href="/museum/network/research/institutional-practice/sources"
          prefetch={false}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(
            DEFAULT_LOCALE,
            "museum.network.institutionalPractice.readSourceRegister"
          )}
        </Link>
      </nav>
    </article>
  );
}

export default function MuseumInstitutionalPracticeLegacyPage() {
  permanentRedirect("/museum/network/research/institutional-practice");
}
