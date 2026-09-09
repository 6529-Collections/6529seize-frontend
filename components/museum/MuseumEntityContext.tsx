import { MuseumStatusBadge } from "./MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type {
  MuseumEntityContextModel,
  MuseumPublicAcquisitionStatus,
} from "@/lib/museum/publication/ia";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";
import {
  displayMuseumPublicAcquisitionStatus,
  displayMuseumStatus,
} from "@/lib/museum/presentation";

interface MuseumEntityContextLabels {
  readonly ariaLabel: string;
  readonly status?: string;
  readonly statusAsOf?: string;
  readonly source?: string;
}

interface MuseumEntityContextProps {
  readonly context: MuseumEntityContextModel;
  readonly labels: MuseumEntityContextLabels;
}

const PUBLIC_ACQUISITION_STATUSES: ReadonlySet<string> = new Set([
  "proposed_in_museum_wave",
  "selected_by_museum_wave_acquisition_review_in_progress",
  "selected_through_acquisition_program_acquisition_pending",
  "acquisition_complete_accession_review_in_progress",
  "accessioned_into_permanent_collection",
  "closed_without_selection",
  "withdrawn",
]);

function displayEntityStatus(value: string): string {
  if (PUBLIC_ACQUISITION_STATUSES.has(value)) {
    return displayMuseumPublicAcquisitionStatus(
      value as MuseumPublicAcquisitionStatus
    );
  }

  return value.includes("_") || value === value.toLocaleUpperCase()
    ? displayMuseumStatus(value.toLocaleLowerCase())
    : value;
}

function MuseumEntityStatus({
  context,
  labels,
}: {
  readonly context: MuseumEntityContextModel;
  readonly labels: MuseumEntityContextLabels;
}) {
  const status = context.status;
  const statusAsOf = context.statusAsOf;
  if (status === undefined && statusAsOf === null) return null;
  return (
    <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-5 tw-gap-y-2 tw-text-sm">
      {status === undefined ? null : (
        <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
          {labels.status === undefined ? null : (
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {labels.status}
            </span>
          )}
          <MuseumStatusBadge
            label={displayEntityStatus(status)}
            tone={context.statusTone ?? "neutral"}
          />
        </div>
      )}
      {statusAsOf === null || labels.statusAsOf === undefined ? null : (
        <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {labels.statusAsOf}
          </span>
          <span className="tw-text-sm tw-leading-6 tw-text-iron-300">
            <time dateTime={statusAsOf}>
              {formatDate(DEFAULT_LOCALE, statusAsOf)}
            </time>
          </span>
        </div>
      )}
    </div>
  );
}

function MuseumEntitySource({
  context,
}: {
  readonly context: MuseumEntityContextModel;
}) {
  const sourcePath = context.sourcePath;
  if (sourcePath === null) return null;
  const sourceHref =
    context.sourceCommit === null
      ? null
      : buildImmutableMuseumBlobUrl(context.sourceCommit, sourcePath);
  if (sourceHref === null) return null;
  return (
    <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1 tw-text-sm">
      <a
        href={sourceHref}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-break-words tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.detail.openSourceRecord")}
      </a>
    </div>
  );
}

export function MuseumEntityContext({
  context,
  labels,
}: MuseumEntityContextProps) {
  const hasStatus = context.status !== undefined;
  const hasStatusAsOf =
    context.statusAsOf !== null && labels.statusAsOf !== undefined;
  const source =
    context.sourcePath === null ||
    context.sourceCommit === null ||
    labels.source === undefined ||
    buildImmutableMuseumBlobUrl(context.sourceCommit, context.sourcePath) ===
      null
      ? null
      : { context };
  if (!hasStatus && !hasStatusAsOf && source === null) return null;

  return (
    <aside
      aria-label={labels.ariaLabel}
      className="tw-mb-8 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-4"
    >
      {hasStatus || hasStatusAsOf ? (
        <MuseumEntityStatus context={context} labels={labels} />
      ) : null}
      {source === null ? null : <MuseumEntitySource {...source} />}
    </aside>
  );
}
