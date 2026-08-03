import type { Metadata } from "next";
import Link from "next/link";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

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

  return (
    <div>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.about.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.about.title")}
        description={t(DEFAULT_LOCALE, "museum.network.about.description")}
      />
      <section className="tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8">
        {mission ? (
          <MuseumMarkdown
            sourceCommit={publicationState.publication.identity.commit}
            sourcePath={mission.sourcePath}
          >
            {mission.markdown}
          </MuseumMarkdown>
        ) : (
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-yellow-100">
            {t(DEFAULT_LOCALE, "museum.network.mission.empty")}
          </p>
        )}
      </section>
      <nav
        className="tw-mt-14 tw-grid tw-gap-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8 sm:tw-grid-cols-2"
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
