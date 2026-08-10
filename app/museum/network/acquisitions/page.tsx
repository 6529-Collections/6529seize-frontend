import type { Metadata } from "next";
import Link from "next/link";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumProgramImage } from "@/components/museum/MuseumProgramImage";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
import { MuseumPublicWorkTextFigure } from "@/components/museum/MuseumPublicWorkTextFigure";
import { MuseumMediaMetadataPlaceholder } from "@/components/museum/MuseumMediaMetadataPlaceholder";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  buildMuseumAcquisitionIndex,
  type MuseumAcquisitionViewModel,
  type MuseumPublicAcquisitionStatus,
} from "@/lib/museum/publication/ia";
import {
  museumAcquisitionHref,
  museumWorkHref,
} from "@/lib/museum/publication/routes";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import { tryCaseyArtworksFromPublication } from "@/lib/museum/casey";
import type {
  MuseumPublication,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import type { MuseumView } from "@/lib/museum/types";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.acquisitions.title"),
    description: t(DEFAULT_LOCALE, "museum.network.acquisitions.description"),
  }),
  alternates: { canonical: "/museum/network/acquisitions" },
};

function statusLabel(status: MuseumPublicAcquisitionStatus): string {
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

function workCountLabel(count: number): string {
  return t(
    DEFAULT_LOCALE,
    count === 1
      ? "museum.network.acquisitions.worksCount.one"
      : "museum.network.acquisitions.worksCount.other",
    { count: formatInteger(DEFAULT_LOCALE, count) }
  );
}

function acquisitionMethodLabel(
  method: string,
  programId: string | null
): string {
  switch (method) {
    case "gift":
    case "donation":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodGift");
    case "program_primary_mint_purchase":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodProgram");
    case "purchase":
      return t(
        DEFAULT_LOCALE,
        programId === null
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

type AcquisitionFilter = "all" | "proposed" | "selected" | "accessioned";

function matchesFilter(
  status: MuseumPublicAcquisitionStatus,
  filter: AcquisitionFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "proposed") {
    return (
      status === "proposed_in_museum_wave" ||
      status === "closed_without_selection"
    );
  }
  if (filter === "accessioned")
    return status === "accessioned_into_permanent_collection";
  return (
    status === "selected_by_museum_wave_acquisition_review_in_progress" ||
    status === "selected_through_acquisition_program_acquisition_pending" ||
    status === "acquisition_complete_accession_review_in_progress"
  );
}

function parseFilter(value: string | undefined): AcquisitionFilter {
  return value === "proposed" || value === "selected" || value === "accessioned"
    ? value
    : "all";
}

function typedAcquisitionWorkPreview(input: {
  readonly work: MuseumPublicWork;
  readonly publication: MuseumPublication;
  readonly acquisitionHref: string;
  readonly acquisitionTitle: string;
  readonly eager: boolean;
}) {
  const { work, publication, acquisitionHref, acquisitionTitle, eager } = input;
  const media = selectMuseumStillMedia(work.media);
  const mediaMetadata = work.mediaMetadata?.[0];
  const artist = publication.artists.find((item) => item.id === work.artistId);
  if (media !== undefined) {
    return (
      <MuseumPublicMediaFigure
        src={media.url}
        width={media.width}
        height={media.height}
        alt={media.altText ?? ""}
        href={acquisitionHref}
        title={acquisitionTitle}
        byline={artist?.preferredName ?? ""}
        eager={eager}
      />
    );
  }
  if (mediaMetadata === undefined) return null;
  return (
    <figure className="tw-m-0 tw-min-w-0">
      <MuseumMediaMetadataPlaceholder
        title={work.title}
        metadata={mediaMetadata}
      />
      <figcaption className="tw-border-b tw-border-solid tw-border-iron-800 tw-py-4">
        <Link
          href={museumWorkHref(work.id)}
          className="hover:tw-text-primary-200 tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {work.title}
        </Link>
        <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
          {artist?.preferredName ?? work.artistId}
        </span>
      </figcaption>
    </figure>
  );
}

function AcquisitionProposalPreview({
  proposal,
  eager,
}: {
  readonly proposal: MuseumAcquisitionViewModel["presentationMedia"][number];
  readonly eager: boolean;
}) {
  const sourceHref = buildMuseumSignedWaveStormDropUrl(
    proposal.source.waveId,
    proposal.source.dropId
  );
  const canOpenPresentation = proposal.affordances.includes(
    "open_upstream_presentation"
  );
  return (
    <figure className="tw-m-0 tw-min-w-0">
      <div className="tw-block">
        <div className="tw-aspect-square tw-overflow-hidden tw-bg-black">
          <MuseumProposalImage
            src={proposal.mediaUrl}
            alt={proposal.altText}
            width={proposal.width}
            height={proposal.height}
            {...(proposal.sourceByteSize === undefined
              ? {}
              : { sourceByteSize: proposal.sourceByteSize })}
            {...(sourceHref === null || !canOpenPresentation
              ? {}
              : {
                  sourceHref,
                  sourceLabel: t(
                    DEFAULT_LOCALE,
                    "museum.network.acquisitions.openPresentation"
                  ),
                })}
            eager={eager}
            className="tw-block tw-h-full tw-w-full tw-object-contain"
          />
        </div>
      </div>
      <figcaption className="tw-border-b tw-border-solid tw-border-iron-800 tw-py-4 tw-text-sm tw-leading-6 tw-text-iron-400">
        <span className="tw-block tw-text-iron-200">
          {proposal.credit.creditLine}
        </span>
        <span className="tw-mt-1 tw-block">
          {t(DEFAULT_LOCALE, "museum.network.acquisitions.presentationRights")}
        </span>
        {sourceHref === null || !canOpenPresentation ? null : (
          <span className="tw-mt-1 tw-block">
            {t(
              DEFAULT_LOCALE,
              "museum.network.acquisitions.presentationSource"
            )}
            :{" "}
            <a
              href={sourceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {t(
                DEFAULT_LOCALE,
                "museum.network.acquisitions.openPresentation"
              )}
            </a>
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function legacyAcquisitionPreview(input: {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
  readonly href: string;
  readonly eager: boolean;
}) {
  const { acquisition, publication, view, href, eager } = input;
  const legacyArtwork = publication.artworks.find((artwork) =>
    acquisition.workIds.includes(artwork.id)
  );
  const caseyArtworks = tryCaseyArtworksFromPublication(publication);
  const caseyArtwork = caseyArtworks?.find(
    (artwork) => artwork.objectId === legacyArtwork?.id
  );
  if (caseyArtwork !== undefined) {
    return (
      <MuseumArtworkFigure
        artwork={caseyArtwork}
        href={href}
        eager={eager}
        sizes="(min-width: 1024px) 40vw, 100vw"
      />
    );
  }
  const outcome = view?.objects.find((object) =>
    acquisition.workIds.includes(object.objectId)
  );
  if (outcome?.media === null || outcome?.media === undefined) return null;
  return (
    <Link
      href={href}
      className="tw-group tw-block tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
    >
      <div className="tw-aspect-square tw-overflow-hidden tw-bg-black">
        <MuseumProgramImage
          media={outcome.media}
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="tw-h-full tw-w-full tw-object-contain"
        />
      </div>
      <p className="group-hover:tw-text-primary-200 tw-m-0 tw-mt-3 tw-text-base tw-font-semibold tw-text-iron-50">
        {outcome.title}
      </p>
    </Link>
  );
}

function AcquisitionPreview({
  acquisition,
  publication,
  view,
  eager = false,
}: {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
  readonly eager?: boolean;
}) {
  const href = museumAcquisitionHref(acquisition.slug);
  const typedWork = publication.works?.find((work) =>
    acquisition.workIds.includes(work.id)
  );
  if (typedWork !== undefined) {
    const typedPreview = typedAcquisitionWorkPreview({
      work: typedWork,
      publication,
      acquisitionHref: href,
      acquisitionTitle: acquisition.title,
      eager,
    });
    if (typedPreview !== null) return typedPreview;
  }
  const proposal = acquisition.presentationMedia[0];
  if (proposal !== undefined) {
    return <AcquisitionProposalPreview proposal={proposal} eager={eager} />;
  }
  if (publication.works !== undefined) {
    if (typedWork === undefined) return null;
    const artist = publication.artists.find(
      (item) => item.id === typedWork.artistId
    );
    return (
      <MuseumPublicWorkTextFigure
        title={typedWork.title}
        href={museumWorkHref(typedWork.id)}
        {...(artist === undefined ? {} : { byline: artist.preferredName })}
      />
    );
  }
  return legacyAcquisitionPreview({
    acquisition,
    publication,
    view,
    href,
    eager,
  });
}

function AcquisitionEditorialRow({
  acquisition,
  publication,
  view,
  eager = false,
}: {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
  readonly eager?: boolean;
}) {
  return (
    <article className="tw-grid tw-gap-7 tw-border-b tw-border-solid tw-border-iron-800 tw-py-8 first:tw-pt-0 md:tw-grid-cols-[minmax(13rem,0.7fr)_minmax(0,1.3fr)] md:tw-gap-10">
      <AcquisitionPreview
        acquisition={acquisition}
        publication={publication}
        view={view}
        eager={eager}
      />
      <div className="tw-min-w-0">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.acquisitions.eyebrow")}
        </p>
        <h2 className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl">
          <Link
            href={museumAcquisitionHref(acquisition.slug)}
            className="hover:tw-text-primary-200 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {acquisition.title}
          </Link>
        </h2>
        <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {acquisition.thesis}
        </p>
        <p className="tw-m-0 tw-mt-5 tw-text-sm tw-leading-6 tw-text-iron-500">
          {statusLabel(acquisition.status)}
        </p>
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-500">
          {acquisitionMethodLabel(
            acquisition.acquisitionMethod,
            acquisition.programId
          )}{" "}
          · {workCountLabel(acquisition.workIds.length)}
        </p>
        <Link
          href={museumAcquisitionHref(acquisition.slug)}
          className="hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(DEFAULT_LOCALE, "museum.network.acquisitions.read")}
        </Link>
      </div>
    </article>
  );
}

export default async function MuseumAcquisitionsPage({
  searchParams,
}: {
  readonly searchParams?: Promise<{ status?: string }>;
}) {
  const { publicationState, view } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (publication === null) return <MuseumPublicationUnavailable />;
  const filter = parseFilter((await searchParams)?.status);
  const acquisitions = buildMuseumAcquisitionIndex(publication, view).filter(
    (acquisition) => matchesFilter(acquisition.status, filter)
  );

  return (
    <section>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.acquisitions.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.acquisitions.title")}
        description={t(
          DEFAULT_LOCALE,
          "museum.network.acquisitions.description"
        )}
      />
      <nav
        aria-label={t(
          DEFAULT_LOCALE,
          "museum.network.acquisitions.filterLabel"
        )}
        className="tw-mb-10 tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-2 tw-border-b tw-border-t tw-border-solid tw-border-iron-800 tw-py-4"
      >
        {(["all", "proposed", "selected", "accessioned"] as const).map(
          (value) => {
            const labels = {
              all: "museum.network.acquisitions.filterAll",
              proposed: "museum.network.acquisitions.filterProposed",
              selected: "museum.network.acquisitions.filterSelected",
              accessioned: "museum.network.acquisitions.filterAccessioned",
            } as const;
            return (
              <Link
                key={value}
                href={
                  value === "all"
                    ? "/museum/network/acquisitions"
                    : `/museum/network/acquisitions?status=${value}`
                }
                aria-current={filter === value ? "page" : undefined}
                className={`tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${filter === value ? "tw-text-primary-300" : "tw-text-iron-400 hover:tw-text-white"}`}
              >
                {t(DEFAULT_LOCALE, labels[value])}
              </Link>
            );
          }
        )}
      </nav>
      {acquisitions.length === 0 ? (
        <p className="tw-m-0 tw-border-l-2 tw-border-yellow-400 tw-pl-5 tw-text-sm tw-leading-6 tw-text-yellow-100">
          {t(DEFAULT_LOCALE, "museum.network.acquisitions.noRecords")}
        </p>
      ) : (
        <div>
          {acquisitions.map((acquisition, index) => (
            <AcquisitionEditorialRow
              key={acquisition.acquisitionId}
              acquisition={acquisition}
              publication={publication}
              view={view}
              eager={index === 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}
