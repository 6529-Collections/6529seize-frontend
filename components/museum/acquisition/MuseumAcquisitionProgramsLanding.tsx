import type { ReactNode } from "react";
import Link from "next/link";
import { MuseumManagedImage } from "@/components/museum/MuseumManagedImage";
import { MuseumMediaMetadataPlaceholder } from "@/components/museum/MuseumMediaMetadataPlaceholder";
import { MuseumProgramImage } from "@/components/museum/MuseumProgramImage";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";
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
  museumAcquisitionStatusLabel,
  type MuseumAcquisitionLandingMedia,
  type MuseumAcquisitionLandingRecord,
} from "./MuseumAcquisitionLanding";

type AcquisitionFramework = "gifts" | "meme-card";

interface MuseumAcquisitionProgramLandingRecord {
  readonly program: MuseumAcquisitionProgram;
  readonly acquisitions: readonly MuseumAcquisitionLandingRecord[];
  readonly acquisitionArtistNames: Readonly<Record<string, string>>;
}

const FRAMEWORKS: readonly {
  readonly id: AcquisitionFramework;
  readonly titleKey:
    | "museum.network.acquisitionPrograms.frameworks.gifts.title"
    | "museum.network.acquisitionPrograms.frameworks.memeCard.title";
  readonly descriptionKey:
    | "museum.network.acquisitionPrograms.frameworks.gifts.description"
    | "museum.network.acquisitionPrograms.frameworks.memeCard.description";
}[] = [
  {
    id: "gifts",
    titleKey: "museum.network.acquisitionPrograms.frameworks.gifts.title",
    descriptionKey:
      "museum.network.acquisitionPrograms.frameworks.gifts.description",
  },
  {
    id: "meme-card",
    titleKey: "museum.network.acquisitionPrograms.frameworks.memeCard.title",
    descriptionKey:
      "museum.network.acquisitionPrograms.frameworks.memeCard.description",
  },
] as const;

function frameworkForProgram(
  program: MuseumAcquisitionProgram
): AcquisitionFramework | null {
  if (
    program.id === "6529NM-AP-ENT-0001" ||
    program.id === "AP-GIFT-01" ||
    program.slug === "gift-acquisitions"
  ) {
    return "gifts";
  }
  if (program.slug === "keys-and-gates") return "meme-card";
  return null;
}

function programStatusLabel(program: MuseumAcquisitionProgram): string {
  if (program.slug === "keys-and-gates") {
    return t(
      DEFAULT_LOCALE,
      "museum.network.acquisitionPrograms.status.keysAndGates"
    );
  }
  switch (program.status) {
    case "proposed":
      return t(
        DEFAULT_LOCALE,
        "museum.network.acquisitionPrograms.status.proposed"
      );
    case "open":
      return t(
        DEFAULT_LOCALE,
        "museum.network.acquisitionPrograms.status.open"
      );
    case "selection_complete":
      return t(
        DEFAULT_LOCALE,
        "museum.network.acquisitionPrograms.status.selectionComplete"
      );
    case "acquisition_in_progress":
      return t(
        DEFAULT_LOCALE,
        "museum.network.acquisitionPrograms.status.acquisitionInProgress"
      );
    case "completed":
      return t(
        DEFAULT_LOCALE,
        "museum.network.acquisitionPrograms.status.completed"
      );
    case "closed":
      return t(
        DEFAULT_LOCALE,
        "museum.network.acquisitionPrograms.status.closed"
      );
  }
  throw new Error(
    `museum_acquisition_program_status:${String(program.status)}`
  );
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
  if (frameworkForProgram(program) === "gifts") {
    return t(
      DEFAULT_LOCALE,
      "museum.network.acquisitionPrograms.frameworks.gifts.recordDescription"
    );
  }
  if (program.slug === "keys-and-gates") {
    return t(
      DEFAULT_LOCALE,
      "museum.network.acquisitionPrograms.frameworks.memeCard.recordDescription"
    );
  }
  return t(
    DEFAULT_LOCALE,
    "museum.network.acquisitionPrograms.detailDescription"
  );
}

