import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import { MuseumJsonDisclosure } from "@/components/museum/MuseumMarkdown";
import { MuseumRecordCard } from "@/components/museum/MuseumRecordCard";
import {
  MuseumSectionHeading,
  MuseumStatusBadge,
} from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";
import { buildMuseumRawUrl } from "@/lib/museum/source";
import {
  displayMuseumStatus,
  museumSlug,
  statusTone,
} from "@/lib/museum/presentation";

interface ProgramDetailProps {
  readonly params: Promise<{ programId: string }>;
}

export async function generateMetadata({
  params,
}: ProgramDetailProps): Promise<Metadata> {
  const { programId } = await params;
  const view = await getMuseumView();
  const program = view.programs.find(
    (item) => museumSlug(item.programId) === programId
  );
  return getAppMetadata({
    title: program?.title ?? t(DEFAULT_LOCALE, "museum.network.programs.title"),
    description:
      program?.subtitle ??
      t(DEFAULT_LOCALE, "museum.network.programs.description"),
  });
}

export default async function MuseumProgramDetailPage({
  params,
}: ProgramDetailProps) {
  const { programId } = await params;
  const view = await getMuseumView();
  const program = view.programs.find(
    (item) => museumSlug(item.programId) === programId
  );
  if (!program) notFound();

  return (
    <article>
      <Link
        href="/museum/network/programs"
        className="hover:tw-text-primary-200 tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.programs.detail.back")}
      </Link>
      <div className="tw-mt-8">
        <MuseumSectionHeading
          eyebrow={program.programId}
          title={program.title}
          description={program.subtitle || program.curatorialFrame}
        />
        <MuseumStatusBadge
          label={displayMuseumStatus(program.status)}
          tone={statusTone(program.status)}
        />
      </div>
      {program.curatorialFrame && (
        <p className="tw-mt-6 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-200">
          {program.curatorialFrame}
        </p>
      )}
      <section
        className="tw-mt-8"
        aria-labelledby="program-selected-works-title"
      >
        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
          <h2
            id="program-selected-works-title"
            className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
          >
            {t(DEFAULT_LOCALE, "museum.network.programs.detail.selectedWorks")}
          </h2>
          <p className="tw-m-0 tw-text-xs tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.programs.detail.selectionNote")}
          </p>
        </div>
        <div className="tw-mt-4 tw-grid tw-gap-4 md:tw-grid-cols-2 xl:tw-grid-cols-3">
          {program.selectedWorks.map((work) => (
            <MuseumRecordCard
              key={work.recordId}
              href={`/museum/network/objects/${museumSlug(work.recordId)}`}
              eyebrow={work.recordId}
              title={work.title}
              description={work.artist}
              meta={work.outcomePath ?? undefined}
            >
              <MuseumStatusBadge
                label={displayMuseumStatus(work.status)}
                tone={statusTone(work.status)}
              />
            </MuseumRecordCard>
          ))}
        </div>
      </section>
      <div className="tw-mt-8 tw-grid tw-gap-4 lg:tw-grid-cols-2">
        {program.rules.length > 0 && (
          <section className="tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5">
            <h2 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white">
              {t(DEFAULT_LOCALE, "museum.network.programs.rules")}
            </h2>
            <ul className="tw-m-4 tw-mb-0 tw-list-disc tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300">
              {program.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        )}
        {program.nonClaims.length > 0 && (
          <section className="tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5">
            <h2 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white">
              {t(DEFAULT_LOCALE, "museum.network.programs.nonClaims")}
            </h2>
            <ul className="tw-m-4 tw-mb-0 tw-list-disc tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300">
              {program.nonClaims.map((claim) => (
                <li key={claim}>{claim}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <div className="tw-mt-6">
        <MuseumJsonDisclosure
          label={t(DEFAULT_LOCALE, "museum.network.detail.technicalEvidence")}
          value={program}
        />
      </div>
      <p className="tw-mt-4 tw-text-xs tw-text-iron-500">
        <a
          href={buildMuseumRawUrl(program.sourcePath)}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-underline tw-underline-offset-4 hover:tw-text-iron-300"
        >
          {t(DEFAULT_LOCALE, "museum.network.detail.sourceRecord")}
        </a>
      </p>
    </article>
  );
}
