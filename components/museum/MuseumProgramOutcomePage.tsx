import Link from "next/link";
import { MuseumJsonDisclosure } from "./MuseumMarkdown";
import { MuseumProgramImage } from "./MuseumProgramImage";
import { MuseumStatusBadge } from "./MuseumShell";
import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isMuseumKeysAndGatesProgramId } from "@/lib/museum/publication/collectionSemantics";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";
import { displayMuseumStatus, statusTone } from "@/lib/museum/presentation";
import type { MuseumObjectRecord } from "@/lib/museum/types";

export function MuseumProgramOutcomePage({
  outcome,
  sourceCommit,
}: {
  readonly outcome: MuseumObjectRecord;
  readonly sourceCommit: string;
}) {
  const isKeysAndGates = isMuseumKeysAndGatesProgramId(outcome.programId);
  const programHref = isKeysAndGates
    ? "/museum/network/acquisitions/keys-and-gates"
    : null;
  const sourceHref = buildImmutableMuseumBlobUrl(
    sourceCommit,
    outcome.sourcePath
  );

  return (
    <article className="tw-min-w-0">
      {programHref === null ? null : (
        <Link
          href={programHref}
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(
            DEFAULT_LOCALE,
            isKeysAndGates
              ? "museum.network.objects.backToKeysAndGates"
              : "museum.network.objects.backToProgram"
          )}
        </Link>
      )}

      <header className="tw-mb-8 tw-mt-6">
        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-primary-300">
          {outcome.artist}
        </p>
        <h1 className="tw-m-0 tw-mt-2 tw-max-w-4xl tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl">
          {outcome.title}
        </h1>
      </header>

      {outcome.media && (
        <figure className="tw-m-0 tw-min-w-0">
          <div className="tw-relative tw-h-[min(80vh,60rem)] tw-min-h-96 tw-w-full tw-overflow-hidden tw-bg-black">
            <MuseumProgramImage
              media={outcome.media}
              eager
              sizes="(min-width: 1280px) 70vw, 100vw"
              className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-contain"
            />
          </div>
          <figcaption className="tw-flex tw-flex-col tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4 tw-text-sm tw-leading-6 tw-text-iron-400 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
            <span>
              {t(DEFAULT_LOCALE, "museum.network.objects.programMediaCaption")}
            </span>
            <a
              href={outcome.media.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-flex-none tw-items-center tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {t(DEFAULT_LOCALE, "museum.network.objects.openHighResolution")}
            </a>
          </figcaption>
        </figure>
      )}

      <div className="tw-mt-8">
        <MuseumStatusBadge
          label={displayMuseumStatus(outcome.status)}
          tone={statusTone(outcome.status)}
        />
      </div>

      {isKeysAndGates && (
        <section
          aria-label={t(
            DEFAULT_LOCALE,
            "museum.network.objects.winnerStatusLabel"
          )}
          className="tw-mt-6 tw-border-l-2 tw-border-primary-300 tw-py-1 tw-pl-5"
        >
          <p className="tw-text-primary-200 tw-m-0 tw-text-sm tw-font-semibold">
            {t(DEFAULT_LOCALE, "museum.network.objects.winnerStatusTitle")}
          </p>
          <p className="tw-m-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-200">
            {t(
              DEFAULT_LOCALE,
              "museum.network.objects.winnerStatusDescription"
            )}
          </p>
        </section>
      )}

      <div className="tw-mt-12 tw-grid tw-gap-10 lg:tw-grid-cols-[minmax(0,1fr)_18rem] lg:tw-gap-16">
        <section aria-labelledby="program-outcome-statement-title">
          <h2
            id="program-outcome-statement-title"
            className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.objects.statement")}
          </h2>
          {outcome.artistStatement ? (
            <p className="tw-m-0 tw-mt-6 tw-whitespace-pre-line tw-text-base tw-leading-8 tw-text-iron-200">
              {outcome.artistStatement}
            </p>
          ) : (
            <p className="tw-m-0 tw-mt-6 tw-text-base tw-leading-8 tw-text-iron-400">
              {t(
                DEFAULT_LOCALE,
                "museum.network.objects.programStatementUnavailable"
              )}
            </p>
          )}
        </section>

        <aside
          aria-labelledby="program-outcome-details-title"
          className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6 lg:tw-border-l lg:tw-border-t-0 lg:tw-pl-6 lg:tw-pt-0"
        >
          <h2
            id="program-outcome-details-title"
            className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
          >
            {t(DEFAULT_LOCALE, "museum.network.objects.programDetails")}
          </h2>
          <dl className="tw-m-0 tw-mt-5 tw-space-y-5">
            {outcome.selectionPlace !== null && (
              <div>
                <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                  {t(DEFAULT_LOCALE, "museum.network.objects.selection")}
                </dt>
                <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
                  {t(DEFAULT_LOCALE, "museum.network.objects.selectionPlace", {
                    place: outcome.selectionPlace,
                  })}
                  {outcome.selectionDate
                    ? ` · ${formatDate(DEFAULT_LOCALE, outcome.selectionDate)}`
                    : ""}
                </dd>
              </div>
            )}
            <div>
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                {t(DEFAULT_LOCALE, "museum.network.objects.medium")}
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
                {outcome.classification}
              </dd>
            </div>
            {outcome.rightsStatus && (
              <div>
                <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                  {t(DEFAULT_LOCALE, "museum.network.objects.rightsReview")}
                </dt>
                <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
                  {outcome.rightsStatus}
                </dd>
              </div>
            )}
          </dl>
          <div className="tw-mt-6 tw-flex tw-flex-col tw-items-start tw-gap-3 tw-text-sm">
            {outcome.selectionSourceUrl && (
              <a
                href={outcome.selectionSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {t(DEFAULT_LOCALE, "museum.network.objects.openSelection")}
              </a>
            )}
            {sourceHref && (
              <a
                href={sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {t(DEFAULT_LOCALE, "museum.network.detail.sourceRecord")}
              </a>
            )}
          </div>
        </aside>
      </div>

      <div className="tw-mt-12 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8">
        <MuseumJsonDisclosure
          label={t(DEFAULT_LOCALE, "museum.network.detail.technicalEvidence")}
          value={outcome.record}
        />
      </div>
    </article>
  );
}