function programEyebrowKey(
  framework: AcquisitionFramework | null
):
  | "museum.network.acquisitionPrograms.frameworks.gifts.recordEyebrow"
  | "museum.network.acquisitionPrograms.frameworks.memeCard.recordEyebrow"
  | "museum.network.acquisitionPrograms.current.eyebrow" {
  if (framework === "gifts") {
    return "museum.network.acquisitionPrograms.frameworks.gifts.recordEyebrow";
  }
  if (framework === "meme-card") {
    return "museum.network.acquisitionPrograms.frameworks.memeCard.recordEyebrow";
  }
  return "museum.network.acquisitionPrograms.current.eyebrow";
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
    const acquisitionArtistNames = Object.fromEntries(
      produced.map((record) => {
        const names = record.acquisition.artistIds
          .map(
            (artistId) =>
              publication.artists.find((artist) => artist.id === artistId)
                ?.preferredName
          )
          .filter(
            (name): name is string => name !== undefined && name.trim() !== ""
          );
        return [
          record.acquisition.acquisitionId,
          [...new Set(names)].join(" · "),
        ];
      })
    );
    return {
      program,
      acquisitions: produced,
      acquisitionArtistNames,
    };
  });
}

function mediaDimensions(
  media: MuseumAcquisitionLandingMedia
): { readonly width: number; readonly height: number } | null {
  if (media.kind === "governed" || media.kind === "proposal") {
    return media.width === null || media.height === null
      ? null
      : { width: media.width, height: media.height };
  }
  const variant = media.media.variants[0];
  const width = media.media.sourceWidth ?? variant?.width;
  const height = media.media.sourceHeight ?? variant?.height;
  return width === undefined || height === undefined ? null : { width, height };
}

