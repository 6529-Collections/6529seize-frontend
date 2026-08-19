import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import {
  DataArchitectureProfileDisclosure,
  dataArchitecturePublicationIsComplete,
} from "@/components/museum/DataArchitectureReadingRoom";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumResearchEditorialFigure } from "@/components/museum/research/MuseumResearchEditorialFigure";
import { MuseumResearchReading } from "@/components/museum/research/MuseumResearchReading";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { projectMuseumResearchReading } from "@/lib/museum/researchEditorialProjection";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.dataArchitecture.title"),
  description: t(DEFAULT_LOCALE, "museum.network.dataArchitecture.description"),
});

export async function renderMuseumDataArchitecturePage() {
  const state = await getMuseumPublicationState();
  const publication = state.publication;
  if (!dataArchitecturePublicationIsComplete(publication)) {
    return <MuseumPublicationUnavailable />;
  }
  const architecture = publication.dataArchitecture;
  const selectedReading = projectMuseumResearchReading(
    architecture.introduction.markdown,
    [
      "Eleven questions, eleven standards and vocabularies",
      "One artwork through the architecture",
      "The Museum's core entities",
      "Distinctions the Museum keeps",
      "Current Casey Reas implementation",
      "Education is part of stewardship",
    ]
  );
  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/research"
        prefetch={false}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.research.back")}
      </Link>
      <header className="tw-mt-6 tw-max-w-5xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.dataArchitecture.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-[2rem] tw-font-semibold tw-leading-[1.08] tw-tracking-tight tw-text-iron-50 sm:tw-text-[2.75rem]">
          {architecture.title}
        </h1>
        <p className="tw-m-0 tw-mt-5 tw-inline-flex tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-200">
          {t(DEFAULT_LOCALE, "museum.network.research.workingStandardStatus")}
        </p>
        <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-lg tw-leading-8 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.dataArchitecture.standfirst")}
        </p>
      </header>
      <MuseumResearchEditorialFigure
        src="/museum/research/editorial/data-architecture-1600.webp"
        srcSet="/museum/research/editorial/data-architecture-800.webp 800w, /museum/research/editorial/data-architecture-1600.webp 1600w"
        width={1600}
        height={1084}
        alt="Pieter Jansz. Saenredam's measured ground plan of the Church of Saint John in 's-Hertogenbosch."
        credit="Pieter Jansz. Saenredam, Groundplan of the Church of Saint John in 's-Hertogenbosch, 1632. The Metropolitan Museum of Art. Public Domain."
        sourceHref="https://www.metmuseum.org/art/collection/search/419541"
      />
      <MuseumResearchReading
        {...(selectedReading === null
          ? {}
          : { selectedMarkdown: selectedReading })}
        completeMarkdown={architecture.introduction.markdown}
        sourceCommit={publication.identity.commit}
        sourcePath={architecture.introduction.sourcePath}
        selectedTitle={t(
          DEFAULT_LOCALE,
          "museum.network.research.selectedReading"
        )}
        selectedDescription={t(
          DEFAULT_LOCALE,
          "museum.network.research.dataReadingDescription"
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
      <section className="tw-mt-12 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8">
        <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
          {t(DEFAULT_LOCALE, "museum.network.dataArchitecture.profileTitle")}
        </h2>
        <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "museum.network.dataArchitecture.profileDescription"
          )}
        </p>
        <div className="tw-mt-5">
          <DataArchitectureProfileDisclosure publication={publication} />
        </div>
      </section>
    </article>
  );
}

export default function MuseumDataArchitectureLegacyPage() {
  permanentRedirect("/museum/network/research/data-architecture");
}
