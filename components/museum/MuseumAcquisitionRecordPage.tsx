import Link from "next/link";
import { MuseumBreadcrumbs } from "./MuseumBreadcrumbs";
import { MuseumEntityContext } from "./MuseumEntityContext";
import { MuseumMediaMetadataPlaceholder } from "./MuseumMediaMetadataPlaceholder";
import {
  MuseumProposalImage,
  MUSEUM_PROPOSAL_INTENT_VIEW_BYTES,
} from "./MuseumProposalImage";
import { MuseumProgramImage } from "./MuseumProgramImage";
import { MuseumRelatedEntities } from "./MuseumRelatedEntities";
import { MuseumJsonDisclosure, MuseumMarkdown } from "./MuseumMarkdown";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  type MuseumAcquisitionViewModel,
} from "@/lib/museum/publication/ia";
import {
  museumAcquisitionProgramHref,
  museumAcquisitionProgramHrefForSourceId,
  museumWorkHrefForSourceId,
  museumWorkHref,
} from "@/lib/museum/publication/routes";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication";
import type {
  MuseumArtwork,
  MuseumExternalProposalPresentationMedia,
  MuseumMediaMetadata,
  MuseumMedia,
  MuseumPublication,
} from "@/lib/museum/publication/types";
import type { MuseumProgramMedia, MuseumView } from "@/lib/museum/types";
import { museumDocumentKindLabelKey } from "@/lib/museum/publication/documentLabels";
import { displayMuseumPublicAcquisitionStatus } from "@/lib/museum/presentation";

const MUSEUM_OPEN_PRESENTATION_MESSAGE =
  "museum.network.acquisitions.openPresentation";

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
    case "commission":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodCommission");
    case "bequest":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodBequest");
    case "exchange":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodExchange");
    case "transfer":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodTransfer");
    default:
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodOther");
  }
}

function artworkMedia(artwork: MuseumArtwork): MuseumProgramMedia | undefined {
  const media = artwork.media.at(0);
  return media === undefined ? undefined : museumMediaToProgramMedia(media);
}

function museumMediaToProgramMedia(media: MuseumMedia): MuseumProgramMedia {
  return {
    sourceUrl: media.url,
    sourceMimeType: media.mediaType ?? "image/*",
    sourceSha256: media.sha256,
    sourceByteSize: null,
    sourceWidth: media.width,
    sourceHeight: media.height,
    altText: media.altText ?? "",
    altTextStatus:
      media.altText === null ? "unavailable" : "governed_artwork_description",
    variants: [],
  };
}

interface AcquisitionWorkCard {
  readonly id: string;
  readonly href: string;
  readonly title: string;
  readonly artist: string;
  readonly media?: MuseumProgramMedia;
  readonly mediaMetadata?: MuseumMediaMetadata;
  readonly presentationMedia?: MuseumExternalProposalPresentationMedia;
  readonly meta?: string;
  readonly status?: string;
  readonly statusQualifier?: string;
}

function decorateAcquisitionWorkCard(
  card: AcquisitionWorkCard,
  acquisition: MuseumAcquisitionViewModel
): AcquisitionWorkCard {
  return {
    ...card,
    status: displayMuseumPublicAcquisitionStatus(acquisition.status),
    ...(acquisition.status ===
    "selected_through_acquisition_program_acquisition_pending"
      ? {
          statusQualifier: t(
            DEFAULT_LOCALE,
            "museum.network.acquisitions.selectedWorkQualifier"
          ),
        }
      : {}),
  };
}

function acquisitionWorkCards(
  publication: MuseumPublication,
  acquisition: MuseumAcquisitionViewModel,
  view: MuseumView | null
): readonly AcquisitionWorkCard[] {
  const records: AcquisitionWorkCard[] = [];
  for (const workId of acquisition.workIds) {
    const publicWorkCard = acquisitionPublicWorkCard(publication, workId);
    if (publicWorkCard !== undefined) {
      records.push(decorateAcquisitionWorkCard(publicWorkCard, acquisition));
      continue;
    }

    const artworkCard = acquisitionArtworkCard(publication, workId);
    if (artworkCard !== undefined) {
      records.push(decorateAcquisitionWorkCard(artworkCard, acquisition));
      continue;
    }

    const outcomeCard = acquisitionOutcomeCard(publication, workId, view);
    if (outcomeCard !== undefined) {
      records.push(decorateAcquisitionWorkCard(outcomeCard, acquisition));
    }
  }
  return records;
}

