import Link from "next/link";
import { MuseumManagedImage } from "@/components/museum/MuseumManagedImage";
import { MuseumMediaMetadataPlaceholder } from "@/components/museum/MuseumMediaMetadataPlaceholder";
import { MuseumProgramImage } from "@/components/museum/MuseumProgramImage";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";
import { MuseumStatusBadge } from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { findReviewedProgramMediaMatch } from "@/lib/museum/normalize";
import type { MuseumAcquisitionViewModel } from "@/lib/museum/publication/ia";
import {
  buildMuseumSignedWaveStormDropUrl,
  type MuseumExternalProposalPresentationMedia,
  type MuseumMediaMetadata,
  type MuseumPublication,
  type MuseumPublicWork,
} from "@/lib/museum/publication/types";
import { museumAcquisitionHref } from "@/lib/museum/publication/routes";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
import type { MuseumProgramMedia, MuseumView } from "@/lib/museum/types";

export type MuseumAcquisitionLandingMedia =
  | {
      readonly kind: "governed";
      readonly src: string;
      readonly width: number | null;
      readonly height: number | null;
      readonly alt: string;
      readonly creditLine: string;
    }
  | {
      readonly kind: "proposal";
      readonly src: string;
      readonly width: number;
      readonly height: number;
      readonly alt: string;
      readonly sourceByteSize: number;
      readonly variants?: MuseumExternalProposalPresentationMedia["variants"];
      readonly sourceHref?: string;
      readonly creditLine: string;
    }
  | {
      readonly kind: "program";
      readonly media: MuseumProgramMedia;
      readonly creditLine?: string;
    };

export interface MuseumAcquisitionLandingRecord {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly media?: MuseumAcquisitionLandingMedia;
  readonly metadata?: MuseumMediaMetadata;
  readonly mediaTitle: string;
  readonly mediaSubtitle?: string;
}

function governedMedia(
  work: MuseumPublicWork
): MuseumAcquisitionLandingMedia | undefined {
  const media = selectMuseumStillMedia(work.media);
  if (media === undefined) return undefined;
  return {
    kind: "governed",
    src: media.url,
    width: media.width,
    height: media.height,
    alt: media.altText ?? work.title,
    creditLine: media.credit.creditLine,
  };
}

function proposalMedia(
  media: MuseumExternalProposalPresentationMedia
): MuseumAcquisitionLandingMedia {
  const sourceHref = buildMuseumSignedWaveStormDropUrl(
    media.source.waveId,
    media.source.dropId
  );
  return {
    kind: "proposal",
    src: media.mediaUrl,
    width: media.width,
    height: media.height,
    alt: media.altText,
    sourceByteSize: media.sourceByteSize,
    ...(media.variants === undefined ? {} : { variants: media.variants }),
    ...(sourceHref === null ? {} : { sourceHref }),
    creditLine: media.credit.creditLine,
  };
}

function mediaForWork(
  work: MuseumPublicWork,
  view: MuseumView | null
): {
  readonly media?: MuseumAcquisitionLandingMedia;
  readonly metadata?: MuseumMediaMetadata;
} {
  const retained = governedMedia(work);
  if (retained !== undefined) return { media: retained };

  const proposal = work.presentationMedia?.[0];
  if (proposal !== undefined) {
    const metadata = work.mediaMetadata?.[0];
    return {
      media: proposalMedia(proposal),
      ...(metadata === undefined ? {} : { metadata }),
    };
  }

  const reviewedProgramMedia = findReviewedProgramMediaMatch(view, [
    work.id,
    ...(work.sourceRecordIds ?? []),
  ]);
  if (reviewedProgramMedia !== null) {
    const creditLine = work.mediaMetadata?.[0]?.credit.creditLine;
    const metadata = work.mediaMetadata?.[0];
    return {
      media: {
        kind: "program",
        media: reviewedProgramMedia.media,
        ...(creditLine === undefined ? {} : { creditLine }),
      },
      ...(metadata === undefined ? {} : { metadata }),
    };
  }

  const metadata = work.mediaMetadata?.[0];
  return metadata === undefined ? {} : { metadata };
}

