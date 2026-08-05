import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import {
  MuseumJsonDisclosure,
  MuseumMarkdown,
} from "@/components/museum/MuseumMarkdown";
import { MuseumRecordCard } from "@/components/museum/MuseumRecordCard";
import {
  MuseumSectionHeading,
  MuseumStatusBadge,
} from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import { KEYS_AND_GATES_PROGRAM_ID } from "@/lib/museum/constants";
import { getMuseumView } from "@/lib/museum/normalize";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";
import { buildMuseumRawUrl } from "@/lib/museum/source";
import {
  displayMuseumStatus,
  museumSlug,
  museumSlugMatches,
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
  const program = view.programs.find((item) =>
    museumSlugMatches(item.programId, programId)
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
  const [view, publicationState] = await Promise.all([
    getMuseumView(),
    getMuseumPublicationState(),
  ]);
  const program = view.programs.find((item) =>
    museumSlugMatches(item.programId, programId)
  );
  if (!program) notFound();
  const isKeysAndGates = program.programId === KEYS_AND_GATES_PROGRAM_ID;
  const programEssay = isKeysAndGates
    ? view.methodology.find(
        (document) => document.path === "docs/programs/keys-and-gates.md"
      )
    : undefined;
  const sourceCommit = publicationState.publication?.identity.commit ?? null;
  const programSourceHref =
    sourceCommit === null
      ? buildMuseumRawUrl(program.sourcePath)
      : (buildImmutableMuseumBlobUrl(sourceCommit, program.sourcePath) ??
        buildMuseumRawUrl(program.sourcePath));
  const selectionPlaceMessageKey = isKeysAndGates
    ? "museum.network.programs.detail.winnerPlace"
    : "museum.network.programs.detail.selectionPlace";

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
      {isKeysAndGates && (
        <section
          aria-labelledby="program-winners-title"
          className="tw-mt-8 tw-overflow-hidden tw-rounded-xl tw-border tw-border-primary-400/30 tw-bg-iron-900/70"
        >
          <div className="tw-p-6 sm:tw-p-8">
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
              {t(
                DEFAULT_LOCALE,
                "museum.network.programs.detail.winnersEyebrow"
              )}
            </p>
            <h2
              id="program-winners-title"
              className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-white sm:tw-text-3xl"
            >
              {t(
                DEFAULT_LOCALE,
                "museum.network.programs.detail.winnersTitle",
                {
                  count: formatInteger(
                    DEFAULT_LOCALE,
                    program.selectedWorks.length
                  ),
                }
              )}
            </h2>
            <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-200">
              {t(
                DEFAULT_LOCALE,
                "museum.network.programs.detail.winnersDescription"
              )}
            </p>
          </div>
          <ol className="tw-m-0 tw-grid tw-list-none tw-gap-px tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-white/10 tw-p-0 md:tw-grid-cols-3">
            <li className="tw-bg-iron-950 tw-p-5">
              <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-white">
                <span aria-hidden="true" className="tw-mr-2 tw-text-success">
                  ✓
                </span>
                {t(
                  DEFAULT_LOCALE,
                  "museum.network.programs.detail.stageSelected"
                )}
              </p>
              <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-success">
                {t(
                  DEFAULT_LOCALE,
                  "museum.network.programs.detail.stageSelectedStatus",
                  {
                    count: formatInteger(
                      DEFAULT_LOCALE,
                      program.selectedWorks.length
                    ),
                  }
                )}
              </p>
            </li>
            <li className="tw-bg-iron-950 tw-p-5">
              <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-white">
                <span
                  aria-hidden="true"
                  className="tw-mr-2 tw-text-primary-300"
                >
                  02
                </span>
                {t(DEFAULT_LOCALE, "museum.network.programs.detail.stageMint")}
              </p>
              <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(
                  DEFAULT_LOCALE,
                  "museum.network.programs.detail.stageMintStatus"
                )}
              </p>
            </li>
            <li className="tw-bg-iron-950 tw-p-5">
              <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-white">
                <span aria-hidden="true" className="tw-mr-2 tw-text-iron-500">
                  03
                </span>
                {t(
                  DEFAULT_LOCALE,
                  "museum.network.programs.detail.stageAccession"
                )}
              </p>
              <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(
                  DEFAULT_LOCALE,
                  "museum.network.programs.detail.stageAccessionStatus"
                )}
              </p>
            </li>
          </ol>
          <p className="tw-m-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-black/30 tw-px-6 tw-py-4 tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-px-8">
            {t(DEFAULT_LOCALE, "museum.network.programs.detail.statusBoundary")}
          </p>
        </section>
      )}
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
            {t(
              DEFAULT_LOCALE,
              isKeysAndGates
                ? "museum.network.programs.detail.selectedWinners"
                : "museum.network.programs.detail.selectedWorks"
            )}
          </h2>
          {isKeysAndGates && (
            <p className="tw-m-0 tw-text-xs tw-text-iron-500">
              {t(
                DEFAULT_LOCALE,
                "museum.network.programs.detail.selectionNote"
              )}
            </p>
          )}
        </div>
        <div className="tw-mt-4 tw-grid tw-gap-4 md:tw-grid-cols-2 xl:tw-grid-cols-3">
          {program.selectedWorks.map((work) => (
            <MuseumRecordCard
              key={work.recordId}
              href={`/museum/network/objects/${museumSlug(work.recordId)}`}
              eyebrow={work.recordId}
              title={work.title}
              description={work.artist}
              media={work.media ?? undefined}
              meta={
                work.winnerPlace === null
                  ? undefined
                  : t(DEFAULT_LOCALE, selectionPlaceMessageKey, {
                      place: work.winnerPlace,
                    })
              }
            >
              <MuseumStatusBadge
                label={displayMuseumStatus(work.status)}
                tone={statusTone(work.status)}
              />
            </MuseumRecordCard>
          ))}
        </div>
      </section>
      {programEssay && (
        <section
          className="tw-mt-14 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
          aria-labelledby="program-essay-title"
        >
          <h2
            id="program-essay-title"
            className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.programs.detail.programEssay")}
          </h2>
          <MuseumMarkdown
            className="tw-mt-6"
            embeddedDocument
            sourceCommit={sourceCommit}
            sourcePath={programEssay.path}
          >
            {programEssay.markdown}
          </MuseumMarkdown>
        </section>
      )}
      <div className="tw-mt-6">
        <MuseumJsonDisclosure
          label={t(DEFAULT_LOCALE, "museum.network.detail.technicalEvidence")}
          value={program}
        />
      </div>
      <p className="tw-mt-4 tw-text-xs tw-text-iron-500">
        <a
          href={programSourceHref}
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
