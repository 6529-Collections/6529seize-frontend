import Link from "next/link";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumProgramImage } from "@/components/museum/MuseumProgramImage";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
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
  MUSEUM_REPOSITORY_URL,
  MUSEUM_SAFE_ETHERSCAN_URL,
} from "@/lib/museum/types";

const PRIMARY_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-600 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-no-underline hover:tw-border-primary-400 hover:tw-bg-primary-500 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black";
const HERO_EDITORIAL_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors tw-duration-150 hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black";
const TEXT_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

const INSTITUTIONAL_FACTS = [
  "museum.network.home.fact.held",
  "museum.network.home.fact.governed",
  "museum.network.home.fact.ethereum",
  "museum.network.home.fact.open",
] as const;

const COLLECTION_PATHS = [
  {
    titleKey: "museum.network.home.collection.allWorks",
    descriptionKey: "museum.network.home.collection.allWorksDescription",
    href: "/museum/network/collection",
  },
  {
    titleKey: "museum.network.home.collection.artists",
    descriptionKey: "museum.network.home.collection.artistsDescription",
    href: "/museum/network/artists",
  },
  {
    titleKey: "museum.network.home.collection.projects",
    descriptionKey: "museum.network.home.collection.projectsDescription",
    href: "/museum/network/projects/century",
  },
] as const;

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

