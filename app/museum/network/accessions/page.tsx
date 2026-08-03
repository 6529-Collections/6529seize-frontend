import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { MuseumRecordCard } from "@/components/museum/MuseumRecordCard";
import {
  MuseumSectionHeading,
  MuseumStatusBadge,
} from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";
import {
  displayMuseumStatus,
  museumSlug,
  statusTone,
} from "@/lib/museum/presentation";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.accessions.title"),
  description: t(DEFAULT_LOCALE, "museum.network.accessions.description"),
});

export default async function MuseumAccessionsPage() {
  const view = await getMuseumView();

  return (
    <section aria-labelledby="museum-accessions-title">
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.explore.accessions")}
        title={t(DEFAULT_LOCALE, "museum.network.accessions.title")}
        description={t(DEFAULT_LOCALE, "museum.network.accessions.description")}
      />
      {view.accessions.length === 0 ? (
        <p className="tw-m-0 tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5 tw-text-sm tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.accessions.empty")}
        </p>
      ) : (
        <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
          {view.accessions.map((lot) => (
            <MuseumRecordCard
              key={lot.accessionLotId}
              href={`/museum/network/accessions/${museumSlug(lot.accessionLotId)}`}
              eyebrow={lot.accessionLotId}
              title={lot.preferredTitle}
              description={lot.donorPublicCredit ?? undefined}
              meta={lot.sourcePath}
            >
              <div className="tw-flex tw-flex-wrap tw-gap-2">
                <MuseumStatusBadge
                  label={displayMuseumStatus(lot.donationStatus)}
                  tone={statusTone(lot.donationStatus)}
                />
                <MuseumStatusBadge
                  label={displayMuseumStatus(lot.accessionStatus)}
                  tone={statusTone(lot.accessionStatus)}
                />
              </div>
            </MuseumRecordCard>
          ))}
        </div>
      )}
    </section>
  );
}
