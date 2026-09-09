import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication";
import type {
  MuseumExternalProposalPresentationMedia,
  MuseumMediaMetadata,
} from "@/lib/museum/publication/types";
import type { MuseumProgramMedia } from "@/lib/museum/types";
import { MuseumMediaMetadataPlaceholder } from "../MuseumMediaMetadataPlaceholder";
import {
  MuseumProposalImage,
  MUSEUM_PROPOSAL_INTENT_VIEW_BYTES,
} from "../MuseumProposalImage";
import { MuseumProgramImage } from "../MuseumProgramImage";
import { MuseumRightsLink } from "../MuseumRightsLink";

const MUSEUM_OPEN_PRESENTATION_MESSAGE =
  "museum.network.acquisitions.openPresentation";

type MuseumPresentationContext =
  | "magnum_accession"
  | "keys_and_gates_selection";

const MUSEUM_MAGNUM_ACQUISITION_ID = "6529NM-CA-2026-003";
const MUSEUM_KEYS_AND_GATES_ACQUISITION_ID = "6529NM-CA-2026-002";

function museumPresentationContext(
  media: MuseumExternalProposalPresentationMedia
): MuseumPresentationContext | null {
  if (media.source.contextEntityId === MUSEUM_MAGNUM_ACQUISITION_ID) {
    return "magnum_accession";
  }
  if (media.source.contextEntityId === MUSEUM_KEYS_AND_GATES_ACQUISITION_ID) {
    return "keys_and_gates_selection";
  }
  return null;
}

function presentationRightsCaption(
  context: MuseumPresentationContext | null
): string {
  if (context === "magnum_accession") {
    return "Copyright remains with the photographer and Magnum Photos. The Museum presents this image in the context of the accession under its recorded institutional-display interpretation. No general reproduction, commercial, derivative, licensing, download, or AI-training rights are granted.";
  }
  if (context === "keys_and_gates_selection") {
    return "This image represents a selected, unminted work from Keys and Gates. It is shown in the acquisition-program context and does not represent accession into the Museum's permanent Collection.";
  }
  return "The governed record does not establish a public display context for this image.";
}