function acquisitionPublicWorkCard(
  publication: MuseumPublication,
  workId: string
): AcquisitionWorkCard | undefined {
  const publicWork = publication.works?.find((item) => item.id === workId);
  if (publicWork === undefined) return undefined;
  const artist = publication.artists.find(
    (item) => item.id === publicWork.artistId
  );
  const media = publicWork.media.at(0);
  const programMedia =
    media === undefined ? undefined : museumMediaToProgramMedia(media);
  return {
    id: publicWork.id,
    href: museumWorkHref(publicWork.id),
    title: publicWork.title,
    artist: artist?.preferredName ?? publicWork.artistId,
    ...(programMedia === undefined ? {} : { media: programMedia }),
    ...(publicWork.presentationMedia?.[0] === undefined
      ? {}
      : { presentationMedia: publicWork.presentationMedia[0] }),
    ...(publicWork.mediaMetadata?.[0] === undefined
      ? {}
      : { mediaMetadata: publicWork.mediaMetadata[0] }),
  };
}

function acquisitionArtworkCard(
  publication: MuseumPublication,
  workId: string
): AcquisitionWorkCard | undefined {
  const artwork = publication.artworks.find((item) => item.id === workId);
  if (artwork === undefined) return undefined;
  const href = museumWorkHrefForSourceId(publication, artwork.id);
  if (href === null) return undefined;
  const artist = publication.artists.find(
    (item) => item.id === artwork.artistId
  );
  const programMedia = artworkMedia(artwork);
  return {
    id: artwork.id,
    href,
    title: artwork.title,
    artist: artist?.preferredName ?? artwork.artistId,
    ...(programMedia === undefined ? {} : { media: programMedia }),
  };
}

function acquisitionOutcomeCard(
  publication: MuseumPublication,
  workId: string,
  view: MuseumView | null
): AcquisitionWorkCard | undefined {
  const outcome = view?.objects.find((item) => item.objectId === workId);
  if (outcome === undefined) return undefined;
  const href = museumWorkHrefForSourceId(publication, outcome.objectId, view);
  if (href === null) return undefined;
  const meta =
    outcome.selectionPlace === null
      ? undefined
      : t(DEFAULT_LOCALE, "museum.network.objects.selectionPlace", {
          place: String(outcome.selectionPlace),
        });
  return {
    id: outcome.objectId,
    href,
    title: outcome.title,
    artist: outcome.artist,
    ...(outcome.media === null ? {} : { media: outcome.media }),
    ...(meta === undefined ? {} : { meta }),
  };
}

