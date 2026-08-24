import Link from "next/link";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumNetworkHomeSecondarySections } from "@/components/museum/MuseumNetworkHomeSecondarySections";
import { MuseumProgramImage } from "@/components/museum/MuseumProgramImage";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
import { MuseumPublicWorkTextFigure } from "@/components/museum/MuseumPublicWorkTextFigure";
import { MuseumMediaMetadataPlaceholder } from "@/components/museum/MuseumMediaMetadataPlaceholder";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ARTIST_NAME,
  type CaseyArtwork,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import {
  buildMuseumAcquisitionIndex,
  type MuseumAcquisitionViewModel,
  type MuseumPublicAcquisitionStatus,
} from "@/lib/museum/publication/ia";
import {
  museumAcquisitionHref,
  museumWorkHref,
  museumWorkHrefForSourceId,
} from "@/lib/museum/publication/routes";
import type {
  MuseumPublication,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import type { MuseumView } from "@/lib/museum/types";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication";
import {
  museumMediaResponsiveImage,
  selectMuseumStillMedia,
} from "@/lib/museum/publication/mediaSelection";
import { formatMuseumCreatorCredit } from "@/lib/museum/presentation";
import { VERA_MOLNAR_OBJECT_ID } from "@/lib/museum/publication/veraMolnarPublication";

const PRIMARY_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-600 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-no-underline hover:tw-border-primary-400 hover:tw-bg-primary-500 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black";
const HERO_EDITORIAL_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors tw-duration-150 hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black";
const TEXT_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";
const MUSEUM_OPEN_PRESENTATION_MESSAGE =
  "museum.network.acquisitions.openPresentation";
const EMPTY_EXCLUDED_WORK_IDS: readonly string[] = [];

function MuseumHomeHero({
  artwork,
  publication,
}: {
  readonly artwork: CaseyArtwork;
  readonly publication: MuseumPublication;
}) {
  const href = museumWorkHrefForSourceId(publication, artwork.objectId);
  return (
    <section aria-labelledby="museum-home-title">
      <div className="tw-grid tw-gap-8 lg:tw-grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] lg:tw-grid-rows-[auto_auto] lg:tw-gap-x-12 lg:tw-gap-y-0">
        <div className="tw-max-w-2xl lg:tw-row-start-1 lg:tw-self-center">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.home.eyebrow")}
          </p>
          <h1
            id="museum-home-title"
            className="tw-m-0 tw-mt-4 tw-text-4xl tw-font-semibold tw-leading-[0.98] tw-tracking-[-0.02em] tw-text-iron-50 sm:tw-text-5xl xl:tw-text-6xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.home.title")}
          </h1>
          <p className="tw-m-0 tw-mt-5 tw-text-[18px] tw-leading-[1.52] tw-text-[#c8c8c8]">
            {t(DEFAULT_LOCALE, "museum.network.home.intro")}
          </p>
          <p className="tw-m-0 tw-mt-4 tw-text-[17px] tw-leading-[1.55] tw-text-iron-400">
            {t(DEFAULT_LOCALE, "museum.network.home.principle")}
          </p>
          <div className="tw-mt-7 tw-flex tw-flex-wrap tw-gap-3">
            <Link
              href="/museum/network/collection"
              className={PRIMARY_LINK_CLASS}
            >
              {t(DEFAULT_LOCALE, "museum.network.home.exploreCollection")}
            </Link>
            <Link
              href="/museum/network/about"
              className={HERO_EDITORIAL_LINK_CLASS}
            >
              <span>{t(DEFAULT_LOCALE, "museum.network.home.howItWorks")}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <MuseumArtworkFigure
          artwork={artwork}
          artistName={CASEY_ARTIST_NAME}
          captionVariant="hero"
          eager
          {...(href === null ? {} : { href })}
          sizes="(min-width: 1024px) 58vw, 100vw"
        />
      </div>
    </section>
  );
}

