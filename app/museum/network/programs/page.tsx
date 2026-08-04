import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { MuseumRecordCard } from "@/components/museum/MuseumRecordCard";
import {
  MuseumSectionHeading,
  MuseumStatusBadge,
} from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import { getMuseumView } from "@/lib/museum/normalize";
import {
  displayMuseumStatus,
  museumSlug,
  statusTone,
} from "@/lib/museum/presentation";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.programs.title"),
  description: t(DEFAULT_LOCALE, "museum.network.programs.description"),
});

export default async function MuseumProgramsPage() {
  const view = await getMuseumView();

  return (
    <section>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.explore.programs")}
        title={t(DEFAULT_LOCALE, "museum.network.programs.title")}
        description={t(DEFAULT_LOCALE, "museum.network.programs.description")}
      />
      {view.programs.length === 0 ? (
        <p className="tw-m-0 tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5 tw-text-sm tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.programs.empty")}
        </p>
      ) : (
        <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
          {view.programs.map((program) => (
            <MuseumRecordCard
              key={program.programId}
              href={`/museum/network/programs/${museumSlug(program.programId)}`}
              eyebrow={program.programId}
              title={program.title}
              description={program.subtitle || program.curatorialFrame}
              meta={t(
                DEFAULT_LOCALE,
                "museum.network.programs.selectedWorksCount",
                {
                  count: formatInteger(
                    DEFAULT_LOCALE,
                    program.selectedWorks.length
                  ),
                }
              )}
            >
              <MuseumStatusBadge
                label={displayMuseumStatus(program.status)}
                tone={statusTone(program.status)}
              />
            </MuseumRecordCard>
          ))}
        </div>
      )}
    </section>
  );
}
