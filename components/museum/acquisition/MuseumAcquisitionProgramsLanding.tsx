import Link from "next/link";
import { MuseumStatusBadge } from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumAcquisitionViewModel } from "@/lib/museum/publication/ia";
import type {
  MuseumAcquisitionProgram,
  MuseumPublication,
} from "@/lib/museum/publication/types";
import { museumAcquisitionProgramHref } from "@/lib/museum/publication/routes";
import type { MuseumView } from "@/lib/museum/types";
import {
  buildMuseumAcquisitionLandingRecords,
  MuseumAcquisitionMediaCard,
  museumAcquisitionStatusLabel,
  type MuseumAcquisitionLandingRecord,
} from "./MuseumAcquisitionLanding";

interface MuseumAcquisitionProgramLandingRecord {
  readonly program: MuseumAcquisitionProgram;
  readonly acquisitions: readonly MuseumAcquisitionLandingRecord[];
  readonly featuredAcquisition?: MuseumAcquisitionLandingRecord;
}

function programStatusLabel(
  status: MuseumAcquisitionProgram["status"]
): string {
  switch (status) {
    case "proposed":
      return "Proposed pathway";
    case "open":
      return "Open pathway";
    case "selection_complete":
      return "Selection complete";
    case "acquisition_in_progress":
      return "Acquisition in progress";
    case "completed":
      return "Program complete";
    case "closed":
      return "Program closed";
  }
  throw new Error(`museum_acquisition_program_status:${String(status)}`);
}

function acquisitionCountLabel(count: number): string {
  return t(
    DEFAULT_LOCALE,
    count === 1
      ? "museum.network.acquisitionPrograms.acquisitionsCount.one"
      : "museum.network.acquisitionPrograms.acquisitionsCount.other",
    { count: String(count) }
  );
}

function programDescription(program: MuseumAcquisitionProgram): string {
  if (program.id === "AP-GIFT-01") {
    return "A standing route for considered gifts, with each gift recorded as its own curated acquisition.";
  }
  if (program.id === "6529NM-AP-01") {
    return "A focused photographic acquisition program. Its selected works remain unminted while the acquisition proceeds.";
  }
  return t(
    DEFAULT_LOCALE,
    "museum.network.acquisitionPrograms.detailDescription"
  );
}

export function buildMuseumAcquisitionProgramLandingRecords(
  publication: MuseumPublication,
  programs: readonly MuseumAcquisitionProgram[],
  acquisitions: readonly MuseumAcquisitionViewModel[],
  view: MuseumView | null
): readonly MuseumAcquisitionProgramLandingRecord[] {
  const acquisitionRecords = buildMuseumAcquisitionLandingRecords(
    publication,
    acquisitions,
    view
  );
  return programs.map((program) => {
    const produced = acquisitionRecords.filter(
      (record) =>
        program.acquisitionIds.includes(record.acquisition.acquisitionId) ||
        record.acquisition.programId === program.id
    );
    const featured =
      produced.find(
        (record) => record.media !== undefined || record.metadata !== undefined
      ) ?? produced[0];
    return {
      program,
      acquisitions: produced,
      ...(featured === undefined ? {} : { featuredAcquisition: featured }),
    };
  });
}