function museumTypedWorkArtistByline(
  work: MuseumPublicWork,
  publication: MuseumPublication
): string {
  const artistIds =
    work.artistIds !== undefined && work.artistIds.length > 0
      ? work.artistIds
      : [work.artistId];
  const names = [...new Set(artistIds)].flatMap((artistId) => {
    const artist = publication.artists.find((item) => item.id === artistId);
    return artist === undefined ? [] : [artist.preferredName];
  });
  return formatMuseumCreatorCredit(names);
}

function MuseumTypedWorkFigure({
  work,
  publication,
  eager = false,
}: {
  readonly work: MuseumPublicWork;
  readonly publication: MuseumPublication;
  readonly eager?: boolean;
}) {
  const project =
    work.projectId === null
      ? null
      : publication.projects.find((item) => item.id === work.projectId);
  const href = museumWorkHref(work.id);
  const displayTitle = /^6529NM[-.]/u.test(work.title.trim())
    ? t(DEFAULT_LOCALE, "museum.network.collection.untitledWork")
    : work.title;
  const byline = [
    museumTypedWorkArtistByline(work, publication),
    project?.title,
  ]
    .filter(
      (value): value is string => value !== undefined && value.trim().length > 0
    )
    .join(" · ");
  const media = selectMuseumStillMedia(work.media);
  if (media !== undefined) {
    const responsive = museumMediaResponsiveImage(media);
    const mediaAltText = media.altText?.trim();
    return (
      <MuseumPublicMediaFigure
        src={responsive.src}
        {...(responsive.srcSet === undefined
          ? {}
          : { srcSet: responsive.srcSet })}
        width={media.width}
        height={media.height}
        alt={
          mediaAltText === undefined || mediaAltText.length === 0
            ? displayTitle
            : mediaAltText
        }
        href={href}
        title={displayTitle}
        byline={byline}
        eager={eager}
        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
      />
    );
  }
  const presentation = work.presentationMedia?.[0];
  if (presentation !== undefined) {
    const sourceHref = buildMuseumSignedWaveStormDropUrl(
      presentation.source.waveId,
      presentation.source.dropId
    );
    const canOpenPresentation = presentation.affordances.includes(
      "open_upstream_presentation"
    );
    return (
      <figure className="tw-group tw-m-0 tw-min-w-0">
        <div className="tw-aspect-square tw-overflow-hidden tw-rounded-xl tw-bg-black">
          <MuseumProposalImage
            src={presentation.mediaUrl}
            alt={presentation.altText || displayTitle}
            width={presentation.width}
            height={presentation.height}
            sourceByteSize={presentation.sourceByteSize}
            variants={presentation.variants}
            requireIntentForLargeSource={false}
            optimizeSource
            eager={eager}
            {...(sourceHref === null || !canOpenPresentation
              ? {}
              : {
                  sourceHref,
                  sourceLabel: t(
                    DEFAULT_LOCALE,
                    MUSEUM_OPEN_PRESENTATION_MESSAGE
                  ),
                })}
            className="tw-block tw-h-full tw-w-full tw-object-contain"
          />
        </div>
        <figcaption className="tw-pt-4">
          <Link
            href={href}
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {displayTitle}
          </Link>
          {byline ? (
            <span className="tw-mt-1 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
              {byline}
            </span>
          ) : null}
          <span className="tw-mt-3 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
            {presentation.credit.creditLine}
          </span>
          {sourceHref === null || !canOpenPresentation ? null : (
            <a
              href={sourceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:tw-text-primary-200 tw-mt-2 tw-inline-flex tw-min-h-11 tw-items-center tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {t(DEFAULT_LOCALE, MUSEUM_OPEN_PRESENTATION_MESSAGE)}
            </a>
          )}
        </figcaption>
      </figure>
    );
  }
  const metadata = work.mediaMetadata?.[0];
  return (
    <figure className="tw-m-0 tw-min-w-0">
      {metadata === undefined ? (
        <div className="tw-flex tw-aspect-square tw-items-end tw-bg-black tw-p-5">
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
          </p>
        </div>
      ) : (
        <MuseumMediaMetadataPlaceholder
          title={displayTitle}
          metadata={metadata}
        />
      )}
      <figcaption className="tw-pt-4">
        <Link
          href={href}
          className="hover:tw-text-primary-200 tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {displayTitle}
        </Link>
        {byline ? (
          <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
            {byline}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}

function MuseumTypedHomeHero({
  work,
  publication,
}: {
  readonly work: MuseumPublicWork;
  readonly publication: MuseumPublication;
}) {
  return (
    <section aria-labelledby="museum-home-title">
      <div className="tw-grid tw-gap-8 lg:tw-grid-cols-[minmax(18rem,1.2fr)_minmax(0,0.8fr)] lg:tw-items-center lg:tw-gap-x-12">
        <MuseumTypedWorkFigure work={work} publication={publication} eager />
        <div className="tw-max-w-2xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.home.eyebrow")}
          </p>
          <h1
            id="museum-home-title"
            className="tw-m-0 tw-mt-4 tw-text-4xl tw-font-semibold tw-leading-[0.98] tw-tracking-[-0.02em] tw-text-iron-50 sm:tw-text-5xl xl:tw-text-6xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.home.title")}
          </h1>
          <p className="tw-m-0 tw-mt-5 tw-text-[18px] tw-leading-[1.52] tw-text-[#c8c8c8]">
            {t(DEFAULT_LOCALE, "museum.network.home.intro")}
          </p>
          <p className="tw-m-0 tw-mt-4 tw-text-[17px] tw-leading-[1.55] tw-text-iron-400">
            {t(DEFAULT_LOCALE, "museum.network.home.principle")}
          </p>
          <div className="tw-mt-7 tw-flex tw-flex-wrap tw-gap-3">
            <Link
              href="/museum/network/collection"
              className={PRIMARY_LINK_CLASS}
            >
              {t(DEFAULT_LOCALE, "museum.network.home.exploreCollection")}
            </Link>
            <Link
              href="/museum/network/about"
              className={HERO_EDITORIAL_LINK_CLASS}
            >
              <span>{t(DEFAULT_LOCALE, "museum.network.home.howItWorks")}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MuseumTypedNetworkHome({
  publication,
  view,
}: {
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
}) {
  const collectionWorks = (publication.works ?? []).filter(
    (work) => work.collectionMembership === true
  );
  const featuredWork =
    collectionWorks.find((work) =>
      work.sourceRecordIds?.includes(VERA_MOLNAR_OBJECT_ID)
    ) ?? collectionWorks[0];
  if (featuredWork === undefined) return <MuseumPublicationUnavailable />;
  return (
    <div className="tw-min-w-0 tw-space-y-20 sm:tw-space-y-28">
      <MuseumTypedHomeHero work={featuredWork} publication={publication} />
      <MuseumAcquisitionStories publication={publication} view={view} />
      <MuseumNetworkHomeSecondarySections />
    </div>
  );
}

function MuseumCaseyPresentation({
  artworks,
  publication,
}: {
  readonly artworks: readonly CaseyArtwork[];
  readonly publication: MuseumPublication;
}) {
  return (
    <section aria-labelledby="museum-casey-title">
      <div className="tw-mb-8 tw-grid tw-gap-5 md:tw-grid-cols-[minmax(0,1fr)_minmax(17rem,0.55fr)] md:tw-items-end">
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.home.firstGift")}
          </p>
          <h2
            id="museum-casey-title"
            className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.home.caseyTitle")}
          </h2>
        </div>
        <div>
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.home.caseySummary")}
          </p>
          <Link
            href="/museum/network/acquisitions/the-system-in-seven-states"
            className={`${TEXT_LINK_CLASS} tw-mt-4`}
          >
            {t(DEFAULT_LOCALE, "museum.network.home.readGift")}
          </Link>
        </div>
      </div>
      <div className="tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-10 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        {artworks.map((artwork) => {
          const href = museumWorkHrefForSourceId(publication, artwork.objectId);
          return (
            <MuseumArtworkFigure
              key={artwork.objectId}
              artwork={artwork}
              {...(href === null ? {} : { href })}
              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
            />
          );
        })}
      </div>
    </section>
  );
}

