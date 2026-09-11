import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumResearchEditorialFigure } from "@/components/museum/research/MuseumResearchEditorialFigure";
import { MuseumResearchReading } from "@/components/museum/research/MuseumResearchReading";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";
import { projectSourceMatrixForVisitors } from "@/lib/museum/publication/sourceMatrixProjection";
import { projectMuseumResearchReading } from "@/lib/museum/researchEditorialProjection";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.research.title"),
  description: t(DEFAULT_LOCALE, "museum.network.research.description"),
});

export async function renderMuseumSourceAndChronologyPage() {
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
  const selectedReading = projectMuseumResearchReading(visitorResearch, [
    "2. Canonical accession facts",
    "6. Chronology of life, practice, tools, and institutions",
    "9. Conflicts, naming problems, and distinctions to preserve",
    "9.1 Phototaxis date",
    "9.2 923 versus 924",
    "9.7 Artist name typography",
    "9.9 Token, artwork, image, code",
  ]);
  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/research"
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
      <MuseumResearchEditorialFigure
        src="/museum/research/editorial/sources-and-chronology-1600.webp"
        srcSet="/museum/research/editorial/sources-and-chronology-800.webp 800w, /museum/research/editorial/sources-and-chronology-1600.webp 1600w"
        width={1218}
        height={1600}
        alt="A scholar studies a luminous diagram among papers and books."
        credit="Rembrandt van Rijn, A Scholar in His Study ('Faust'), c. 1652. The Metropolitan Museum of Art. Public Domain."
        sourceHref="https://www.metmuseum.org/art/collection/search/373045"
      />
      <MuseumResearchReading
        {...(selectedReading === null
          ? {}
          : { selectedMarkdown: selectedReading })}
        completeMarkdown={visitorResearch}
        sourceCommit={publication.identity.commit}
        sourcePath={sourceMatrix.sourcePath}
        selectedTitle={t(
          DEFAULT_LOCALE,
          "museum.network.research.recordHeading"
        )}
        selectedDescription={t(
          DEFAULT_LOCALE,
          "museum.network.research.sourceReadingDescription"
        )}
        completeLabel={t(
          DEFAULT_LOCALE,
          "museum.network.research.completeSourceRecord"
        )}
        completeDescription={t(
          DEFAULT_LOCALE,
          "museum.network.research.completeSourceRecordDescription"
        )}
      />
    </article>
  );
}

export default function MuseumSourceAndChronologyLegacyPage() {
  permanentRedirect("/museum/network/research/sources-and-chronology");
}