function MuseumProposalPresentationMedia({
  media,
}: {
  readonly media: readonly MuseumExternalProposalPresentationMedia[];
}) {
  if (media.length === 0) return null;
  return (
    <section className="tw-mt-12" aria-labelledby="proposal-presentation-title">
      <h2
        id="proposal-presentation-title"
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {t(
          DEFAULT_LOCALE,
          "museum.network.acquisitions.historicalWavePresentation"
        )}
      </h2>
      <div className="tw-mt-5 tw-grid tw-gap-6 sm:tw-grid-cols-2">
        {media.map((presentationMedia, index) => (
          <figure
            key={presentationMedia.id}
            className="tw-m-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-5"
          >
            <div className="tw-overflow-hidden tw-bg-black">
              <MuseumProposalImage
                src={presentationMedia.mediaUrl}
                alt={presentationMedia.altText}
                width={presentationMedia.width}
                height={presentationMedia.height}
                {...(presentationMedia.sourceByteSize === undefined
                  ? {}
                  : { sourceByteSize: presentationMedia.sourceByteSize })}
                {...(() => {
                  const sourceHref = buildMuseumSignedWaveStormDropUrl(
                    presentationMedia.source.waveId,
                    presentationMedia.source.dropId
                  );
                  return sourceHref === null ||
                    !presentationMedia.affordances.includes(
                      "open_upstream_presentation"
                    )
                    ? {}
                    : {
                        sourceHref,
                        sourceLabel: t(
                          DEFAULT_LOCALE,
                          MUSEUM_OPEN_PRESENTATION_MESSAGE
                        ),
                      };
                })()}
                eager={index === 0}
              />
            </div>
            <figcaption className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
              <span className="tw-block tw-text-iron-200">
                {presentationMedia.credit.creditLine}
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
                {(() => {
                  const sourceHref = buildMuseumSignedWaveStormDropUrl(
                    presentationMedia.source.waveId,
                    presentationMedia.source.dropId
                  );
                  const canOpenPresentation =
                    presentationMedia.affordances.includes(
                      "open_upstream_presentation"
                    );
                  return sourceHref === null || !canOpenPresentation ? (
                    presentationMedia.source.sourcePath
                  ) : (
                    <a
                      href={sourceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                    >
                      {t(DEFAULT_LOCALE, MUSEUM_OPEN_PRESENTATION_MESSAGE)}
                    </a>
                  );
                })()}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function AcquisitionWorkFigure({
  work,
  eager = false,
}: {
  readonly work: AcquisitionWorkCard;
  readonly eager?: boolean;
}) {
  const presentationSourceHref =
    work.presentationMedia === undefined
      ? null
      : buildMuseumSignedWaveStormDropUrl(
          work.presentationMedia.source.waveId,
          work.presentationMedia.source.dropId
        );
  const canOpenPresentation =
    work.presentationMedia?.affordances.includes(
      "open_upstream_presentation"
    ) === true;
  const requiresIntent =
    work.presentationMedia?.sourceByteSize !== undefined &&
    work.presentationMedia.sourceByteSize >= MUSEUM_PROPOSAL_INTENT_VIEW_BYTES;
  const metadataOnly =
    work.media === undefined &&
    work.presentationMedia === undefined &&
    work.mediaMetadata !== undefined;
  const media = <AcquisitionWorkMedia work={work} eager={eager} />;
  return (
    <figure className="tw-m-0 tw-min-w-0">
      {requiresIntent || metadataOnly ? (
        <div className="tw-group tw-block">{media}</div>
      ) : (
        <Link
          href={work.href}
          className="tw-group tw-block focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-4 focus-visible:tw-ring-offset-black"
        >
          {media}
        </Link>
      )}
      <figcaption className="tw-border-b tw-border-solid tw-border-iron-800 tw-py-4">
        <Link
          href={work.href}
          className="hover:tw-text-primary-200 tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {work.title}
        </Link>
        <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
          {work.artist}
        </span>
        {work.status ? (
          <span className="tw-mt-2 tw-block tw-text-sm tw-leading-6 tw-text-iron-300">
            {work.status}
          </span>
        ) : null}
        {work.statusQualifier ? (
          <span className="tw-mt-1 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
            {work.statusQualifier}
          </span>
        ) : null}
        {work.presentationMedia ? (
          <div className="tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-500">
            <span className="tw-block tw-text-iron-300">
              {work.presentationMedia.credit.creditLine}
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
              {presentationSourceHref === null || !canOpenPresentation ? (
                work.presentationMedia.source.sourcePath
              ) : (
                <a
                  href={presentationSourceHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {t(DEFAULT_LOCALE, MUSEUM_OPEN_PRESENTATION_MESSAGE)}
                </a>
              )}
            </span>
          </div>
        ) : null}
        {work.meta ? (
          <span className="tw-mt-1 tw-block tw-text-xs tw-text-iron-500">
            {work.meta}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}

function AcquisitionWorkMedia({
  work,
  eager = false,
}: {
  readonly work: AcquisitionWorkCard;
  readonly eager?: boolean;
}) {
  if (work.media !== undefined) {
    return (
      <div className="tw-aspect-square tw-overflow-hidden tw-bg-black">
        <MuseumProgramImage
          media={work.media}
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="tw-h-full tw-w-full tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.01] motion-reduce:tw-transition-none"
        />
      </div>
    );
  }
  if (work.presentationMedia !== undefined) {
    const presentationSourceHref = buildMuseumSignedWaveStormDropUrl(
      work.presentationMedia.source.waveId,
      work.presentationMedia.source.dropId
    );
    const canOpenPresentation = work.presentationMedia.affordances.includes(
      "open_upstream_presentation"
    );
    return (
      <div className="tw-aspect-square tw-overflow-hidden tw-bg-black">
        <MuseumProposalImage
          src={work.presentationMedia.mediaUrl}
          alt={work.presentationMedia.altText}
          width={work.presentationMedia.width}
          height={work.presentationMedia.height}
          {...(work.presentationMedia.sourceByteSize === undefined
            ? {}
            : { sourceByteSize: work.presentationMedia.sourceByteSize })}
          {...(presentationSourceHref === null || !canOpenPresentation
            ? {}
            : {
                sourceHref: presentationSourceHref,
                sourceLabel: t(
                  DEFAULT_LOCALE,
                  MUSEUM_OPEN_PRESENTATION_MESSAGE
                ),
              })}
          eager={eager}
          className="tw-block tw-h-full tw-w-full tw-object-contain"
        />
      </div>
    );
  }
  if (work.mediaMetadata !== undefined) {
    return (
      <MuseumMediaMetadataPlaceholder
        title={work.title}
        metadata={work.mediaMetadata}
      />
    );
  }
  return (
    <div className="tw-border-y tw-border-solid tw-border-iron-800 tw-py-8 tw-text-sm tw-text-iron-400">
      {work.title}
    </div>
  );
}

export function MuseumAcquisitionRecordPage({
  acquisition,
  publication,
  view,
  sourceCommit,
}: {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
  readonly sourceCommit: string;
}) {
  const program =
    acquisition.programId === null
      ? null
      : (publication.acquisitionPrograms?.find(
          (item) => item.id === acquisition.programId
        ) ??
        view?.programs.find(
          (item) => item.programId === acquisition.programId
        ) ??
        null);
  const acquisitionDocuments = publication.documents.filter((document) =>
    acquisition.sourceDocumentIds.includes(document.id)
  );
  const workCards = acquisitionWorkCards(publication, acquisition, view);
  const coveredPresentationIds = new Set(
    workCards.flatMap((work) =>
      work.presentationMedia === undefined ? [] : [work.presentationMedia.id]
    )
  );
  const additionalPresentationMedia = acquisition.presentationMedia.filter(
    (media) => !coveredPresentationIds.has(media.id)
  );
  const context = {
    ...acquisition,
    status: displayMuseumPublicAcquisitionStatus(acquisition.status),
    breadcrumbs: [
      { label: "6529 Network Museum", href: "/museum/network" },
      {
        label: t(DEFAULT_LOCALE, "museum.network.acquisitions.title"),
        href: "/museum/network/acquisitions",
      },
      { label: acquisition.title },
    ],
  };

  return (
    <article className="tw-min-w-0">
      <MuseumBreadcrumbs
        ariaLabel={t(
          DEFAULT_LOCALE,
          "museum.network.accessibility.breadcrumbs"
        )}
        items={context.breadcrumbs}
      />
      <Link
        href="/museum/network/acquisitions"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.acquisitions.back")}
      </Link>
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.acquisitions.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {acquisition.title}
        </h1>
        <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {acquisition.thesis}
        </p>
      </header>

      <MuseumEntityContext
        context={context}
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

      <section
        className="tw-mt-10 tw-grid tw-gap-6 sm:tw-grid-cols-2 lg:tw-grid-cols-3"
        aria-label={t(DEFAULT_LOCALE, "museum.network.acquisitions.context")}
      >
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.method")}
          </p>
          <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {acquisitionMethodLabel(
              acquisition.acquisitionMethod,
              acquisition.programId
            )}
          </p>
        </div>
        {program && (
          <div>
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.acquisitions.program")}
            </p>
            {(() => {
              const programHref =
                "slug" in program
                  ? museumAcquisitionProgramHref(program.slug)
                  : museumAcquisitionProgramHrefForSourceId(
                      publication,
                      program.programId
                    );
              return programHref === null ? (
                <span className="tw-mt-2 tw-block tw-text-sm tw-text-iron-300">
                  {program.title}
                </span>
              ) : (
                <Link
                  href={programHref}
                  className="hover:tw-text-primary-200 tw-mt-2 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {program.title}
                </Link>
              );
            })()}
          </div>
        )}
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.works")}
          </p>
          <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {formatInteger(DEFAULT_LOCALE, acquisition.workIds.length)}
          </p>
        </div>
      </section>

      {workCards.length > 0 ? (
        <section className="tw-mt-12" aria-labelledby="acquisition-works-title">
          <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
            <h2
              id="acquisition-works-title"
              className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
            >
              {t(DEFAULT_LOCALE, "museum.network.acquisitions.works")}
            </h2>
            <p className="tw-m-0 tw-text-sm tw-text-iron-500">
              {formatInteger(DEFAULT_LOCALE, workCards.length)}
            </p>
          </div>
          <div className="tw-mt-6 tw-grid tw-gap-5 md:tw-grid-cols-2 xl:tw-grid-cols-3">
            {workCards.map((work, index) => (
              <AcquisitionWorkFigure
                key={work.id}
                work={work}
                eager={index === 0}
              />
            ))}
          </div>
        </section>
      ) : null}

      <MuseumProposalPresentationMedia media={additionalPresentationMedia} />

      {acquisitionDocuments.map((document) => (
        <section
          key={document.id}
          className="tw-mt-14 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
          aria-labelledby={`acquisition-document-${document.id}`}
        >
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, museumDocumentKindLabelKey(document.kind))}
          </p>
          <h2
            id={`acquisition-document-${document.id}`}
            className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {document.title}
          </h2>
          {document.kind === "source_record" ? (
            <div className="tw-mt-6">
              <MuseumJsonDisclosure
                label={document.title}
                sourceJson={document.markdown}
              />
            </div>
          ) : (
            <MuseumMarkdown
              className="tw-mt-6"
              embeddedDocument
              sourceCommit={sourceCommit}
              sourcePath={document.sourcePath}
            >
              {document.markdown}
            </MuseumMarkdown>
          )}
        </section>
      ))}

      <MuseumRelatedEntities
        entities={[
          ...acquisition.primaryRelations,
          ...acquisition.secondaryRelations,
        ]}
        headingId="acquisition-related-entities-title"
        title={t(DEFAULT_LOCALE, "museum.network.acquisitions.related")}
      />
    </article>
  );
}
