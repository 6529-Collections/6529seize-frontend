import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumArtworkViewer } from "./MuseumArtworkViewer";
import { MuseumLiveGeneratorEncounter } from "./MuseumLiveGeneratorEncounter";
import { MuseumBreadcrumbs } from "./MuseumBreadcrumbs";
import { MuseumEntityContext } from "./MuseumEntityContext";
import { MuseumJsonDisclosure, MuseumMarkdown } from "./MuseumMarkdown";
import { MuseumMediaMetadataPlaceholder } from "./MuseumMediaMetadataPlaceholder";
import { MuseumPublicationUnavailable } from "./MuseumPublicationUnavailable";
import { MuseumProgramOutcomePage } from "./MuseumProgramOutcomePage";
import { MuseumProposalImage } from "./MuseumProposalImage";
import { MuseumRelatedEntities } from "./MuseumRelatedEntities";
import { MuseumInTheSystem } from "./MuseumInsideSystem";
import { MuseumRightsLink } from "./MuseumRightsLink";
import { displayCreditWithoutRepeatedLicense } from "@/lib/museum/credit";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ARTIST_NAME,
  CASEY_ARTIST_SLUG,
  tryCaseyArtworksFromPublication,
  getCaseyArtwork,
} from "@/lib/museum/casey";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import {
  findReviewedProgramMediaMatch,
  getMuseumView,
} from "@/lib/museum/normalize";
import { buildMuseumWorkContext } from "@/lib/museum/publication/ia";
import { hasMuseumMagnumInstitutionalDisplayRights } from "@/lib/museum/publication/collectionSemantics";
import { selectMuseumPublicWorkDocuments } from "@/lib/museum/publication/typedDocuments";
import type {
  MuseumPublication,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
import {
  displayMuseumPublicAcquisitionStatus,
  museumSlugMatches,
} from "@/lib/museum/presentation";
import { getGenerativeStudyByObjectId } from "@/lib/museum/generative-studies";
import type { MuseumView } from "@/lib/museum/types";
import { MuseumProgramImage } from "./MuseumProgramImage";
import { MuseumReviewedProgramMediaFigure } from "./MuseumReviewedProgramMediaFigure";
import {
  creatorSeparator,
  museumWorkCreationDate,
  museumWorkInsideSystemHref,
  publicWorkMedia,
  workQualifierLabel,
} from "./MuseumObjectPageModel";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication";
import { museumWorkHrefIndex } from "@/lib/museum/publication/routes";

export async function getMuseumObjectMetadata(
  objectId: string
): Promise<Metadata> {
  const artwork = getCaseyArtwork(objectId);
  if (artwork !== null) {
    return getAppMetadata({
      title: artwork.title,
      description: artwork.visualDescription,
    });
  }

  const publicationState = await getMuseumPublicationState();
  const publicWork = publicationState.publication?.works?.find(
    (work) => work.id === objectId
  );
  if (publicWork !== undefined) {
    return getAppMetadata({
      title: publicWork.title,
      description: publicWork.title,
    });
  }

  const view = await getMuseumView();
  const outcome = view.objects.find((item) =>
    museumSlugMatches(item.objectId, objectId)
  );
  const description =
    outcome === undefined || outcome.scope.trim().length === 0
      ? t(DEFAULT_LOCALE, "museum.network.objects.description")
      : outcome.scope;
  return getAppMetadata({
    title: outcome?.title ?? t(DEFAULT_LOCALE, "museum.network.objects.title"),
    description,
  });
}

function MuseumCanonicalWorkMedia({
  work,
  programMediaMatch,
  presentationSourceHref,
}: {
  readonly work: MuseumPublicWork;
  readonly programMediaMatch: ReturnType<typeof findReviewedProgramMediaMatch>;
  readonly presentationSourceHref: string | null;
}) {
  const stillMedia = selectMuseumStillMedia(work.media);
  if (stillMedia !== undefined) {
    return (
      <section
        className="tw-mt-10"
        aria-labelledby="canonical-work-media-title"
      >
        <h2 id="canonical-work-media-title" className="tw-sr-only">
          {t(DEFAULT_LOCALE, "museum.network.works.title")}
        </h2>
        <figure key={stillMedia.id} className="tw-m-0 tw-w-full">
          <div className="tw-overflow-hidden tw-bg-black">
            <MuseumProgramImage
              media={publicWorkMedia(stillMedia)}
              sizes="(min-width: 640px) 50vw, 100vw"
              className="tw-block tw-h-auto tw-w-full tw-object-contain"
            />
          </div>
          <figcaption className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {displayCreditWithoutRepeatedLicense(
              stillMedia.credit.creditLine,
              stillMedia.credit.licenseLabel
            )}
            {stillMedia.credit.licenseLabel === null ? null : (
              <>
                {" "}
                <MuseumRightsLink
                  href={stillMedia.credit.licenseUrl ?? undefined}
                  label={stillMedia.credit.licenseLabel}
                  className="tw-text-iron-300 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                />
              </>
            )}
          </figcaption>
        </figure>
      </section>
    );
  }
  if (programMediaMatch !== null) {
    const metadata = work.mediaMetadata?.find((candidate) =>
      candidate.sourceRecordIds?.includes(programMediaMatch.sourceRecordId)
    );
    return (
      <section
        className="tw-mt-10"
        aria-labelledby="canonical-work-media-title"
      >
        <h2 id="canonical-work-media-title" className="tw-sr-only">
          {t(DEFAULT_LOCALE, "museum.network.works.title")}
        </h2>
        <MuseumReviewedProgramMediaFigure
          media={programMediaMatch.media}
          metadata={metadata}
          sizes="(min-width: 1024px) 66vw, 100vw"
          eager
          figureClassName="tw-m-0"
          captionClassName="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400"
          creditLineClassName="tw-block tw-text-iron-200"
          licenseWrapperClassName="tw-mt-1 tw-block"
          rightsLayout="block"
        >
          {presentationSourceHref === null ? null : (
            <span className="tw-mt-1 tw-block tw-text-iron-400">
              {t(
                DEFAULT_LOCALE,
                "museum.network.acquisitions.presentationSource"
              )}
              {": "}
              <a
                href={presentationSourceHref}
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
        </MuseumReviewedProgramMediaFigure>
      </section>
    );
  }
  // The dedicated Wave figure follows below; do not precede it with metadata.
  if (
    work.presentationMedia !== undefined &&
    work.presentationMedia.length > 0
  ) {
    return null;
  }
  const metadata = work.mediaMetadata?.[0];
  if (metadata !== undefined) {
    return (
      <section
        className="tw-mt-10"
        aria-labelledby="canonical-work-media-title"
      >
        <h2 id="canonical-work-media-title" className="tw-sr-only">
          {t(DEFAULT_LOCALE, "museum.network.works.title")}
        </h2>
        <MuseumMediaMetadataPlaceholder
          title={work.title}
          metadata={metadata}
        />
      </section>
    );
  }
  return (
    <p className="tw-mt-10 tw-text-sm tw-leading-6 tw-text-iron-400">
      {t(DEFAULT_LOCALE, "museum.network.objects.mediaUnavailable")}
    </p>
  );
}

function MuseumCanonicalWorkRecordPage({
  work,
  publication,
  view,
}: {
  readonly work: MuseumPublicWork;
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
}) {
  const artistIds =
    work.artistIds !== undefined && work.artistIds.length > 0
      ? work.artistIds
      : [work.artistId];
  const artists = artistIds.flatMap((artistId) => {
    const artist = publication.artists.find((item) => item.id === artistId);
    return artist === undefined ? [] : [artist];
  });
  const project =
    work.projectId === null
      ? null
      : publication.projects.find((item) => item.id === work.projectId);
  const context = buildMuseumWorkContext(publication, work.id, view, [
    { label: "6529 Network Museum", href: "/museum/network" },
    {
      label: t(DEFAULT_LOCALE, "museum.network.works.title"),
      href: "/museum/network/works",
    },
    { label: work.title },
  ]);
  if (context === null) return <MuseumPublicationUnavailable />;
  const projectedDocuments = work.documentIds.flatMap((documentId) => {
    const document = publication.documents.find(
      (candidate) => candidate.id === documentId
    );
    return document === undefined ? [] : [document];
  });
  const documents = selectMuseumPublicWorkDocuments(work, projectedDocuments);
  const workHrefs = museumWorkHrefIndex(publication, view);
  const workAliasIds = (publication.workAliases ?? [])
    .filter((alias) => alias.workId === work.id)
    .map((alias) => alias.sourceObjectId);
  const programMediaMatch = findReviewedProgramMediaMatch(view, [
    work.id,
    ...(work.sourceRecordIds ?? []),
    ...workAliasIds,
  ]);
  const presentationSourceHref = (() => {
    const presentation = work.presentationMedia?.find((media) =>
      media.affordances.includes("open_upstream_presentation")
    );
    return presentation === undefined
      ? null
      : buildMuseumSignedWaveStormDropUrl(
          presentation.source.waveId,
          presentation.source.dropId
        );
  })();
  const programMediaMetadata =
    programMediaMatch === null
      ? undefined
      : work.mediaMetadata?.find((candidate) =>
          candidate.sourceRecordIds?.includes(programMediaMatch.sourceRecordId)
        );
  const metadataCredit =
    programMediaMatch === null
      ? work.mediaMetadata?.[0]?.credit
      : programMediaMetadata?.credit;
  const primaryCredit =
    (work.media[0] === undefined
      ? undefined
      : displayCreditWithoutRepeatedLicense(
          work.media[0].credit.creditLine,
          work.media[0].credit.licenseLabel
        )) ??
    (metadataCredit === undefined
      ? undefined
      : displayCreditWithoutRepeatedLicense(
          metadataCredit.creditLine,
          metadataCredit.licenseLabel
        )) ??
    (work.presentationMedia?.[0] === undefined
      ? undefined
      : displayCreditWithoutRepeatedLicense(
          work.presentationMedia[0].credit.creditLine,
          work.presentationMedia[0].rights.licenseLabel
        ));
  const insideSystemHref = museumWorkInsideSystemHref(work, publication);
  const creationDate = museumWorkCreationDate(publication, work.id);
  const stillMedia = selectMuseumStillMedia(work.media);
  const liveMedia = work.media.find(
    (media) => media.kind === "live" && media.role === "source"
  );
  const liveManifestationDimensions =
    liveMedia !== undefined &&
    typeof stillMedia?.width === "number" &&
    typeof stillMedia.height === "number"
      ? { width: stillMedia.width, height: stillMedia.height }
      : null;
  const qualifierLabels = work.qualifiers.flatMap((qualifier) => {
    const label = workQualifierLabel(work, qualifier);
    return label === null ? [] : [{ qualifier, label }];
  });
  return (
    <article className="tw-min-w-0">
      <MuseumBreadcrumbs
        ariaLabel={t(
          DEFAULT_LOCALE,
          "museum.network.accessibility.breadcrumbs"
        )}
        items={context.breadcrumbs}
      />
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.works.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-5xl">
          {work.title}
        </h1>
        {artists.length > 0 ? (
          <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
            {artists.map((creator, index) => (
              <span key={creator.id}>
                {creatorSeparator(index, artists.length)}
                <Link
                  href={`/museum/network/artists/${encodeURIComponent(creator.slug)}`}
                  className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {creator.preferredName}
                </Link>
              </span>
            ))}
            {project === undefined || project === null
              ? null
              : ` / ${project.title}`}
            {creationDate === null ? null : ` · ${creationDate}`}
          </p>
        ) : null}
      </header>
      <MuseumCanonicalWorkMedia
        work={work}
        programMediaMatch={programMediaMatch}
        presentationSourceHref={presentationSourceHref}
      />
      {liveManifestationDimensions === null ? null : (
        <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.objects.liveManifestation", {
            width: liveManifestationDimensions.width,
            height: liveManifestationDimensions.height,
          })}
        </p>
      )}
      <section
        className="tw-mt-10"
        aria-labelledby="canonical-work-record-title"
      >
        <h2
          id="canonical-work-record-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.objects.reading")}
        </h2>
        {documents.length > 0 ? (
          <div className="tw-mt-6 tw-space-y-8">
            {documents.map((document) =>
              document.kind === "source_record" ? (
                <MuseumJsonDisclosure
                  key={document.id}
                  label={document.title}
                  sourceJson={document.markdown}
                />
              ) : (
                <MuseumMarkdown
                  key={document.id}
                  className="tw-max-w-3xl"
                  embeddedDocument={document.kind === "object_entry"}
                  sourceCommit={publication.identity.commit}
                  sourcePath={document.sourcePath}
                  workHrefs={workHrefs}
                >
                  {document.markdown}
                </MuseumMarkdown>
              )
            )}
          </div>
        ) : (
          <p className="tw-m-0 tw-mt-5 tw-text-sm tw-text-yellow-100">
            {t(DEFAULT_LOCALE, "museum.network.objects.readingUnavailable")}
          </p>
        )}
      </section>
      <MuseumLiveGeneratorEncounter
        media={liveMedia}
        title={work.title}
        creditLine={
          stillMedia === undefined
            ? undefined
            : displayCreditWithoutRepeatedLicense(
                stillMedia.credit.creditLine,
                stillMedia.credit.licenseLabel
              )
        }
      />
      <MuseumEntityContext
        context={{
          ...context,
          status: displayMuseumPublicAcquisitionStatus(work.status),
        }}
        labels={{
          ariaLabel: t(
            DEFAULT_LOCALE,
            "museum.network.accessibility.entityContext"
          ),
          status: t(DEFAULT_LOCALE, "museum.network.entity.status"),
          statusAsOf: t(DEFAULT_LOCALE, "museum.network.entity.statusAsOf"),
          source: t(DEFAULT_LOCALE, "museum.network.entity.sources"),
        }}
      />
      {insideSystemHref !== null ? (
        <div className="tw-mt-8">
          <Link
            href={insideSystemHref}
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.locateWork")}
          </Link>
        </div>
      ) : null}
      {programMediaMatch === null &&
      work.presentationMedia !== undefined &&
      work.presentationMedia.length > 0 ? (
        <section
          className="tw-mt-10"
          aria-labelledby="canonical-work-presentation-title"
        >
          <h2 id="canonical-work-presentation-title" className="tw-sr-only">
            {t(
              DEFAULT_LOCALE,
              "museum.network.acquisitions.historicalWavePresentation"
            )}
          </h2>
          <div
            className={`tw-grid tw-gap-6 ${
              work.presentationMedia.length > 1 ? "lg:tw-grid-cols-2" : ""
            }`}
          >
            {work.presentationMedia.map((media, index) => {
              const sourceHref = buildMuseumSignedWaveStormDropUrl(
                media.source.waveId,
                media.source.dropId
              );
              const canOpenPresentation = media.affordances.includes(
                "open_upstream_presentation"
              );
              return (
                <figure
                  key={media.id}
                  className="tw-m-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-5"
                >
                  <div className="tw-overflow-hidden tw-bg-black">
                    <MuseumProposalImage
                      src={media.mediaUrl}
                      alt={media.altText}
                      width={media.width}
                      height={media.height}
                      sourceByteSize={media.sourceByteSize}
                      variants={media.variants}
                      optimizeSource={hasMuseumMagnumInstitutionalDisplayRights(
                        work
                      )}
                      {...(sourceHref === null || !canOpenPresentation
                        ? {}
                        : {
                            sourceHref,
                            sourceLabel: t(
                              DEFAULT_LOCALE,
                              "museum.network.acquisitions.openPresentation"
                            ),
                          })}
                      eager={index === 0}
                    />
                  </div>
                  <figcaption className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
                    <span className="tw-block tw-text-iron-200">
                      {media.credit.creditLine}
                    </span>
                    <span className="tw-mt-1 tw-block">
                      {t(
                        DEFAULT_LOCALE,
                        "museum.network.acquisitions.presentationRights"
                      )}
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
            })}
          </div>
        </section>
      ) : null}
      <dl className="tw-mt-10 tw-grid tw-gap-5 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-5 sm:tw-grid-cols-2">
        <div>
          <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.objects.medium")}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
            {work.medium}
          </dd>
        </div>
        {primaryCredit === undefined ? null : (
          <div>
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.objects.credit")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
              {primaryCredit}
            </dd>
          </div>
        )}
      </dl>
      {hasMuseumMagnumInstitutionalDisplayRights(work) ? (
        <p className="tw-mt-4 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(
            DEFAULT_LOCALE,
            "museum.network.rights.magnumInstitutionalDisplay"
          )}
        </p>
      ) : null}
      {qualifierLabels.length > 0 ? (
        <dl className="tw-mt-10 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-4">
          {qualifierLabels.map(({ qualifier, label }) => (
            <div
              key={`${qualifier.kind}:${qualifier.sourcePath}`}
              className="tw-flex tw-flex-wrap tw-gap-x-3 tw-gap-y-1 tw-text-sm"
            >
              <dt className="tw-font-semibold tw-text-iron-300">{label}</dt>
            </div>
          ))}
        </dl>
      ) : null}
      <MuseumRelatedEntities
        entities={[...context.primaryRelations, ...context.secondaryRelations]}
        headingId="canonical-work-related-title"
        title={t(DEFAULT_LOCALE, "museum.network.works.context")}
      />
    </article>
  );
}

