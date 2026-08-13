import type { Metadata } from "next";
import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import { MuseumRecordCard } from "@/components/museum/MuseumRecordCard";
import {
  MuseumSectionHeading,
  MuseumStatusBadge,
} from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";
import {
  isAdoptedGovernanceEffect,
  museumSlug,
} from "@/lib/museum/presentation";
import {
  displayGovernanceDecisionClass,
  displayGovernanceEffect,
} from "./presentation";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.governance.title"),
    description: t(DEFAULT_LOCALE, "museum.network.governance.description"),
  }),
  alternates: { canonical: "/museum/network/about/governance" },
};

export default async function MuseumAboutGovernancePage() {
  const view = await getMuseumView();
  return (
    <section>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.explore.governance")}
        title={t(DEFAULT_LOCALE, "museum.network.governance.title")}
        description={t(DEFAULT_LOCALE, "museum.network.governance.description")}
      />
      {view.governance.length === 0 ? (
        <p className="tw-m-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-5 tw-text-sm tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.governance.empty")}
        </p>
      ) : (
        <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
          {view.governance.map((decision) => {
            const adopted = isAdoptedGovernanceEffect(
              decision.governanceEffect
            );
            return (
              <MuseumRecordCard
                key={decision.decisionId}
                href={`/museum/network/about/governance/${museumSlug(decision.decisionId)}`}
                eyebrow={decision.decisionId}
                title={decision.title}
                description={displayGovernanceEffect(decision.governanceEffect)}
                meta={
                  decision.createdAt
                    ? formatDate(DEFAULT_LOCALE, decision.createdAt)
                    : undefined
                }
              >
                <div className="tw-flex tw-flex-wrap tw-gap-2">
                  <MuseumStatusBadge
                    label={
                      adopted
                        ? t(DEFAULT_LOCALE, "museum.network.governance.adopted")
                        : t(
                            DEFAULT_LOCALE,
                            "museum.network.governance.notAdopted"
                          )
                    }
                    tone={adopted ? "success" : "warning"}
                  />
                  <MuseumStatusBadge
                    label={displayGovernanceDecisionClass(
                      decision.decisionClass
                    )}
                  />
                </div>
              </MuseumRecordCard>
            );
          })}
        </div>
      )}
      <Link
        href="/museum/network/about"
        className="tw-mt-8 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.nav.about")}
      </Link>
    </section>
  );
}