function acquisitionStatusLabel(status: MuseumPublicAcquisitionStatus): string {
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
}

function typedAcquisitionStoryWork(input: {
  readonly work: MuseumPublicWork;
  readonly publication: MuseumPublication;
}) {
  const { work, publication } = input;
  if (
    selectMuseumStillMedia(work.media) === undefined &&
    work.presentationMedia?.[0] === undefined &&
    work.mediaMetadata?.[0] === undefined
  ) {
    return null;
  }
  return <MuseumTypedWorkFigure work={work} publication={publication} />;
}

function MuseumAcquisitionProposalFigure({
  presentation,
}: {
  readonly presentation: MuseumAcquisitionViewModel["presentationMedia"][number];
}) {
  const sourceHref = buildMuseumSignedWaveStormDropUrl(
    presentation.source.waveId,
    presentation.source.dropId
  );
  const canOpenPresentation = presentation.affordances.includes(
    "open_upstream_presentation"
  );
  return (
    <figure className="tw-m-0 tw-min-w-0">
      <div className="tw-block">
        <div className="tw-aspect-square tw-overflow-hidden tw-bg-black">
          <MuseumProposalImage
            src={presentation.mediaUrl}
            alt={presentation.altText}
            width={presentation.width}
            height={presentation.height}
            sourceByteSize={presentation.sourceByteSize}
            variants={presentation.variants}
            {...(sourceHref === null || !canOpenPresentation
              ? {}
              : {
                  sourceHref,
                  sourceLabel: t(
                    DEFAULT_LOCALE,
                    MUSEUM_OPEN_PRESENTATION_MESSAGE
                  ),
                })}
            className="tw-block tw-h-full tw-w-full tw-object-contain"
          />
        </div>
      </div>
      <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4 tw-text-sm tw-leading-6 tw-text-iron-400">
        <span className="tw-block tw-text-iron-200">
          {presentation.credit.creditLine}
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
              {t(DEFAULT_LOCALE, MUSEUM_OPEN_PRESENTATION_MESSAGE)}
            </a>
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function legacyAcquisitionStoryMedia(input: {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
  readonly href: string;
  readonly excludeWorkIds: readonly string[];
}) {
  const { acquisition, publication, view, href, excludeWorkIds } = input;
  const caseyArtwork = tryCaseyArtworksFromPublication(publication)?.find(
    (artwork) =>
      acquisition.workIds.includes(artwork.objectId) &&
      !excludeWorkIds.includes(artwork.objectId)
  );
  if (caseyArtwork !== undefined) {
    return (
      <MuseumArtworkFigure
        artwork={caseyArtwork}
        href={href}
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

function MuseumAcquisitionStoryMedia({
  acquisition,
  publication,
  view,
  excludeWorkIds,
}: {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
  readonly excludeWorkIds: readonly string[];
}) {
  const href = museumAcquisitionHref(acquisition.slug);
  const typedWork = publication.works?.find(
    (work) =>
      acquisition.workIds.includes(work.id) && !excludeWorkIds.includes(work.id)
  );
  if (typedWork !== undefined) {
    const typedPreview = typedAcquisitionStoryWork({
      work: typedWork,
      publication,
    });
    if (typedPreview !== null) return typedPreview;
  }
  const presentation = acquisition.presentationMedia[0];
  if (presentation !== undefined) {
    return <MuseumAcquisitionProposalFigure presentation={presentation} />;
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
  return legacyAcquisitionStoryMedia({
    acquisition,
    publication,
    view,
    href,
    excludeWorkIds,
  });
}

function MuseumAcquisitionStories({
  publication,
  view,
  excludeWorkIds = EMPTY_EXCLUDED_WORK_IDS,
}: {
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
  readonly excludeWorkIds?: readonly string[];
}) {
  const acquisitions = buildMuseumAcquisitionIndex(publication, view).filter(
    (acquisition) =>
      !acquisition.workIds.some((workId) => excludeWorkIds.includes(workId))
  );
  if (acquisitions.length === 0) return null;
  return (
    <section
      aria-labelledby="museum-acquisition-stories-title"
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
    >
      <div className="tw-grid tw-gap-5 md:tw-grid-cols-[minmax(0,1fr)_minmax(17rem,0.75fr)] md:tw-items-end">
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.home.acquisitionStoriesEyebrow")}
          </p>
          <h2
            id="museum-acquisition-stories-title"
            className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-4xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.home.acquisitionStoriesTitle")}
          </h2>
        </div>
        <div>
          <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "museum.network.home.acquisitionStoriesDescription"
            )}
          </p>
          <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-1">
            <Link href="/museum/network/collection" className={TEXT_LINK_CLASS}>
              {t(DEFAULT_LOCALE, "museum.network.home.collection.allWorks")}
            </Link>
            <Link
              href="/museum/network/acquisitions"
              className={TEXT_LINK_CLASS}
            >
              {t(DEFAULT_LOCALE, "museum.network.home.browseAcquisitions")}
            </Link>
          </div>
        </div>
      </div>
      <div className="tw-mt-8 tw-grid tw-gap-x-8 tw-gap-y-10 md:tw-grid-cols-2 xl:tw-grid-cols-4">
        {acquisitions.map((acquisition) => (
          <article key={acquisition.acquisitionId} className="tw-min-w-0">
            <MuseumAcquisitionStoryMedia
              acquisition={acquisition}
              publication={publication}
              view={view}
              excludeWorkIds={excludeWorkIds}
            />
            <div className="tw-mt-4">
              <h3 className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-50">
                <Link
                  href={museumAcquisitionHref(acquisition.slug)}
                  className="hover:tw-text-primary-200 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {acquisition.title}
                </Link>
              </h3>
              <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
                {acquisition.thesis}
              </p>
              <p className="tw-m-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-500">
                {acquisitionStatusLabel(acquisition.status)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function MuseumNetworkPage() {
  const { publicationState, view } = await getMuseumPublicationBundle();
  if (publicationState.publication === null)
    return <MuseumPublicationUnavailable />;
  if (publicationState.publication.works !== undefined) {
    return (
      <MuseumTypedNetworkHome
        publication={publicationState.publication}
        view={view}
      />
    );
  }
  const artworks = tryCaseyArtworksFromPublication(
    publicationState.publication
  );
  if (artworks === null) return <MuseumPublicationUnavailable />;
  const featuredArtwork = artworks.find(
    (artwork) => artwork.objectId === "6529NM.2026.001.01"
  );
  if (featuredArtwork === undefined) return <MuseumPublicationUnavailable />;
  const supportingArtworks = artworks.filter(
    (artwork) => artwork.objectId !== featuredArtwork.objectId
  );

  return (
    <div className="tw-min-w-0 tw-space-y-20 sm:tw-space-y-28">
      <MuseumHomeHero
        artwork={featuredArtwork}
        publication={publicationState.publication}
      />
      <MuseumCaseyPresentation
        artworks={supportingArtworks}
        publication={publicationState.publication}
      />
      <MuseumAcquisitionStories
        publication={publicationState.publication}
        view={view}
        excludeWorkIds={[featuredArtwork.objectId]}
      />
      <MuseumNetworkHomeSecondarySections />
    </div>
  );
}