function mediaForAcquisition(
  publication: MuseumPublication,
  acquisition: MuseumAcquisitionViewModel,
  works: readonly MuseumPublicWork[],
  view: MuseumView | null
): {
  readonly media?: MuseumAcquisitionLandingMedia;
  readonly metadata?: MuseumMediaMetadata;
  readonly title: string;
  readonly subtitle?: string;
} {
  let metadataFallback:
    | {
        readonly metadata: MuseumMediaMetadata;
        readonly work: MuseumPublicWork;
      }
    | undefined;

  for (const work of works) {
    const candidate = mediaForWork(work, view);
    const artist = publication.artists.find(
      (item) => item.id === work.artistId
    );
    if (candidate.media !== undefined) {
      return {
        ...candidate,
        title: work.title,
        ...(artist === undefined ? {} : { subtitle: artist.preferredName }),
      };
    }
    if (candidate.metadata !== undefined && metadataFallback === undefined) {
      metadataFallback = { metadata: candidate.metadata, work };
    }
  }

  if (metadataFallback !== undefined) {
    const artist = publication.artists.find(
      (item) => item.id === metadataFallback.work.artistId
    );
    return {
      metadata: metadataFallback.metadata,
      title: metadataFallback.work.title,
      ...(artist === undefined ? {} : { subtitle: artist.preferredName }),
    };
  }

  const presentation = acquisition.presentationMedia[0];
  if (presentation !== undefined) {
    return { media: proposalMedia(presentation), title: acquisition.title };
  }
  return { title: acquisition.title };
}

/**
 * The index is intentionally strict: it only presents acquisitions whose
 * declared Work IDs all resolve in the typed publication graph.
 */
export function buildMuseumAcquisitionLandingRecords(
  publication: MuseumPublication,
  acquisitions: readonly MuseumAcquisitionViewModel[],
  view: MuseumView | null
): readonly MuseumAcquisitionLandingRecord[] {
  if (publication.works === undefined) return [];
  const publicationWorks = publication.works;

  return acquisitions.flatMap((acquisition) => {
    const works = acquisition.workIds.flatMap((workId) => {
      const work = publicationWorks.find(
        (candidate) => candidate.id === workId
      );
      return work === undefined ? [] : [work];
    });
    if (works.length !== acquisition.workIds.length) return [];
    const media = mediaForAcquisition(publication, acquisition, works, view);
    return [
      {
        acquisition,
        ...(media.media === undefined ? {} : { media: media.media }),
        ...(media.metadata === undefined ? {} : { metadata: media.metadata }),
        mediaTitle: media.title,
        ...(media.subtitle === undefined
          ? {}
          : { mediaSubtitle: media.subtitle }),
      },
    ];
  });
}

export function museumAcquisitionStatusLabel(
  status: MuseumAcquisitionViewModel["status"]
): string {
  switch (status) {
    case "proposed_in_museum_wave":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.proposedStatus");
    case "selected_by_museum_wave_acquisition_review_in_progress":
      return t(
        DEFAULT_LOCALE,
        "museum.network.acquisitions.selectedWaveStatus"
      );
    case "selected_through_acquisition_program_acquisition_pending":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.selectedStatus");
    case "acquisition_complete_accession_review_in_progress":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.completeStatus");
    case "accessioned_into_permanent_collection":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.accessionedStatus");
    case "closed_without_selection":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.closedStatus");
    case "withdrawn":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.withdrawnStatus");
  }
  throw new Error(`museum_acquisition_status:${String(status)}`);
}

function museumAcquisitionStatusTone(
  status: MuseumAcquisitionViewModel["status"]
): "neutral" | "success" | "warning" | "danger" {
  if (status === "accessioned_into_permanent_collection") return "success";
  if (status === "closed_without_selection" || status === "withdrawn")
    return "neutral";
  return "warning";
}

function acquisitionMethodLabel(
  acquisition: MuseumAcquisitionViewModel
): string {
  switch (acquisition.acquisitionMethod) {
    case "gift":
    case "donation":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodGift");
    case "program_primary_mint_purchase":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodProgram");
    case "purchase":
      return t(
        DEFAULT_LOCALE,
        acquisition.programId === null
          ? "museum.network.acquisitions.methodPurchase"
          : "museum.network.acquisitions.methodProgram"
      );
    case "bequest":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodBequest");
    case "exchange":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodExchange");
    case "transfer":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodTransfer");
    case "commission":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodCommission");
    default:
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodOther");
  }
}

function acquisitionPathLabel(acquisition: MuseumAcquisitionViewModel): string {
  if (
    acquisition.acquisitionMethod === "gift" ||
    acquisition.acquisitionMethod === "donation"
  ) {
    return t(DEFAULT_LOCALE, "museum.network.acquisitions.caseyMethod");
  }
  if (acquisition.programId !== null) {
    return t(DEFAULT_LOCALE, "museum.network.acquisitions.keysAndGatesMethod");
  }
  return acquisitionMethodLabel(acquisition);
}

