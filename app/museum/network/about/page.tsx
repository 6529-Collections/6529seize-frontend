import type { Metadata } from "next";
import Link from "next/link";
import { MuseumOpenMuseumStatement } from "@/components/museum/MuseumOpenMuseumStatement";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

const MUSEUM_OBLIGATIONS = [
  {
    title: "museum.network.mission.permanence.title",
    description: "museum.network.mission.permanence.description",
  },
  {
    title: "museum.network.mission.knowledge.title",
    description: "museum.network.mission.knowledge.description",
  },
  {
    title: "museum.network.mission.stewardship.title",
    description: "museum.network.mission.stewardship.description",
  },
  {
    title: "museum.network.mission.rights.title",
    description: "museum.network.mission.rights.description",
  },
] as const;

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.about.title"),
  description: t(DEFAULT_LOCALE, "museum.network.about.description"),
});

export default async function MuseumAboutPage() {
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const mission = publicationState.publication.documents.find(
    (document) => document.kind === "founding_principles"
  );
  const openMuseum = publicationState.publication.documents.find(
    (document) => document.kind === "open_museum_statement"
  );
  const transition = publicationState.publication.documents.find(
    (document) => document.kind === "onchain_transition"
  );
  if (
    mission === undefined ||
    openMuseum === undefined ||
    transition === undefined
  ) {
    return <MuseumPublicationUnavailable />;
  }
  const missionSourceUrl = buildImmutableMuseumBlobUrl(
    publicationState.publication.identity.commit,
    mission.sourcePath
  );

  return (
    <div>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.about.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.about.title")}
        description={t(DEFAULT_LOCALE, "museum.network.about.description")}
      />
      <section
        className="tw-mt-10 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
        aria-labelledby="museum-mission-title"
      >
        <h2
          id="museum-mission-title"
          className="tw-m-0 tw-mb-6 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.mission.title")}
        </h2>
        <p className="tw-m-0 tw-max-w-3xl tw-text-lg tw-leading-8 tw-text-iron-200">
          {t(DEFAULT_LOCALE, "museum.network.mission.description")}
        </p>
        <h3 className="tw-m-0 tw-mt-10 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.mission.obligations")}
        </h3>
        <div className="tw-mt-5 tw-grid tw-gap-x-10 tw-gap-y-7 sm:tw-grid-cols-2">
          {MUSEUM_OBLIGATIONS.map((obligation) => (
            <article
              key={obligation.title}
              className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5"
            >
              <h4 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
                {t(DEFAULT_LOCALE, obligation.title)}
              </h4>
              <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(DEFAULT_LOCALE, obligation.description)}
              </p>
            </article>
          ))}
        </div>
        {missionSourceUrl !== null ? (
          <a
            href={missionSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:tw-text-primary-200 tw-mt-7 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.mission.source")}
          </a>
        ) : null}
      </section>
      <MuseumOpenMuseumStatement
        commit={publicationState.publication.identity.commit}
        openMuseum={openMuseum}
        transition={transition}
      />
      <nav
        className="tw-mt-16 tw-grid tw-gap-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8 sm:tw-grid-cols-2"
        aria-label={t(DEFAULT_LOCALE, "museum.network.about.institutional")}
      >
        <Link
          href="/museum/network/governance"
          className="hover:tw-text-primary-200 tw-block tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-6 tw-text-iron-100 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          <span className="tw-block tw-text-lg tw-font-semibold">
            {t(DEFAULT_LOCALE, "museum.network.governance.title")}
          </span>
          <span className="tw-mt-2 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(DEFAULT_LOCALE, "museum.network.governance.description")}
          </span>
        </Link>
        <Link
          href="/museum/network/methodology"
          className="hover:tw-text-primary-200 tw-block tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-6 tw-text-iron-100 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          <span className="tw-block tw-text-lg tw-font-semibold">
            {t(DEFAULT_LOCALE, "museum.network.methodology.title")}
          </span>
          <span className="tw-mt-2 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(DEFAULT_LOCALE, "museum.network.methodology.description")}
          </span>
        </Link>
      </nav>
    </div>
  );
}