function MuseumTypedWorkFigure({
  work,
  publication,
  eager = false,
}: {
  readonly work: MuseumPublicWork;
  readonly publication: MuseumPublication;
  readonly eager?: boolean;
}) {
  const artist = publication.artists.find((item) => item.id === work.artistId);
  const project =
    work.projectId === null
      ? null
      : publication.projects.find((item) => item.id === work.projectId);
  const href = museumWorkHref(work.id);
  const byline = [artist?.preferredName, project?.title]
    .filter(
      (value): value is string => value !== undefined && value.trim().length > 0
    )
    .join(" · ");
  const media = work.media.find(
    (item) => item.altText !== null && item.altText.trim().length > 0
  );
  if (media !== undefined) {
    return (
      <MuseumPublicMediaFigure
        src={media.url}
        width={media.width}
        height={media.height}
        alt={media.altText ?? ""}
        href={href}
        title={work.title}
        byline={byline}
        eager={eager}
        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
      />
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
          title={work.title}
          metadata={metadata}
        />
      )}
      <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
        <Link
          href={href}
          className="hover:tw-text-primary-200 tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {work.title}
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

function MuseumTypedCollectionPresentation({
  works,
  publication,
}: {
  readonly works: readonly MuseumPublicWork[];
  readonly publication: MuseumPublication;
}) {
  const artist = publication.artists.find((item) =>
    works.some(
      (work) => work.artistId === item.id && item.slug === "casey-reas"
    )
  );
  const title =
    artist !== undefined && works.length === 7
      ? t(DEFAULT_LOCALE, "museum.network.home.caseyTitle")
      : t(DEFAULT_LOCALE, "museum.network.collection.title");
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
            {title}
          </h2>
        </div>
        <div>
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            {artist !== undefined
              ? t(DEFAULT_LOCALE, "museum.network.home.caseySummary")
              : t(DEFAULT_LOCALE, "museum.network.collection.description")}
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
        {works.map((work) => (
          <MuseumTypedWorkFigure
            key={work.id}
            work={work}
            publication={publication}
          />
        ))}
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
  const featuredWork = collectionWorks[0];
  if (featuredWork === undefined) return <MuseumPublicationUnavailable />;
  const caseyWorks = collectionWorks.filter((work) =>
    publication.artists.some(
      (artist) => artist.id === work.artistId && artist.slug === "casey-reas"
    )
  );
  const presentationWorks =
    caseyWorks.length > 0 ? caseyWorks : collectionWorks;
  return (
    <div className="tw-min-w-0 tw-space-y-20 sm:tw-space-y-28">
      <MuseumTypedHomeHero work={featuredWork} publication={publication} />
      <MuseumInstitutionalFacts />
      <MuseumTypedCollectionPresentation
        works={presentationWorks}
        publication={publication}
      />
      <MuseumAcquisitionStories publication={publication} view={view} />
      <MuseumCollectionPaths />
      <MuseumEditorialPaths />
      <MuseumInstitution />
      <MuseumPublicRecord />
    </div>
  );
}

function MuseumInstitutionalFacts() {
  return (
    <section
      aria-label={t(DEFAULT_LOCALE, "museum.network.home.institutionalFacts")}
      className="tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-6"
    >
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-3 tw-p-0 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        {INSTITUTIONAL_FACTS.map((key) => (
          <li
            key={key}
            className="tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-100"
          >
            {t(DEFAULT_LOCALE, key)}
          </li>
        ))}
      </ul>
      <div className="tw-mt-5 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-6">
        <p className="tw-m-0 tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "museum.network.home.institutionalSummary")}
        </p>
        <Link
          href="/museum/network/about"
          className={`${TEXT_LINK_CLASS} tw-shrink-0`}
        >
          {t(DEFAULT_LOCALE, "museum.network.home.readHowItWorks")}
        </Link>
      </div>
    </section>
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

function MuseumAcquisitionStoryMedia({
  acquisition,
  publication,
  view,
}: {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
}) {
  const href = museumAcquisitionHref(acquisition.slug);
  const typedWork = publication.works?.find((work) =>
    acquisition.workIds.includes(work.id)
  );
  const retained = typedWork?.media[0];
  if (typedWork !== undefined && retained !== undefined) {
    return (
      <MuseumPublicMediaFigure
        src={retained.url}
        width={retained.width}
        height={retained.height}
        alt={retained.altText ?? ""}
        href={href}
        title={acquisition.title}
        byline={
          publication.artists.find((artist) => artist.id === typedWork.artistId)
            ?.preferredName ?? ""
        }
      />
    );
  }
  const metadata = typedWork?.mediaMetadata?.[0];
  if (typedWork !== undefined && metadata !== undefined) {
    return (
      <MuseumMediaMetadataPlaceholder
        title={typedWork.title}
        metadata={metadata}
      />
    );
  }
  const presentation = acquisition.presentationMedia[0];
  if (presentation !== undefined) {
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
              {...(presentation.sourceByteSize === undefined
                ? {}
                : { sourceByteSize: presentation.sourceByteSize })}
              {...(sourceHref === null || !canOpenPresentation
                ? {}
                : {
                    sourceHref,
                    sourceLabel: t(
                      DEFAULT_LOCALE,
                      "museum.network.acquisitions.openPresentation"
                    ),
                  })}
              className="tw-block tw-h-full tw-w-full tw-object-contain"
            />
          </div>
        </div>
        <figcaption className="tw-border-b tw-border-solid tw-border-iron-800 tw-py-4 tw-text-sm tw-leading-6 tw-text-iron-400">
          <span className="tw-block tw-text-iron-200">
            {presentation.credit.creditLine}
          </span>
          <span className="tw-mt-1 tw-block">
            {t(
              DEFAULT_LOCALE,
              "museum.network.acquisitions.presentationRights"
            )}
          </span>
          <span className="tw-mt-1 tw-block">
            {t(
              DEFAULT_LOCALE,
              "museum.network.acquisitions.presentationSource"
            )}
            :{" "}
            {sourceHref === null || !canOpenPresentation ? (
              presentation.source.sourcePath
            ) : (
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
            )}
          </span>
        </figcaption>
      </figure>
    );
  }
  const caseyArtwork = tryCaseyArtworksFromPublication(publication)?.find(
    (artwork) => acquisition.workIds.includes(artwork.objectId)
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
  return outcome?.media ? (
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
  ) : null;
}

function MuseumAcquisitionStories({
  publication,
  view,
}: {
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
}) {
  const acquisitions = buildMuseumAcquisitionIndex(publication, view);
  if (acquisitions.length === 0) return null;
  return (
    <section
      aria-labelledby="museum-acquisition-stories-title"
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
    >
      <div className="tw-max-w-3xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.home.acquisitionStoriesEyebrow")}
        </p>
        <h2
          id="museum-acquisition-stories-title"
          className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-4xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.home.acquisitionStoriesTitle")}
        </h2>
        <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "museum.network.home.acquisitionStoriesDescription"
          )}
        </p>
      </div>
      <div className="tw-mt-8 tw-grid tw-gap-x-8 tw-gap-y-10 lg:tw-grid-cols-3">
        {acquisitions.map((acquisition) => (
          <article key={acquisition.acquisitionId} className="tw-min-w-0">
            <MuseumAcquisitionStoryMedia
              acquisition={acquisition}
              publication={publication}
              view={view}
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

function MuseumCollectionPaths() {
  return (
    <section
      aria-labelledby="museum-collection-title"
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
    >
      <div className="tw-grid tw-gap-6 lg:tw-grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:tw-gap-16">
        <div className="tw-max-w-xl">
          <h2
            id="museum-collection-title"
            className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.home.collection.title")}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.home.collection.description")}
          </p>
        </div>
        <nav
          aria-label={t(
            DEFAULT_LOCALE,
            "museum.network.home.collection.navigation"
          )}
          className="tw-grid tw-gap-5 sm:tw-grid-cols-3"
        >
          {COLLECTION_PATHS.map((path) => (
            <Link
              key={path.href}
              href={path.href}
              className="hover:tw-text-primary-200 tw-block tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-5 tw-text-iron-100 tw-no-underline hover:tw-border-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              <span className="tw-block tw-text-base tw-font-semibold">
                {t(DEFAULT_LOCALE, path.titleKey)}
              </span>
              <span className="tw-mt-2 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(DEFAULT_LOCALE, path.descriptionKey)}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

function MuseumEditorialPaths() {
  return (
    <div className="tw-grid tw-gap-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 lg:tw-grid-cols-3 lg:tw-gap-10">
      <EditorialPath
        eyebrow={t(DEFAULT_LOCALE, "museum.network.nav.artists")}
        title={CASEY_ARTIST_NAME}
        description={t(DEFAULT_LOCALE, "museum.network.home.artistSummary")}
        action={t(DEFAULT_LOCALE, "museum.network.home.readArtist")}
        href="/museum/network/artists/casey-reas"
        headingId="museum-home-artist-title"
      />
      <EditorialPath
        eyebrow={t(DEFAULT_LOCALE, "museum.network.nav.acquisitions")}
        title={t(DEFAULT_LOCALE, "museum.network.programs.keysAndGates")}
        description={t(DEFAULT_LOCALE, "museum.network.home.keysSummary")}
        action={t(DEFAULT_LOCALE, "museum.network.home.readProgram")}
        href="/museum/network/acquisitions/keys-and-gates"
        headingId="museum-home-program-title"
      />
      <EditorialPath
        eyebrow={t(DEFAULT_LOCALE, "museum.network.nav.research")}
        title={t(DEFAULT_LOCALE, "museum.network.home.researchTitle")}
        description={t(DEFAULT_LOCALE, "museum.network.home.researchSummary")}
        action={t(DEFAULT_LOCALE, "museum.network.home.readResearch")}
        href="/museum/network/research"
        headingId="museum-home-research-title"
      />
    </div>
  );
}

function EditorialPath({
  eyebrow,
  title,
  description,
  action,
  href,
  headingId,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly action: string;
  readonly href: string;
  readonly headingId: string;
}) {
  return (
    <section aria-labelledby={headingId}>
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
        {eyebrow}
      </p>
      <h2
        id={headingId}
        className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {title}
      </h2>
      <p className="tw-m-0 tw-mt-3 tw-max-w-xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {description}
      </p>
      <Link href={href} className={`${TEXT_LINK_CLASS} tw-mt-4`}>
        {action}
      </Link>
    </section>
  );
}

function MuseumInstitution() {
  return (
    <section
      aria-labelledby="museum-institution-title"
      className="tw-grid tw-gap-8 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-10 lg:tw-grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:tw-gap-16"
    >
      <div>
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.home.institution.eyebrow")}
        </p>
        <h2
          id="museum-institution-title"
          className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.home.institution.title")}
        </h2>
      </div>
      <div className="tw-max-w-3xl">
        <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.home.institution.description")}
        </p>
        <p className="tw-m-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "museum.network.home.institution.objective")}
        </p>
        <Link
          href="/museum/network/about"
          className={`${TEXT_LINK_CLASS} tw-mt-5`}
        >
          {t(DEFAULT_LOCALE, "museum.network.home.institution.action")}
        </Link>
      </div>
    </section>
  );
}

function MuseumPublicRecord() {
  return (
    <section aria-labelledby="museum-public-record-title">
      <h2
        id="museum-public-record-title"
        className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-500"
      >
        {t(DEFAULT_LOCALE, "museum.network.home.publicRecord")}
      </h2>
      <nav
        aria-labelledby="museum-public-record-title"
        className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-1"
      >
        <a
          href={MUSEUM_SAFE_ETHERSCAN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={TEXT_LINK_CLASS}
        >
          {t(DEFAULT_LOCALE, "museum.network.home.museumSafe")}
        </a>
        <Link
          href="/museum/network/about/governance"
          className={TEXT_LINK_CLASS}
        >
          {t(DEFAULT_LOCALE, "museum.network.home.decisions")}
        </Link>
        <a
          href={MUSEUM_REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={TEXT_LINK_CLASS}
        >
          {t(DEFAULT_LOCALE, "museum.network.home.publicRepository")}
        </a>
      </nav>
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
      <MuseumInstitutionalFacts />
      <MuseumCaseyPresentation
        artworks={supportingArtworks}
        publication={publicationState.publication}
      />
      <MuseumAcquisitionStories
        publication={publicationState.publication}
        view={view}
      />
      <MuseumCollectionPaths />
      <MuseumEditorialPaths />
      <MuseumInstitution />
      <MuseumPublicRecord />
    </div>
  );
}