export interface AcquisitionWorkCard {
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

function mediaAspectRatio(
  media: MuseumProgramMedia | MuseumExternalProposalPresentationMedia
): string | undefined {
  const width =
    "width" in media
      ? media.width
      : (media.sourceWidth ?? media.variants[0]?.width ?? null);
  const height =
    "height" in media
      ? media.height
      : (media.sourceHeight ?? media.variants[0]?.height ?? null);
  return width !== null && height !== null && width > 0 && height > 0
    ? `${width} / ${height}`
    : undefined;
}

export function MuseumProposalPresentationMedia({
  media,
  exhibitionPresentation = false,
  presentationContext,
}: {
  readonly media: readonly MuseumExternalProposalPresentationMedia[];
  readonly exhibitionPresentation?: boolean;
  readonly presentationContext?: MuseumPresentationContext;
}) {
  if (media.length === 0) return null;
  return (
    <section className="tw-mt-12" aria-labelledby="proposal-presentation-title">
      <h2
        id="proposal-presentation-title"
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {t(DEFAULT_LOCALE, "museum.network.acquisitions.worksInAcquisition")}
      </h2>
      <div className="tw-mt-5 tw-grid tw-gap-6 sm:tw-grid-cols-2">
        {media.map((presentationMedia, index) => (
          <figure
            key={presentationMedia.id}
            className="tw-m-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-5"
          >
            <div
              className="tw-overflow-hidden tw-bg-black"
              style={
                exhibitionPresentation
                  ? { aspectRatio: mediaAspectRatio(presentationMedia) }
                  : undefined
              }
            >
              <MuseumProposalImage
                src={presentationMedia.mediaUrl}
                alt={presentationMedia.altText}
                width={presentationMedia.width}
                height={presentationMedia.height}
                sourceByteSize={presentationMedia.sourceByteSize}
                variants={presentationMedia.variants}
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
                requireIntentForLargeSource={!exhibitionPresentation}
              />
            </div>
            <figcaption className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
              <span className="tw-block tw-text-iron-200">
                {presentationMedia.credit.creditLine}
              </span>
              <span className="tw-mt-1 tw-block">
                {presentationRightsCaption(
                  presentationContext ??
                    museumPresentationContext(presentationMedia)
                )}
              </span>
              {(() => {
                const sourceHref = buildMuseumSignedWaveStormDropUrl(
                  presentationMedia.source.waveId,
                  presentationMedia.source.dropId
                );
                const canOpenPresentation =
                  presentationMedia.affordances.includes(
                    "open_upstream_presentation"
                  );
                return sourceHref === null || !canOpenPresentation ? null : (
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
                );
              })()}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function AcquisitionWorkFigure({
  work,
  eager = false,
  exhibitionPresentation = false,
  featured = false,
  presentationContext,
}: {
  readonly work: AcquisitionWorkCard;
  readonly eager?: boolean;
  readonly exhibitionPresentation?: boolean;
  readonly featured?: boolean;
  readonly presentationContext?: MuseumPresentationContext;
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
    !exhibitionPresentation &&
    work.presentationMedia?.sourceByteSize !== undefined &&
    work.presentationMedia.sourceByteSize >= MUSEUM_PROPOSAL_INTENT_VIEW_BYTES;
  const metadataOnly =
    work.media === undefined &&
    work.presentationMedia === undefined &&
    work.mediaMetadata !== undefined;
  const media = (
    <AcquisitionWorkMedia
      work={work}
      eager={eager}
      exhibitionPresentation={exhibitionPresentation}
    />
  );
  return (
    <figure
      className={[
        "tw-m-0 tw-min-w-0",
        featured ? "tw-mx-auto tw-w-full tw-max-w-5xl" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
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
      <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
        <Link
          href={work.href}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
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
        <AcquisitionWorkCredit
          work={work}
          presentationSourceHref={presentationSourceHref}
          canOpenPresentation={canOpenPresentation}
          {...(presentationContext === undefined
            ? {}
            : { presentationContext })}
        />
        {!exhibitionPresentation && work.meta ? (
          <span className="tw-mt-1 tw-block tw-text-xs tw-text-iron-500">
            {work.meta}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}

function AcquisitionWorkCredit({
  work,
  presentationSourceHref,
  canOpenPresentation,
  presentationContext,
}: {
  readonly work: AcquisitionWorkCard;
  readonly presentationSourceHref: string | null;
  readonly canOpenPresentation: boolean;
  readonly presentationContext?: MuseumPresentationContext;
}) {
  if (work.presentationMedia !== undefined) {
    const context =
      presentationContext ?? museumPresentationContext(work.presentationMedia);
    return (
      <div className="tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-500">
        <span className="tw-block tw-text-iron-300">
          {work.presentationMedia.credit.creditLine}
        </span>
        <span className="tw-mt-1 tw-block">
          {presentationRightsCaption(context)}
        </span>
        {presentationSourceHref === null || !canOpenPresentation ? null : (
          <span className="tw-mt-1 tw-block">
            {t(
              DEFAULT_LOCALE,
              "museum.network.acquisitions.presentationSource"
            )}
            :{" "}
            <a
              href={presentationSourceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {t(DEFAULT_LOCALE, MUSEUM_OPEN_PRESENTATION_MESSAGE)}
            </a>
          </span>
        )}
      </div>
    );
  }
  if (work.media === undefined || work.mediaMetadata === undefined) return null;
  return (
    <div className="tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-500">
      <span className="tw-block tw-text-iron-300">
        {work.mediaMetadata.credit.creditLine}
      </span>
      {work.mediaMetadata.credit.licenseLabel === null ? null : (
        <span className="tw-mt-1 tw-block">
          <MuseumRightsLink
            href={work.mediaMetadata.credit.licenseUrl ?? undefined}
            label={work.mediaMetadata.credit.licenseLabel}
            className="tw-text-iron-300 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          />
        </span>
      )}
    </div>
  );
}

function AcquisitionProgramMedia({
  media,
  eager,
  exhibitionPresentation,
}: {
  readonly media: MuseumProgramMedia;
  readonly eager: boolean;
  readonly exhibitionPresentation: boolean;
}) {
  return (
    <div
      className={
        exhibitionPresentation
          ? "tw-overflow-hidden tw-bg-black"
          : "tw-aspect-square tw-overflow-hidden tw-bg-black"
      }
      style={
        exhibitionPresentation
          ? { aspectRatio: mediaAspectRatio(media) }
          : undefined
      }
    >
      <MuseumProgramImage
        media={media}
        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
        eager={eager}
        className={
          exhibitionPresentation
            ? "tw-block tw-h-auto tw-w-full tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.01] motion-reduce:tw-transition-none"
            : "tw-h-full tw-w-full tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.01] motion-reduce:tw-transition-none"
        }
      />
    </div>
  );
}

function AcquisitionPresentationMedia({
  media,
  eager,
  exhibitionPresentation,
}: {
  readonly media: MuseumExternalProposalPresentationMedia;
  readonly eager: boolean;
  readonly exhibitionPresentation: boolean;
}) {
  const presentationSourceHref = buildMuseumSignedWaveStormDropUrl(
    media.source.waveId,
    media.source.dropId
  );
  const canOpenPresentation = media.affordances.includes(
    "open_upstream_presentation"
  );
  return (
    <div
      className={
        exhibitionPresentation
          ? "tw-overflow-hidden tw-bg-black"
          : "tw-aspect-square tw-overflow-hidden tw-bg-black"
      }
      style={
        exhibitionPresentation
          ? { aspectRatio: mediaAspectRatio(media) }
          : undefined
      }
    >
      <MuseumProposalImage
        src={media.mediaUrl}
        alt={media.altText}
        width={media.width}
        height={media.height}
        sourceByteSize={media.sourceByteSize}
        variants={media.variants}
        {...(presentationSourceHref === null || !canOpenPresentation
          ? {}
          : {
              sourceHref: presentationSourceHref,
              sourceLabel: t(DEFAULT_LOCALE, MUSEUM_OPEN_PRESENTATION_MESSAGE),
            })}
        eager={eager}
        requireIntentForLargeSource={!exhibitionPresentation}
        className={
          exhibitionPresentation
            ? "tw-block tw-h-auto tw-w-full tw-object-contain"
            : "tw-block tw-h-full tw-w-full tw-object-contain"
        }
      />
    </div>
  );
}

function AcquisitionWorkMedia({
  work,
  eager = false,
  exhibitionPresentation = false,
}: {
  readonly work: AcquisitionWorkCard;
  readonly eager?: boolean;
  readonly exhibitionPresentation?: boolean;
}) {
  if (work.media !== undefined) {
    return (
      <AcquisitionProgramMedia
        media={work.media}
        eager={eager}
        exhibitionPresentation={exhibitionPresentation}
      />
    );
  }
  if (work.presentationMedia !== undefined) {
    return (
      <AcquisitionPresentationMedia
        media={work.presentationMedia}
        eager={eager}
        exhibitionPresentation={exhibitionPresentation}
      />
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
