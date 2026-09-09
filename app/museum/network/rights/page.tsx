import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumResearchEditorialFigure } from "@/components/museum/research/MuseumResearchEditorialFigure";
import { MuseumResearchReading } from "@/components/museum/research/MuseumResearchReading";
import {
  MuseumRightsDirectory,
  MuseumRightsGuideCards,
} from "@/components/museum/MuseumRightsReadingRoom";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { projectMuseumResearchReading } from "@/lib/museum/researchEditorialProjection";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.rights.title"),
  description: t(DEFAULT_LOCALE, "museum.network.rights.description"),
});

export async function renderMuseumRightsPage() {
  const publicationState = await getMuseumPublicationState();
  const publication = publicationState.publication;
  if (publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const { rightsHandbook } = publication;
  const selectedReading = projectMuseumResearchReading(
    rightsHandbook.introduction.markdown,
    [
      "Copyright in brief",
      "Two useful starting points",
      "Buying the artwork usually does not buy its copyright",
      "The public domain is where much of art history lives",
      "The token and the work",
      "Four questions to ask",
      "Who owns the relevant right?",
      "What exactly is covered?",
      "What permission applies?",
      "What else remains?",
      "A practical route through the handbook",
    ]
  );
  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/research"
        prefetch={false}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.rights.backToResearch")}
      </Link>
      <header className="tw-mt-6 tw-max-w-5xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.rights.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-max-w-4xl tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {rightsHandbook.introduction.title}
        </h1>
        <p className="tw-m-0 tw-mt-6 tw-max-w-4xl tw-text-lg tw-leading-8 tw-text-iron-200">
          {t(DEFAULT_LOCALE, "museum.network.rights.description")}
        </p>
      </header>
      <MuseumResearchEditorialFigure
        src="/museum/research/editorial/rights-1600.webp"
        srcSet="/museum/research/editorial/rights-800.webp 800w, /museum/research/editorial/rights-1600.webp 1600w"
        width={1600}
        height={1309}
        alt="Printmakers at work in an eighteenth-century intaglio workshop."
        credit="Pellegrino dal Colle after Francesco Maggiotto, The Printmaking Workshop, 1750–1800. The Metropolitan Museum of Art. Public Domain."
        sourceHref="https://www.metmuseum.org/art/collection/search/415528"
      />
      <MuseumResearchReading
        {...(selectedReading === null
          ? {}
          : { selectedMarkdown: selectedReading })}
        completeMarkdown={rightsHandbook.introduction.markdown}
        sourceCommit={publication.identity.commit}
        sourcePath={rightsHandbook.introduction.sourcePath}
        selectedTitle={t(
          DEFAULT_LOCALE,
          "museum.network.research.rightsQuestions"
        )}
        selectedDescription={t(
          DEFAULT_LOCALE,
          "museum.network.research.rightsReadingDescription"
        )}
        completeLabel={t(
          DEFAULT_LOCALE,
          "museum.network.research.completeGuide"
        )}
        completeDescription={t(
          DEFAULT_LOCALE,
          "museum.network.research.completeGuideDescription"
        )}
      />
      <MuseumRightsGuideCards handbook={rightsHandbook} />
      <details className="tw-group tw-mt-14 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-1">
        <summary className="hover:tw-text-primary-200 tw-flex tw-min-h-16 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-py-4 tw-text-base tw-font-semibold tw-text-primary-300 marker:tw-hidden focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 [&::-webkit-details-marker]:tw-hidden">
          <span
            role="heading"
            aria-level={2}
            className="tw-text-base tw-font-semibold tw-text-primary-300"
          >
            {t(DEFAULT_LOCALE, "museum.network.research.openRightsDirectory")}
          </span>
          <span
            aria-hidden="true"
            className="tw-text-xl tw-text-iron-400 group-open:tw-rotate-45"
          >
            +
          </span>
        </summary>
        <MuseumRightsDirectory handbook={rightsHandbook} />
      </details>
    </article>
  );
}

export default function MuseumRightsLegacyPage() {
  permanentRedirect("/museum/network/research/rights");
}
