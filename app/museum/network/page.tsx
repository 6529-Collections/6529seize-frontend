import Link from "next/link";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import {
  MuseumMetric,
  MuseumSectionHeading,
} from "@/components/museum/MuseumShell";
import { MuseumRecordCard } from "@/components/museum/MuseumRecordCard";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";

const exploreCards = [
  [
    "museum.network.explore.collections",
    "museum.network.explore.collectionsDescription",
    "/museum/network/collections",
  ],
  [
    "museum.network.explore.accessions",
    "museum.network.explore.accessionsDescription",
    "/museum/network/accessions",
  ],
  [
    "museum.network.explore.programs",
    "museum.network.explore.programsDescription",
    "/museum/network/programs",
  ],
  [
    "museum.network.explore.governance",
    "museum.network.explore.governanceDescription",
    "/museum/network/governance",
  ],
  [
    "museum.network.explore.methodology",
    "museum.network.explore.methodologyDescription",
    "/museum/network/methodology",
  ],
] as const;

export default async function MuseumNetworkPage() {
  const view = await getMuseumView();
  const mission = view.mission;

  return (
    <div className="tw-space-y-14">
      <section
        aria-labelledby="museum-mission-title"
        className="tw-grid tw-gap-8 lg:tw-grid-cols-[1.35fr_0.65fr] lg:tw-items-end"
      >
        <div>
          <MuseumSectionHeading
            eyebrow={t(DEFAULT_LOCALE, "museum.network.mission.eyebrow")}
            title={t(DEFAULT_LOCALE, "museum.network.mission.title")}
            description={t(DEFAULT_LOCALE, "museum.network.description")}
          />
          {mission ? (
            <div className="tw-max-w-3xl">
              <h2 id="museum-mission-title" className="tw-sr-only">
                {mission.title}
              </h2>
              <MuseumMarkdown>{mission.markdown}</MuseumMarkdown>
            </div>
          ) : (
            <p className="tw-m-0 tw-text-sm tw-text-iron-400">
              {t(DEFAULT_LOCALE, "museum.network.mission.empty")}
            </p>
          )}
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-4 lg:tw-grid-cols-2">
          <MuseumMetric
            value={`${view.approvedCollections.length}`}
            label={t(DEFAULT_LOCALE, "museum.network.stat.collections")}
          />
          <MuseumMetric
            value={`${view.accessions.length}`}
            label={t(DEFAULT_LOCALE, "museum.network.stat.accessions")}
          />
          <MuseumMetric
            value={`${view.programs.length}`}
            label={t(DEFAULT_LOCALE, "museum.network.stat.programs")}
          />
          <MuseumMetric
            value={`${view.governance.length}`}
            label={t(DEFAULT_LOCALE, "museum.network.stat.decisions")}
          />
        </div>
      </section>

      <section aria-labelledby="museum-explore-title">
        <MuseumSectionHeading
          eyebrow={t(DEFAULT_LOCALE, "museum.network.explore.eyebrow")}
          title={t(DEFAULT_LOCALE, "museum.network.explore.title")}
          description={t(
            DEFAULT_LOCALE,
            "museum.network.methodology.description"
          )}
        />
        <div className="tw-grid tw-gap-4 md:tw-grid-cols-2 xl:tw-grid-cols-3">
          {exploreCards.map(([titleKey, descriptionKey, href]) => (
            <MuseumRecordCard
              key={href}
              href={href}
              title={t(DEFAULT_LOCALE, titleKey)}
              description={t(DEFAULT_LOCALE, descriptionKey)}
              meta={t(DEFAULT_LOCALE, "museum.network.detail.readRecord")}
            />
          ))}
        </div>
      </section>

      <section
        className="tw-rounded-2xl tw-border tw-border-primary-400/20 tw-bg-primary-500/5 tw-p-6 sm:tw-p-8"
        aria-labelledby="museum-reading-title"
      >
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.detail.technicalEvidence")}
        </p>
        <h2
          id="museum-reading-title"
          className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-text-white"
        >
          {t(DEFAULT_LOCALE, "museum.network.methodology.title")}
        </h2>
        <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.methodology.description")}
        </p>
        <Link
          href="/museum/network/methodology"
          className="tw-text-primary-200 hover:tw-border-primary-200 tw-mt-5 tw-inline-flex tw-min-h-10 tw-items-center tw-rounded-lg tw-border tw-border-primary-300/40 tw-px-4 tw-text-sm tw-font-semibold tw-no-underline hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
        >
          {t(DEFAULT_LOCALE, "museum.network.detail.openTechnicalEvidence")}
        </Link>
      </section>
    </div>
  );
}