function workCountLabel(count: number): string {
  return t(
    DEFAULT_LOCALE,
    count === 1
      ? "museum.network.acquisitions.worksCount.one"
      : "museum.network.acquisitions.worksCount.other",
    { count: String(count) }
  );
}

function MuseumAcquisitionMediaFrame({
  media,
  metadata,
  title,
  eager,
}: {
  readonly media?: MuseumAcquisitionLandingMedia;
  readonly metadata?: MuseumMediaMetadata;
  readonly title: string;
  readonly eager: boolean;
}) {
  if (media === undefined && metadata !== undefined) {
    return <MuseumMediaMetadataPlaceholder title={title} metadata={metadata} />;
  }
  if (media === undefined) {
    return (
      <div className="tw-flex tw-h-full tw-items-end tw-bg-iron-950 tw-p-5">
        <p className="tw-m-0 tw-max-w-xs tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
        </p>
      </div>
    );
  }

  const imageClassName =
    "tw-block tw-h-full tw-w-full tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.01] motion-reduce:tw-transition-none";
  if (media.kind === "governed") {
    return (
      <MuseumManagedImage
        src={media.src}
        {...(media.width === null ? {} : { width: media.width })}
        {...(media.height === null ? {} : { height: media.height })}
        alt={media.alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        sizes="(min-width: 1280px) 56vw, (min-width: 768px) 64vw, 100vw"
        failureMessage={t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
        retryLabel={t(DEFAULT_LOCALE, "museum.network.media.retry")}
        className={imageClassName}
      />
    );
  }
  if (media.kind === "program") {
    return (
      <MuseumProgramImage
        media={media.media}
        sizes="(min-width: 1280px) 56vw, (min-width: 768px) 64vw, 100vw"
        eager={eager}
        className={imageClassName}
      />
    );
  }
  return (
    <MuseumProposalImage
      src={media.src}
      alt={media.alt}
      width={media.width}
      height={media.height}
      sourceByteSize={media.sourceByteSize}
      variants={media.variants}
      eager={eager}
      containerClassName="tw-h-full tw-w-full"
      className={imageClassName}
    />
  );
}

function MuseumAcquisitionLandingMediaCard({
  record,
  eager,
}: {
  readonly record: MuseumAcquisitionLandingRecord;
  readonly eager: boolean;
}) {
  const { acquisition } = record;
  const sourceHref =
    record.media?.kind === "proposal" ? record.media.sourceHref : undefined;
  const displayMediaTitle = /^6529NM[-.]/u.test(record.mediaTitle.trim())
    ? acquisition.title
    : record.mediaTitle;
  const hasDistinctMediaTitle = displayMediaTitle !== acquisition.title;
  return (
    <figure
      className="group tw-m-0 tw-min-w-0"
      data-testid="museum-acquisition-landing-media-card"
    >
      <div
        className="tw-flex tw-aspect-[4/3] tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 lg:tw-aspect-[4/5]"
        data-testid="museum-acquisition-media-stage"
      >
        <MuseumAcquisitionMediaFrame
          {...(record.media === undefined ? {} : { media: record.media })}
          {...(record.metadata === undefined
            ? {}
            : { metadata: record.metadata })}
          title={displayMediaTitle}
          eager={eager}
        />
      </div>
      <figcaption className="tw-pt-4 lg:tw-min-h-44">
        {hasDistinctMediaTitle ? (
          <span className="tw-block tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-100">
            {displayMediaTitle}
          </span>
        ) : null}
        {record.mediaSubtitle === undefined ? null : (
          <span className="tw-mt-1 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
            {record.mediaSubtitle}
          </span>
        )}
        {record.media?.creditLine === undefined ? null : (
          <span className="tw-mt-3 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
            {record.media.creditLine}
          </span>
        )}
        {sourceHref === undefined ? null : (
          <a
            href={sourceHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:tw-text-primary-200 tw-mt-2 tw-inline-flex tw-min-h-11 tw-items-center tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.openPresentation")}
          </a>
        )}
      </figcaption>
    </figure>
  );
}

function pathwayRelation(acquisition: MuseumAcquisitionViewModel) {
  return acquisition.secondaryRelations.find(
    (item) => item.kind === "acquisition_program"
  );
}

function editorialOrder(
  records: readonly MuseumAcquisitionLandingRecord[]
): readonly MuseumAcquisitionLandingRecord[] {
  return [...records].sort((left, right) => {
    const leftIsGift =
      left.acquisition.acquisitionMethod === "gift" ||
      left.acquisition.acquisitionMethod === "donation";
    const rightIsGift =
      right.acquisition.acquisitionMethod === "gift" ||
      right.acquisition.acquisitionMethod === "donation";
    if (leftIsGift !== rightIsGift) return leftIsGift ? -1 : 1;
    const leftIsAccessioned =
      left.acquisition.status === "accessioned_into_permanent_collection";
    const rightIsAccessioned =
      right.acquisition.status === "accessioned_into_permanent_collection";
    if (leftIsAccessioned !== rightIsAccessioned) {
      return leftIsAccessioned ? -1 : 1;
    }
    return 0;
  });
}

function AcquisitionFeature({
  record,
  index,
}: {
  readonly record: MuseumAcquisitionLandingRecord;
  readonly index: number;
}) {
  const { acquisition } = record;
  const href = museumAcquisitionHref(acquisition.slug);
  const program = pathwayRelation(acquisition);
  return (
    <article
      className="tw-flex tw-h-full tw-min-w-0 tw-flex-col"
      data-testid="museum-acquisition-card"
    >
      <MuseumAcquisitionLandingMediaCard record={record} eager={index < 3} />
      <div className="tw-mt-5 tw-flex tw-flex-1 tw-flex-col">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.acquisitions.eyebrow")}
        </p>
        <h2 className="tw-m-0 tw-mt-3 tw-max-w-xl tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-[-0.02em] tw-text-iron-50 sm:tw-text-3xl">
          <Link
            href={href}
            className="hover:tw-text-primary-200 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {acquisition.title}
          </Link>
        </h2>
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
          <MuseumStatusBadge
            label={museumAcquisitionStatusLabel(acquisition.status)}
            tone={museumAcquisitionStatusTone(acquisition.status)}
          />
          <span className="tw-text-sm tw-leading-6 tw-text-iron-400">
            {acquisitionPathLabel(acquisition)}
          </span>
        </div>
        <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
          {acquisition.thesis}
        </p>
        <dl className="tw-mt-5 tw-grid tw-grid-cols-2 tw-gap-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4">
          <div>
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.acquisitions.works")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-200">
              {workCountLabel(acquisition.workIds.length)}
            </dd>
          </div>
          <div>
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.acquisitions.method")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-200">
              {acquisitionMethodLabel(acquisition)}
            </dd>
          </div>
        </dl>
        <div className="tw-mt-auto tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-2 tw-pt-4">
          <Link
            href={href}
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.read")}
            <span aria-hidden="true" className="tw-ml-2">
              →
            </span>
          </Link>
          {program === undefined ? null : (
            <Link
              href={program.href}
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {program.label}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function MuseumAcquisitionLandingPage({
  records,
}: {
  readonly records: readonly MuseumAcquisitionLandingRecord[];
}) {
  if (records.length === 0) return null;
  const orderedRecords = editorialOrder(records);

  return (
    <div className="tw-min-w-0 tw-space-y-20 sm:tw-space-y-28">
      <header
        className="tw-min-w-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-12 sm:tw-pb-16"
        aria-labelledby="museum-acquisitions-title"
      >
        <div className="tw-max-w-3xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.eyebrow")}
          </p>
          <h1
            id="museum-acquisitions-title"
            className="tw-m-0 tw-mt-4 tw-text-4xl tw-font-semibold tw-leading-[0.98] tw-tracking-[-0.035em] tw-text-iron-50 sm:tw-text-6xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.title")}
          </h1>
          <p className="tw-m-0 tw-mt-6 tw-max-w-2xl tw-text-lg tw-leading-8 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.description")}
          </p>
          <div className="tw-mt-8 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <Link
              href="/museum/network/collection"
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-bg-primary-500 tw-px-5 tw-text-sm tw-font-semibold tw-text-black tw-no-underline hover:tw-bg-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
            >
              {t(DEFAULT_LOCALE, "museum.network.home.exploreCollection")}
            </Link>
            <Link
              href="/museum/network/acquisition-programs"
              className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.title")}
              <span aria-hidden="true" className="tw-ml-2">
                →
              </span>
            </Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="acquisition-units-title">
        <div className="tw-max-w-3xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.statusEyebrow")}
          </p>
          <h2
            id="acquisition-units-title"
            className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-[-0.02em] tw-text-iron-50 sm:tw-text-4xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.currentTitle")}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "museum.network.acquisitions.currentDescription"
            )}
          </p>
        </div>
        <div className="tw-mt-8 tw-grid tw-min-w-0 tw-gap-x-8 tw-gap-y-12 lg:tw-grid-cols-3">
          {orderedRecords.map((record, index) => (
            <AcquisitionFeature
              key={record.acquisition.acquisitionId}
              record={record}
              index={index}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