function programImage(
  media: MuseumAcquisitionLandingMedia,
  title: string,
  eager: boolean
): ReactNode {
  const className =
    "tw-block tw-h-auto tw-w-full tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.01] motion-reduce:tw-transition-none";
  if (media.kind === "governed") {
    return (
      <MuseumManagedImage
        src={media.src}
        {...(media.width === null ? {} : { width: media.width })}
        {...(media.height === null ? {} : { height: media.height })}
        alt={media.alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        sizes="(min-width: 1024px) 55vw, 100vw"
        failureMessage={t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
        retryLabel={t(DEFAULT_LOCALE, "museum.network.media.retry")}
        className={className}
      />
    );
  }
  if (media.kind === "program") {
    return (
      <MuseumProgramImage
        media={media.media}
        sizes="(min-width: 1024px) 55vw, 100vw"
        eager={eager}
        className={className}
      />
    );
  }
  return (
    <MuseumProposalImage
      src={media.src}
      alt={media.alt || title}
      width={media.width}
      height={media.height}
      sourceByteSize={media.sourceByteSize}
      variants={media.variants}
      sizes="(min-width: 1024px) 55vw, 100vw"
      eager={eager}
      className={className}
    />
  );
}

function ProgramMediaFigure({
  record,
  captionHref,
  eager,
}: {
  readonly record: MuseumAcquisitionLandingRecord;
  readonly captionHref: string;
  readonly eager: boolean;
}) {
  const media = record.media;
  const dimensions = media === undefined ? null : mediaDimensions(media);
  let mediaContent;
  if (media !== undefined) {
    mediaContent = programImage(media, record.mediaTitle, eager);
  } else if (record.metadata !== undefined) {
    mediaContent = (
      <MuseumMediaMetadataPlaceholder
        title={record.mediaTitle}
        metadata={record.metadata}
      />
    );
  } else {
    mediaContent = (
      <div className="tw-flex tw-min-h-48 tw-items-end tw-p-5">
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
        </p>
      </div>
    );
  }
  return (
    <figure className="group tw-m-0 tw-min-w-0">
      <div
        className="tw-overflow-hidden tw-bg-black"
        style={
          dimensions === null
            ? undefined
            : { aspectRatio: `${dimensions.width} / ${dimensions.height}` }
        }
      >
        {mediaContent}
      </div>
      <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
        <Link
          href={captionHref}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {record.mediaTitle}
        </Link>
        {record.mediaSubtitle === undefined ? null : (
          <span className="tw-mt-1 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
            {record.mediaSubtitle}
          </span>
        )}
        {record.media?.creditLine === undefined ? null : (
          <span className="tw-mt-2 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
            {record.media.creditLine}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function ProgramFeature({
  record,
  framework,
  index,
}: {
  readonly record: MuseumAcquisitionProgramLandingRecord;
  readonly framework: AcquisitionFramework | null;
  readonly index: number;
}) {
  const { program } = record;
  const href = museumAcquisitionProgramHref(program.slug);
  const mediaRecords = record.acquisitions
    .filter(
      (acquisition) =>
        acquisition.media !== undefined || acquisition.metadata !== undefined
    )
    .slice(0, 2);
  const titleKey =
    framework === "gifts"
      ? "museum.network.acquisitionPrograms.frameworks.gifts.recordTitle"
      : null;
  return (
    <article className="tw-grid tw-min-w-0 tw-gap-8 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-12 first:tw-pt-0 md:tw-grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)] md:tw-items-start md:tw-gap-14 md:tw-py-16">
      <div
        className={index % 2 === 0 ? "tw-order-1" : "tw-order-1 md:tw-order-2"}
      >
        {mediaRecords.length === 0 ? (
          <div className="tw-flex tw-min-h-48 tw-items-end tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-4">
            <p className="tw-m-0 tw-max-w-md tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
            </p>
          </div>
        ) : (
          <div className="tw-grid tw-gap-6 sm:tw-grid-cols-2">
            {mediaRecords.map((acquisition, mediaIndex) => (
              <ProgramMediaFigure
                key={acquisition.acquisition.acquisitionId}
                record={acquisition}
                captionHref={href}
                eager={index === 0 && mediaIndex === 0}
              />
            ))}
          </div>
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
          {t(DEFAULT_LOCALE, programEyebrowKey(framework))}
        </p>
        <h3 className="tw-m-0 tw-mt-4 tw-max-w-xl tw-text-3xl tw-font-semibold tw-leading-[1.05] tw-tracking-[-0.025em] tw-text-iron-50 sm:tw-text-4xl">
          {titleKey === null ? (
            <Link
              href={href}
              className="hover:tw-text-primary-200 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {program.title}
            </Link>
          ) : (
            t(DEFAULT_LOCALE, titleKey)
          )}
        </h3>
        <p className="tw-m-0 tw-mt-5 tw-max-w-xl tw-text-base tw-leading-7 tw-text-iron-300 sm:tw-text-lg sm:tw-leading-8">
          {programDescription(program)}
        </p>
        <p className="tw-m-0 tw-mt-5 tw-text-sm tw-leading-6 tw-text-iron-200">
          {programStatusLabel(program)} {"·"}{" "}
          {acquisitionCountLabel(record.acquisitions.length)}
        </p>
        {record.acquisitions.length === 0 ? null : (
          <div className="tw-mt-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5">
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
              {t(
                DEFAULT_LOCALE,
                "museum.network.acquisitionPrograms.acquisitions"
              )}
            </p>
            <ul className="tw-mt-3 tw-list-none tw-space-y-3 tw-p-0">
              {record.acquisitions.map((acquisitionRecord) => {
                const acquisition = acquisitionRecord.acquisition;
                const artists =
                  record.acquisitionArtistNames[acquisition.acquisitionId];
                return (
                  <li
                    key={acquisition.acquisitionId}
                    className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1 sm:tw-flex-row sm:tw-items-baseline sm:tw-justify-between sm:tw-gap-4"
                  >
                    <div className="tw-min-w-0">
                      <Link
                        href={acquisition.canonicalHref}
                        className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-iron-100 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                      >
                        {acquisition.title}
                      </Link>
                      {artists === undefined || artists === "" ? null : (
                        <span className="tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
                          {artists}
                        </span>
                      )}
                    </div>
                    <span className="tw-text-xs tw-leading-5 tw-text-iron-500">
                      {museumAcquisitionStatusLabel(acquisition.status)}
                    </span>
                  </li>
                );
              })}
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
  const frameworkRecords = FRAMEWORKS.map((framework) => ({
    framework,
    records: records.filter(
      (record) => frameworkForProgram(record.program) === framework.id
    ),
  })).filter((entry) => entry.records.length > 0);
  const unclassifiedPrograms = records.filter(
    (record) => frameworkForProgram(record.program) === null
  );
  return (
    <div className="tw-min-w-0 tw-space-y-20 sm:tw-space-y-28">
      <header
        className="tw-max-w-4xl"
        aria-labelledby="museum-acquisition-programs-title"
      >
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.eyebrow")}
        </p>
        <h1
          id="museum-acquisition-programs-title"
          className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-4xl tw-font-semibold tw-leading-[0.98] tw-tracking-[-0.035em] tw-text-iron-50 sm:tw-text-6xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.title")}
        </h1>
        <p className="tw-m-0 tw-mt-6 tw-max-w-3xl tw-text-lg tw-leading-8 tw-text-iron-300 sm:tw-text-xl sm:tw-leading-9">
          {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.lead")}
        </p>
        <div className="tw-mt-7 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2">
          <Link
            href="/museum/network/collection"
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.home.exploreCollection")}
          </Link>
          <Link
            href="/museum/network/acquisitions"
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.title")}
          </Link>
        </div>
      </header>

      <section aria-labelledby="acquisition-frameworks-title">
        <div className="tw-max-w-3xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(
              DEFAULT_LOCALE,
              "museum.network.acquisitionPrograms.frameworks.eyebrow"
            )}
          </p>
          <h2
            id="acquisition-frameworks-title"
            className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-[-0.02em] tw-text-iron-50 sm:tw-text-4xl"
          >
            {t(
              DEFAULT_LOCALE,
              "museum.network.acquisitionPrograms.frameworks.title"
            )}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "museum.network.acquisitionPrograms.frameworks.description"
            )}
          </p>
        </div>
        <div className="tw-mt-8 tw-space-y-16 sm:tw-space-y-20">
          {frameworkRecords.map(({ framework, records: frameworkItems }) => (
            <section
              key={framework.id}
              aria-labelledby={`${framework.id}-title`}
            >
              <h3
                id={`${framework.id}-title`}
                className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl"
              >
                {t(DEFAULT_LOCALE, framework.titleKey)}
              </h3>
              <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
                {t(DEFAULT_LOCALE, framework.descriptionKey)}
              </p>
              <ul className="tw-m-0 tw-mt-8 tw-list-none tw-p-0">
                {frameworkItems.map((record, index) => (
                  <li key={record.program.id}>
                    <ProgramFeature
                      record={record}
                      framework={framework.id}
                      index={index}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {unclassifiedPrograms.length === 0 ? null : (
            <section aria-labelledby="other-published-programs-title">
              <div className="tw-max-w-3xl">
                <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
                  {t(
                    DEFAULT_LOCALE,
                    "museum.network.acquisitionPrograms.current.eyebrow"
                  )}
                </p>
                <h2
                  id="other-published-programs-title"
                  className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-[-0.02em] tw-text-iron-50 sm:tw-text-4xl"
                >
                  Other published programs
                </h2>
                <p className="tw-m-0 tw-mt-4 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
                  These published programs have not been assigned to one of the
                  Museum&apos;s standing collecting frameworks.
                </p>
              </div>
              <ul className="tw-m-0 tw-mt-8 tw-list-none tw-p-0">
                {unclassifiedPrograms.map((record, index) => (
                  <li key={record.program.id}>
                    <ProgramFeature
                      record={record}
                      framework={null}
                      index={index}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      <section aria-labelledby="acquisition-methods-title">
        <div className="tw-grid tw-gap-8 md:tw-grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:tw-gap-14">
          <div>
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
              {t(
                DEFAULT_LOCALE,
                "museum.network.acquisitionPrograms.methods.eyebrow"
              )}
            </p>
            <h2
              id="acquisition-methods-title"
              className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-[-0.02em] tw-text-iron-50 sm:tw-text-4xl"
            >
              {t(
                DEFAULT_LOCALE,
                "museum.network.acquisitionPrograms.methods.title"
              )}
            </h2>
          </div>
          <div>
            <p className="tw-m-0 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
              {t(
                DEFAULT_LOCALE,
                "museum.network.acquisitionPrograms.methods.description"
              )}
            </p>
            <dl className="tw-mt-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800">
              {(
                [
                  [
                    "museum.network.acquisitionPrograms.methods.gift.label",
                    "museum.network.acquisitionPrograms.methods.gift.description",
                  ],
                  [
                    "museum.network.acquisitionPrograms.methods.purchase.label",
                    "museum.network.acquisitionPrograms.methods.purchase.description",
                  ],
                  [
                    "museum.network.acquisitionPrograms.methods.commission.label",
                    "museum.network.acquisitionPrograms.methods.commission.description",
                  ],
                  [
                    "museum.network.acquisitionPrograms.methods.other.label",
                    "museum.network.acquisitionPrograms.methods.other.description",
                  ],
                ] as const
              ).map(([termKey, descriptionKey]) => (
                <div
                  key={termKey}
                  className="tw-grid tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4 sm:tw-grid-cols-[minmax(10rem,0.7fr)_minmax(0,1.3fr)] sm:tw-gap-6"
                >
                  <dt className="tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-100">
                    {t(DEFAULT_LOCALE, termKey)}
                  </dt>
                  <dd className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
                    {t(DEFAULT_LOCALE, descriptionKey)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="tw-m-0 tw-border-l-2 tw-border-solid tw-border-primary-400 tw-py-1 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-200">
              {t(
                DEFAULT_LOCALE,
                "museum.network.acquisitionPrograms.methods.accessionNotice"
              )}
            </p>
          </div>
        </div>
      </section>

      <section
        className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 sm:tw-pt-14"
        aria-labelledby="program-language-title"
      >
        <div className="tw-grid tw-gap-8 md:tw-grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:tw-gap-14">
          <h2
            id="program-language-title"
            className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl"
          >
            {t(
              DEFAULT_LOCALE,
              "museum.network.acquisitionPrograms.terms.title"
            )}
          </h2>
          <p className="tw-m-0 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "museum.network.acquisitionPrograms.terms.description"
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
