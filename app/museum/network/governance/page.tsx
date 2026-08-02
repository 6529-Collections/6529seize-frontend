import type { Metadata } from "next";
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
  statusTone,
} from "@/lib/museum/presentation";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.governance.title"),
  description: t(DEFAULT_LOCALE, "museum.network.governance.description"),
});

export default async function MuseumGovernancePage() {
  const view = await getMuseumView();

  return (
    <section>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.explore.governance")}
        title={t(DEFAULT_LOCALE, "museum.network.governance.title")}
        description={t(DEFAULT_LOCALE, "museum.network.governance.description")}
      />
      {view.governance.length === 0 ? (
        <p className="tw-m-0 tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5 tw-text-sm tw-text-iron-300">
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
                href={`/museum/network/governance/${museumSlug(decision.decisionId)}`}
                eyebrow={decision.decisionId}
                title={decision.title}
                description={decision.governanceEffect}
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
                    label={decision.decisionClass}
                    tone={statusTone(decision.observedWaveStatus)}
                  />
                </div>
              </MuseumRecordCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