export async function MuseumObjectPage({
  objectId,
  publication: publicationInput,
  view: viewInput,
}: {
  readonly objectId: string;
  readonly publication?: MuseumPublication;
  readonly view?: MuseumView | null;
}) {
  const publicationState =
    publicationInput === undefined ? await getMuseumPublicationState() : null;
  const publication = publicationInput ?? publicationState?.publication;
  if (publication === null || publication === undefined) {
    return <MuseumPublicationUnavailable />;
  }
  const view = viewInput === undefined ? await getMuseumView() : viewInput;
  const workHrefs = museumWorkHrefIndex(publication, view);
  const publicWork = publication.works?.find((work) => work.id === objectId);
  if (publicWork !== undefined) {
    return (
      <MuseumCanonicalWorkRecordPage
        work={publicWork}
        publication={publication}
        view={view}
      />
    );
  }
  if (view === null) {
    return <MuseumPublicationUnavailable />;
  }
  const artworks = tryCaseyArtworksFromPublication(publication);
  if (artworks === null) {
    return <MuseumPublicationUnavailable />;
  }
  const artwork = artworks.find((item) =>
    museumSlugMatches(item.objectId, objectId)
  );
  if (artwork === undefined) {
    const outcome = view.objects.find((item) =>
      museumSlugMatches(item.objectId, objectId)
    );
    if (outcome?.programId === null || outcome?.programId === undefined) {
      notFound();
    }
    return (
      <MuseumProgramOutcomePage
        outcome={outcome}
        sourceCommit={publication.identity.commit}
      />
    );
  }

  const objectDocument = publication.documents.find(
    (document) =>
      document.kind === "object_entry" &&
      document.artworkIds.includes(artwork.objectId)
  );
  const objectRecord = publication.artworks.find(
    (item) => item.id === artwork.objectId
  );
  const generativeStudy = getGenerativeStudyByObjectId(artwork.objectId);
  const heldPosition = generativeStudy?.heldPositions.find(
    (position) => position.objectId === artwork.objectId
  );

  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/collection"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.objects.backToCollection")}
      </Link>

      <header className="tw-mb-8 tw-mt-6 tw-grid tw-gap-5 md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-items-end">
        <div>
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-primary-300">
            <Link
              href={`/museum/network/artists/${CASEY_ARTIST_SLUG}`}
              className="hover:tw-text-primary-200 tw-text-inherit tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {CASEY_ARTIST_NAME}
            </Link>
          </p>
          <h1 className="tw-m-0 tw-mt-2 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl">
            {artwork.title}
          </h1>
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {artwork.project}, {artwork.year} · {artwork.objectId}
          </p>
        </div>
        <Link
          href={`/museum/network/projects/${artwork.projectSlug}`}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(DEFAULT_LOCALE, "museum.network.objects.viewProject")}
        </Link>
      </header>

      <MuseumArtworkViewer artwork={artwork} />

      {generativeStudy && heldPosition ? (
        <MuseumInTheSystem study={generativeStudy} position={heldPosition} />
      ) : null}

      <div className="tw-mt-12 tw-grid tw-gap-10 lg:tw-grid-cols-[minmax(0,1fr)_18rem] lg:tw-gap-16">
        <section aria-labelledby="museum-object-reading-title">
          <h2
            id="museum-object-reading-title"
            className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.objects.reading")}
          </h2>
          {objectDocument ? (
            <MuseumMarkdown
              className="tw-mt-6"
              embeddedDocument
              sourceCommit={publication.identity.commit}
              sourcePath={objectDocument.sourcePath}
              workHrefs={workHrefs}
            >
              {objectDocument.markdown}
            </MuseumMarkdown>
          ) : (
            <div className="tw-mt-6 tw-border-l-2 tw-border-yellow-400 tw-pl-4 tw-text-sm tw-leading-6 tw-text-yellow-100">
              {t(DEFAULT_LOCALE, "museum.network.objects.readingUnavailable")}
            </div>
          )}
        </section>

        <aside
          aria-labelledby="museum-object-details-title"
          className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6 lg:tw-border-l lg:tw-border-t-0 lg:tw-pl-6 lg:tw-pt-0"
        >
          <h2
            id="museum-object-details-title"
            className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
          >
            {t(DEFAULT_LOCALE, "museum.network.objects.collectionDetails")}
          </h2>
          <dl className="tw-m-0 tw-mt-5 tw-space-y-5">
            <div>
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                {t(DEFAULT_LOCALE, "museum.network.objects.status")}
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
                {t(DEFAULT_LOCALE, "museum.network.objects.accessioned")}
              </dd>
            </div>
            <div>
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                {t(DEFAULT_LOCALE, "museum.network.objects.medium")}
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
                {artwork.medium}
              </dd>
            </div>
            <div>
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                {t(DEFAULT_LOCALE, "museum.network.objects.credit")}
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
                {artwork.creditLine}{" "}
                <MuseumRightsLink
                  href={artwork.rightsUrl}
                  label={artwork.rightsLabel}
                  className="tw-text-iron-200 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                />
              </dd>
            </div>
          </dl>
          <Link
            href="/museum/network/acquisitions/the-system-in-seven-states"
            className="hover:tw-text-primary-200 tw-mt-6 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.objects.viewGift")}
          </Link>
        </aside>
      </div>

      {objectRecord && (
        <div className="tw-mt-12 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8">
          <MuseumJsonDisclosure
            label={t(DEFAULT_LOCALE, "museum.network.detail.technicalEvidence")}
            value={{ publication: publication.identity, artwork: objectRecord }}
          />
        </div>
      )}
    </article>
  );
}