function ProgramFeature({
  record,
  index,
}: {
  readonly record: MuseumAcquisitionProgramLandingRecord;
  readonly index: number;
}) {
  const { program } = record;
  const href = museumAcquisitionProgramHref(program.slug);
  return (
    <article className="tw-grid tw-min-w-0 tw-gap-8 tw-border-b tw-border-solid tw-border-iron-800 tw-py-12 first:tw-pt-0 md:tw-grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)] md:tw-items-start md:tw-gap-14 md:tw-py-16">
      <div
        className={index % 2 === 0 ? "tw-order-1" : "tw-order-1 md:tw-order-2"}
      >
        {record.featuredAcquisition === undefined ? (
          <div className="tw-flex tw-min-h-64 tw-items-end tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
            <p className="tw-m-0 tw-max-w-xs tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(
                DEFAULT_LOCALE,
                "museum.network.acquisitionPrograms.detailDescription"
              )}
            </p>
          </div>
        ) : (
          <MuseumAcquisitionMediaCard
            record={record.featuredAcquisition}
            eager={index === 0}
            featured
            captionHref={href}
          />
        )}
      </div>
      <div
        className={
          index % 2 === 0
            ? "tw-order-2 md:tw-pt-3"
            : "tw-order-2 md:tw-order-1 md:tw-pt-3"
        }
      >
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.eyebrow")}
        </p>
        <h3 className="tw-m-0 tw-mt-4 tw-max-w-xl tw-text-3xl tw-font-semibold tw-leading-[1.05] tw-tracking-[-0.025em] tw-text-iron-50 sm:tw-text-4xl">
          <Link
            href={href}
            className="hover:tw-text-primary-200 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {program.title}
          </Link>
        </h3>
        <p className="tw-m-0 tw-mt-5 tw-max-w-xl tw-text-base tw-leading-7 tw-text-iron-300 sm:tw-text-lg sm:tw-leading-8">
          {programDescription(program)}
        </p>
        <div className="tw-mt-7 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-3">
          <MuseumStatusBadge
            label={programStatusLabel(program.status)}
            tone={program.status === "completed" ? "success" : "neutral"}
          />
          <span className="tw-text-sm tw-leading-6 tw-text-iron-400">
            {acquisitionCountLabel(record.acquisitions.length)}
          </span>
        </div>
        {record.acquisitions.length === 0 ? null : (
          <div className="tw-mt-8 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5">
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
              {t(
                DEFAULT_LOCALE,
                "museum.network.acquisitionPrograms.acquisitions"
              )}
            </p>
            <ul className="tw-m-3 tw-list-none tw-space-y-3 tw-p-0">
              {record.acquisitions.map((acquisitionRecord) => (
                <li
                  key={acquisitionRecord.acquisition.acquisitionId}
                  className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1 sm:tw-flex-row sm:tw-items-baseline sm:tw-justify-between sm:tw-gap-4"
                >
                  <Link
                    href={acquisitionRecord.acquisition.canonicalHref}
                    className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-iron-100 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    {acquisitionRecord.acquisition.title}
                  </Link>
                  <span className="tw-text-xs tw-leading-5 tw-text-iron-500">
                    {museumAcquisitionStatusLabel(
                      acquisitionRecord.acquisition.status
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link
          href={href}
          className="hover:tw-text-primary-200 tw-mt-7 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.view")}
          <span aria-hidden="true" className="tw-ml-2">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}

export function MuseumAcquisitionProgramsLandingPage({
  records,
}: {
  readonly records: readonly MuseumAcquisitionProgramLandingRecord[];
}) {
  if (records.length === 0) return null;
  const hero = records.find(
    (record) => record.featuredAcquisition !== undefined
  );

  return (
    <div className="tw-min-w-0 tw-space-y-20 sm:tw-space-y-28">
      <header
        className="tw-grid tw-min-w-0 tw-gap-10 md:tw-grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] md:tw-items-center md:tw-gap-14"
        aria-labelledby="museum-acquisition-programs-title"
      >
        {hero?.featuredAcquisition === undefined ? null : (
          <div className="tw-order-1 tw-min-w-0">
            <MuseumAcquisitionMediaCard
              record={hero.featuredAcquisition}
              eager
              featured
              captionHref={museumAcquisitionProgramHref(hero.program.slug)}
            />
          </div>
        )}
        <div
          className={`tw-order-2 tw-max-w-xl ${hero?.featuredAcquisition === undefined ? "md:tw-col-span-2" : ""}`}
        >
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.eyebrow")}
          </p>
          <h1
            id="museum-acquisition-programs-title"
            className="tw-m-0 tw-mt-4 tw-text-4xl tw-font-semibold tw-leading-[0.98] tw-tracking-[-0.035em] tw-text-iron-50 sm:tw-text-6xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.title")}
          </h1>
          <p className="tw-m-0 tw-mt-6 tw-max-w-lg tw-text-lg tw-leading-8 tw-text-iron-300">
            Curated routes for forming groups of works. A program sets the
            premise; the acquisition that follows gives the works a title and a
            place in Museum history.
          </p>
          <div className="tw-mt-8 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <Link
              href="/museum/network/acquisitions"
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-bg-primary-500 tw-px-5 tw-text-sm tw-font-semibold tw-text-black tw-no-underline hover:tw-bg-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
            >
              {t(DEFAULT_LOCALE, "museum.network.acquisitions.title")}
            </Link>
            <Link
              href="/museum/network/collection"
              className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {t(DEFAULT_LOCALE, "museum.network.home.exploreCollection")}
            </Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="program-pathways-title">
        <div className="tw-max-w-3xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            Two routes, distinct histories
          </p>
          <h2
            id="program-pathways-title"
            className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-[-0.02em] tw-text-iron-50 sm:tw-text-4xl"
          >
            Curatorial pathways
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
            The Museum currently uses two pathways: a standing route for
            considered gifts and Keys and Gates, a focused photographic
            acquisition program.
          </p>
        </div>
        <ul className="tw-m-0 tw-mt-8 tw-list-none tw-p-0">
          {records.map((record, index) => (
            <li key={record.program.id}>
              <ProgramFeature record={record} index={index} />
            </li>
          ))}
        </ul>
      </section>

      <section
        className="tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 sm:tw-pt-14"
        aria-labelledby="program-language-title"
      >
        <div className="tw-grid tw-gap-8 md:tw-grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:tw-gap-14">
          <div>
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
              A simple distinction
            </p>
            <h2
              id="program-language-title"
              className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl"
            >
              A program sets the route; an acquisition names the group
            </h2>
          </div>
          <p className="tw-m-0 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
            Start with the program for its frame, then move to the acquisition
            for the works themselves. Accessioned works continue into the
            permanent Collection; selected works remain visibly in process.
          </p>
        </div>
      </section>
    </div>
  );
}
